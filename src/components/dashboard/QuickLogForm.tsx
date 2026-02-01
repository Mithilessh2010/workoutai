import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Plus, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface QuickLogFormProps {
  onMealLogged: () => void;
}

const mealTypes = [
  { value: 'breakfast', label: 'Breakfast', icon: Coffee },
  { value: 'lunch', label: 'Lunch', icon: Sun },
  { value: 'dinner', label: 'Dinner', icon: Moon },
  { value: 'snack', label: 'Snack', icon: Cookie },
];

export function QuickLogForm({ onMealLogged }: QuickLogFormProps) {
  const [input, setInput] = useState('');
  const [mealType, setMealType] = useState<string>('snack');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('parse-nutrition', {
        body: { text: input },
      });

      if (error) throw error;

      const nutrition = data.nutrition;

      const { error: insertError } = await supabase.from('meals').insert({
        user_id: user.id,
        name: nutrition.name || input,
        description: input,
        calories: nutrition.calories || 0,
        protein: nutrition.protein || 0,
        carbs: nutrition.carbs || 0,
        fat: nutrition.fat || 0,
        fiber: nutrition.fiber || 0,
        servings: nutrition.servings || 1,
        meal_type: mealType,
        logged_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      toast({
        title: '🎉 Meal logged!',
        description: `${nutrition.name}: ${Math.round(nutrition.calories)} calories added`,
      });

      setInput('');
      onMealLogged();
    } catch (error) {
      console.error('Error logging meal:', error);
      toast({
        title: 'Error',
        description: 'Failed to log meal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="glass-card rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">Quick Log</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Describe what you ate in natural language and AI will parse the nutrition.
      </p>

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='e.g. "Two scrambled eggs with toast and a glass of orange juice"'
        className="min-h-[100px] resize-none"
        disabled={isLoading}
      />

      <div className="flex flex-wrap gap-2">
        {mealTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => setMealType(type.value)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                mealType === type.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Icon className="w-4 h-4" />
              {type.label}
            </button>
          );
        })}
      </div>

      <Button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="w-full gap-2"
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </motion.span>
          ) : (
            <motion.span
              key="submit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Log Meal
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.form>
  );
}
