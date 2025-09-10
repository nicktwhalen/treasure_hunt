import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return "Ahoy! 🏴‍☠️ Treasure Hunt API is running!";
  }

  @Get("health")
  getHealth() {
    return {
      status: "ok",
      message: "Treasure Hunt API is healthy",
      timestamp: new Date().toISOString(),
    };
  }
}
