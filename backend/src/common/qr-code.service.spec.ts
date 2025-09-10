import { Test, TestingModule } from "@nestjs/testing";
import { QrCodeService } from "./qr-code.service";

describe("QrCodeService", () => {
  let service: QrCodeService;

  beforeEach(async () => {
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
});
