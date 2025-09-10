import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class QrCodeService {
  /**
   * Generate a unique QR code data string
   */
  generateQrData(): string {
    return `treasure-${uuidv4()}`;
  }
}
