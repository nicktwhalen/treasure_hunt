import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { TreasuresService } from "./treasures.service";
import { CreateTreasureDto } from "./dto/create-treasure.dto";
import { UpdateTreasureDto } from "./dto/update-treasure.dto";

@Controller("hunts/:huntId/treasures")
export class TreasuresController {
  constructor(private readonly treasuresService: TreasuresService) {}

  @Get()
  findByHunt(@Param("huntId", ParseIntPipe) huntId: number) {
    return this.treasuresService.findByHunt(huntId);
  }

  @Get(":id")
  async findOne(
    @Param("huntId", ParseIntPipe) huntId: number,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const treasure = await this.treasuresService.findOne(id, huntId);
    if (!treasure) {
      throw new NotFoundException(`Treasure with ID ${id} not found`);
    }
    return treasure;
  }

  // All treasure modifications now handled via hunt endpoints
}
