import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { GameSession } from "./game-session.entity";
import { Treasure } from "../../treasures/entities/treasure.entity";

@Entity("treasure_discoveries")
export class TreasureDiscovery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "game_session_id" })
  gameSessionId: number;

  @Column({ name: "treasure_id" })
  treasureId: number;

  @Column({ name: "treasure_ordinal" })
  treasureOrdinal: number;

  @Column({
    name: "discovered_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  discoveredAt: Date;

  @Column({ name: "time_taken_seconds" })
  timeTakenSeconds: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // Relations
  @ManyToOne(() => GameSession, (session) => session.discoveries, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "game_session_id" })
  gameSession: GameSession;

  @ManyToOne(() => Treasure, { onDelete: "CASCADE" })
  @JoinColumn({ name: "treasure_id" })
  treasure: Treasure;
}
