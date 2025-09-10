import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { GameSession } from "./entities/game-session.entity";
import { TreasureDiscovery } from "./entities/treasure-discovery.entity";
import { Hunt } from "../hunts/entities/hunt.entity";
import { Treasure } from "../treasures/entities/treasure.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([GameSession, TreasureDiscovery, Hunt, Treasure]),
  ],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
