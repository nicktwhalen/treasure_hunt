import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GameSession, GameStatus } from "./entities/game-session.entity";
import { TreasureDiscovery } from "./entities/treasure-discovery.entity";
import { Hunt } from "../hunts/entities/hunt.entity";
import { Treasure } from "../treasures/entities/treasure.entity";
import { StartGameDto } from "./dto/start-game.dto";
import { ScanQrDto } from "./dto/scan-qr.dto";

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameSession)
    private gameSessionRepository: Repository<GameSession>,
    @InjectRepository(TreasureDiscovery)
    private treasureDiscoveryRepository: Repository<TreasureDiscovery>,
    @InjectRepository(Hunt)
    private huntRepository: Repository<Hunt>,
    @InjectRepository(Treasure)
    private treasureRepository: Repository<Treasure>,
  ) {}

  async startGame(
    huntId: number,
    startGameDto: StartGameDto,
  ): Promise<GameSession> {
    // Check if hunt exists and has treasures
    const hunt = await this.huntRepository.findOne({
      where: { id: huntId },
      relations: ["treasures"],
    });

    if (!hunt) {
      throw new NotFoundException(`Hunt with ID ${huntId} not found`);
    }

    if (!hunt.treasures || hunt.treasures.length === 0) {
      throw new BadRequestException(
        "Hunt must have at least one treasure to start",
      );
    }

    // Create new game session
    const gameSession = this.gameSessionRepository.create({
      huntId,
      playerName: startGameDto.playerName,
      totalTreasures: hunt.treasures.length,
      currentTreasureOrdinal: 1,
      status: GameStatus.ACTIVE,
    });

    return this.gameSessionRepository.save(gameSession);
  }

  async getGameSession(sessionId: number): Promise<GameSession> {
    const session = await this.gameSessionRepository.findOne({
      where: { id: sessionId },
      relations: [
        "hunt",
        "discoveries",
        "discoveries.treasure",
        "discoveries.treasure.clue",
      ],
    });

    if (!session) {
      throw new NotFoundException(
        `Game session with ID ${sessionId} not found`,
      );
    }

    return session;
  }

  async scanQrCode(
    sessionId: number,
    scanQrDto: ScanQrDto,
  ): Promise<{
    success: boolean;
    treasure?: Treasure;
    clue?: string;
    isGameComplete?: boolean;
    message: string;
  }> {
    const session = await this.getGameSession(sessionId);

    if (session.status !== GameStatus.ACTIVE) {
      throw new BadRequestException("Game session is not active");
    }

    // Find the treasure with this QR code
    const treasure = await this.treasureRepository.findOne({
      where: { qrCodeData: scanQrDto.qrCodeData, huntId: session.huntId },
      relations: ["clue"],
    });

    if (!treasure) {
      return {
        success: false,
        message: "Invalid QR code or treasure not found for this hunt",
      };
    }

    // Check if this is the correct treasure in sequence
    if (treasure.ordinal !== session.currentTreasureOrdinal) {
      if (treasure.ordinal < session.currentTreasureOrdinal) {
        return {
          success: false,
          message:
            "You have already found this treasure! Look for the next one.",
        };
      } else {
        return {
          success: false,
          message: `This is treasure #${treasure.ordinal}, but you need to find treasure #${session.currentTreasureOrdinal} first!`,
        };
      }
    }

    // Check if treasure was already discovered (shouldn't happen with proper sequencing)
    const existingDiscovery = await this.treasureDiscoveryRepository.findOne({
      where: { gameSessionId: sessionId, treasureId: treasure.id },
    });

    if (existingDiscovery) {
      return {
        success: false,
        message: "You have already found this treasure!",
      };
    }

    // Calculate time taken for this treasure
    const now = new Date();
    let timeTaken = 0;

    if (session.discoveries && session.discoveries.length > 0) {
      // Time since last discovery
      const lastDiscovery = session.discoveries[session.discoveries.length - 1];
      timeTaken = Math.floor(
        (now.getTime() - lastDiscovery.discoveredAt.getTime()) / 1000,
      );
    } else {
      // Time since game started
      timeTaken = Math.floor(
        (now.getTime() - session.startedAt.getTime()) / 1000,
      );
    }

    // Record the discovery
    const discovery = this.treasureDiscoveryRepository.create({
      gameSessionId: sessionId,
      treasureId: treasure.id,
      treasureOrdinal: treasure.ordinal,
      timeTakenSeconds: timeTaken,
    });

    await this.treasureDiscoveryRepository.save(discovery);

    // Update game session
    const isGameComplete = treasure.ordinal === session.totalTreasures;

    if (isGameComplete) {
      // Game completed
      const totalTime = Math.floor(
        (now.getTime() - session.startedAt.getTime()) / 1000,
      );
      await this.gameSessionRepository.update(sessionId, {
        status: GameStatus.COMPLETED,
        completedAt: now,
        totalTimeSeconds: totalTime,
      });
    } else {
      // Move to next treasure
      await this.gameSessionRepository.update(sessionId, {
        currentTreasureOrdinal: treasure.ordinal + 1,
      });
    }

    return {
      success: true,
      treasure,
      clue: treasure.clue?.text,
      isGameComplete,
      message: isGameComplete
        ? "🏆 Congratulations! You have completed the treasure hunt!"
        : `🏴‍☠️ Treasure found! ${treasure.clue?.text || "Look for the next treasure!"}`,
    };
  }

  async abandonGame(sessionId: number): Promise<void> {
    const session = await this.gameSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(
        `Game session with ID ${sessionId} not found`,
      );
    }

    if (session.status !== GameStatus.ACTIVE) {
      throw new BadRequestException("Game session is not active");
    }

    await this.gameSessionRepository.update(sessionId, {
      status: GameStatus.ABANDONED,
    });
  }

  async getGameStats(huntId: number): Promise<{
    totalSessions: number;
    completedSessions: number;
    averageCompletionTime: number;
    completionRate: number;
  }> {
    const totalSessions = await this.gameSessionRepository.count({
      where: { huntId },
    });

    const completedSessions = await this.gameSessionRepository.count({
      where: { huntId, status: GameStatus.COMPLETED },
    });

    const completedSessionsData = await this.gameSessionRepository.find({
      where: { huntId, status: GameStatus.COMPLETED },
      select: ["totalTimeSeconds"],
    });

    const averageCompletionTime =
      completedSessionsData.length > 0
        ? Math.round(
            completedSessionsData.reduce(
              (sum, session) => sum + session.totalTimeSeconds,
              0,
            ) / completedSessionsData.length,
          )
        : 0;

    const completionRate =
      totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    return {
      totalSessions,
      completedSessions,
      averageCompletionTime,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  }
}
