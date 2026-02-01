import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a nutrition expert. Parse the food description and estimate accurate nutritional values.
    
IMPORTANT: Return ONLY valid JSON with this exact structure:
{
  "name": "Brief descriptive name of the food/meal",
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "fiber": <number in grams>,
  "sugar": <number in grams>,
  "servings": <number, default 1>
}

Be accurate with common foods. For example:
- 1 large egg: ~70 cal, 6g protein, 0g carbs, 5g fat
- 1 slice white bread: ~75 cal, 2g protein, 14g carbs, 1g fat
- 1 cup orange juice: ~110 cal, 2g protein, 26g carbs, 0g fat

Sum up all items mentioned. Round to whole numbers.`;

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
          { role: 'user', content: `Parse this food description: "${text}"` }
        ],
        temperature: 0.3,
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
      throw new Error('Failed to parse nutrition data');
    }

    const nutrition = JSON.parse(jsonMatch[0]);
    
    // Validate and sanitize
    const sanitizedNutrition = {
      name: nutrition.name || text.slice(0, 50),
      calories: Math.max(0, Number(nutrition.calories) || 0),
      protein: Math.max(0, Number(nutrition.protein) || 0),
      carbs: Math.max(0, Number(nutrition.carbs) || 0),
      fat: Math.max(0, Number(nutrition.fat) || 0),
      fiber: Math.max(0, Number(nutrition.fiber) || 0),
      sugar: Math.max(0, Number(nutrition.sugar) || 0),
      servings: Math.max(1, Number(nutrition.servings) || 1),
    };

    console.log('Parsed nutrition:', sanitizedNutrition);

    return new Response(
      JSON.stringify({ nutrition: sanitizedNutrition }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Parse nutrition error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
