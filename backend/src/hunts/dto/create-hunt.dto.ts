import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsArray,
  ValidateNested,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";
import { CreateTreasureBulkDto } from "../../treasures/dto/create-treasure-bulk.dto";

export class CreateHuntDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1, { message: "Hunt title must not be empty" })
  @MaxLength(20, { message: "Hunt title must be less than 20 characters" })
  title: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTreasureBulkDto)
  treasures?: CreateTreasureBulkDto[];
}
