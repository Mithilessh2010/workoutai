import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface WorkoutRequest {
  goal: string;
  duration: number;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  focusArea?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { goal, duration, fitnessLevel, equipment, focusArea }: WorkoutRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const equipmentList = equipment.length > 0 ? equipment.join(', ') : 'no equipment (bodyweight only)';

    const systemPrompt = `You are a certified personal trainer. Create safe, effective workout plans.

IMPORTANT: Return ONLY valid JSON with this exact structure:
{
  "title": "Workout title",
  "description": "Brief description",
  "duration_minutes": <number>,
  "difficulty": "${fitnessLevel}",
  "equipment": [<array of equipment needed>],
  "exercises": [
    {
      "name": "Exercise name",
      "sets": <number>,
      "reps": "8-12" or "30 seconds",
      "rest": "60 seconds",
      "notes": "Optional form tips"
    }
  ],
  "safety_notes": ["Important safety considerations"]
}

Guidelines:
- Include warm-up and cool-down
- Provide beginner modifications in notes when appropriate
- Prioritize compound movements
- Balance push/pull/legs
- Include rest periods`;

    const userPrompt = `Create a ${duration}-minute ${fitnessLevel} workout for someone whose goal is to ${goal}.
Available equipment: ${equipmentList}.
${focusArea ? `Focus area: ${focusArea}` : 'Full body workout'}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits in settings.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to generate workout plan');
    }

    const workout = JSON.parse(jsonMatch[0]);
    
    console.log('Generated workout:', workout.title);

    return new Response(
      JSON.stringify({ workout }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate workout error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
