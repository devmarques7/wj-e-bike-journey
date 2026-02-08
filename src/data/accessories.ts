// Mock accessory data for the accessories gallery
export interface Accessory {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  category: "safety" | "storage" | "tech" | "comfort" | "protection";
  colors: {
    name: string;
    hex: string;
  }[];
  specs: {
    material?: string;
    weight?: string;
    compatibility?: string;
    warranty?: string;
  };
  features: string[];
  image: string;
  isNew?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
}

export const accessories: Accessory[] = [
  {
    id: "helmet-pro",
    name: "Vision Helmet Pro",
    tagline: "Aerodynamic Safety",
    price: 149,
    category: "safety",
    colors: [
      { name: "Matte Black", hex: "#1a1a1a" },
      { name: "Pearl White", hex: "#f5f5f5" },
      { name: "WJ Green", hex: "#058c42" },
    ],
    specs: {
      material: "Carbon Fiber",
      weight: "280g",
      compatibility: "All head sizes",
      warranty: "3 years",
    },
    features: ["Integrated LED", "Bluetooth Speaker", "MIPS Technology", "Ventilation System"],
    image: "/placeholder.svg",
    isBestseller: true,
    isFeatured: true,
  },
  {
    id: "lock-smart",
    name: "Smart Lock X",
    tagline: "Ultimate Security",
    price: 89,
    originalPrice: 119,
    category: "tech",
    colors: [
      { name: "Stealth Black", hex: "#0a0a0a" },
      { name: "Graphite", hex: "#4a4a4a" },
    ],
    specs: {
      material: "Hardened Steel",
      weight: "450g",
      compatibility: "All WJ Bikes",
      warranty: "5 years",
    },
    features: ["App Control", "GPS Tracking", "Tamper Alert", "Auto-Lock"],
    image: "/placeholder.svg",
    isNew: true,
  },
  {
    id: "bag-commuter",
    name: "Commuter Bag",
    tagline: "Carry Everything",
    price: 129,
    category: "storage",
    colors: [
      { name: "Urban Grey", hex: "#6b7280" },
      { name: "Deep Black", hex: "#171717" },
      { name: "Forest Green", hex: "#08150d" },
    ],
    specs: {
      material: "Recycled Nylon",
      weight: "680g",
      compatibility: "Universal",
      warranty: "2 years",
    },
    features: ["Waterproof", "25L Capacity", "Quick Release", "Laptop Sleeve"],
    image: "/placeholder.svg",
    isBestseller: true,
  },
  {
    id: "light-set",
    name: "Vision Light Set",
    tagline: "Be Seen, Be Safe",
    price: 69,
    category: "safety",
    colors: [
      { name: "Black", hex: "#1a1a1a" },
    ],
    specs: {
      material: "Aircraft Aluminum",
      weight: "120g",
      compatibility: "All Bikes",
      warranty: "2 years",
    },
    features: ["800 Lumens", "USB-C Charging", "5 Modes", "Water Resistant"],
    image: "/placeholder.svg",
  },
  {
    id: "phone-mount",
    name: "Phone Mount Pro",
    tagline: "Stay Connected",
    price: 49,
    category: "tech",
    colors: [
      { name: "Matte Black", hex: "#1a1a1a" },
      { name: "Silver", hex: "#c0c0c0" },
    ],
    specs: {
      material: "CNC Aluminum",
      weight: "85g",
      compatibility: "All Phones",
      warranty: "Lifetime",
    },
    features: ["Magnetic Mount", "360° Rotation", "Wireless Charging", "Vibration Damping"],
    image: "/placeholder.svg",
    isNew: true,
  },
  {
    id: "fenders-premium",
    name: "Premium Fenders",
    tagline: "Rain or Shine",
    price: 79,
    category: "protection",
    colors: [
      { name: "Matte Black", hex: "#1a1a1a" },
      { name: "Carbon Look", hex: "#2d2d2d" },
    ],
    specs: {
      material: "Polycarbonate",
      weight: "340g",
      compatibility: "WJ City/Commuter",
      warranty: "2 years",
    },
    features: ["Full Coverage", "Quick Mount", "Splash Guard", "UV Resistant"],
    image: "/placeholder.svg",
  },
  {
    id: "seat-comfort",
    name: "Comfort Saddle",
    tagline: "Ride in Comfort",
    price: 89,
    category: "comfort",
    colors: [
      { name: "Black Leather", hex: "#1a1a1a" },
      { name: "Brown Leather", hex: "#8b4513" },
    ],
    specs: {
      material: "Genuine Leather",
      weight: "420g",
      compatibility: "Universal",
      warranty: "3 years",
    },
    features: ["Memory Foam", "Breathable", "Waterproof Base", "Ergonomic Design"],
    image: "/placeholder.svg",
  },
  {
    id: "grips-ergonomic",
    name: "Ergo Grips",
    tagline: "Perfect Grip",
    price: 35,
    category: "comfort",
    colors: [
      { name: "Black", hex: "#1a1a1a" },
      { name: "WJ Green", hex: "#058c42" },
      { name: "Brown", hex: "#8b4513" },
    ],
    specs: {
      material: "Kraton Rubber",
      weight: "95g",
      compatibility: "All Handlebars",
      warranty: "1 year",
    },
    features: ["Anti-Slip", "Shock Absorbing", "Lock-On System", "Hand Support"],
    image: "/placeholder.svg",
  },
  {
    id: "mirror-aero",
    name: "Aero Mirror",
    tagline: "See Behind",
    price: 29,
    category: "safety",
    colors: [
      { name: "Black", hex: "#1a1a1a" },
    ],
    specs: {
      material: "Glass + ABS",
      weight: "45g",
      compatibility: "All Handlebars",
      warranty: "1 year",
    },
    features: ["Wide Angle", "Foldable", "Anti-Glare", "Tool-Free Mount"],
    image: "/placeholder.svg",
  },
];

export const accessoryCategories = [
  { id: "all", name: "All" },
  { id: "safety", name: "Safety" },
  { id: "storage", name: "Storage" },
  { id: "tech", name: "Tech" },
  { id: "comfort", name: "Comfort" },
  { id: "protection", name: "Protection" },
];
