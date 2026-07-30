import React, { useState } from 'react';
import { IngredientCheckResult } from '../types';
import { FlaskConical, AlertTriangle, CheckCircle, ShieldAlert, Sparkles, Plus, X, ArrowRight } from 'lucide-react';

const COMMON_INGREDIENTS = [
  'Retinol / Retinoid',
  'Vitamin C (L-Ascorbic Acid)',
  'Salicylic Acid (BHA)',
  'Glycolic Acid (AHA)',
  'Niacinamide (Vitamin B3)',
  'Benzoyl Peroxide',
  'Azelaic Acid',
  'Hyaluronic Acid',
  'Ceramides',
  'Peptides',
  'Copper Peptides',
  'Hydroquinone',
];

function evaluateIngredientSafety(ingredients: string[]): IngredientCheckResult {
  const norm = ingredients.map((i) => i.toLowerCase());
  const conflicts: Array<{ ingredientA: string; ingredientB: string; risk: string; recommendedUsage: string }> = [];

  const has = (keyword: string) => norm.some((i) => i.includes(keyword.toLowerCase()));

  // 1. Retinol + Acids (BHA/AHA)
  if (has('retinol') && (has('salicylic') || has('bha') || has('glycolic') || has('aha') || has('tretinoin') || has('adapalene'))) {
    conflicts.push({
      ingredientA: 'Retinol / Retinoid',
      ingredientB: ingredients.find((i) => i.toLowerCase().includes('salicylic') || i.toLowerCase().includes('bha') || i.toLowerCase().includes('glycolic') || i.toLowerCase().includes('aha')) || 'Exfoliating Acid (AHA/BHA)',
      risk: 'High risk of skin barrier breakdown, severe flaking, stinging, and contact irritation due to over-exfoliation.',
      recommendedUsage: 'Use AHA/BHA in the morning or on alternate nights. Apply Retinol strictly in evening routines.',
    });
  }

  // 2. Retinol + Benzoyl Peroxide
  if (has('retinol') && has('benzoyl')) {
    conflicts.push({
      ingredientA: 'Retinol / Retinoid',
      ingredientB: 'Benzoyl Peroxide',
      risk: 'Benzoyl Peroxide oxidizes retinol molecules, making both actives ineffective while compounding dryness.',
      recommendedUsage: 'Use Benzoyl Peroxide in the AM (or as a wash-off cleanser) and Retinol at night.',
    });
  }

  // 3. Retinol + Vitamin C
  if (has('retinol') && has('vitamin c')) {
    conflicts.push({
      ingredientA: 'Retinol / Retinoid',
      ingredientB: 'Vitamin C (L-Ascorbic Acid)',
      risk: 'Simultaneous application can overwhelm skin barrier receptors and cause flushing/sensitivity.',
      recommendedUsage: 'Apply Vitamin C serum in the morning under sunscreen and Retinol at night.',
    });
  }

  // 4. Vitamin C + Acids
  if (has('vitamin c') && (has('salicylic') || has('glycolic') || has('bha') || has('aha'))) {
    const acid = ingredients.find((i) => i.toLowerCase().includes('salicylic') || i.toLowerCase().includes('glycolic') || i.toLowerCase().includes('bha') || i.toLowerCase().includes('aha')) || 'Exfoliating Acid';
    conflicts.push({
      ingredientA: 'Vitamin C',
      ingredientB: acid,
      risk: 'Layering low pH L-Ascorbic Acid with chemical exfoliants causes stinging and moisture barrier dehydration.',
      recommendedUsage: 'Use Vitamin C in the AM for antioxidant defense and Exfoliating Acids in the PM 2-3 nights per week.',
    });
  }

  // 5. Copper Peptides + Vitamin C / Acids
  if (has('copper') && (has('vitamin c') || has('salicylic') || has('glycolic') || has('aha') || has('bha'))) {
    conflicts.push({
      ingredientA: 'Copper Peptides',
      ingredientB: 'Vitamin C / Direct Acids',
      risk: 'Acidic environments alter copper peptide chemical bonds, reducing efficacy and causing potential oxidation.',
      recommendedUsage: 'Use Vitamin C or Acids in AM and Copper Peptides in PM.',
    });
  }

  // 6. Benzoyl Peroxide + Hydroquinone
  if (has('benzoyl') && has('hydroquinone')) {
    conflicts.push({
      ingredientA: 'Benzoyl Peroxide',
      ingredientB: 'Hydroquinone',
      risk: 'May cause temporary dark skin staining when combined directly on the skin surface.',
      recommendedUsage: 'Avoid layering together. Consult a dermatologist for hyperpigmentation protocols.',
    });
  }

  if (conflicts.length > 0) {
    return {
      compatible: false,
      safetyRating: conflicts.length >= 2 ? 'High Risk / Do Not Mix' : 'Use with Caution',
      summary: `Identified ${conflicts.length} chemical interaction${conflicts.length > 1 ? 's' : ''} in your selected combination (${ingredients.join(', ')}). Layering these together in a single routine step can cause barrier damage or ingredient deactivation.`,
      conflicts,
      proTip: 'Practice "Skin Cycling": alternate active ingredients across separate days or split them between morning (AM) and evening (PM) routines.',
    };
  }

  return {
    compatible: true,
    safetyRating: 'Safe',
    summary: `The selected active ingredients (${ingredients.join(', ')}) are highly compatible! They work synergistically to support hydration, lipid barrier protection, and skin health without chemical conflict.`,
    conflicts: [],
    proTip: 'Apply lightweight water-based formulations first (e.g., Hyaluronic Acid or Niacinamide), follow with treatments, and seal with a lipid-rich moisturizer.',
  };
}

