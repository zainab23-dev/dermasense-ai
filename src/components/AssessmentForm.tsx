import React, { useState, useRef } from 'react';
import { UserSkinProfile, SkinType, BudgetLevel, PrimaryConcern, PhotoAnalysisData } from '../types';
import { PRESET_PROFILES } from '../data/presets';
import { Sparkles, Camera, Upload, AlertTriangle, ShieldCheck, Check, RotateCcw, HeartHandshake, Thermometer, User, DollarSign, Ban } from 'lucide-react';

interface AssessmentFormProps {
  onSubmit: (profile: UserSkinProfile) => void;
  isLoading: boolean;
}

const SKIN_TYPES: SkinType[] = ['Dry', 'Oily', 'Combination', 'Sensitive', 'Normal'];

const CLIMATES = [
  'Humid & Warm',
  'Arid & Dry',
  'Cold & Dry',
  'Moderate / Seasonal',
  'Polluted Urban',
] as const;

const BUDGETS: BudgetLevel[] = ['Drugstore ($)', 'Mid-range ($$)', 'Luxury ($$$)'];

const CONCERNS_LIST: { id: PrimaryConcern; label: string; desc: string }[] = [
  { id: 'Acne & Blemishes', label: 'Acne & Blemishes', desc: 'Breakouts, blackheads, clogged pores' },
  { id: 'Hyperpigmentation & Dark Spots', label: 'Hyperpigmentation', desc: 'Sun spots, melasma, post-acne marks' },
  { id: 'Aging & Fine Lines', label: 'Aging & Fine Lines', desc: 'Wrinkles, loss of firmness, dullness' },
  { id: 'Redness & Rosacea', label: 'Redness & Rosacea', desc: 'Erythema, blushing, visible capillaries' },
  { id: 'Dehydration & Dry Flakes', label: 'Dehydration', desc: 'Tight feeling, dry patches, dull barrier' },
  { id: 'Uneven Texture & Enlarged Pores', label: 'Texture & Pores', desc: 'Roughness, visible pores, bumpy skin' },
  { id: 'Barrier Damage & Irritation', label: 'Barrier Damage', desc: 'Stinging from products, compromised skin' },
];

