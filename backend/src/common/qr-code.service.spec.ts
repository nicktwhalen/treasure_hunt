import { Test, TestingModule } from "@nestjs/testing";
import { QrCodeService } from "./qr-code.service";
import * as fs from "fs";
import * as path from "path";

// Mock fs and QRCode
jest.mock("fs");
jest.mock("qrcode");

const mockFs = fs as jest.Mocked<typeof fs>;
const mockQRCode = require("qrcode");

describe("QrCodeService", () => {
  let service: QrCodeService;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [QrCodeService],
    }).compile();

    service = module.get<QrCodeService>(QrCodeService);
  });

  describe("generateQrData", () => {
    it("should generate unique QR data with treasure prefix", () => {
      const qrData1 = service.generateQrData();
      const qrData2 = service.generateQrData();

      expect(qrData1).toMatch(/^treasure-[a-f0-9-]{36}$/);
      expect(qrData2).toMatch(/^treasure-[a-f0-9-]{36}$/);
      expect(qrData1).not.toBe(qrData2);
    });
  });

  describe("generateQrCode", () => {
    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
      mockQRCode.toFile.mockResolvedValue(undefined);
    });

    it("should generate QR code with correct data and file path", async () => {
      const result = await service.generateQrCode();

      expect(result.qrCodeData).toMatch(/^treasure-[a-f0-9-]{36}$/);
      expect(result.qrCodeImagePath).toMatch(
        /^uploads\/qr-codes\/treasure-[a-f0-9-]{36}\.png$/,
      );

      expect(mockQRCode.toFile).toHaveBeenCalledWith(
        expect.stringContaining(".png"),
        result.qrCodeData,
        expect.objectContaining({
          width: 200,
          margin: 2,
          color: {
            dark: "#8B4513",
            light: "#FFF8DC",
          },
        }),
      );
    });

    it("should create uploads directory if it does not exist", () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => "");

      // Create new service instance to trigger constructor
      new QrCodeService();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining("uploads/qr-codes"),
        { recursive: true },
      );
    });
  });

  describe("deleteQrCodeImage", () => {
    it("should delete existing QR code image", async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {});

      await service.deleteQrCodeImage("uploads/qr-codes/test.png");

      expect(mockFs.existsSync).toHaveBeenCalled();
      expect(mockFs.unlinkSync).toHaveBeenCalled();
    });

    it("should not throw error if file does not exist", async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(
        service.deleteQrCodeImage("uploads/qr-codes/nonexistent.png"),
      ).resolves.not.toThrow();
    });

    it("should not throw error if deletion fails", async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {
        throw new Error("Deletion failed");
      });

      // Mock console.error to suppress the error log
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(
        service.deleteQrCodeImage("uploads/qr-codes/test.png"),
      ).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});
