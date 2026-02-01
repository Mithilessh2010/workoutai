import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Flame, Drumstick, Wheat, Droplets, Plus, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { MacroCard } from '@/components/dashboard/MacroCard';
import { MealTimeline } from '@/components/dashboard/MealTimeline';
import { QuickLogForm } from '@/components/dashboard/QuickLogForm';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Meal, MacroTotals } from '@/types';

export default function Dashboard() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState<MacroTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && profile && !profile.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [user, profile, loading, navigate]);

  const fetchMeals = async () => {
    if (!user) return;
    
    try {
      const start = startOfDay(selectedDate).toISOString();
      const end = endOfDay(selectedDate).toISOString();
      
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', start)
        .lte('logged_at', end)
        .order('logged_at', { ascending: false });
      
      if (error) throw error;
      
      const mealData = (data || []) as Meal[];
      setMeals(mealData);
      
      // Calculate totals
      const t = mealData.reduce(
        (acc, meal) => ({
          calories: acc.calories + (meal.calories || 0),
          protein: acc.protein + (meal.protein || 0),
          carbs: acc.carbs + (meal.carbs || 0),
          fat: acc.fat + (meal.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      setTotals(t);
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMeals();
    }
  }, [user, selectedDate]);

  const handleDeleteMeal = async (meal: Meal) => {
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', meal.id);
      
      if (error) throw error;
      
      toast({
        title: 'Meal deleted',
        description: `${meal.name} has been removed.`,
      });
      
      fetchMeals();
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete meal.',
        variant: 'destructive',
      });
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const calorieProgress = (totals.calories / profile.daily_calories) * 100;

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Calendar className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Main Calorie Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8"
        >
          <ProgressRing progress={calorieProgress} size={200} strokeWidth={12} color="calories">
            <div className="text-center">
              <p className="text-4xl font-bold font-display text-foreground">
                {Math.round(totals.calories)}
              </p>
              <p className="text-sm text-muted-foreground">of {profile.daily_calories} cal</p>
            </div>
          </ProgressRing>

          <div className="flex-1 space-y-4">
            <h2 className="font-display text-xl font-semibold">Today's Progress</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-protein/10">
                <div className="flex items-center gap-2 mb-2">
                  <Drumstick className="w-4 h-4 text-protein" />
                  <span className="text-sm font-medium text-protein">Protein</span>
                </div>
                <p className="text-2xl font-bold">{Math.round(totals.protein)}g</p>
                <p className="text-xs text-muted-foreground">of {profile.daily_protein}g</p>
              </div>
              
              <div className="p-4 rounded-xl bg-carbs/10">
                <div className="flex items-center gap-2 mb-2">
                  <Wheat className="w-4 h-4 text-carbs" />
                  <span className="text-sm font-medium text-carbs">Carbs</span>
                </div>
                <p className="text-2xl font-bold">{Math.round(totals.carbs)}g</p>
                <p className="text-xs text-muted-foreground">of {profile.daily_carbs}g</p>
              </div>
              
              <div className="p-4 rounded-xl bg-fat/10">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-4 h-4 text-fat" />
                  <span className="text-sm font-medium text-fat">Fat</span>
                </div>
                <p className="text-2xl font-bold">{Math.round(totals.fat)}g</p>
                <p className="text-xs text-muted-foreground">of {profile.daily_fat}g</p>
              </div>
            </div>

            {calorieProgress >= 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3"
              >
                <Flame className="w-6 h-6 text-primary animate-pulse" />
                <div>
                  <p className="font-medium text-primary">Calorie goal reached! 🎉</p>
                  <p className="text-sm text-muted-foreground">Great job staying on track!</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Quick Log & Timeline */}
        <div className="grid lg:grid-cols-2 gap-8">
          <QuickLogForm onMealLogged={fetchMeals} />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="font-display font-semibold text-lg mb-4">Today's Meals</h3>
            <MealTimeline meals={meals} onDelete={handleDeleteMeal} />
          </motion.div>
        </div>

        {/* Macro Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MacroCard
            label="Calories"
            current={totals.calories}
            target={profile.daily_calories}
            unit=" cal"
            color="calories"
            delay={0}
          />
          <MacroCard
            label="Protein"
            current={totals.protein}
            target={profile.daily_protein}
            color="protein"
            delay={0.1}
          />
          <MacroCard
            label="Carbs"
            current={totals.carbs}
            target={profile.daily_carbs}
            color="carbs"
            delay={0.2}
          />
          <MacroCard
            label="Fat"
            current={totals.fat}
            target={profile.daily_fat}
            color="fat"
            delay={0.3}
          />
        </div>
      </div>
    </MainLayout>
  );
}
