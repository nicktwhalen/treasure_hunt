import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
  IsOptional,
} from "class-validator";

export class CreateTreasureBulkDto {
  @IsNumber({}, { message: "Ordinal must be a number" })
  @Min(1, { message: "Ordinal must be at least 1" })
  ordinal: number;

  @IsNotEmpty({ message: "Clue text cannot be empty" })
  @IsString()
  @MinLength(1, { message: "Clue text must not be empty" })
  @MaxLength(100, { message: "Clue text must be less than 100 characters" })
  clueText: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: "QR code data must be less than 255 characters" })
  qrCodeData?: string;
}
