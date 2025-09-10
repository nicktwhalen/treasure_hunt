import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsNumber,
  Min,
} from "class-validator";

export class UpdateTreasureDto {
  @IsOptional()
  @IsNumber({}, { message: "Ordinal must be a number" })
  @Min(1, { message: "Ordinal must be at least 1" })
  ordinal?: number;

  @IsNotEmpty({ message: "Clue text cannot be empty" })
  @IsString()
  @MinLength(1, { message: "Clue text must not be empty" })
  @MaxLength(100, { message: "Clue text must be less than 100 characters" })
  clueText: string;
}
