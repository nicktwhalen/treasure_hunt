import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Treasure } from "./entities/treasure.entity";
import { Clue } from "../clues/entities/clue.entity";
import { QrCodeService } from "../common/qr-code.service";
import { CreateTreasureDto } from "./dto/create-treasure.dto";
import { UpdateTreasureDto } from "./dto/update-treasure.dto";

@Injectable()
export class TreasuresService {
  constructor(
    @InjectRepository(Treasure)
    private treasuresRepository: Repository<Treasure>,
    @InjectRepository(Clue)
    private cluesRepository: Repository<Clue>,
    private qrCodeService: QrCodeService,
  ) {}

  async findByHunt(huntId: number): Promise<Treasure[]> {
    return this.treasuresRepository.find({
      where: { huntId },
      relations: ["clue"],
      order: { ordinal: "ASC" },
    });
  }

  async findOne(id: number, huntId?: number): Promise<Treasure | null> {
    const where = huntId ? { id, huntId } : { id };
    return this.treasuresRepository.findOne({
      where,
      relations: ["clue"],
    });
  }

  async findByHuntAndOrdinal(
    huntId: number,
    ordinal: number,
  ): Promise<Treasure | null> {
    return this.treasuresRepository.findOne({
      where: { huntId, ordinal },
      relations: ["clue"],
    });
  }

  async existsByHuntAndOrdinal(
    huntId: number,
    ordinal: number,
  ): Promise<boolean> {
    const count = await this.treasuresRepository.count({
      where: { huntId, ordinal },
    });
    return count > 0;
  }

  async create(
    huntId: number,
    createTreasureDto: CreateTreasureDto,
  ): Promise<Treasure> {
    // Use provided QR code data or generate new one
    const qrCodeData =
      createTreasureDto.qrCodeData || this.qrCodeService.generateQrData();

    // Determine ordinal if not provided
    let ordinal = createTreasureDto.ordinal;
    if (!ordinal) {
      const maxOrdinal = await this.treasuresRepository
        .createQueryBuilder("treasure")
        .where("treasure.huntId = :huntId", { huntId })
        .select("MAX(treasure.ordinal)", "max")
        .getRawOne();
      ordinal = (maxOrdinal.max || 0) + 1;
    }

    // Create treasure
    const treasure = this.treasuresRepository.create({
      huntId,
      ordinal,
      qrCodeData,
    });

    const savedTreasure = await this.treasuresRepository.save(treasure);

    // Create clue
    const clue = this.cluesRepository.create({
      treasureId: savedTreasure.id,
      text: createTreasureDto.clueText,
    });

    await this.cluesRepository.save(clue);

    // Return treasure with clue
    return this.findOne(savedTreasure.id) as Promise<Treasure>;
  }

  async update(
    id: number,
    huntId: number,
    updateTreasureDto: UpdateTreasureDto,
  ): Promise<Treasure | null> {
    const treasure = await this.findOne(id, huntId);
    if (!treasure) {
      return null;
    }

    // Update treasure if ordinal changed
    if (
      updateTreasureDto.ordinal &&
      updateTreasureDto.ordinal !== treasure.ordinal
    ) {
      await this.treasuresRepository.update(id, {
        ordinal: updateTreasureDto.ordinal,
      });
    }

    // Update clue if text changed
    if (updateTreasureDto.clueText && treasure.clue) {
      await this.cluesRepository.update(treasure.clue.id, {
        text: updateTreasureDto.clueText,
      });
    }

    return this.findOne(id, huntId);
  }

  async remove(id: number, huntId: number): Promise<void> {
    const treasure = await this.findOne(id, huntId);
    if (!treasure) {
      throw new NotFoundException(`Treasure with ID ${id} not found`);
    }

    const deletedOrdinal = treasure.ordinal;

    // Delete treasure and reorder remaining treasures in a transaction
    await this.treasuresRepository.manager.transaction(async (manager) => {
      // Delete treasure (clue will be cascade deleted)
      await manager.delete(Treasure, id);

      // Decrement ordinal of all treasures in the same hunt that have ordinal > deletedOrdinal
      await manager
        .createQueryBuilder()
        .update(Treasure)
        .set({ ordinal: () => "ordinal - 1" })
        .where("huntId = :huntId AND ordinal > :deletedOrdinal", {
          huntId,
          deletedOrdinal,
        })
        .execute();
    });
  }

  async reorderTreasures(
    huntId: number,
    ordinalUpdates: { id: number; ordinal: number }[],
  ): Promise<void> {
    // Update ordinals in a transaction
    await this.treasuresRepository.manager.transaction(async (manager) => {
      for (const update of ordinalUpdates) {
        await manager.update(
          Treasure,
          { id: update.id, huntId },
          { ordinal: update.ordinal },
        );
      }
    });
  }
}
