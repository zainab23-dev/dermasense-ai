import React, { useState } from 'react';
import { FullDermaAnalysisResponse, UserSkinProfile } from '../types';
import { Sun, Moon, Dna, ShieldAlert, Sparkles, Check, Copy, Download, RefreshCw, Layers, Clock, Trash2, Plus, AlertTriangle } from 'lucide-react';

interface AnalysisResultsProps {
  data: FullDermaAnalysisResponse;
  profile: UserSkinProfile;
  onReset: () => void;
  onNavigateToTracker: () => void;
  onDelete?: () => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  data,
  profile,
  onReset,
  onNavigateToTracker,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCopyRoutine = () => {
    let text = `DermaSense AI - Custom Skincare Routine\n`;
    text += `User Profile: ${profile.skinType} Skin | ${profile.primaryConcerns.join(', ')}\n\n`;
    
    text += `--- 1. PROFILE SUMMARY & DIAGNOSIS ---\n`;
    text += `${data.diagnosis.summary}\n`;
    text += `Focus Areas: ${data.diagnosis.focusAreas.join(', ')}\n\n`;

    text += `--- 2. MORNING (AM) ROUTINE ---\n`;
    data.amRoutine.forEach((step) => {
      text += `Step ${step.stepNumber}: ${step.stepName}\n- Active Ingredients: ${step.activeIngredients}\n- Purpose: ${step.purpose}\n- Application Tip: ${step.applicationTip}\n\n`;
    });

    text += `--- 3. EVENING (PM) ROUTINE ---\n`;
    data.pmRoutine.forEach((step) => {
      text += `Step ${step.stepNumber}: ${step.stepName}\n- Active Ingredients: ${step.activeIngredients}\n- Purpose: ${step.purpose}\n- Application Tip: ${step.applicationTip}\n\n`;
    });

    text += `--- 4. HERO INGREDIENTS BREAKDOWN ---\n`;
    data.heroIngredients.forEach((hero) => {
      text += `${hero.ingredient} (${hero.bestTime}): ${hero.benefit}. Note: ${hero.notes}\n`;
    });

    text += `\n--- 5. SAFETY & TRANSITION PLAN ---\n`;
    text += `Patch Testing: ${data.safetyPlan.patchTestingGuide}\n`;
    text += `Timeline: ${data.safetyPlan.introductionTimeline}\n`;
    text += `Red Flags: ${data.safetyPlan.redFlags}\n\n`;
    text += `Disclaimer: ${data.disclaimer}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadTxt = () => {
    const text = `DermaSense AI Routine Summary\nGenerated for: ${profile.age}y/o, ${profile.skinType} Skin\n\n` +
      `DIAGNOSIS:\n${data.diagnosis.summary}\n\n` +
      `AM ROUTINE:\n` + data.amRoutine.map(s => `${s.stepNumber}. ${s.stepName} (${s.activeIngredients}) - ${s.purpose}`).join('\n') +
      `\n\nPM ROUTINE:\n` + data.pmRoutine.map(s => `${s.stepNumber}. ${s.stepName} (${s.activeIngredients}) - ${s.purpose}`).join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DermaSense-Skincare-Routine.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStepEyebrow = (stepNum: number, isAm: boolean) => {
    const amLabels = ['01 Cleanse', '02 Treat', '03 Hydrate', '04 Shield', '05 Protect'];
    const pmLabels = ['01 Cleanse', '02 Active', '03 Nourish', '04 Recover', '05 Repair'];
    const arr = isAm ? amLabels : pmLabels;
    return arr[stepNum - 1] || `0${stepNum} Step`;
  };

  const getTimeBadgeStyle = (timeStr: string) => {
    const lower = timeStr.toLowerCase();
    if (lower.includes('am/pm') || lower.includes('both')) {
      return 'bg-pink-50 text-pink-700 border-pink-200';
    }
    if (lower.includes('pm') || lower.includes('night')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Controls Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#FFD1DC] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            D+
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF69B4] bg-[#FFE4EC] px-2.5 py-0.5 rounded border border-[#FFD1DC]">
                High Density Routine
              </span>
              {profile.isPregnantOrLactating && (
                <span className="text-[10px] font-bold text-[#9F1239] bg-[#FFF5F5] px-2 py-0.5 rounded border border-[#FECDD3]">
                  Pregnancy Safe Filter
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#4A1525] mt-1">
              Dermatological Analysis & Tailored Plan
            </h1>
            <p className="text-xs text-[#8E5A6B]">
              Patient Baseline: {profile.age}y/o • {profile.skinType} Skin • Climate: {profile.climate}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={handleCopyRoutine}
            className="px-3 py-1.5 bg-[#FFE4EC] hover:bg-[#FFE4EC]/80 text-[#4A1525] rounded-lg border border-[#FFD1DC] text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#FF69B4]" /> : <Copy className="w-3.5 h-3.5 text-[#8E5A6B]" />}
            <span>{copied ? 'Copied' : 'Copy Plan'}</span>
          </button>

          <button
            onClick={handleDownloadTxt}
            className="px-3 py-1.5 bg-[#FFE4EC] hover:bg-[#FFE4EC]/80 text-[#4A1525] rounded-lg border border-[#FFD1DC] text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-[#8E5A6B]" />
            <span>Download</span>
          </button>

          <button
            onClick={onNavigateToTracker}
            className="px-3.5 py-1.5 bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] hover:opacity-90 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Start Daily Tracker</span>
          </button>

          <button
            onClick={onReset}
            className="px-3 py-1.5 bg-[#FFE4EC] hover:bg-[#FFD1DC] text-[#4A1525] rounded-lg border border-[#FFD1DC] text-xs font-semibold flex items-center space-x-1.5 transition"
            title="Create a new routine or re-assess"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF69B4]" />
            <span>New Routine</span>
          </button>

          {onDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 bg-[#FFF5F5] hover:bg-[#FFE4EC] text-[#E11D48] rounded-lg border border-[#FECDD3] text-xs font-semibold flex items-center space-x-1.5 transition"
              title="Delete this custom routine"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>Delete Routine</span>
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#FFD1DC] p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center space-x-3 text-[#E11D48]">
              <div className="w-10 h-10 rounded-full bg-[#FFF5F5] flex items-center justify-center border border-[#FECDD3]">
                <AlertTriangle className="w-5 h-5 text-[#E11D48]" />
              </div>
              <h3 className="text-base font-bold text-[#4A1525]">Delete Custom Routine?</h3>
            </div>

            <p className="text-xs text-[#8E5A6B] leading-relaxed">
              Are you sure you want to delete this custom skincare routine and diagnostic data? This action will permanently remove your currently generated routine and let you create a new one.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4A1525] bg-[#FFE4EC] hover:bg-[#FFD1DC] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDelete) onDelete();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#E11D48] to-[#BE123C] hover:opacity-90 transition shadow-xs flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Routine</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Column (Profile & Hero Ingredients) & Right Column (AM/PM Routines) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (4 cols on lg): Diagnosis + Hero Table + Safety */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. Profile Summary & Diagnosis */}
          <div className="bg-white rounded-2xl border border-[#FFD1DC] p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-[#4A1525] uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-[#FF69B4] rounded-full"></span>
              1. Profile Summary & Diagnosis
            </h2>

            <div className="p-4 bg-[#FFE4EC]/50 rounded-xl border border-[#FFD1DC]">
              <p className="text-xs text-[#4A1525] leading-relaxed mb-3 italic">
                "{data.diagnosis.summary}"
              </p>
              
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-[#FF69B4] uppercase tracking-wider">Key Focus Areas:</div>
                <div className="flex flex-wrap gap-1.5">
                  {data.diagnosis.focusAreas.map((area, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white rounded border border-[#FFD1DC] text-[11px] font-semibold text-[#FF69B4]">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {data.diagnosis.barrierStatusAssessment && (
                <div className="mt-3 pt-2 border-t border-[#FFD1DC] text-[11px] text-[#FF69B4]">
                  <strong>Barrier Status:</strong> {data.diagnosis.barrierStatusAssessment}
                </div>
              )}
            </div>
          </div>

          {/* 2. Hero Ingredients Breakdown */}
          <div className="bg-white rounded-2xl border border-[#FFD1DC] p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-[#4A1525] uppercase tracking-widest flex items-center gap-2">
              <Dna className="w-3.5 h-3.5 text-[#FF69B4]" />
              2. Hero Ingredients Breakdown
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#FFD1DC]">
                    <th className="py-2 text-[10px] font-bold text-[#8E5A6B] uppercase">Ingredient</th>
                    <th className="py-2 text-[10px] font-bold text-[#8E5A6B] uppercase">Benefit</th>
                    <th className="py-2 text-[10px] font-bold text-[#8E5A6B] uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {data.heroIngredients.map((hero, idx) => (
                    <tr key={idx} className="border-b border-[#FFE4EC] last:border-0">
                      <td className="py-2.5 font-semibold text-[#FF69B4] pr-2">{hero.ingredient}</td>
                      <td className="py-2.5 text-[#4A1525] text-[11px] pr-2">{hero.benefit}</td>
                      <td className="py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getTimeBadgeStyle(hero.bestTime)}`}>
                          {hero.bestTime}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Safety Protocol Box */}
          <div className="p-4 bg-[#FFF5F5] rounded-xl border border-[#FECDD3] space-y-2">
            <h3 className="text-xs font-bold text-[#9F1239] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#E11D48]" />
              Safety & Transition Protocol
            </h3>
            <p className="text-[11px] text-[#BE123C] leading-normal">
              <strong>Patch Test:</strong> {data.safetyPlan.patchTestingGuide}
            </p>
            <p className="text-[11px] text-[#BE123C] leading-normal border-t border-[#FECDD3] pt-2">
              <strong>Timeline:</strong> {data.safetyPlan.introductionTimeline}
            </p>
            <p className="text-[11px] text-[#9F1239] leading-normal border-t border-[#FECDD3] pt-2">
              <strong>Red Flags:</strong> {data.safetyPlan.redFlags}
            </p>
          </div>

        </div>

        {/* Right Column (7 cols on lg): Morning & Evening Routines */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Morning (AM) Routine Card */}
          <div className="bg-white rounded-2xl border border-[#FFD1DC] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#FFD1DC]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#FFE4EC] rounded-full flex items-center justify-center text-[#FF69B4] font-bold">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#4A1525]">Morning (AM) Routine</h3>
                  <p className="text-xs text-[#8E5A6B]">Goal: Antioxidant Defense & UV Shielding</p>
                </div>
              </div>
              <span className="text-[10px] bg-[#FFE4EC] text-[#FF69B4] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-[#FFD1DC]">
                {data.amRoutine.length} Steps
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.amRoutine.map((step) => (
                <div key={step.stepNumber} className="p-3.5 bg-[#FFE4EC]/40 rounded-xl border border-[#FFD1DC] flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-[#8E5A6B] uppercase block mb-1">
                      {getStepEyebrow(step.stepNumber, true)}
                    </span>
                    <h4 className="text-xs font-bold text-[#4A1525] mb-0.5">{step.stepName}</h4>
                    <p className="text-[11px] text-[#4A1525] leading-normal mb-2">{step.purpose}</p>
                    <span className="inline-block text-[10px] font-semibold text-[#FF69B4] bg-[#FFE4EC] px-2 py-0.5 rounded border border-[#FFD1DC]">
                      {step.activeIngredients}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-dashed border-[#FFD1DC] text-[10px] text-[#8E5A6B] italic">
                    {step.applicationTip}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Night (PM) Routine Card */}
          <div className="bg-white rounded-2xl border border-[#FFD1DC] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#FFD1DC]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#4A1525]">Evening (PM) Routine</h3>
                  <p className="text-xs text-[#8E5A6B]">Goal: Deep Repair, Active Cell Turnover & Lipid Recovery</p>
                </div>
              </div>
              <span className="text-[10px] bg-[#FFE4EC] text-[#FF69B4] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-[#FFD1DC]">
                {data.pmRoutine.length} Steps
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.pmRoutine.map((step) => (
                <div key={step.stepNumber} className="p-3.5 bg-[#FFE4EC]/40 rounded-xl border border-[#FFD1DC] flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-[#8E5A6B] uppercase block mb-1">
                      {getStepEyebrow(step.stepNumber, false)}
                    </span>
                    <h4 className="text-xs font-bold text-[#4A1525] mb-0.5">{step.stepName}</h4>
                    <p className="text-[11px] text-[#4A1525] leading-normal mb-2">{step.purpose}</p>
                    <span className="inline-block text-[10px] font-semibold text-[#FF69B4] bg-[#FFE4EC] px-2 py-0.5 rounded border border-[#FFD1DC]">
                      {step.activeIngredients}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-dashed border-[#FFD1DC] text-[10px] text-[#8E5A6B] italic">
                    {step.applicationTip}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Disclaimer Banner */}
      <div className="p-4 bg-white rounded-xl border border-[#FFD1DC] text-[#8E5A6B] text-[11px] text-center space-y-1 shadow-2xs">
        <strong className="text-[#4A1525] block uppercase tracking-wider text-[10px]">Medical Safety Disclaimer</strong>
        <p>{data.disclaimer}</p>
      </div>
    </div>
  );
};
