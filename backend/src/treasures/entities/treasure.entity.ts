import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Hunt } from "../../hunts/entities/hunt.entity";
import { Clue } from "../../clues/entities/clue.entity";

@Entity("treasures")
@Unique(["huntId", "ordinal"])
export class Treasure {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "hunt_id" })
  huntId: number;

  @Column({ type: "integer" })
  ordinal: number;

  @Column({ name: "qr_code_data", type: "varchar", length: 255, unique: true })
  qrCodeData: string;

  @Column({
    name: "qr_code_image_path",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  qrCodeImagePath: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => Hunt, (hunt) => hunt.treasures, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "hunt_id" })
  hunt: Hunt;

  @OneToOne(() => Clue, (clue) => clue.treasure, {
    cascade: true,
    eager: true,
  })
  clue: Clue;
}
