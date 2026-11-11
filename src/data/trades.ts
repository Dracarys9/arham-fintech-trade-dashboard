export interface Trade {
  id: string;
  client: string;
  symbol: string;
  quantity: number;
  price: number;
  timestamp: string;
}

interface StockDefinition {
  symbol: string;
  basePrice: number;
}

const STOCKS: ReadonlyArray<StockDefinition> = [
  { symbol: "RELIANCE", basePrice: 2_850 },
  { symbol: "TCS", basePrice: 3_950 },
  { symbol: "INFY", basePrice: 1_650 },
  { symbol: "HDFCBANK", basePrice: 1_720 },
  { symbol: "ICICIBANK", basePrice: 1_280 },
  { symbol: "SBIN", basePrice: 820 },
  { symbol: "ITC", basePrice: 470 },
  { symbol: "LT", basePrice: 3_650 },
  { symbol: "BHARTIARTL", basePrice: 1_620 },
  { symbol: "MARUTI", basePrice: 12_100 },
  { symbol: "HINDUNILVR", basePrice: 2_450 },
  { symbol: "AXISBANK", basePrice: 1_140 },
];

const CLIENTS = [
  "Arham Securities",
  "Apex Capital",
  "BlueChip Investments",
  "Crescent Broking",
  "FinEdge Wealth",
  "Greenfield Holdings",
  "Horizon Capital",
  "Lotus Financial",
  "Nexus Investments",
  "Pioneer Broking",
  "Quantum Wealth",
  "Summit Securities",
] as const;

class SeededRandom {
  private state: number;

  public constructor(seed: number) {
    if (!Number.isInteger(seed)) {
      throw new Error("Seed must be an integer");
    }

    this.state = seed >>> 0 || 1;
  }

  public next(): number {
    this.state = (1_664_525 * this.state + 1_013_904_223) >>> 0;
    return this.state / 0x1_0000_0000;
  }

  public integer(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function generateTrades(
  count = 3_000,
  seed = 20_261_111,
): Trade[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error("Trade count must be a non-negative integer");
  }

  const random = new SeededRandom(seed);
  const now = Date.now();

  return Array.from({ length: count }, (_, index) => {
    const stock = STOCKS[random.integer(0, STOCKS.length - 1)];
    const client = CLIENTS[random.integer(0, CLIENTS.length - 1)];

    if (!stock || !client) {
      throw new Error("Unable to select seeded trade data");
    }

    const priceChange = 1 + (random.next() - 0.5) * 0.08;
    const price = roundToTwo(stock.basePrice * priceChange);
    const quantity = random.integer(1, 500);
    const timestamp = new Date(
      now - random.integer(0, 30 * 24 * 60 * 60 * 1_000),
    ).toISOString();

    return {
      id: `BSE-${String(index + 1).padStart(6, "0")}`,
      client,
      symbol: stock.symbol,
      quantity,
      price,
      timestamp,
    };
  });
}

export const trades: Trade[] = generateTrades();
