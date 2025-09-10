import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { GameService } from "./game.service";
import { GameSession, GameStatus } from "./entities/game-session.entity";
import { TreasureDiscovery } from "./entities/treasure-discovery.entity";
import { Hunt } from "../hunts/entities/hunt.entity";
import { Treasure } from "../treasures/entities/treasure.entity";

describe("GameService", () => {
  let service: GameService;
  let gameSessionRepository: jest.Mocked<Repository<GameSession>>;
  let treasureDiscoveryRepository: jest.Mocked<Repository<TreasureDiscovery>>;
  let huntRepository: jest.Mocked<Repository<Hunt>>;
  let treasureRepository: jest.Mocked<Repository<Treasure>>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: getRepositoryToken(GameSession),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(TreasureDiscovery),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Hunt),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Treasure),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    gameSessionRepository = module.get(getRepositoryToken(GameSession));
    treasureDiscoveryRepository = module.get(
      getRepositoryToken(TreasureDiscovery),
    );
    huntRepository = module.get(getRepositoryToken(Hunt));
    treasureRepository = module.get(getRepositoryToken(Treasure));
  });

  describe("startGame", () => {
    it("should start a game when hunt exists with treasures", async () => {
      const mockHunt = {
        id: 1,
        treasures: [{ id: 1 }, { id: 2 }],
      };
      const mockGameSession = {
        id: 1,
        huntId: 1,
        playerName: "Test Player",
        totalTreasures: 2,
        currentTreasureOrdinal: 1,
        status: GameStatus.ACTIVE,
      };

      huntRepository.findOne.mockResolvedValue(mockHunt as any);
      gameSessionRepository.create.mockReturnValue(mockGameSession as any);
      gameSessionRepository.save.mockResolvedValue(mockGameSession as any);

      const result = await service.startGame(1, { playerName: "Test Player" });

      expect(result).toEqual(mockGameSession);
      expect(huntRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["treasures"],
      });
    });

    it("should throw NotFoundException when hunt does not exist", async () => {
      huntRepository.findOne.mockResolvedValue(null);

      await expect(
        service.startGame(999, { playerName: "Test Player" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when hunt has no treasures", async () => {
      const mockHunt = { id: 1, treasures: [] };
      huntRepository.findOne.mockResolvedValue(mockHunt as any);

      await expect(
        service.startGame(1, { playerName: "Test Player" }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("scanQrCode", () => {
    const mockSession = {
      id: 1,
      huntId: 1,
      currentTreasureOrdinal: 1,
      totalTreasures: 2,
      status: GameStatus.ACTIVE,
      startedAt: new Date("2023-01-01T10:00:00Z"),
      discoveries: [],
    };

    beforeEach(() => {
      // Mock getGameSession directly instead of repository
      jest
        .spyOn(service, "getGameSession")
        .mockResolvedValue(mockSession as any);
    });

    it("should reject invalid QR code", async () => {
      treasureRepository.findOne.mockResolvedValue(null);

      const result = await service.scanQrCode(1, { qrCodeData: "invalid-qr" });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid QR code");
    });

    it("should reject out-of-sequence QR code (future treasure)", async () => {
      const mockTreasure = {
        id: 2,
        ordinal: 3,
        qrCodeData: "treasure-future",
        huntId: 1,
      };

      treasureRepository.findOne.mockImplementation((options: any) => {
        if (
          options.where.qrCodeData === "treasure-future" &&
          options.where.huntId === 1
        ) {
          return Promise.resolve(mockTreasure as any);
        }
        return Promise.resolve(null);
      });

      const result = await service.scanQrCode(1, {
        qrCodeData: "treasure-future",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("need to find treasure #1 first");
    });

    it("should throw BadRequestException for inactive game session", async () => {
      const inactiveSession = { ...mockSession, status: GameStatus.COMPLETED };
      jest
        .spyOn(service, "getGameSession")
        .mockResolvedValue(inactiveSession as any);

      await expect(
        service.scanQrCode(1, { qrCodeData: "treasure-123" }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getGameStats", () => {
    it("should calculate correct game statistics", async () => {
      gameSessionRepository.count
        .mockResolvedValueOnce(10) // total sessions
        .mockResolvedValueOnce(6); // completed sessions

      gameSessionRepository.find.mockResolvedValue([
        { totalTimeSeconds: 120 },
        { totalTimeSeconds: 180 },
        { totalTimeSeconds: 90 },
      ] as any);

      const result = await service.getGameStats(1);

      expect(result).toEqual({
        totalSessions: 10,
        completedSessions: 6,
        averageCompletionTime: 130, // (120 + 180 + 90) / 3 = 130
        completionRate: 60, // 6/10 * 100 = 60%
      });
    });

    it("should handle zero sessions gracefully", async () => {
      gameSessionRepository.count.mockResolvedValue(0);
      gameSessionRepository.find.mockResolvedValue([]);

      const result = await service.getGameStats(1);

      expect(result).toEqual({
        totalSessions: 0,
        completedSessions: 0,
        averageCompletionTime: 0,
        completionRate: 0,
      });
    });
  });
});
