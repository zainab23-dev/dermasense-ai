import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to instantiate Gemini AI client lazily
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. Skin Profile & Routine Analysis API Endpoint
app.post("/api/analyze-skin", async (req, res) => {
  try {
    const profile = req.body;
    const ai = getGenAI();

    const isPregnant = profile.isPregnantOrLactating;
    const pregnancyConstraintNote = isPregnant
      ? "CRITICAL SAFETY DIRECTIVE: User is PREGNANT or BREASTFEEDING. Strictly EXCLUDE all retinoids (Retinol, Tretinoin, Adapalene), Hydroquinone, and high-concentration Salicylic Acid (>2%). Recommend safe alternatives like Azelaic Acid, Bakuchiol, Vitamin C, Niacinamide, and Glycolic Acid (low %)."
      : "";

    const prompt = `You are DermaSense AI, an expert virtual dermatological assistant and skincare consultant.
Analyze the following user profile and provide a scientifically backed, safe, personalized skincare routine and breakdown.

User Profile:
- Age: ${profile.age || "Not specified"}
- Gender: ${profile.gender || "Not specified"}
- Location/Climate: ${profile.climate || "Moderate"}
- Skin Type: ${profile.skinType || "Combination"}
- Primary Concerns: ${(profile.concerns || []).join(", ") || "General maintenance"}
- Current Products Used: ${profile.currentRoutine || "None specified"}
- Budget Level: ${profile.budget || "Mid-range ($$)"}
- Preferences: ${profile.veganCrueltyFree ? "Vegan & Cruelty-Free only" : "No preference"}
- Pregnancy/Lactation Status: ${isPregnant ? "Pregnant or Breastfeeding" : "Not pregnant/lactating"}
- Known Allergies/Sensitivities: ${profile.allergies || "None"}

${pregnancyConstraintNote}

Instructions for output:
Provide structured JSON containing:
1. "diagnosis": Short summary of skin baseline and 2-3 key focus areas based on dermatological principles.
2. "amRoutine": Array of numbered morning steps (stepNumber, stepName, activeIngredients, purpose, applicationTip).
3. "pmRoutine": Array of numbered evening steps (stepNumber, stepName, activeIngredients, purpose, applicationTip).
4. "heroIngredients": Array of 3-4 top ingredients (ingredient, benefit, bestTime, notes).
5. "safetyPlan": Object with patchTestingGuide, introductionTimeline, redFlags.
6. "disclaimer": Standard medical disclaimer string.

Ensure strict adherence to active ingredient ordering, safety rules (e.g. SPF in morning, no mixing AHA/BHA with strong retinoids in same step).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                focusAreas: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                barrierStatusAssessment: { type: Type.STRING },
              },
              required: ["summary", "focusAreas"],
            },
            amRoutine: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  stepName: { type: Type.STRING },
                  activeIngredients: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  applicationTip: { type: Type.STRING },
                },
                required: ["stepNumber", "stepName", "activeIngredients", "purpose", "applicationTip"],
              },
            },
            pmRoutine: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  stepName: { type: Type.STRING },
                  activeIngredients: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  applicationTip: { type: Type.STRING },
                },
                required: ["stepNumber", "stepName", "activeIngredients", "purpose", "applicationTip"],
              },
            },
            heroIngredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ingredient: { type: Type.STRING },
                  benefit: { type: Type.STRING },
                  bestTime: { type: Type.STRING },
                  notes: { type: Type.STRING },
                },
                required: ["ingredient", "benefit", "bestTime", "notes"],
              },
            },
            safetyPlan: {
              type: Type.OBJECT,
              properties: {
                patchTestingGuide: { type: Type.STRING },
                introductionTimeline: { type: Type.STRING },
                redFlags: { type: Type.STRING },
                purgingVsBreakoutTip: { type: Type.STRING },
              },
              required: ["patchTestingGuide", "introductionTimeline", "redFlags"],
            },
            disclaimer: { type: Type.STRING },
          },
          required: ["diagnosis", "amRoutine", "pmRoutine", "heroIngredients", "safetyPlan", "disclaimer"],
        },
      },
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error in /api/analyze-skin:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to analyze skin profile" });
  }
});

// 2. Ingredient Conflict & Layering Checker API Endpoint
app.post("/api/check-ingredients", async (req, res) => {
  try {
    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ success: false, error: "Please provide an array of ingredients to check." });
    }

    const ai = getGenAI();
    const prompt = `You are DermaSense AI, a dermatological chemist.
Evaluate the compatibility and layering interaction of the following skincare ingredients when used together:
Ingredients: ${ingredients.join(", ")}

Analyze whether these can be used in the same routine, in separate routines (AM vs PM), or should never be combined.
Provide JSON output:
- "compatible": boolean
- "safetyRating": string ("Safe", "Use with Caution", "High Risk / Do Not Mix")
- "summary": string explanation
- "conflicts": array of objects ({ ingredientA, ingredientB, risk, recommendedUsage })
- "proTip": string advice on optimal layering order or spacing.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            compatible: { type: Type.BOOLEAN },
            safetyRating: { type: Type.STRING },
            summary: { type: Type.STRING },
            conflicts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ingredientA: { type: Type.STRING },
                  ingredientB: { type: Type.STRING },
                  risk: { type: Type.STRING },
                  recommendedUsage: { type: Type.STRING },
                },
                required: ["ingredientA", "ingredientB", "risk", "recommendedUsage"],
              },
            },
            proTip: { type: Type.STRING },
          },
          required: ["compatible", "safetyRating", "summary", "conflicts", "proTip"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error in /api/check-ingredients:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to check ingredient compatibility." });
  }
});

// 3. Photo Visual Assessment Endpoint (Multimodal)
app.post("/api/analyze-photo", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "No image data provided" });
    }

    const ai = getGenAI();
    const imagePart = {
      inlineData: {
        mimeType,
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
      },
    };
    const textPart = {
      text: `You are DermaSense AI. Perform a non-medical cosmetic visual assessment of this skin image.
Identify visible visual markers (e.g., surface redness, shine/sebum reflection, texture roughness, dehydration flakiness, dark spots).
Provide JSON with:
- "observedFeatures": array of strings (e.g. "Mild localized T-zone shine", "Cheek erythema/redness", "Uneven surface texture")
- "perceivedSkinType": string
- "suggestedFocusAreas": array of strings
- "disclaimer": string ("This visual scan is an AI cosmetic estimation, not a clinical diagnostic scan.")`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            observedFeatures: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            perceivedSkinType: { type: Type.STRING },
            suggestedFocusAreas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            disclaimer: { type: Type.STRING },
          },
          required: ["observedFeatures", "perceivedSkinType", "suggestedFocusAreas", "disclaimer"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error in /api/analyze-photo:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to analyze skin photo." });
  }
});

export default app;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DermaSense AI server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
