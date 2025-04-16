'use client';

import React, { useState } from 'react';

export default function VibeRecipeApp() {
  const [mediaTitle, setMediaTitle] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const generateRecipe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: mediaTitle }),
      });

      const data = await res.json();
      setResult(data);
      setImageLoading(true);
    } catch (error) {
      console.error('Error generating recipe:', error);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const shareRecipe = () => {
    if (!result) return;
    const shareText = `Check out this vibe-matched recipe: ${result.recipeTitle}!

${result.backstory}

Ingredients: ${result.ingredients?.join(', ')}

Steps: ${result.steps?.join(' ')}

Image: ${result.imageUrl}`;

    if (navigator.share) {
      navigator.share({
        title: result.recipeTitle,
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Recipe copied to clipboard!');
    }
  };

  const defaultStyle = 'bg-amber-50 border-red-200 text-stone-800 font-serif';
  const vibeStyle = result?.styleClass || defaultStyle;

  return (
    <div className={`min-h-screen p-8 flex flex-col items-center gap-8 ${vibeStyle}`}>
      <h1 className="text-3xl font-bold text-center">🍲 AI Vibe Recipe Generator</h1>
      <div className="w-full max-w-md flex gap-2">
        <input
          className="w-full border px-4 py-2 rounded"
          placeholder="Enter a book, show, or movie..."
          value={mediaTitle}
          onChange={(e) => setMediaTitle(e.target.value)}
        />
        <button
          onClick={generateRecipe}
          disabled={loading || !mediaTitle}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Get Recipe'}
        </button>
      </div>

      {result && (
        <div className={`w-full max-w-2xl shadow-xl border-2 ${vibeStyle}`}>
          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-semibold">{result.recipeTitle}</h2>

            {imageLoading && (
              <div className="w-full h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-stone-500"></div>
              </div>
            )}

            <img
              src={result.imageUrl}
              alt="recipe"
              className={`w-full rounded-xl shadow transition-opacity duration-500 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
            />

            <p className="italic text-stone-600">{result.backstory}</p>

            {Array.isArray(result.ingredients) && (
              <>
                <h3 className="text-xl font-semibold mt-4">Ingredients</h3>
                <ul className="list-disc list-inside">
                  {result.ingredients.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </>
            )}

            {Array.isArray(result.steps) && (
              <>
                <h3 className="text-xl font-semibold mt-4">Steps</h3>
                <ol className="list-decimal list-inside">
                  {result.steps.map((step: string, idx: number) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </>
            )}

            <div className="pt-4 text-right">
              <button
                onClick={shareRecipe}
                className="border border-gray-400 px-4 py-2 rounded hover:bg-gray-100"
              >
                Share Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
