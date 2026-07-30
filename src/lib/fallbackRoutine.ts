import { UserSkinProfile, FullDermaAnalysisResponse } from '../types';

export function generateFallbackRoutine(profile: UserSkinProfile): FullDermaAnalysisResponse {
  const isPregnant = profile.isPregnantOrLactating;
  const concerns = profile.primaryConcerns.length > 0 ? profile.primaryConcerns : ['General Maintenance'];

  const heroIngredients = isPregnant
    ? [
        {
          ingredient: 'Azelaic Acid 10%',
          benefit: 'Target hyperpigmentation & redness safely during pregnancy',
          bestTime: 'AM & PM' as const,
          notes: 'Dermatologist-approved safe alternative to retinoids and hydroquinone.',
        },
        {
          ingredient: 'Niacinamide (Vitamin B3) 5%',
          benefit: 'Strengthens moisture barrier and balances sebum production',
          bestTime: 'AM & PM' as const,
          notes: 'Calms redness and reduces pore congestion.',
        },
        {
          ingredient: 'Hyaluronic Acid & Ceramides',
          benefit: 'Restores deep hydration and locks in epidermal moisture',
          bestTime: 'AM & PM' as const,
          notes: 'Essential for maintaining lipid barrier integrity.',
        },
      ]
    : [
        {
          ingredient: 'Encapsulated Retinol 0.25%',
          benefit: 'Accelerates cellular turnover and boosts collagen synthesis',
          bestTime: 'PM (2-3x/week)' as const,
          notes: 'Apply to completely dry skin; always follow with a rich moisturizer.',
        },
        {
          ingredient: 'Vitamin C (L-Ascorbic Acid / THD) 10%',
          benefit: 'Neutralizes free radicals and brightens skin tone',
          bestTime: 'AM' as const,
          notes: 'Pair with broad-spectrum SPF for enhanced photoprotection.',
        },
        {
          ingredient: 'Niacinamide 5% & Ceramides',
          benefit: 'Barrier repair, lipid synthesis, and pore refinement',
          bestTime: 'AM & PM' as const,
          notes: 'Soothes inflammation and prevents transepidermal water loss.',
        },
      ];

  const amRoutine = [
    {
      stepNumber: 1,
      stepName: 'Gentle Hydrating Cleanser',
      activeIngredients: 'Glycerin, Ceramides, Aloe Vera',
      purpose: 'Cleanse overnight oil build-up without stripping natural skin lipids.',
      applicationTip: 'Lather with tepid water for 30 seconds, then gently pat dry with a clean towel.',
    },
    {
      stepNumber: 2,
      stepName: 'Antioxidant & Brightening Serum',
      activeIngredients: isPregnant ? 'Niacinamide 5%, Azelaic Acid 10%' : 'Vitamin C 10%, Niacinamide 2%',
      purpose: 'Protect against environmental oxidative stress and brighten complexion.',
      applicationTip: 'Apply 3-4 drops to slightly damp face and neck. Allow 1-2 minutes to absorb.',
    },
    {
      stepNumber: 3,
      stepName: 'Barrier Restorative Moisturizer',
      activeIngredients: 'Ceramides NP/AP/EOP, Hyaluronic Acid, Squalane',
      purpose: 'Lock in hydration and support lipid barrier resilience throughout the day.',
      applicationTip: 'Warm a dime-sized amount between fingertips and press gently into skin.',
    },
    {
      stepNumber: 4,
      stepName: 'Broad-Spectrum Mineral Sunscreen SPF 50+',
      activeIngredients: 'Zinc Oxide 15%, Titanium Dioxide 5%',
      purpose: 'Non-negotiable daily defense against UV photo-aging and post-inflammatory pigmentation.',
      applicationTip: 'Apply 2 finger-lengths generously as the final step 15 minutes before sun exposure.',
    },
  ];

  const pmRoutine = [
    {
      stepNumber: 1,
      stepName: 'Double Cleansing Balm / Oil',
      activeIngredients: 'Jojoba Oil, Caprylic/Capric Triglyceride',
      purpose: 'Melt away water-resistant SPF, makeup, and urban micro-pollutants.',
      applicationTip: 'Massage onto dry skin for 60 seconds, emulsify with water, then rinse thoroughly.',
    },
    {
      stepNumber: 2,
      stepName: 'Gentle pH-Balanced Cleanser',
      activeIngredients: 'Amino Acid Surfactants, Panthenol',
      purpose: 'Purify remaining residue while maintaining optimal acidic skin mantle (pH ~5.5).',
      applicationTip: 'Follow second step of double cleanse with gentle circular motions.',
    },
    {
      stepNumber: 3,
      stepName: 'Targeted Treatment Serum',
      activeIngredients: isPregnant
        ? 'Azelaic Acid 10%, Centella Asiatica (Cica)'
        : 'Encapsulated Retinol 0.25%, Peptide Complex',
      purpose: isPregnant
        ? 'Target redness and clarify pores using pregnancy-safe botanical active.'
        : 'Stimulate cellular renewal, smooth fine lines, and refine overall skin texture.',
      applicationTip: isPregnant
        ? 'Apply nightly to clean, dry skin.'
        : 'Start 2 nights per week (sandwich method: moisturizer, retinol, moisturizer).',
    },
    {
      stepNumber: 4,
      stepName: 'Deep Barrier Repair Night Cream',
      activeIngredients: 'Ceramide Complex, Shea Butter, Colloidal Oatmeal',
      purpose: 'Replenish overnight barrier lipids and prevent moisture loss while sleeping.',
      applicationTip: 'Smooth a generous layer over face, neck, and chest as the final evening step.',
    },
  ];

  return {
    diagnosis: {
      summary: `Tailored ${profile.skinType} skin routine formulated for ${profile.location} (${profile.climate} climate). Primary targets: ${concerns.join(', ')}.`,
      focusAreas: [
        `Target ${concerns[0] || 'Skin Balance'} with clinically proven actives`,
        `Support epidermal barrier function against ${profile.climate.toLowerCase()} environmental stress`,
        `Enforce strict safety constraints (${isPregnant ? 'Pregnancy-Safe' : 'Standard Routine'}, ${profile.budget} Budget)`,
      ],
      barrierStatusAssessment: 'Skin barrier resilience is optimized with ceramide-dominant formulations and pH-balanced hydration layers.',
    },
    amRoutine,
    pmRoutine,
    heroIngredients,
    safetyPlan: {
      patchTestingGuide: 'Apply a small pea-sized amount behind the ear or on inner wrist for 48 hours to check for hypersensitivity.',
      introductionTimeline: 'Introduce new active serums 1 at a time, spacing 5-7 days apart to easily isolate any skin reaction.',
      redFlags: 'Immediate stinging, persistent burning, intense flaking, or hive-like redness means stop actives and switch to soothing Cica balm.',
      purgingVsBreakoutTip: 'Purging occurs only in areas you usually break out and resolves within 2-4 weeks. Breakouts in new areas indicate product irritation.',
    },
    disclaimer: 'Medical Disclaimer: Educational & routine optimization. Consult a board-certified dermatologist for clinical skin conditions.',
  };
}
