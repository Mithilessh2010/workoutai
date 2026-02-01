import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Clock, Zap, Loader2, Plus, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { WorkoutPlan, Exercise } from '@/types';
import { cn } from '@/lib/utils';

const equipmentOptions = [
  'Dumbbells', 'Barbell', 'Kettlebell', 'Resistance Bands', 'Pull-up Bar', 
  'Bench', 'Cable Machine', 'Treadmill', 'None (Bodyweight)'
];

const focusAreas = [
  { value: 'full', label: 'Full Body' },
  { value: 'upper', label: 'Upper Body' },
  { value: 'lower', label: 'Lower Body' },
  { value: 'core', label: 'Core & Abs' },
  { value: 'push', label: 'Push (Chest, Shoulders, Triceps)' },
  { value: 'pull', label: 'Pull (Back, Biceps)' },
];

export default function Workouts() {
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  
  const [goal, setGoal] = useState('build muscle');
  const [duration, setDuration] = useState('30');
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [focusArea, setFocusArea] = useState('full');
  
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const fetchWorkouts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Parse exercises JSONB with proper typing
      const parsed = (data || []).map(w => ({
        ...w,
        exercises: (Array.isArray(w.exercises) ? w.exercises : []) as unknown as Exercise[],
      })) as WorkoutPlan[];
      
      setWorkouts(parsed);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [user]);

  const generateWorkout = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-workout', {
        body: {
          goal,
          duration: parseInt(duration),
          fitnessLevel,
          equipment,
          focusArea: focusArea !== 'full' ? focusArea : undefined,
        },
      });
      
      if (error) throw error;
      
      const workout = data.workout;
      
      // Save to database
      const { error: insertError } = await supabase.from('workout_plans').insert({
        user_id: user.id,
        title: workout.title,
        description: workout.description,
        duration_minutes: workout.duration_minutes,
        difficulty: workout.difficulty,
        equipment: workout.equipment,
        exercises: workout.exercises,
        safety_notes: workout.safety_notes,
      });
      
      if (insertError) throw insertError;
      
      toast({
        title: '💪 Workout generated!',
        description: workout.title,
      });
      
      setShowGenerator(false);
      fetchWorkouts();
    } catch (error) {
      console.error('Error generating workout:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate workout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleEquipment = (item: string) => {
    if (equipment.includes(item)) {
      setEquipment(equipment.filter(e => e !== item));
    } else {
      setEquipment([...equipment, item]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Workouts</h1>
            <p className="text-muted-foreground mt-1">AI-powered workout plans tailored to you</p>
          </div>
          
          <Button onClick={() => setShowGenerator(!showGenerator)} className="gap-2">
            <Plus className="w-4 h-4" />
            Generate Workout
          </Button>
        </motion.div>

        {/* Generator */}
        {showGenerator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-6 space-y-6"
          >
            <h3 className="font-display font-semibold text-lg">Create Your Workout</h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Goal</Label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="build muscle">Build Muscle</SelectItem>
                    <SelectItem value="lose fat">Lose Fat</SelectItem>
                    <SelectItem value="improve strength">Improve Strength</SelectItem>
                    <SelectItem value="increase endurance">Increase Endurance</SelectItem>
                    <SelectItem value="stay active">Stay Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fitness Level</Label>
                <Select value={fitnessLevel} onValueChange={(v: 'beginner' | 'intermediate' | 'advanced') => setFitnessLevel(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Focus Area</Label>
                <Select value={focusArea} onValueChange={setFocusArea}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {focusAreas.map(area => (
                      <SelectItem key={area.value} value={area.value}>{area.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Available Equipment</Label>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map(item => (
                  <button
                    key={item}
                    onClick={() => toggleEquipment(item)}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      equipment.includes(item)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={generateWorkout} disabled={isGenerating} className="w-full gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate Workout
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Workout List */}
        <div className="space-y-4">
          {workouts.length === 0 ? (
            <div className="text-center py-16">
              <Dumbbell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">No workouts yet</h3>
              <p className="text-muted-foreground mb-6">Generate your first AI-powered workout plan</p>
              <Button onClick={() => setShowGenerator(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Workout
              </Button>
            </div>
          ) : (
            workouts.map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display font-semibold text-lg">{workout.title}</h3>
                    <p className="text-sm text-muted-foreground">{workout.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {workout.duration_minutes} min
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    workout.difficulty === 'beginner' && 'bg-green-500/10 text-green-600',
                    workout.difficulty === 'intermediate' && 'bg-yellow-500/10 text-yellow-600',
                    workout.difficulty === 'advanced' && 'bg-red-500/10 text-red-600'
                  )}>
                    {workout.difficulty}
                  </span>
                  {workout.equipment?.map(e => (
                    <span key={e} className="px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                      {e}
                    </span>
                  ))}
                </div>

                <div className="space-y-3">
                  {workout.exercises.map((exercise: Exercise, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {exercise.sets} sets × {exercise.reps} • Rest {exercise.rest}
                        </p>
                      </div>
                      {exercise.notes && (
                        <p className="text-xs text-muted-foreground max-w-xs hidden md:block">
                          💡 {exercise.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {workout.safety_notes && workout.safety_notes.length > 0 && (
                  <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-amber-600">Safety Notes</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {workout.safety_notes.map((note, i) => (
                        <li key={i}>• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