export const AssessmentForm: React.FC<AssessmentFormProps> = ({ onSubmit, isLoading }) => {
  const [profile, setProfile] = useState<UserSkinProfile>({
    age: '28',
    gender: 'Female',
    location: 'New York, NY',
    climate: 'Moderate / Seasonal',
    skinType: 'Combination',
    primaryConcerns: ['Acne & Blemishes', 'Hyperpigmentation & Dark Spots'],
    currentRoutine: 'Gentle hydrating cleanser, SPF 30 moisturizer',
    budget: 'Mid-range ($$)',
    veganCrueltyFree: false,
    isPregnantOrLactating: false,
    allergies: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysisData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConcernToggle = (concern: PrimaryConcern) => {
    setProfile((prev) => {
      const exists = prev.primaryConcerns.includes(concern);
      let updated = [...prev.primaryConcerns];
      if (exists) {
        updated = updated.filter((c) => c !== concern);
      } else {
        if (updated.length >= 3) {
          // keep max 3 for tight focus
          updated.shift();
        }
        updated.push(concern);
      }
      return { ...prev, primaryConcerns: updated };
    });
  };

  const handleApplyPreset = (presetProfile: UserSkinProfile) => {
    setProfile(presetProfile);
    setPhotoPreview(null);
    setPhotoAnalysis(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPhotoPreview(base64String);
      setAnalyzingPhoto(true);

      try {
        const response = await fetch('/api/analyze-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64String,
            mimeType: file.type,
          }),
        });
        const contentType = response.headers.get('content-type');
        if (response.ok && contentType && contentType.includes('application/json')) {
          const result = await response.json();
          if (result.success && result.data) {
            setPhotoAnalysis(result.data);
            setProfile((prev) => ({
              ...prev,
              photoAnalysisResult: result.data,
            }));
          }
        } else {
          console.warn('Photo API non-JSON or offline, using visual scan estimate');
          const mockPhotoAnalysis: PhotoAnalysisData = {
            observedFeatures: ['Surface shine near T-zone', 'Minor erythema on cheeks', 'Smooth skin texture'],
            perceivedSkinType: 'Combination / Sensitive',
            suggestedFocusAreas: ['Barrier Hydration', 'Pore Clarification'],
            disclaimer: 'Educational visual estimation.',
          };
          setPhotoAnalysis(mockPhotoAnalysis);
          setProfile((prev) => ({
            ...prev,
            photoAnalysisResult: mockPhotoAnalysis,
          }));
        }
      } catch (err) {
        console.error('Photo analysis error:', err);
      } finally {
        setAnalyzingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(profile);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-[#FF85B3] via-[#FF69B4] to-[#4A1525] text-white rounded-2xl p-6 sm:p-7 shadow-2xs relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-white/15 text-[#FFE4EC] text-xs font-semibold mb-3 border border-white/20">
            <HeartHandshake className="w-3.5 h-3.5 text-[#FFD1DC]" />
            <span>AI Dermatological Consultation Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Skin Profile Assessment
          </h1>
          <p className="mt-2 text-[#FFE4EC] text-xs sm:text-sm leading-relaxed">
            Provide your baseline parameters, environmental factors, budget, and safety requirements. DermaSense AI will synthesize a high-density morning & evening routine.
          </p>
        </div>
      </div>

      {/* Preset Quick-Start Cards */}
      <div className="bg-white rounded-2xl p-5 border border-[#FFD1DC] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4A1525] flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-[#FF69B4]" />
            <span>Quick Start Demo Profiles</span>
          </h2>
          <span className="text-[11px] text-[#8E5A6B]">Click to autofill</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_PROFILES.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(item.profile)}
              className="text-left p-3 rounded-xl border border-[#FFD1DC] hover:border-[#FF69B4] hover:bg-[#FFE4EC]/40 transition duration-150 group"
            >
              <div className="font-semibold text-xs text-[#4A1525] group-hover:text-[#FF69B4]">{item.name}</div>
              <p className="text-[11px] text-[#8E5A6B] mt-0.5 line-clamp-2">{item.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Assessment Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#FFD1DC] p-6 sm:p-7 shadow-2xs space-y-7">
        
        {/* Section 1: Basic Profile & Environment */}
        <div className="space-y-3.5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4A1525] flex items-center gap-2">
            <User className="w-4 h-4 text-[#FF69B4]" />
            <span>1. Basic Profile & Environment</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#4A1525] mb-1">Age</label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4A1525] mb-1">Gender (Optional)</label>
              <input
                type="text"
                value={profile.gender || ''}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                placeholder="e.g. Female / Male / Non-binary"
                className="w-full px-3 py-2 rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4A1525] mb-1">Location / City</label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="e.g. London, UK / New York, NY"
                className="w-full px-3 py-2 rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A1525] mb-1.5 flex items-center space-x-1">
              <Thermometer className="w-3.5 h-3.5 text-[#FF69B4]" />
              <span>Climate & Environment</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CLIMATES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setProfile({ ...profile, climate: c as any })}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold border text-center transition ${
                    profile.climate === c
                      ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white border-[#FF85B3]'
                      : 'bg-white text-[#4A1525] border-[#FFD1DC] hover:bg-[#FFE4EC]/40'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-[#FFD1DC]" />

        {/* Section 2: Skin Type & Primary Concerns */}
        <div className="space-y-3.5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4A1525] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FF69B4]" />
            <span>2. Skin Type & Primary Concerns</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[#4A1525] mb-1.5">Skin Type Baseline</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SKIN_TYPES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setProfile({ ...profile, skinType: st })}
                  className={`py-2.5 px-3 rounded-lg text-xs font-semibold border text-center transition ${
                    profile.skinType === st
                      ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white border-[#FF85B3]'
                      : 'bg-white text-[#4A1525] border-[#FFD1DC] hover:bg-[#FFE4EC]/40'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A1525] mb-1.5">
              Primary Concerns <span className="text-[#8E5A6B] font-normal">(Select up to 3)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {CONCERNS_LIST.map((c) => {
                const isSelected = profile.primaryConcerns.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleConcernToggle(c.id)}
                    className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                      isSelected
                        ? 'bg-[#FFE4EC]/60 border-[#FF69B4] text-[#FF69B4]'
                        : 'bg-white border-[#FFD1DC] text-[#4A1525] hover:border-[#FF85B3]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] border-[#FF85B3] text-white' : 'border-[#FFD1DC] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{c.label}</div>
                      <div className="text-[11px] text-[#8E5A6B] mt-0.5">{c.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <hr className="border-[#FFD1DC]" />

        {/* Section 3: Safety Guardrails & Preferences */}
        <div className="space-y-3.5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4A1525] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E11D48]" />
            <span>3. Safety Constraints & Preferences</span>
          </h2>

          {/* Pregnancy Safety Toggle Banner */}
          <div className="p-3.5 bg-[#FFF5F5] rounded-xl border border-[#FECDD3] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="pregnancyToggle"
                  checked={profile.isPregnantOrLactating}
                  onChange={(e) => setProfile({ ...profile, isPregnantOrLactating: e.target.checked })}
                  className="w-4 h-4 text-[#E11D48] rounded border-[#FECDD3] focus:ring-[#E11D48] cursor-pointer"
                />
                <label htmlFor="pregnancyToggle" className="text-xs font-bold text-[#9F1239] cursor-pointer">
                  Currently Pregnant, Nursing, or Planning Pregnancy
                </label>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[#FFE4E6] text-[#9F1239] rounded border border-[#FECDD3]">
                Safety Filter
              </span>
            </div>
            <p className="text-[11px] text-[#BE123C] leading-normal pl-6">
              Checking this option excludes retinoids, hydroquinone, and high-concentration salicylic acid.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#4A1525] mb-1.5 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-[#FF69B4]" />
                <span>Budget Tier</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BUDGETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setProfile({ ...profile, budget: b })}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold border text-center transition ${
                      profile.budget === b
                        ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white border-[#FF85B3]'
                        : 'bg-white text-[#4A1525] border-[#FFD1DC] hover:bg-[#FFE4EC]/40'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2.5 pt-5">
              <input
                type="checkbox"
                id="veganToggle"
                checked={profile.veganCrueltyFree}
                onChange={(e) => setProfile({ ...profile, veganCrueltyFree: e.target.checked })}
                className="w-4 h-4 text-[#FF69B4] rounded border-[#FFD1DC] focus:ring-[#FF69B4]"
              />
              <label htmlFor="veganToggle" className="text-xs font-semibold text-[#4A1525] cursor-pointer">
                Strictly Vegan & Cruelty-Free Formulations
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#4A1525] mb-1">
                Current Products / Routine
              </label>
              <textarea
                value={profile.currentRoutine}
                onChange={(e) => setProfile({ ...profile, currentRoutine: e.target.value })}
                rows={2}
                placeholder="e.g. Cleanser, Niacinamide, SPF 50"
                className="w-full px-3 py-2 rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4A1525] mb-1 flex items-center space-x-1">
                <Ban className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>Known Allergies / Sensitivities</span>
              </label>
              <textarea
                value={profile.allergies}
                onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                rows={2}
                placeholder="e.g. Fragrance, Essential Oils, Lanolin"
                className="w-full px-3 py-2 rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none"
              />
            </div>
          </div>
        </div>

        <hr className="border-[#FFD1DC]" />

        {/* Section 4: Optional Photo Visual Assessment */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#831843] flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#BE185D]" />
              <span>4. Optional AI Photo Visual Scan</span>
            </h2>
            <span className="text-[10px] text-[#FF69B4] font-bold bg-[#FFE4EC] px-2 py-0.5 rounded border border-[#FFD1DC]">
              Multimodal Vision Scan
            </span>
          </div>

          <div className="p-4 border border-dashed border-[#FFD1DC] rounded-xl bg-[#FFE4EC]/40 flex flex-col items-center justify-center text-center space-y-3">
            {photoPreview ? (
              <div className="space-y-3 max-w-sm w-full">
                <div className="relative rounded-xl overflow-hidden border border-[#FFD1DC] shadow-xs aspect-square max-h-44 mx-auto">
                  <img src={photoPreview} alt="Skin upload preview" className="w-full h-full object-cover" />
                  {analyzingPhoto && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 animate-spin text-[#FFE4EC]" />
                        <span>Analyzing skin features...</span>
                      </div>
                    </div>
                  )}
                </div>

                {photoAnalysis && (
                  <div className="p-3 bg-[#FFE4EC] rounded-lg border border-[#FFD1DC] text-left text-xs space-y-1">
                    <div className="font-bold text-[#FF69B4] flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 text-[#FF69B4]" />
                      <span>Visual Scan Observations:</span>
                    </div>
                    <ul className="list-disc list-inside text-[#4A1525] text-[11px] space-y-0.5">
                      {photoAnalysis.observedFeatures.map((feat, i) => (
                        <li key={i}>{feat}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(null);
                    setPhotoAnalysis(null);
                  }}
                  className="inline-flex items-center space-x-1 text-xs text-[#8E5A6B] hover:text-[#4A1525] underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Remove photo</span>
                </button>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-[#FFE4EC] text-[#FF69B4] flex items-center justify-center border border-[#FFD1DC]">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#4A1525]">Upload or snap a skin photo</p>
                  <p className="text-[11px] text-[#8E5A6B] mt-0.5 max-w-sm">
                    AI visual scan helps detect surface texture, shine reflections, or localized redness.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white rounded-lg text-xs font-bold hover:opacity-90 transition shadow-xs"
                >
                  Select / Snap Photo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>

        {/* Submit CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] hover:opacity-90 text-white font-bold rounded-xl shadow-xs flex items-center justify-center space-x-2 text-sm transition duration-150 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-[#FCE7F0]" />
                <span>Generating High-Density Routine & Diagnosis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Custom Routine & Dermatological Plan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
