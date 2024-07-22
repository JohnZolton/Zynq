import * as SQLite from "expo-sqlite";

interface FoodNutrient {
  id: number;
  amount: number;
  nutrient: {
    id: number;
    name: string;
    unitName: string;
  };
}

export interface BrandedFoodItem {
  fdcId: number;
  description: string;
  brandOwner?: string;
  ingredients?: string;
  foodNutrients: FoodNutrient[];
}

export interface LoggedFood {
  id: number;
  date: string;
  time: string;
  amount: number;
  foodId: number;
  foodData: string; // JSON string of BrandedFoodItem
}
