import { Injectable } from "@nestjs/common";
import * as QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class QrCodeService {
  private readonly uploadsDir = path.join(process.cwd(), "uploads", "qr-codes");

  constructor() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Generate a unique QR code data string
   */
  generateQrData(): string {
    return `treasure-${uuidv4()}`;
  }

  /**
   * Generate QR code image file and return both data and file path
   */
  async generateQrCode(): Promise<{
    qrCodeData: string;
    qrCodeImagePath: string;
  }> {
    const qrCodeData = this.generateQrData();
    const filename = `${qrCodeData}.png`;
    const filePath = path.join(this.uploadsDir, filename);
    const relativePath = `uploads/qr-codes/${filename}`;

    // Generate QR code image
    await QRCode.toFile(filePath, qrCodeData, {
      width: 200,
      margin: 2,
      color: {
        dark: "#8B4513", // Pirate brown
        light: "#FFF8DC", // Cornsilk background
      },
    });

    return {
      qrCodeData,
      qrCodeImagePath: relativePath,
    };
  }

  /**
   * Delete QR code image file
   */
  async deleteQrCodeImage(imagePath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      console.error("Error deleting QR code image:", error);
      // Don't throw - we don't want deletion to fail if image is missing
    }
  }
}
