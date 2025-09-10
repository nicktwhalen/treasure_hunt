import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CluesService } from "./clues.service";
import { Clue } from "./entities/clue.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Clue])],
  providers: [CluesService],
  exports: [CluesService],
})
export class CluesModule {}
