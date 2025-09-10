import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { Hunt } from "../../hunts/entities/hunt.entity";
import { TreasureDiscovery } from "./treasure-discovery.entity";

export enum GameStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  ABANDONED = "abandoned",
}

@Entity("game_sessions")
export class GameSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  huntId: number;

  @Column({ name: "player_name" })
  playerName: string;

  @Column({
    type: "enum",
    enum: GameStatus,
    default: GameStatus.ACTIVE,
  })
  status: GameStatus;

  @Column({ name: "current_treasure_ordinal", default: 1 })
  currentTreasureOrdinal: number;

  @Column({ name: "total_treasures" })
  totalTreasures: number;

  @Column({
    name: "started_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  startedAt: Date;

  @Column({ name: "completed_at", type: "timestamp", nullable: true })
  completedAt: Date | null;

  @Column({ name: "total_time_seconds", default: 0 })
  totalTimeSeconds: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Hunt, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hunt_id" })
  hunt: Hunt;

  @OneToMany(() => TreasureDiscovery, (discovery) => discovery.gameSession, {
    cascade: true,
  })
  discoveries: TreasureDiscovery[];

  // Computed properties
  get isCompleted(): boolean {
    return this.status === GameStatus.COMPLETED;
  }

  get isActive(): boolean {
    return this.status === GameStatus.ACTIVE;
  }

  get progress(): number {
    return this.totalTreasures > 0
      ? (this.currentTreasureOrdinal - 1) / this.totalTreasures
      : 0;
  }

  get progressPercentage(): number {
    return Math.round(this.progress * 100);
  }
}
