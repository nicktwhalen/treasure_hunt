import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Clue } from "./entities/clue.entity";

@Injectable()
export class CluesService {
  constructor(
    @InjectRepository(Clue)
    private cluesRepository: Repository<Clue>,
  ) {}
}
