import { motion } from 'framer-motion';
import { Coffee, Sun, Moon, Cookie, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Meal } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MealTimelineProps {
  meals: Meal[];
  onEdit?: (meal: Meal) => void;
  onDelete?: (meal: Meal) => void;
}

const mealTypeConfig = {
  breakfast: { icon: Coffee, label: 'Breakfast', color: 'text-amber-500' },
  lunch: { icon: Sun, label: 'Lunch', color: 'text-yellow-500' },
  dinner: { icon: Moon, label: 'Dinner', color: 'text-indigo-500' },
  snack: { icon: Cookie, label: 'Snack', color: 'text-pink-500' },
};

export function MealTimeline({ meals, onEdit, onDelete }: MealTimelineProps) {
  if (meals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <Coffee className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No meals logged yet today</p>
        <p className="text-sm text-muted-foreground mt-1">Start by adding your first meal!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meals.map((meal, index) => {
        const config = mealTypeConfig[meal.meal_type || 'snack'];
        const Icon = config.icon;
        
        return (
          <motion.div
            key={meal.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
          >
            <div className={cn('w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0', config.color)}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-foreground truncate">{meal.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(meal.logged_at), 'h:mm a')} • {config.label}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(meal)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDelete(meal)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-calories font-medium">{Math.round(meal.calories)} cal</span>
                <span className="text-protein font-medium">{Math.round(meal.protein)}g P</span>
                <span className="text-carbs font-medium">{Math.round(meal.carbs)}g C</span>
                <span className="text-fat font-medium">{Math.round(meal.fat)}g F</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
