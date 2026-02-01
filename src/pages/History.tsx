import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { MealTimeline } from '@/components/dashboard/MealTimeline';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Meal, MacroTotals } from '@/types';
import { cn } from '@/lib/utils';

export default function History() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState<MacroTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Generate week days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(subDays(new Date(), i));
    }
    setWeekDays(days);
  }, []);

  const fetchMeals = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
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
      const { error } = await supabase.from('meals').delete().eq('id', meal.id);
      if (error) throw error;
      
      toast({
        title: 'Meal deleted',
        description: `${meal.name} has been removed.`,
      });
      
      fetchMeals();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete meal.',
        variant: 'destructive',
      });
    }
  };

  const goToPreviousWeek = () => {
    const newDate = subDays(selectedDate, 7);
    setSelectedDate(newDate);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(subDays(newDate, i));
    }
    setWeekDays(days);
  };

  const goToNextWeek = () => {
    const today = new Date();
    const newDate = subDays(selectedDate, -7);
    if (newDate <= today) {
      setSelectedDate(newDate);
      const days = [];
      for (let i = 6; i >= 0; i--) {
        days.push(subDays(newDate, i));
      }
      setWeekDays(days);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold text-foreground">History</h1>
          <p className="text-muted-foreground mt-1">View and manage your past meals</p>
        </motion.div>

        {/* Week Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="font-medium">
              {format(weekDays[0] || new Date(), 'MMM d')} - {format(weekDays[6] || new Date(), 'MMM d, yyyy')}
            </span>
            <Button variant="ghost" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-xl transition-all',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : isToday
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'hover:bg-muted'
                  )}
                >
                  <span className="text-xs font-medium opacity-70">{format(day, 'EEE')}</span>
                  <span className="text-lg font-bold">{format(day, 'd')}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Day Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-4"
        >
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-calories">{Math.round(totals.calories)}</p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-protein">{Math.round(totals.protein)}g</p>
            <p className="text-xs text-muted-foreground">Protein</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-carbs">{Math.round(totals.carbs)}g</p>
            <p className="text-xs text-muted-foreground">Carbs</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-fat">{Math.round(totals.fat)}g</p>
            <p className="text-xs text-muted-foreground">Fat</p>
          </div>
        </motion.div>

        {/* Meals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="font-display font-semibold text-lg mb-4">
            Meals on {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <MealTimeline meals={meals} onDelete={handleDeleteMeal} />
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}
