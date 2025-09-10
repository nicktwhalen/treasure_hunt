import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, DataSource, EntityManager } from "typeorm";
import { HuntsService } from "./hunts.service";
import { Hunt } from "./entities/hunt.entity";
import { Treasure } from "../treasures/entities/treasure.entity";
import { Clue } from "../clues/entities/clue.entity";
import { QrCodeService } from "../common/qr-code.service";

describe("HuntsService", () => {
  let service: HuntsService;
  let huntsRepository: jest.Mocked<Repository<Hunt>>;
  let treasuresRepository: jest.Mocked<Repository<Treasure>>;
  let cluesRepository: jest.Mocked<Repository<Clue>>;
  let dataSource: jest.Mocked<DataSource>;
  let qrCodeService: jest.Mocked<QrCodeService>;
  let mockEntityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockEntityManager = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const mockQrCodeService = {
      generateQrData: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HuntsService,
        {
          provide: getRepositoryToken(Hunt),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Treasure),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Clue),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: QrCodeService,
          useValue: mockQrCodeService,
        },
      ],
    }).compile();

    service = module.get<HuntsService>(HuntsService);
    huntsRepository = module.get(getRepositoryToken(Hunt));
    treasuresRepository = module.get(getRepositoryToken(Treasure));
    cluesRepository = module.get(getRepositoryToken(Clue));
    dataSource = module.get(DataSource);
    qrCodeService = module.get(QrCodeService);
  });

  describe("findAll", () => {
    it("should return all hunts with treasures relation", async () => {
      const mockHunts = [
        { id: 1, title: "Hunt 1", treasures: [] },
        { id: 2, title: "Hunt 2", treasures: [] },
      ];

      huntsRepository.find.mockResolvedValue(mockHunts as any);

      const result = await service.findAll();

      expect(result).toEqual(mockHunts);
      expect(huntsRepository.find).toHaveBeenCalledWith({
        relations: ["treasures"],
      });
    });
  });

  describe("findOne", () => {
    it("should return hunt with treasures and clues relations", async () => {
      const mockHunt = {
        id: 1,
        title: "Test Hunt",
        treasures: [{ id: 1, clue: { text: "Test clue" } }],
      };

      huntsRepository.findOne.mockResolvedValue(mockHunt as any);

      const result = await service.findOne(1);

      expect(result).toEqual(mockHunt);
      expect(huntsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["treasures", "treasures.clue"],
      });
    });

    it("should return null when hunt not found", async () => {
      huntsRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create and save a simple hunt", async () => {
      const mockHunt = { id: 1, title: "New Hunt" };

      huntsRepository.create.mockReturnValue(mockHunt as any);
      huntsRepository.save.mockResolvedValue(mockHunt as any);

      const result = await service.create("New Hunt");

      expect(result).toEqual(mockHunt);
      expect(huntsRepository.create).toHaveBeenCalledWith({
        title: "New Hunt",
      });
      expect(huntsRepository.save).toHaveBeenCalledWith(mockHunt);
    });
  });

  describe("createWithTreasures", () => {
    beforeEach(() => {
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback(mockEntityManager);
      });
    });

    it("should create hunt with treasures and clues in transaction", async () => {
      const mockHunt = { id: 1, title: "Hunt with Treasures" };
      const mockTreasure = { id: 1, huntId: 1, ordinal: 1 };
      const mockClue = { id: 1, treasureId: 1, text: "Test clue" };
      const mockFinalHunt = {
        id: 1,
        title: "Hunt with Treasures",
        treasures: [{ ...mockTreasure, clue: mockClue }],
      };

      const treasuresData = [{ ordinal: 1, clueText: "Test clue" }];

      mockEntityManager.create
        .mockReturnValueOnce(mockHunt as any) // Hunt
        .mockReturnValueOnce(mockTreasure as any) // Treasure
        .mockReturnValueOnce(mockClue as any); // Clue

      mockEntityManager.save
        .mockResolvedValueOnce(mockHunt as any) // Hunt
        .mockResolvedValueOnce(mockTreasure as any) // Treasure
        .mockResolvedValueOnce(mockClue as any); // Clue

      mockEntityManager.findOne.mockResolvedValue(mockFinalHunt as any);

      qrCodeService.generateQrData.mockReturnValue("treasure-123");

      const result = await service.createWithTreasures(
        "Hunt with Treasures",
        treasuresData,
      );

      expect(result).toEqual(mockFinalHunt);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(qrCodeService.generateQrData).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.create).toHaveBeenCalledTimes(3); // Hunt, Treasure, Clue
      expect(mockEntityManager.save).toHaveBeenCalledTimes(3);
    });

    it("should create hunt without treasures when none provided", async () => {
      const mockHunt = { id: 1, title: "Empty Hunt" };
      const mockFinalHunt = { id: 1, title: "Empty Hunt", treasures: [] };

      mockEntityManager.create.mockReturnValue(mockHunt as any);
      mockEntityManager.save.mockResolvedValue(mockHunt as any);
      mockEntityManager.findOne.mockResolvedValue(mockFinalHunt as any);

      const result = await service.createWithTreasures("Empty Hunt");

      expect(result).toEqual(mockFinalHunt);
      expect(qrCodeService.generateQrData).not.toHaveBeenCalled();
      expect(mockEntityManager.create).toHaveBeenCalledTimes(1); // Only Hunt
    });
  });

  describe("update", () => {
    it("should update hunt title and return updated hunt", async () => {
      const mockHunt = { id: 1, title: "Updated Hunt" };

      huntsRepository.update.mockResolvedValue({} as any);
      huntsRepository.findOne.mockResolvedValue(mockHunt as any);

      const result = await service.update(1, "Updated Hunt");

      expect(result).toEqual(mockHunt);
      expect(huntsRepository.update).toHaveBeenCalledWith(1, {
        title: "Updated Hunt",
      });
    });
  });

  describe("updateWithTreasures", () => {
    beforeEach(() => {
      dataSource.transaction.mockImplementation(async (callback: any) => {
        return callback(mockEntityManager);
      });
    });

    it("should update hunt and replace treasures in transaction", async () => {
      const treasuresData = [{ ordinal: 1, clueText: "New clue" }];
      const mockTreasure = { id: 1, huntId: 1, ordinal: 1 };
      const mockClue = { id: 1, treasureId: 1, text: "New clue" };
      const mockUpdatedHunt = {
        id: 1,
        title: "Updated Hunt",
        treasures: [{ ...mockTreasure, clue: mockClue }],
      };

      // Mock existing treasures for QR code preservation
      const mockExistingTreasures = [
        { id: 1, huntId: 1, ordinal: 1, qrCodeData: "treasure-123" },
      ];

      mockEntityManager.find.mockResolvedValue(mockExistingTreasures as any);
      mockEntityManager.update.mockResolvedValue({} as any);
      mockEntityManager.delete.mockResolvedValue({} as any);
      mockEntityManager.create
        .mockReturnValueOnce(mockTreasure as any)
        .mockReturnValueOnce(mockClue as any);
      mockEntityManager.save
        .mockResolvedValueOnce(mockTreasure as any)
        .mockResolvedValueOnce(mockClue as any);
      mockEntityManager.findOne.mockResolvedValue(mockUpdatedHunt as any);

      qrCodeService.generateQrData.mockReturnValue("treasure-456");

      const result = await service.updateWithTreasures(
        1,
        "Updated Hunt",
        treasuresData,
      );

      expect(result).toEqual(mockUpdatedHunt);
      expect(mockEntityManager.update).toHaveBeenCalledWith(Hunt, 1, {
        title: "Updated Hunt",
      });
      expect(mockEntityManager.delete).toHaveBeenCalledWith(Treasure, {
        huntId: 1,
      });
      // QR code should be preserved from existing treasure, not generated
      expect(qrCodeService.generateQrData).toHaveBeenCalledTimes(0);
    });

    it("should only update title when no treasures provided", async () => {
      const mockUpdatedHunt = { id: 1, title: "Updated Hunt Only" };

      mockEntityManager.update.mockResolvedValue({} as any);
      mockEntityManager.findOne.mockResolvedValue(mockUpdatedHunt as any);

      const result = await service.updateWithTreasures(1, "Updated Hunt Only");

      expect(result).toEqual(mockUpdatedHunt);
      expect(mockEntityManager.update).toHaveBeenCalledWith(Hunt, 1, {
        title: "Updated Hunt Only",
      });
      expect(mockEntityManager.delete).not.toHaveBeenCalled();
      expect(qrCodeService.generateQrData).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("should delete hunt by id", async () => {
      huntsRepository.delete.mockResolvedValue({} as any);

      await service.remove(1);

      expect(huntsRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});
