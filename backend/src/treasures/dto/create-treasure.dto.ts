import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsNumber,
  Min,
} from "class-validator";

export class CreateTreasureDto {
  @IsOptional()
  @IsNumber({}, { message: "Ordinal must be a number" })
  @Min(1, { message: "Ordinal must be at least 1" })
  ordinal?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: "Clue text must be less than 200 characters" })
  clueText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: "QR code data must be less than 255 characters" })
  qrCodeData?: string;
}
