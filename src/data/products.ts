// Mock product data for the e-bike gallery
export interface BikeProduct {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  category: "city" | "commuter" | "sport" | "cargo";
  colors: {
    name: string;
    hex: string;
  }[];
  specs: {
    range: string;
    speed: string;
    weight: string;
    battery: string;
  };
  features: string[];
  image: string;
  isNew?: boolean;
  isBestseller?: boolean;
}

export const bikeProducts: BikeProduct[] = [
  {
    id: "vision-x1",
    name: "Vision X1",
    tagline: "The Urban Pioneer",
    price: 2499,
    category: "city",
    colors: [
      { name: "Midnight Black", hex: "#1a1a1a" },
      { name: "Forest Green", hex: "#08150d" },
      { name: "Pearl White", hex: "#f5f5f5" },
    ],
    specs: {
      range: "120 km",
      speed: "25 km/h",
      weight: "19 kg",
      battery: "504 Wh",
    },
    features: ["Integrated GPS", "Smart Lock", "LED Display", "USB Charging"],
    image: "/placeholder.svg",
    isBestseller: true,
  },
  {
    id: "vision-x2-pro",
    name: "Vision X2 Pro",
    tagline: "Performance Redefined",
    price: 3299,
    originalPrice: 3599,
    category: "commuter",
    colors: [
      { name: "Storm Grey", hex: "#4a4a4a" },
      { name: "WJ Green", hex: "#058c42" },
      { name: "Ocean Blue", hex: "#1e3a5f" },
    ],
    specs: {
      range: "150 km",
      speed: "25 km/h",
      weight: "21 kg",
      battery: "630 Wh",
    },
    features: ["Torque Sensor", "Carbon Fork", "Hydraulic Brakes", "App Integration"],
    image: "/placeholder.svg",
    isNew: true,
  },
  {
    id: "vision-sport",
    name: "Vision Sport",
    tagline: "Born to Move",
    price: 2899,
    category: "sport",
    colors: [
      { name: "Racing Red", hex: "#b91c1c" },
      { name: "Carbon Black", hex: "#0a0a0a" },
      { name: "Electric Yellow", hex: "#eab308" },
    ],
    specs: {
      range: "100 km",
      speed: "25 km/h",
      weight: "17 kg",
      battery: "420 Wh",
    },
    features: ["Sport Mode", "Lightweight Frame", "Racing Geometry", "Quick Charge"],
    image: "/placeholder.svg",
  },
  {
    id: "vision-cargo",
    name: "Vision Cargo",
    tagline: "Carry Everything",
    price: 3899,
    category: "cargo",
    colors: [
      { name: "Utility Grey", hex: "#6b7280" },
      { name: "Deep Black", hex: "#171717" },
    ],
    specs: {
      range: "80 km",
      speed: "25 km/h",
      weight: "32 kg",
      battery: "750 Wh",
    },
    features: ["200kg Capacity", "Dual Battery Option", "Child Seats Compatible", "Rain Cover"],
    image: "/placeholder.svg",
  },
  {
    id: "vision-lite",
    name: "Vision Lite",
    tagline: "Effortless Elegance",
    price: 1999,
    category: "city",
    colors: [
      { name: "Sand Beige", hex: "#d4c4a8" },
      { name: "Mint Green", hex: "#98d8c8" },
      { name: "Soft Pink", hex: "#f0b4b4" },
    ],
    specs: {
      range: "90 km",
      speed: "25 km/h",
      weight: "16 kg",
      battery: "360 Wh",
    },
    features: ["Step-Through Frame", "Basket Mount", "Kickstand", "Bell Included"],
    image: "/placeholder.svg",
    isNew: true,
  },
  {
    id: "vision-commuter-plus",
    name: "Vision Commuter+",
    tagline: "Your Daily Partner",
    price: 2799,
    category: "commuter",
    colors: [
      { name: "Graphite", hex: "#374151" },
      { name: "Navy Blue", hex: "#1e3a8a" },
      { name: "Bronze", hex: "#92400e" },
    ],
    specs: {
      range: "130 km",
      speed: "25 km/h",
      weight: "20 kg",
      battery: "540 Wh",
    },
    features: ["Fenders Included", "Rack Ready", "Puncture-Proof Tires", "Integrated Lights"],
    image: "/placeholder.svg",
    isBestseller: true,
  },
];

export const categories = [
  { id: "all", name: "All Models" },
  { id: "city", name: "City" },
  { id: "commuter", name: "Commuter" },
  { id: "sport", name: "Sport" },
  { id: "cargo", name: "Cargo" },
];
