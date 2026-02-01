export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: 'lose' | 'maintain' | 'gain' | 'recomp' | null;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  dietary_preferences: string[] | null;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  servings: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null;
  logged_at: string;
  created_at: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  equipment: string[] | null;
  exercises: Exercise[];
  safety_notes: string[] | null;
  generated_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servings: number;
}
