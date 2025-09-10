import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Treasure } from "../../treasures/entities/treasure.entity";

@Entity("hunts")
export class Hunt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  title: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => Treasure, (treasure) => treasure.hunt, {
    cascade: true,
    eager: false,
  })
  treasures: Treasure[];
}
