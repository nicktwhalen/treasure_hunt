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
import { HuntsService } from "./hunts.service";
import { CreateHuntDto } from "./dto/create-hunt.dto";
import { UpdateHuntDto } from "./dto/update-hunt.dto";

@Controller("hunts")
export class HuntsController {
  constructor(private readonly huntsService: HuntsService) {}

  @Get()
  findAll() {
    return this.huntsService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const hunt = await this.huntsService.findOne(id);
    if (!hunt) {
      throw new NotFoundException(`Hunt with ID ${id} not found`);
    }
    return hunt;
  }

  @Post()
  create(@Body() createHuntDto: CreateHuntDto) {
    if (createHuntDto.treasures) {
      return this.huntsService.createWithTreasures(
        createHuntDto.title,
        createHuntDto.treasures,
      );
    }
    return this.huntsService.create(createHuntDto.title);
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateHuntDto: UpdateHuntDto,
  ) {
    let hunt;
    if (updateHuntDto.treasures !== undefined) {
      hunt = await this.huntsService.updateWithTreasures(
        id,
        updateHuntDto.title,
        updateHuntDto.treasures,
      );
    } else {
      hunt = await this.huntsService.update(id, updateHuntDto.title);
    }

    if (!hunt) {
      throw new NotFoundException(`Hunt with ID ${id} not found`);
    }
    return hunt;
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseIntPipe) id: number) {
    const hunt = await this.huntsService.findOne(id);
    if (!hunt) {
      throw new NotFoundException(`Hunt with ID ${id} not found`);
    }
    await this.huntsService.remove(id);
  }
}
