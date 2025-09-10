const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001/api"
    : "/api");

export interface Hunt {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  treasures?: Treasure[];
}

export interface Treasure {
  id: number;
  huntId: number;
  ordinal: number;
  qrCodeData: string;
  qrCodeImagePath: string;
  createdAt: string;
  updatedAt: string;
  clue?: Clue;
}

export interface Clue {
  id: number;
  treasureId: number;
  text: string;
  createdAt: string;
  updatedAt: string;
}

class ApiClient {
  private async request(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<any> {
    const url = `${API_BASE}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  // Hunt endpoints
  async getHunts(): Promise<Hunt[]> {
    return this.request("/hunts");
  }

  async getHunt(id: number): Promise<Hunt> {
    return this.request(`/hunts/${id}`);
  }

  async createHunt(
    title: string,
    treasures?: { ordinal: number; clueText: string }[],
  ): Promise<Hunt> {
    const body: any = { title };
    if (treasures !== undefined) {
      body.treasures = treasures;
    }
    return this.request("/hunts", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async updateHunt(
    id: number,
    title: string,
    treasures?: { ordinal: number; clueText: string }[],
  ): Promise<Hunt> {
    const body: any = { title };
    if (treasures !== undefined) {
      body.treasures = treasures;
    }
    return this.request(`/hunts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async deleteHunt(id: number): Promise<void> {
    return this.request(`/hunts/${id}`, {
      method: "DELETE",
    });
  }

  // Treasure endpoints - read-only, modifications done via hunt endpoints
  async getTreasures(huntId: number): Promise<Treasure[]> {
    return this.request(`/hunts/${huntId}/treasures`);
  }

  async getTreasure(huntId: number, treasureId: number): Promise<Treasure> {
    return this.request(`/hunts/${huntId}/treasures/${treasureId}`);
  }

  getTreasureQrUrl(huntId: number, treasureId: number): string {
    return `${API_BASE}/hunts/${huntId}/treasures/${treasureId}/qr`;
  }
}

export const api = new ApiClient();
