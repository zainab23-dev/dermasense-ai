export type SkinType = 'Dry' | 'Oily' | 'Combination' | 'Sensitive' | 'Normal';

export type BudgetLevel = 'Drugstore ($)' | 'Mid-range ($$)' | 'Luxury ($$$)';

export type PrimaryConcern = 
  | 'Acne & Blemishes'
  | 'Hyperpigmentation & Dark Spots'
  | 'Aging & Fine Lines'
  | 'Redness & Rosacea'
  | 'Dehydration & Dry Flakes'
  | 'Uneven Texture & Enlarged Pores'
  | 'Barrier Damage & Irritation';

export interface UserSkinProfile {
  age: string;
  gender?: string;
  location: string;
  climate: 'Humid & Warm' | 'Arid & Dry' | 'Cold & Dry' | 'Moderate / Seasonal' | 'Polluted Urban';
  skinType: SkinType;
  primaryConcerns: PrimaryConcern[];
  currentRoutine: string;
  budget: BudgetLevel;
  veganCrueltyFree: boolean;
  isPregnantOrLactating: boolean;
  allergies: string;
  photoAnalysisResult?: PhotoAnalysisData;
}

export interface RoutineStep {
  stepNumber: number;
  stepName: string;
  activeIngredients: string;
  purpose: string;
  applicationTip: string;
}

export interface HeroIngredient {
  ingredient: string;
  benefit: string;
  bestTime: 'AM' | 'PM' | 'AM & PM' | 'PM (2-3x/week)';
  notes: string;
}

export interface SafetyPlan {
  patchTestingGuide: string;
  introductionTimeline: string;
  redFlags: string;
  purgingVsBreakoutTip?: string;
}

export interface SkinDiagnosis {
  summary: string;
  focusAreas: string[];
  barrierStatusAssessment?: string;
}

export interface FullDermaAnalysisResponse {
  diagnosis: SkinDiagnosis;
  amRoutine: RoutineStep[];
  pmRoutine: RoutineStep[];
  heroIngredients: HeroIngredient[];
  safetyPlan: SafetyPlan;
  disclaimer: string;
}

export interface IngredientConflict {
  ingredientA: string;
  ingredientB: string;
  risk: string;
  recommendedUsage: string;
}

export interface IngredientCheckResult {
  compatible: boolean;
  safetyRating: 'Safe' | 'Use with Caution' | 'High Risk / Do Not Mix';
  summary: string;
  conflicts: IngredientConflict[];
  proTip: string;
}

export interface PhotoAnalysisData {
  observedFeatures: string[];
  perceivedSkinType: string;
  suggestedFocusAreas: string[];
  disclaimer: string;
}

export interface JournalLogEntry {
  id: string;
  date: string;
  barrierScore: number; // 1 to 10
  skinFeeling: 'Calm & Hydrated' | 'Slight Redness' | 'Dry/Flaky' | 'Active Purging' | 'Irritated/Stinging';
  sentiment?: '😊' | '😐' | '🙁';
  amCompleted: boolean;
  pmCompleted: boolean;
  notes: string;
}

export interface CustomRoutineStep {
  id: string;
  stepName: string;
  timeOfDay: 'AM' | 'PM' | 'Both';
  category: 'Cleanser' | 'Toner/Essence' | 'Active/Serum' | 'Eye Cream' | 'Moisturizer' | 'Sunscreen' | 'Face Oil/Mask';
  productName?: string;
  activeIngredients?: string;
  applicationTip?: string;
}

export type StepStatus = 'completed' | 'skipped' | 'pending';

export type OutcomeResult = 'positive' | 'negative' | 'neutral' | 'unrecorded';

export interface DailyRoutineTrackingLog {
  date: string; // YYYY-MM-DD
  stepStatuses: { [stepId: string]: StepStatus };
  notes: string;
  outcomeResult: OutcomeResult;
  outcomeDetail?: string;
}

export interface UserSocialLinks {
  linkedin: string;
  github: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  skinGoal?: string;
  createdAt: string;
}

export interface UserDataPayload {
  profile: UserSkinProfile | null;
  analysisData: FullDermaAnalysisResponse | null;
  journalLogs: JournalLogEntry[];
  trackingLogs: DailyRoutineTrackingLog[];
}
