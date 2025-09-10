import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { GameService } from "./game.service";
import { StartGameDto } from "./dto/start-game.dto";
import { ScanQrDto } from "./dto/scan-qr.dto";

@Controller("api/game")
export class GameController {
  constructor(private readonly gameService: GameService) {}

  // Start a new game session
  @Post("hunts/:huntId/start")
  async startGame(
    @Param("huntId", ParseIntPipe) huntId: number,
    @Body() startGameDto: StartGameDto,
  ) {
    return this.gameService.startGame(huntId, startGameDto);
  }

  // Get game session details
  @Get("sessions/:sessionId")
  async getGameSession(@Param("sessionId", ParseIntPipe) sessionId: number) {
    return this.gameService.getGameSession(sessionId);
  }

  // Scan QR code during game
  @Post("sessions/:sessionId/scan")
  async scanQrCode(
    @Param("sessionId", ParseIntPipe) sessionId: number,
    @Body() scanQrDto: ScanQrDto,
  ) {
    return this.gameService.scanQrCode(sessionId, scanQrDto);
  }

  // Abandon/quit game
  @Post("sessions/:sessionId/abandon")
  @HttpCode(HttpStatus.NO_CONTENT)
  async abandonGame(@Param("sessionId", ParseIntPipe) sessionId: number) {
    await this.gameService.abandonGame(sessionId);
  }

  // Get game statistics for a hunt
  @Get("hunts/:huntId/stats")
  async getGameStats(@Param("huntId", ParseIntPipe) huntId: number) {
    return this.gameService.getGameStats(huntId);
  }
}
