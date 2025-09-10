import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

import { Hunt } from "../hunts/entities/hunt.entity";
import { Treasure } from "../treasures/entities/treasure.entity";
import { Clue } from "../clues/entities/clue.entity";
import { GameSession } from "../game/entities/game-session.entity";
import { TreasureDiscovery } from "../game/entities/treasure-discovery.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("DB_HOST", "localhost"),
        port: configService.get("DB_PORT", 5432),
        username: configService.get("DB_USERNAME", "treasure_hunt"),
        password: configService.get("DB_PASSWORD", "password"),
        database: configService.get("DB_NAME", "treasure_hunt"),
        entities: [Hunt, Treasure, Clue, GameSession, TreasureDiscovery],
        synchronize: configService.get("NODE_ENV") === "development",
        logging: configService.get("NODE_ENV") === "development",
      }),
    }),
  ],
})
export class DatabaseModule {}
