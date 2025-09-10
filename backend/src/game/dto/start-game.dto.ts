import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class StartGameDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1, { message: "Player name must not be empty" })
  @MaxLength(50, { message: "Player name must be less than 50 characters" })
  playerName: string;
}
