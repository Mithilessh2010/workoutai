import { motion } from 'framer-motion';
import { ProgressRing } from '@/components/ui/progress-ring';
import { cn } from '@/lib/utils';

interface MacroCardProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color: 'calories' | 'protein' | 'carbs' | 'fat';
  delay?: number;
}

export function MacroCard({ label, current, target, unit = 'g', color, delay = 0 }: MacroCardProps) {
  const progress = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);
  const isOver = current > target;

  const colorStyles = {
    calories: 'bg-calories/10 text-calories',
    protein: 'bg-protein/10 text-protein',
    carbs: 'bg-carbs/10 text-carbs',
    fat: 'bg-fat/10 text-fat',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card rounded-2xl p-6 flex flex-col items-center gap-4"
    >
      <ProgressRing progress={progress} size={100} strokeWidth={8} color={color}>
        <div className="text-center">
          <p className={cn('text-2xl font-bold', isOver && 'text-destructive')}>
            {Math.round(current)}
          </p>
        </div>
      </ProgressRing>
      
      <div className="text-center">
        <p className="font-display font-semibold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">
          {isOver ? (
            <span className="text-destructive">+{Math.round(current - target)} over</span>
          ) : (
            <span>{Math.round(remaining)}{unit} left</span>
          )}
        </p>
      </div>

      <div className={cn('px-3 py-1 rounded-full text-xs font-medium', colorStyles[color])}>
        Goal: {target}{unit}
      </div>
    </motion.div>
  );
}
