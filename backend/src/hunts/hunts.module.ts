import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HuntsController } from "./hunts.controller";
import { HuntsService } from "./hunts.service";
import { Hunt } from "./entities/hunt.entity";
import { Treasure } from "../treasures/entities/treasure.entity";
import { Clue } from "../clues/entities/clue.entity";
import { QrCodeService } from "../common/qr-code.service";

@Module({
  imports: [TypeOrmModule.forFeature([Hunt, Treasure, Clue])],
  controllers: [HuntsController],
  providers: [HuntsService, QrCodeService],
  exports: [HuntsService],
})
export class HuntsModule {}
