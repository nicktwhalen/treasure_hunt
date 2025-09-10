import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Hunt } from "./entities/hunt.entity";
import { Treasure } from "../treasures/entities/treasure.entity";
import { Clue } from "../clues/entities/clue.entity";
import { CreateTreasureBulkDto } from "../treasures/dto/create-treasure-bulk.dto";
import { QrCodeService } from "../common/qr-code.service";

@Injectable()
export class HuntsService {
  constructor(
    @InjectRepository(Hunt)
    private huntsRepository: Repository<Hunt>,
    @InjectRepository(Treasure)
    private treasuresRepository: Repository<Treasure>,
    @InjectRepository(Clue)
    private cluesRepository: Repository<Clue>,
    private dataSource: DataSource,
    private qrCodeService: QrCodeService,
  ) {}

  async findAll(): Promise<Hunt[]> {
    return this.huntsRepository.find({
      relations: ["treasures"],
    });
  }

  async findOne(id: number): Promise<Hunt | null> {
    return this.huntsRepository.findOne({
      where: { id },
      relations: ["treasures", "treasures.clue"],
    });
  }

  async create(title: string): Promise<Hunt> {
    const hunt = this.huntsRepository.create({ title });
    return this.huntsRepository.save(hunt);
  }

  async createWithTreasures(
    title: string,
    treasures?: CreateTreasureBulkDto[],
  ): Promise<Hunt> {
    return this.dataSource.transaction(async (manager) => {
      // Create the hunt
      const hunt = manager.create(Hunt, { title });
      const savedHunt = await manager.save(hunt);

      // Create treasures if provided
      if (treasures && treasures.length > 0) {
        for (const treasureData of treasures) {
          // Use provided QR code or generate new one
          const qrCodeData =
            treasureData.qrCodeData || this.qrCodeService.generateQrData();

          const treasure = manager.create(Treasure, {
            huntId: savedHunt.id,
            ordinal: treasureData.ordinal,
            qrCodeData,
          });
          const savedTreasure = await manager.save(treasure);

          // Create clue for the treasure
          const clue = manager.create(Clue, {
            treasureId: savedTreasure.id,
            text: treasureData.clueText,
          });
          await manager.save(clue);
        }
      }

      // Return the hunt with all relations
      const result = await manager.findOne(Hunt, {
        where: { id: savedHunt.id },
        relations: ["treasures", "treasures.clue"],
      });
      return result!;
    });
  }

  async update(id: number, title: string): Promise<Hunt | null> {
    await this.huntsRepository.update(id, { title });
    return this.findOne(id);
  }

  async updateWithTreasures(
    id: number,
    title: string,
    treasures?: CreateTreasureBulkDto[],
  ): Promise<Hunt | null> {
    return this.dataSource.transaction(async (manager) => {
      // Update hunt title
      await manager.update(Hunt, id, { title });

      // If treasures provided, replace all existing treasures
      if (treasures) {
        // Get existing treasures to preserve QR codes where possible
        const existingTreasures = await manager.find(Treasure, {
          where: { huntId: id },
          relations: ["clue"],
          order: { ordinal: "ASC" },
        });

        // Delete existing treasures (and their clues via cascade)
        await manager.delete(Treasure, { huntId: id });

        // Create new treasures, preserving QR codes when available
        for (let i = 0; i < treasures.length; i++) {
          const treasureData = treasures[i];
          const existingTreasure = existingTreasures[i]; // Match by position/ordinal

          // Use provided QR code, or preserve existing QR code, or generate new one
          let qrCodeData: string;
          if (treasureData.qrCodeData) {
            // Custom QR code provided by frontend
            qrCodeData = treasureData.qrCodeData;
          } else if (existingTreasure?.qrCodeData) {
            // Preserve existing QR code
            qrCodeData = existingTreasure.qrCodeData;
          } else {
            // Generate new QR code
            qrCodeData = this.qrCodeService.generateQrData();
          }

          const treasure = manager.create(Treasure, {
            huntId: id,
            ordinal: treasureData.ordinal,
            qrCodeData,
          });
          const savedTreasure = await manager.save(treasure);

          // Create clue for the treasure
          const clue = manager.create(Clue, {
            treasureId: savedTreasure.id,
            text: treasureData.clueText,
          });
          await manager.save(clue);
        }
      }

      // Return the updated hunt with all relations
      return manager.findOne(Hunt, {
        where: { id },
        relations: ["treasures", "treasures.clue"],
      });
    });
  }

  async remove(id: number): Promise<void> {
    await this.huntsRepository.delete(id);
  }
}
