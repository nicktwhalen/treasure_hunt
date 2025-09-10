import { IsNotEmpty, IsString } from "class-validator";

export class ScanQrDto {
  @IsNotEmpty()
  @IsString()
  qrCodeData: string;
}
