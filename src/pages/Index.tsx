import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, BarChart3, Dumbbell, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const features = [
  {
    icon: Utensils,
    title: 'Natural Language Logging',
    description: 'Just type what you ate — AI parses the nutrition instantly.',
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Track trends, streaks, and macro distribution over time.',
  },
  {
    icon: Dumbbell,
    title: 'AI Workout Plans',
    description: 'Get personalized workouts based on your goals and equipment.',
  },
  {
    icon: Sparkles,
    title: 'Goal Tracking',
    description: 'Set targets, hit milestones, celebrate your progress.',
  },
];

export default function Index() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
            style={{ background: 'var(--gradient-hero)' }}
          />
          <div 
            className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
            style={{ background: 'var(--gradient-hero)' }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-32">
          {/* Nav */}
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-20"
          >
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-lg">M</span>
              </div>
              <span className="font-display font-bold text-xl">MacroMate</span>
            </Link>
            
            <div className="flex items-center gap-4">
              {loading ? null : user ? (
                <Link to="/dashboard">
                  <Button className="gap-2">
                    Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button className="gap-2">
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </motion.nav>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered Nutrition Tracking
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight"
            >
              Track your macros.
              <br />
              <span className="text-primary">Crush your goals.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              MacroMate uses AI to parse your meals from natural language, 
              generate personalized workouts, and help you stay on track with 
              beautiful analytics.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/auth">
                <Button size="lg" className="gap-2 text-lg px-8">
                  Start Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Built for busy people who want to eat better without the hassle of manual tracking.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl p-12 text-center"
          style={{ background: 'var(--gradient-hero)' }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to transform your nutrition?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of users who've simplified their health journey with MacroMate.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="gap-2 text-lg px-8">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold">M</span>
            </div>
            <span className="font-display font-semibold">MacroMate</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MacroMate. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
