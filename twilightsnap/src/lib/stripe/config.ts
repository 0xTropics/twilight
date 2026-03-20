export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number; // cents
  priceDisplay: string;
  perCredit: string;
  description: string;
  popular: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "pack_5",
    name: "5 Credits",
    credits: 5,
    price: 3500,
    priceDisplay: "$35.00",
    perCredit: "$7.00",
    description: "5 twilight conversions",
    popular: false,
  },
  {
    id: "pack_15",
    name: "15 Credits",
    credits: 15,
    price: 9000,
    priceDisplay: "$90.00",
    perCredit: "$6.00",
    description: "Save 14% — best for active agents",
    popular: true,
  },
  {
    id: "pack_50",
    name: "50 Credits",
    credits: 50,
    price: 25000,
    priceDisplay: "$250.00",
    perCredit: "$5.00",
    description: "Save 29% — best for teams & brokerages",
    popular: false,
  },
  {
    id: "pack_100",
    name: "100 Credits",
    credits: 100,
    price: 40000,
    priceDisplay: "$400.00",
    perCredit: "$4.00",
    description: "Save 43% — best value for high volume",
    popular: false,
  },
];

export const PRICE_PER_CREDIT = 700; // cents
export const CURRENCY = "usd";
