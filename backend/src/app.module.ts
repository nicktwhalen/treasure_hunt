import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AppController } from "./app.controller";
import { DatabaseModule } from "./database/database.module";
import { HuntsModule } from "./hunts/hunts.module";
import { TreasuresModule } from "./treasures/treasures.module";
import { CluesModule } from "./clues/clues.module";
import { GameModule } from "./game/game.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    HuntsModule,
    TreasuresModule,
    CluesModule,
    GameModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