export const IngredientConflictChecker: React.FC = () => {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([
    'Retinol / Retinoid',
    'Salicylic Acid (BHA)',
  ]);
  const [customInput, setCustomInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IngredientCheckResult | null>(null);

  const handleToggleIngredient = (ing: string) => {
    if (selectedIngredients.includes(ing)) {
      setSelectedIngredients(selectedIngredients.filter((i) => i !== ing));
    } else {
      setSelectedIngredients([...selectedIngredients, ing]);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    if (!selectedIngredients.includes(customInput.trim())) {
      setSelectedIngredients([...selectedIngredients, customInput.trim()]);
    }
    setCustomInput('');
  };

  const handleRemove = (ing: string) => {
    setSelectedIngredients(selectedIngredients.filter((i) => i !== ing));
  };

  const handleCheckCompatibility = async () => {
    if (selectedIngredients.length < 2) return;
    setIsLoading(true);
    setResult(null);

    let checkResult: IngredientCheckResult | null = null;

    try {
      const response = await fetch('/api/check-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: selectedIngredients }),
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const resData = await response.json();
        if (resData.success && resData.data) {
          checkResult = resData.data;
        }
      }
    } catch (err) {
      console.warn('Backend check-ingredients offline/non-JSON, evaluating with chemical interaction engine:', err);
    }

    if (!checkResult) {
      checkResult = evaluateIngredientSafety(selectedIngredients);
    }

    setResult(checkResult);
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Title Banner */}
      <div className="bg-gradient-to-r from-[#FF85B3] via-[#FF69B4] to-[#4A1525] text-white rounded-2xl p-6 sm:p-7 shadow-2xs">
        <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-white/15 text-[#FFE4EC] text-xs font-semibold mb-3 border border-white/20">
          <FlaskConical className="w-3.5 h-3.5 text-[#FFD1DC]" />
          <span>Chemical Interaction & Layering Sandbox</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Active Ingredient Conflict Checker</h1>
        <p className="mt-2 text-[#FFE4EC] text-xs sm:text-sm leading-relaxed max-w-2xl">
          Mixing high-potency active ingredients can cause skin barrier destruction, severe flushing, or neutralize product efficacy. Select 2 or more ingredients to check layering compatibility.
        </p>
      </div>

      {/* Selector Box */}
      <div className="bg-white rounded-2xl border border-[#FFD1DC] p-6 sm:p-7 shadow-2xs space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-[#4A1525] mb-2.5">
            Quick-Select Active Ingredients:
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_INGREDIENTS.map((ing) => {
              const active = selectedIngredients.includes(ing);
              return (
                <button
                  key={ing}
                  type="button"
                  onClick={() => handleToggleIngredient(ing)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    active
                      ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white border-[#FF85B3]'
                      : 'bg-white text-[#4A1525] border-[#FFD1DC] hover:bg-[#FFE4EC]'
                  }`}
                >
                  {ing}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <form onSubmit={handleAddCustom} className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Type custom active or product name (e.g. Tretinoin, Glycolic Acid)..."
            className="flex-1 px-3 py-2 rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-[#4A1525] text-white rounded-lg text-xs font-bold hover:bg-[#FF69B4] transition flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* Active Selection Chips */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-[#4A1525] mb-2">
            Selected Ingredients ({selectedIngredients.length}):
          </label>
          <div className="p-3.5 bg-[#FFE4EC]/50 rounded-xl border border-[#FFD1DC] min-h-[56px] flex flex-wrap items-center gap-2">
            {selectedIngredients.length === 0 ? (
              <span className="text-xs text-[#8E5A6B] italic">Select at least 2 ingredients above...</span>
            ) : (
              selectedIngredients.map((ing) => (
                <span
                  key={ing}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-[#4A1525] border border-[#FFD1DC] shadow-2xs"
                >
                  <span>{ing}</span>
                  <button onClick={() => handleRemove(ing)} className="text-[#8E5A6B] hover:text-[#FF69B4]">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        <button
          onClick={handleCheckCompatibility}
          disabled={selectedIngredients.length < 2 || isLoading}
          className="w-full py-3 bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] hover:opacity-90 text-white rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin text-[#FFE4EC]" />
              <span>Analyzing Chemical Compatibility...</span>
            </>
          ) : (
            <>
              <FlaskConical className="w-4 h-4" />
              <span>Evaluate Layering Safety</span>
            </>
          )}
        </button>
      </div>

      {/* Results View */}
      {result && (
        <div className="bg-white rounded-2xl border border-[#FFD1DC] p-6 sm:p-7 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#FFD1DC]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E5A6B]">Compatibility Status</span>
              <div className="flex items-center space-x-2 mt-1">
                {result.compatible ? (
                  <CheckCircle className="w-5 h-5 text-[#FF69B4]" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-[#E11D48]" />
                )}
                <h2 className="text-xl font-bold text-[#4A1525]">{result.safetyRating}</h2>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-md text-xs font-extrabold border ${
                result.compatible
                  ? 'bg-[#FFE4EC] text-[#FF69B4] border-[#FFD1DC]'
                  : 'bg-[#FFF5F5] text-[#E11D48] border-[#FECDD3]'
              }`}
            >
              {result.compatible ? 'Compatible' : 'Conflict Detected'}
            </span>
          </div>

          <p className="text-xs text-[#4A1525] leading-relaxed font-medium">{result.summary}</p>

          {result.conflicts && result.conflicts.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#E11D48]">Identified Interactions & Risks:</h3>
              <div className="space-y-2">
                {result.conflicts.map((conf, idx) => (
                  <div key={idx} className="p-3.5 bg-[#FFF5F5] border border-[#FECDD3] rounded-xl space-y-1">
                    <div className="flex items-center space-x-2 text-[#9F1239] font-bold text-xs">
                      <span>{conf.ingredientA}</span>
                      <ArrowRight className="w-3 h-3 text-[#E11D48]" />
                      <span>{conf.ingredientB}</span>
                    </div>
                    <p className="text-xs text-[#9F1239]"><strong>Risk:</strong> {conf.risk}</p>
                    <p className="text-xs text-[#4A1525]"><strong>Recommendation:</strong> {conf.recommendedUsage}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3.5 bg-[#FFE4EC]/60 rounded-xl border border-[#FFD1DC] space-y-1 text-xs text-[#FF69B4]">
            <strong className="block uppercase tracking-widest font-bold text-[10px] text-[#FF69B4]">Dermatologist Pro-Tip:</strong>
            <p className="text-[#4A1525]">{result.proTip}</p>
          </div>
        </div>
      )}
    </div>
  );
};
