import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

export async function POST(req: Request) {
  const body = await req.json();
  const { title } = body;

  try {
    const vibePrompt = `Given the media title "${title}", describe its mood, setting, and a matching food vibe. Return a short phrase or keywords that could be used to describe a real-world cuisine or meal theme.`;
    const vibeCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: vibePrompt }],
    });

    const vibeKeywords = vibeCompletion.choices?.[0]?.message?.content?.trim() || 'fantasy rustic medieval';

    const recipeResp = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(vibeKeywords)}&number=5&addRecipeInformation=true&apiKey=${SPOONACULAR_API_KEY}`);
    const recipeData = await recipeResp.json();
    if (!recipeData.results?.length) throw new Error("No recipes found");

    const bestRecipe = recipeData.results.reduce((top, curr) =>
      (curr.spoonacularScore || 0) > (top.spoonacularScore || 0) ? curr : top
    );

    const storyPrompt = `Create a fictional backstory for the following real-world recipe as if it came from a world inspired by "${title}". Include a short paragraph backstory and suggest a Tailwind CSS class string to match the vibe (styleClass).\n\nRecipe title: ${bestRecipe.title}`;
    const storyCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: storyPrompt }],
    });

    const backstoryParsed = storyCompletion.choices?.[0]?.message?.content?.trim() || '';
    const [backstory, styleClass = "bg-amber-50 border-red-200 font-serif text-stone-800"] =
      backstoryParsed.split(/\n\nstyleClass:/i);

    const ingredients = bestRecipe.extendedIngredients?.map((ing) => ing.original) || [];
    const steps = bestRecipe.analyzedInstructions?.[0]?.steps?.map((step) => step.step) || [];

    return new Response(
      JSON.stringify({
        recipeTitle: bestRecipe.title,
        ingredients,
        steps,
        backstory: backstory.trim(),
        styleClass: styleClass?.trim(),
        imageUrl:
          bestRecipe.image ||
          `https://via.placeholder.com/1024x1024.png?text=${encodeURIComponent(bestRecipe.title)}`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error("API error:", err);
    return new Response(JSON.stringify({ error: 'Something went wrong on the server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
