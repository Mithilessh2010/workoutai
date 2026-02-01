import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Target, Activity, Scale, Utensils, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const goals = [
  { value: 'lose', label: 'Lose Weight', desc: 'Burn fat, get leaner' },
  { value: 'maintain', label: 'Maintain', desc: 'Stay healthy and fit' },
  { value: 'gain', label: 'Build Muscle', desc: 'Gain strength and size' },
  { value: 'recomp', label: 'Recomposition', desc: 'Lose fat, gain muscle' },
];

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Desk job, little exercise' },
  { value: 'light', label: 'Light Activity', desc: 'Light exercise 1-3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: 'Moderate exercise 3-5 days/week' },
  { value: 'active', label: 'Active', desc: 'Hard exercise 6-7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Athlete or physical job' },
];

const dietaryOptions = [
  'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free', 'Low Carb', 'High Protein'
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState('');
  const [activity, setActivity] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const calculateMacros = () => {
    const h = parseFloat(height) || 170;
    const w = parseFloat(weight) || 70;
    
    // Mifflin-St Jeor equation
    const bmr = 10 * w + 6.25 * h - 5 * 30 + 5; // Assuming age 30, male for simplicity
    
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    
    let tdee = bmr * (activityMultipliers[activity] || 1.55);
    
    // Adjust based on goal
    if (goal === 'lose') tdee -= 500;
    if (goal === 'gain') tdee += 300;
    
    const calories = Math.round(tdee);
    const protein = Math.round(w * 2); // 2g per kg
    const fat = Math.round((calories * 0.25) / 9);
    const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
    
    return { calories, protein, carbs, fat };
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const macros = calculateMacros();
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          goal,
          activity_level: activity,
          height_cm: parseFloat(height) || null,
          weight_kg: parseFloat(weight) || null,
          dietary_preferences: dietary.length > 0 ? dietary : null,
          daily_calories: macros.calories,
          daily_protein: macros.protein,
          daily_carbs: macros.carbs,
          daily_fat: macros.fat,
          onboarding_completed: true,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await refreshProfile();
      
      toast({
        title: '🎉 Welcome to MacroMate!',
        description: 'Your personalized plan is ready.',
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your preferences.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!goal;
      case 1: return !!activity;
      case 2: return !!height && !!weight;
      case 3: return true;
      default: return false;
    }
  };

  const steps = [
    { icon: Target, title: 'Your Goal' },
    { icon: Activity, title: 'Activity Level' },
    { icon: Scale, title: 'Your Stats' },
    { icon: Utensils, title: 'Preferences' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Header */}
      <div className="border-b border-border p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      i < step ? 'bg-primary text-primary-foreground' :
                      i === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                      'bg-muted text-muted-foreground'
                    )}
                  >
                    {i < step ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        'h-0.5 w-12 sm:w-24 mx-2',
                        i < step ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="goal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold mb-2">What's your goal?</h1>
                  <p className="text-muted-foreground">We'll customize your macros based on this</p>
                </div>

                <div className="grid gap-3">
                  {goals.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setGoal(g.value)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        goal === g.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <p className="font-medium">{g.label}</p>
                      <p className="text-sm text-muted-foreground">{g.desc}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold mb-2">How active are you?</h1>
                  <p className="text-muted-foreground">This helps us calculate your daily needs</p>
                </div>

                <div className="grid gap-3">
                  {activityLevels.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setActivity(a.value)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        activity === a.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <p className="font-medium">{a.label}</p>
                      <p className="text-sm text-muted-foreground">{a.desc}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold mb-2">Your measurements</h1>
                  <p className="text-muted-foreground">Used to calculate your calorie needs</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="170"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="70"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="dietary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-bold mb-2">Dietary preferences</h1>
                  <p className="text-muted-foreground">Optional — select any that apply</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        if (dietary.includes(option)) {
                          setDietary(dietary.filter((d) => d !== option));
                        } else {
                          setDietary([...dietary, option]);
                        }
                      }}
                      className={cn(
                        'px-4 py-2 rounded-full border-2 text-sm font-medium transition-all',
                        dietary.includes(option)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {height && weight && (
                  <div className="mt-8 p-6 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-4">Your calculated daily targets:</p>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      {Object.entries(calculateMacros()).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-2xl font-bold text-foreground">{value}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {key === 'calories' ? 'cal' : 'g ' + key}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t border-border p-4">
        <div className="max-w-lg mx-auto flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Complete Setup'}
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
