export enum Category {
  Electronics = 'Electronics',
  Books = 'Books',
  Clothing = 'Clothing',
  Drawing_Instruments = 'Drawing Instruments',
  Furniture = 'Furniture',
  Stationery = 'Stationery',
  Sports = 'Sports Equipment',
  Other = 'Other'
}

export enum Condition {
  New = 'New',
  LikeNew = 'Like New',
  UsedGood = 'Used - Good',
  UsedFair = 'Used - Fair'
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  createdAt: string;
}

export interface Product {
  id: string;
  userId: string;
  // seller contact info — only phone is kept (course/year removed)
  sellerName: string;
  sellerPhone: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  condition: Condition;
  images: string[];
  isSold: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
