export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'staff';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  ingredients: string[];
  image: string;
  category: 'Classic' | 'Seasonal' | 'Signature';
  inStock: boolean;
  prepTime: number; // in minutes
}

export interface CustomBlend {
  name: string;
  base: string; // e.g. Coconut Water, Orange Juice, Apple Juice
  ingredients: {
    name: string;
    amount: number; // e.g. 10 - 100%
    color: string;
  }[];
  sweetness: 'None' | 'Subtle' | 'Natural' | 'Sweet';
  addins: string[]; // e.g. Ginger, Chia Seeds, Mint, Protein Powder
  aiDescription?: string;
  aiTagline?: string;
  aiFunFact?: string;
  aiColor?: string; // hex representation of the blended juice
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isCustom: boolean;
  customDetails?: CustomBlend;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'on_the_way' | 'delivered';
  paymentStatus: 'pending' | 'paid';
  createdAt: string;
  address: string;
  tracking: {
    driverName: string;
    driverPhone: string;
    driverStep: number; // 0: Pending, 1: Preparing, 2: Out for Delivery, 3: Arrived
    statusLog: { status: string; timestamp: string }[];
    simulatedProgress: number; // 0 to 100
  };
}
