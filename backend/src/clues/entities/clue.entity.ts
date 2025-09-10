import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Treasure } from "../../treasures/entities/treasure.entity";

@Entity("clues")
export class Clue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "treasure_id" })
  treasureId: number;

  @Column({ type: "text", nullable: false })
  text: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToOne(() => Treasure, (treasure) => treasure.clue, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "treasure_id" })
  treasure: Treasure;
}
