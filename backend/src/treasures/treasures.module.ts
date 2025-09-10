import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TreasuresController } from "./treasures.controller";
import { TreasuresService } from "./treasures.service";
import { Treasure } from "./entities/treasure.entity";
import { Clue } from "../clues/entities/clue.entity";
import { QrCodeService } from "../common/qr-code.service";

@Module({
  imports: [TypeOrmModule.forFeature([Treasure, Clue])],
  controllers: [TreasuresController],
  providers: [TreasuresService, QrCodeService],
  exports: [TreasuresService],
})
export class TreasuresModule {}
