import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Flame, Target, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Meal } from '@/types';
import { cn } from '@/lib/utils';

interface DayData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function Insights() {
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [averages, setAverages] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchWeekData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        const days: DayData[] = [];
        let currentStreak = 0;
        
        for (let i = 6; i >= 0; i--) {
          const day = subDays(new Date(), i);
          const start = startOfDay(day).toISOString();
          const end = endOfDay(day).toISOString();
          
          const { data } = await supabase
            .from('meals')
            .select('*')
            .eq('user_id', user.id)
            .gte('logged_at', start)
            .lte('logged_at', end);
          
          const meals = (data || []) as Meal[];
          const totals = meals.reduce(
            (acc, meal) => ({
              calories: acc.calories + (meal.calories || 0),
              protein: acc.protein + (meal.protein || 0),
              carbs: acc.carbs + (meal.carbs || 0),
              fat: acc.fat + (meal.fat || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );
          
          days.push({
            date: format(day, 'EEE'),
            ...totals,
          });
          
          // Calculate streak (days with logged meals)
          if (meals.length > 0) {
            currentStreak++;
          } else {
            currentStreak = 0;
          }
        }
        
        setWeekData(days);
        setStreak(currentStreak);
        
        // Calculate averages
        const totalDays = days.filter(d => d.calories > 0).length || 1;
        setAverages({
          calories: Math.round(days.reduce((sum, d) => sum + d.calories, 0) / totalDays),
          protein: Math.round(days.reduce((sum, d) => sum + d.protein, 0) / totalDays),
          carbs: Math.round(days.reduce((sum, d) => sum + d.carbs, 0) / totalDays),
          fat: Math.round(days.reduce((sum, d) => sum + d.fat, 0) / totalDays),
        });
      } catch (error) {
        console.error('Error fetching insights:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchWeekData();
    }
  }, [user]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const macroDistribution = [
    { name: 'Protein', value: averages.protein * 4, color: 'hsl(210, 85%, 55%)' },
    { name: 'Carbs', value: averages.carbs * 4, color: 'hsl(158, 64%, 45%)' },
    { name: 'Fat', value: averages.fat * 9, color: 'hsl(340, 75%, 55%)' },
  ];

  const calorieComparison = averages.calories - profile.daily_calories;
  const getTrendIcon = () => {
    if (calorieComparison > 100) return <TrendingUp className="w-5 h-5 text-destructive" />;
    if (calorieComparison < -100) return <TrendingDown className="w-5 h-5 text-primary" />;
    return <Minus className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold text-foreground">Insights</h1>
          <p className="text-muted-foreground mt-1">Your weekly nutrition analytics</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-calories/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-calories" />
              </div>
              {getTrendIcon()}
            </div>
            <p className="text-2xl font-bold">{averages.calories}</p>
            <p className="text-sm text-muted-foreground">Avg. Calories</p>
            <p className={cn(
              'text-xs mt-1',
              calorieComparison > 0 ? 'text-destructive' : 'text-primary'
            )}>
              {calorieComparison > 0 ? '+' : ''}{calorieComparison} from target
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-protein/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-protein" />
              </div>
            </div>
            <p className="text-2xl font-bold">{averages.protein}g</p>
            <p className="text-sm text-muted-foreground">Avg. Protein</p>
            <p className="text-xs text-muted-foreground mt-1">
              Target: {profile.daily_protein}g
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">{streak} days</p>
            <p className="text-sm text-muted-foreground">Logging Streak</p>
            <p className="text-xs text-primary mt-1">
              {streak >= 7 ? '🔥 Perfect week!' : 'Keep it up!'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-carbs/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-carbs" />
              </div>
            </div>
            <p className="text-2xl font-bold">{weekData.filter(d => d.calories > 0).length}</p>
            <p className="text-sm text-muted-foreground">Days Tracked</p>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calorie Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="font-display font-semibold text-lg mb-6">Calorie Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="calories"
                  stroke="hsl(var(--calories))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--calories))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Macro Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="font-display font-semibold text-lg mb-6">Macro Distribution</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={macroDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {macroDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${Math.round(value)} cal`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {macroDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Protein Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="font-display font-semibold text-lg mb-6">Protein Intake</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="protein"
                stroke="hsl(var(--protein))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--protein))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </MainLayout>
  );
}
