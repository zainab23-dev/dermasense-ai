import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FullDermaAnalysisResponse, CustomRoutineStep, DailyRoutineTrackingLog, OutcomeResult, StepStatus } from '../types';
import { 
  Sun, Moon, Check, X, Plus, Trash2, Calendar, Clock, 
  TrendingUp, ThumbsUp, ThumbsDown, Sparkles, Timer, Play, Pause, RotateCcw, 
  Layers, Edit3, ShieldAlert, FileText, ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react';

interface RoutineTrackerProps {
  analysis: FullDermaAnalysisResponse | null;
  userId?: string;
}

// Default starter steps if user has no custom routine saved (Separated Morning and Evening)
const DEFAULT_CUSTOM_STEPS: CustomRoutineStep[] = [
  {
    id: 'am_step_1',
    stepName: 'Gentle Hydrating Cleanser',
    timeOfDay: 'AM',
    category: 'Cleanser',
    productName: 'CeraVe Hydrating Cleanser',
    activeIngredients: 'Ceramides, Hyaluronic Acid',
    applicationTip: 'Massage gently on damp skin for 60 seconds.'
  },
  {
    id: 'am_step_2',
    stepName: 'Niacinamide & Vitamin C Serum',
    timeOfDay: 'AM',
    category: 'Active/Serum',
    productName: 'The Ordinary Niacinamide 10%',
    activeIngredients: 'Niacinamide, Zinc PCA',
    applicationTip: 'Apply 2-3 drops to face before heavier creams.'
  },
  {
    id: 'am_step_3',
    stepName: 'Lightweight Barrier Day Cream',
    timeOfDay: 'AM',
    category: 'Moisturizer',
    productName: 'La Roche-Posay Lipikar Light',
    activeIngredients: 'Shea Butter, Panthenol B5',
    applicationTip: 'Press gently into skin to lock in moisture.'
  },
  {
    id: 'am_step_4',
    stepName: 'Broad Spectrum SPF 50 Sunscreen',
    timeOfDay: 'AM',
    category: 'Sunscreen',
    productName: 'Beauty of Joseon Relief Sun',
    activeIngredients: 'Rice Extract, Probiotics',
    applicationTip: 'Apply 2 finger lengths every morning as final step.'
  },
  {
    id: 'pm_step_1',
    stepName: 'Nourishing Oil Cleanser / Double Cleanse',
    timeOfDay: 'PM',
    category: 'Cleanser',
    productName: 'Anua Heartleaf Pore Cleansing Oil',
    activeIngredients: 'Heartleaf Extract, Jojoba Oil',
    applicationTip: 'Massage for 60 seconds on dry skin to break down sunscreen and oil.'
  },
  {
    id: 'pm_step_2',
    stepName: 'Retinol 0.25% Night Treatment',
    timeOfDay: 'PM',
    category: 'Active/Serum',
    productName: 'CeraVe Resurfacing Retinol Serum',
    activeIngredients: 'Encapsulated Retinol, Ceramides',
    applicationTip: 'Apply a pea-sized amount on dry skin 2-3 nights a week.'
  },
  {
    id: 'pm_step_3',
    stepName: 'Intensive Night Repair Cream',
    timeOfDay: 'PM',
    category: 'Moisturizer',
    productName: 'La Roche-Posay Cicaplast Baume B5+',
    activeIngredients: 'Panthenol B5, Madecassoside',
    applicationTip: 'Apply a rich layer to soothe skin barrier overnight.'
  }
];

export const RoutineTracker: React.FC<RoutineTrackerProps> = ({ analysis, userId = 'guest' }) => {
  // Storage key helpers
  const stepsKey = `dermasense_user_${userId}_custom_steps`;
  const logsKey = `dermasense_user_${userId}_tracking_logs`;

  // Timeframe View State: Daily | Weekly | Monthly
  const [timeframeView, setTimeframeView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Selected Date string (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Active Mode for Daily view: AM vs PM
  const [activeAmPm, setActiveAmPm] = useState<'AM' | 'PM'>('AM');

  // Helper to normalize steps so AM and PM never share identical step IDs
  const normalizeSteps = (steps: CustomRoutineStep[]): CustomRoutineStep[] => {
    const result: CustomRoutineStep[] = [];
    steps.forEach((s) => {
      if ((s.timeOfDay as string) === 'Both') {
        result.push({ ...s, id: `${s.id}_am`, timeOfDay: 'AM' });
        result.push({ ...s, id: `${s.id}_pm`, timeOfDay: 'PM' });
      } else {
        result.push(s);
      }
    });
    return result;
  };

  // Custom Routine Steps
  const [customSteps, setCustomSteps] = useState<CustomRoutineStep[]>(() => {
    const saved = localStorage.getItem(stepsKey) || localStorage.getItem('dermasense_custom_steps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return normalizeSteps(parsed);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_CUSTOM_STEPS;
  });

  // Daily Routine Logs
  const [trackingLogs, setTrackingLogs] = useState<{ [date: string]: DailyRoutineTrackingLog }>(() => {
    const saved = localStorage.getItem(logsKey) || localStorage.getItem('dermasense_tracking_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {};
  });

  // Daily Submit Success Toast state
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // New Step Modal Form State
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [newStepName, setNewStepName] = useState('');
  const [newStepTime, setNewStepTime] = useState<'AM' | 'PM' | 'Both'>('AM');
  const [newStepCategory, setNewStepCategory] = useState<CustomRoutineStep['category']>('Cleanser');
  const [newStepProduct, setNewStepProduct] = useState('');
  const [newStepIngredients, setNewStepIngredients] = useState('');
  const [newStepTip, setNewStepTip] = useState('');

  // Absorption Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [initialTimer, setInitialTimer] = useState<number>(60);

  // Reload when userId changes
  useEffect(() => {
    const savedSteps = localStorage.getItem(`dermasense_user_${userId}_custom_steps`);
    if (savedSteps) {
      try {
        const parsed = JSON.parse(savedSteps);
        if (Array.isArray(parsed)) setCustomSteps(normalizeSteps(parsed));
      } catch (e) {}
    } else {
      setCustomSteps(DEFAULT_CUSTOM_STEPS);
    }

    const savedLogs = localStorage.getItem(`dermasense_user_${userId}_tracking_logs`);
    if (savedLogs) {
      try {
        setTrackingLogs(JSON.parse(savedLogs));
      } catch (e) {}
    } else {
      setTrackingLogs({});
    }
  }, [userId]);

  // Sync customSteps and trackingLogs to user-scoped localStorage
  useEffect(() => {
    localStorage.setItem(stepsKey, JSON.stringify(customSteps));
  }, [customSteps, stepsKey]);

  useEffect(() => {
    localStorage.setItem(logsKey, JSON.stringify(trackingLogs));
  }, [trackingLogs, logsKey]);


  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Handle Importing AI Routine into Custom Steps
  const handleImportAiRoutine = () => {
    if (!analysis) return;
    const newImported: CustomRoutineStep[] = [];

    analysis.amRoutine.forEach((step, idx) => {
      newImported.push({
        id: `ai_am_${idx}_${Date.now()}`,
        stepName: step.stepName,
        timeOfDay: 'AM',
        category: idx === 0 ? 'Cleanser' : idx === analysis.amRoutine.length - 1 ? 'Sunscreen' : 'Active/Serum',
        activeIngredients: step.activeIngredients,
        applicationTip: step.applicationTip
      });
    });

    analysis.pmRoutine.forEach((step, idx) => {
      newImported.push({
        id: `ai_pm_${idx}_${Date.now()}`,
        stepName: step.stepName,
        timeOfDay: 'PM',
        category: idx === 0 ? 'Cleanser' : idx === analysis.pmRoutine.length - 1 ? 'Moisturizer' : 'Active/Serum',
        activeIngredients: step.activeIngredients,
        applicationTip: step.applicationTip
      });
    });

    setCustomSteps(newImported);
  };

  // Add Custom Step handler
  const handleAddCustomStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepName.trim()) return;

    const ts = Date.now();
    const newStepsAdded: CustomRoutineStep[] = [];

    if (newStepTime === 'AM' || newStepTime === 'Both') {
      newStepsAdded.push({
        id: `step_am_${ts}`,
        stepName: newStepName.trim(),
        timeOfDay: 'AM',
        category: newStepCategory,
        productName: newStepProduct.trim(),
        activeIngredients: newStepIngredients.trim(),
        applicationTip: newStepTip.trim() || 'Apply gently and allow skin to absorb.'
      });
    }

    if (newStepTime === 'PM' || newStepTime === 'Both') {
      newStepsAdded.push({
        id: `step_pm_${ts}_2`,
        stepName: newStepName.trim(),
        timeOfDay: 'PM',
        category: newStepCategory,
        productName: newStepProduct.trim(),
        activeIngredients: newStepIngredients.trim(),
        applicationTip: newStepTip.trim() || 'Apply gently and allow skin to absorb.'
      });
    }

    setCustomSteps([...customSteps, ...newStepsAdded]);
    setNewStepName('');
    setNewStepProduct('');
    setNewStepIngredients('');
    setNewStepTip('');
    setShowAddStepModal(false);
  };

  // Delete Custom Step handler
  const handleDeleteCustomStep = (id: string) => {
    setCustomSteps(customSteps.filter((s) => s.id !== id));
  };

  // Get or initialize log for selected date
  const currentDayLog: DailyRoutineTrackingLog = trackingLogs[selectedDate] || {
    date: selectedDate,
    stepStatuses: {},
    notes: '',
    outcomeResult: 'unrecorded'
  };

  // Toggle step execution status: 'completed' (tick ✓) -> 'skipped' (cross ✕) -> 'pending'
  const handleToggleStepStatus = (stepId: string, targetStatus?: StepStatus) => {
    const currentStatus = currentDayLog.stepStatuses[stepId] || 'pending';
    let nextStatus: StepStatus = 'completed';

    if (targetStatus) {
      nextStatus = targetStatus;
    } else {
      if (currentStatus === 'pending') nextStatus = 'completed';
      else if (currentStatus === 'completed') nextStatus = 'skipped';
      else nextStatus = 'pending';
    }

    const updatedLog: DailyRoutineTrackingLog = {
      ...currentDayLog,
      stepStatuses: {
        ...currentDayLog.stepStatuses,
        [stepId]: nextStatus
      }
    };

    setTrackingLogs({
      ...trackingLogs,
      [selectedDate]: updatedLog
    });
  };

  // Update outcome result (positive (+), negative (-), neutral (=))
  const handleSetOutcomeResult = (result: OutcomeResult) => {
    const updatedLog: DailyRoutineTrackingLog = {
      ...currentDayLog,
      outcomeResult: result
    };
    setTrackingLogs({
      ...trackingLogs,
      [selectedDate]: updatedLog
    });
  };

  // Update daily notes
  const handleUpdateNotes = (notesText: string) => {
    const updatedLog: DailyRoutineTrackingLog = {
      ...currentDayLog,
      notes: notesText
    };
    setTrackingLogs({
      ...trackingLogs,
      [selectedDate]: updatedLog
    });
  };

  // Explicit Submit Daily Log Handler
  const handleSubmitDailyLog = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    localStorage.setItem(logsKey, JSON.stringify(trackingLogs));
    setSaveSuccessMsg(`✓ Daily routine & notes submitted and saved for ${selectedDate}!`);
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 4000);
  };

  // Absorption Timer Helpers
  const startAbsorptionTimer = (duration: number) => {
    setInitialTimer(duration);
    setTimerSeconds(duration);
    setTimerRunning(true);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(initialTimer);
  };

  // Filter steps strictly by AM vs PM for active daily view (no integration/leakage)
  const visibleSteps = customSteps.filter(
    (s) => s.timeOfDay === activeAmPm
  );

  // Stats calculations for current day
  const currentCompletedCount = visibleSteps.filter(
    (s) => currentDayLog.stepStatuses[s.id] === 'completed'
  ).length;
  const currentSkippedCount = visibleSteps.filter(
    (s) => currentDayLog.stepStatuses[s.id] === 'skipped'
  ).length;
  const currentProgressPercent = visibleSteps.length > 0
    ? Math.round((currentCompletedCount / visibleSteps.length) * 100)
    : 0;

  // Helpers for Weekly & Monthly Analytics
  const getDaysOfWeek = (referenceDateStr: string) => {
    const refDate = new Date(referenceDateStr);
    const dayOfWeek = refDate.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMon = refDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const monDate = new Date(refDate);
    monDate.setDate(diffToMon);

    const weekDays: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monDate);
      d.setDate(monDate.getDate() + i);
      weekDays.push(d.toISOString().split('T')[0]);
    }
    return weekDays;
  };

  const currentWeekDays = getDaysOfWeek(selectedDate);

  // Month days generator
  const getDaysOfMonth = (referenceDateStr: string) => {
    const date = new Date(referenceDateStr);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const monthDays: string[] = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dayDate = new Date(year, month, d);
      monthDays.push(dayDate.toISOString().split('T')[0]);
    }
    return monthDays;
  };

  const currentMonthDays = getDaysOfMonth(selectedDate);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Title & Header Banner */}
      <div className="bg-gradient-to-r from-[#FF85B3] via-[#FF69B4] to-[#4A1525] text-white p-6 sm:p-7 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-white/15 text-[#FFE4EC] text-xs font-semibold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD1DC]" />
              <span>Custom Skincare Routine & Outcomes Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Daily, Weekly & Monthly Execution
            </h1>
            <p className="mt-1.5 text-[#FFE4EC] text-xs sm:text-sm max-w-xl leading-relaxed">
              Build your customized morning & evening routines, tick (✓) completed steps, cross (✕) skipped steps, and log positive or negative skin result observations over time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {analysis && (
              <button
                onClick={handleImportAiRoutine}
                className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold border border-white/30 transition flex items-center space-x-1.5 backdrop-blur-xs"
              >
                <Layers className="w-3.5 h-3.5 text-[#FFD1DC]" />
                <span>Import AI Routine</span>
              </button>
            )}

            <button
              onClick={() => setShowAddStepModal(true)}
              className="px-4 py-2 bg-white text-[#FF69B4] hover:bg-[#FFE4EC] rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs hover:shadow-md"
            >
              <Plus className="w-4 h-4 text-[#FF69B4]" />
              <span>Add Custom Step</span>
            </button>
          </div>
        </div>
      </div>

      {/* Timeframe Navigation Tabs (Daily | Weekly | Monthly) */}
      <div className="bg-white p-2 rounded-2xl border border-[#FFD1DC] shadow-2xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setTimeframeView('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              timeframeView === 'daily'
                ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white shadow-2xs'
                : 'text-[#4A1525] hover:bg-[#FFE4EC]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Daily Checklist</span>
          </button>

          <button
            onClick={() => setTimeframeView('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              timeframeView === 'weekly'
                ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white shadow-2xs'
                : 'text-[#4A1525] hover:bg-[#FFE4EC]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Weekly Adherence</span>
          </button>

          <button
            onClick={() => setTimeframeView('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              timeframeView === 'monthly'
                ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white shadow-2xs'
                : 'text-[#4A1525] hover:bg-[#FFE4EC]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Monthly Results Log</span>
          </button>
        </div>

        {/* Date Selector input */}
        <div className="flex items-center space-x-2 pr-2">
          <label className="text-[11px] font-bold text-[#4A1525] hidden sm:block">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#FFD1DC] text-xs font-semibold text-[#4A1525] bg-[#FFE4EC]/50 outline-none"
          />
        </div>
      </div>

      {/* VIEW 1: DAILY CHECKLIST & OUTCOMES */}
      {timeframeView === 'daily' && (
        <div className="space-y-6">
          {/* AM / PM Toggle & Progress Bar Header */}
          <div className="bg-white p-5 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-[#FFE4EC]/70 p-1 rounded-xl border border-[#FFD1DC]">
                  <button
                    onClick={() => setActiveAmPm('AM')}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeAmPm === 'AM' ? 'bg-[#FF85B3] text-white shadow-2xs' : 'text-[#4A1525] hover:text-[#FF69B4]'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Morning (AM)</span>
                  </button>
                  <button
                    onClick={() => setActiveAmPm('PM')}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeAmPm === 'PM' ? 'bg-[#4A1525] text-white shadow-2xs' : 'text-[#4A1525] hover:text-[#FF69B4]'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Evening (PM)</span>
                  </button>
                </div>

                <span className="text-xs font-bold text-[#4A1525] bg-[#FFE4EC]/70 px-2.5 py-1 rounded-lg border border-[#FFD1DC]">
                  {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate}
                </span>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-[#4A1525]">
                  {currentCompletedCount} Done (✓) • {currentSkippedCount} Skipped (✕) • {visibleSteps.length - currentCompletedCount - currentSkippedCount} Pending
                </div>
                <div className="text-[11px] text-[#8E5A6B]">
                  {currentProgressPercent}% Routine Completed
                </div>
              </div>
            </div>

            {/* Progress bar with smooth Baby Pink gradient */}
            <div className="w-full h-2.5 bg-[#FFE4EC] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${currentProgressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full transition-all duration-300 ${
                  currentProgressPercent === 100
                    ? 'bg-gradient-to-r from-[#FF85B3] via-[#FF69B4] to-[#FF85B3]'
                    : activeAmPm === 'AM' ? 'bg-[#FF85B3]' : 'bg-[#4A1525]'
                }`}
              ></motion.div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Steps Checklist Column */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#4A1525] flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF69B4]" />
                  <span>{activeAmPm} Steps ({visibleSteps.length})</span>
                </h3>
                <span className="text-[11px] text-[#8E5A6B] italic">
                  Click Tick (✓) to Complete or Cross (✕) to Skip
                </span>
              </div>

              {visibleSteps.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#FFD1DC] p-8 text-center space-y-3">
                  <p className="text-xs text-[#8E5A6B]">No steps created for {activeAmPm} routine yet.</p>
                  <button
                    onClick={() => setShowAddStepModal(true)}
                    className="px-3.5 py-1.5 bg-[#FF85B3] hover:bg-[#FF69B4] text-white text-xs font-bold rounded-lg transition"
                  >
                    Add First Step
                  </button>
                </div>
              ) : (
                visibleSteps.map((step, idx) => {
                  const status = currentDayLog.stepStatuses[step.id] || 'pending';
                  const isCompleted = status === 'completed';
                  const isSkipped = status === 'skipped';

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                      whileHover={{ scale: 1.008 }}
                      className={`p-4 rounded-2xl border transition-all duration-200 space-y-2.5 silk-shadow-hover ${
                        isCompleted
                          ? 'bg-[#FFE4EC]/60 border-[#FFD1DC] shadow-2xs'
                          : isSkipped
                          ? 'bg-[#FFF5F5] border-[#FECDD3]'
                          : 'bg-white border-[#FFD1DC] hover:border-[#FF85B3]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          {/* Tick / Cross Action Controls */}
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.85 }}
                              animate={isCompleted ? { scale: [1, 1.12, 1] } : {}}
                              transition={{ duration: 0.25 }}
                              onClick={() => handleToggleStepStatus(step.id, 'completed')}
                              className={`p-1.5 rounded-lg border transition ${
                                isCompleted
                                  ? 'bg-[#FF85B3] text-white border-[#FF85B3] shadow-2xs ring-2 ring-[#FF85B3]/30'
                                  : 'bg-white text-[#8E5A6B] border-[#FFD1DC] hover:bg-[#FFE4EC]'
                              }`}
                              title="Mark Cleansed / Completed (✓)"
                            >
                              <Check className="w-4 h-4" />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.85 }}
                              onClick={() => handleToggleStepStatus(step.id, 'skipped')}
                              className={`p-1.5 rounded-lg border transition ${
                                isSkipped
                                  ? 'bg-[#E11D48] text-white border-[#E11D48] shadow-2xs'
                                  : 'bg-white text-[#8E5A6B] border-[#FFD1DC] hover:bg-[#FFE4E6]'
                              }`}
                              title="Mark Skipped / Missed (✕)"
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF69B4] bg-[#FFE4EC] px-2 py-0.5 rounded border border-[#FFD1DC]">
                                Step {idx + 1} • {step.category}
                              </span>
                              {step.timeOfDay === 'Both' && (
                                <span className="text-[10px] font-semibold text-[#4A1525] bg-white px-1.5 py-0.5 rounded border border-[#FFD1DC]">
                                  AM & PM
                                </span>
                              )}
                            </div>
                            <h4 className={`text-sm font-bold mt-1 ${isCompleted ? 'line-through text-[#4A1525]/60' : 'text-[#4A1525]'}`}>
                              {step.stepName}
                            </h4>
                            {step.productName && (
                              <p className="text-xs text-[#8E5A6B] font-medium mt-0.5">
                                Product: {step.productName}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {step.activeIngredients && (
                            <span className="text-[11px] font-semibold text-[#4A1525] bg-white px-2 py-1 rounded-lg border border-[#FFD1DC] hidden sm:inline-block">
                              {step.activeIngredients}
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteCustomStep(step.id)}
                            className="text-[#8E5A6B] hover:text-[#FF69B4] p-1 transition"
                            title="Delete step"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {step.applicationTip && (
                        <p className="text-xs text-[#8E5A6B] bg-white/90 p-2 rounded-xl border border-[#FFD1DC] italic">
                          💡 Tip: {step.applicationTip}
                        </p>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Daily Skin Outcomes & Notes Column */}
            <div className="lg:col-span-4 space-y-4">
              {/* Daily Outcome Tag Selector */}
              <div className="bg-white p-5 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#4A1525] flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-[#FF69B4]" />
                  <span>Skin Result Outcome</span>
                </h3>

                <p className="text-xs text-[#8E5A6B]">
                  Did your skin react positively (+) or negatively (-) after today's skincare execution?
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSetOutcomeResult('positive')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center space-y-1 ${
                      currentDayLog.outcomeResult === 'positive'
                        ? 'bg-[#FF85B3] text-white border-[#FF85B3] shadow-2xs'
                        : 'bg-[#FFE4EC]/60 text-[#4A1525] border-[#FFD1DC] hover:bg-[#FFE4EC]'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Positive (+)</span>
                  </button>

                  <button
                    onClick={() => handleSetOutcomeResult('neutral')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center space-y-1 ${
                      currentDayLog.outcomeResult === 'neutral'
                        ? 'bg-[#4A1525] text-white border-[#4A1525] shadow-2xs'
                        : 'bg-[#FFE4EC]/60 text-[#4A1525] border-[#FFD1DC] hover:bg-[#FFE4EC]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Neutral (=)</span>
                  </button>

                  <button
                    onClick={() => handleSetOutcomeResult('negative')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center space-y-1 ${
                      currentDayLog.outcomeResult === 'negative'
                        ? 'bg-[#E11D48] text-white border-[#E11D48] shadow-2xs'
                        : 'bg-[#FFF5F5] text-[#9F1239] border-[#FECDD3] hover:bg-[#FFE4E6]'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>Negative (-)</span>
                  </button>
                </div>

                {/* Outcome notes textarea */}
                <div>
                  <label className="block text-xs font-semibold text-[#4A1525] mb-1">
                    Daily Observations & Notes
                  </label>
                  <textarea
                    value={currentDayLog.notes || ''}
                    onChange={(e) => handleUpdateNotes(e.target.value)}
                    rows={3}
                    placeholder="Write observations (e.g., 'Skin felt super smooth after cleansing', or 'Slight stinging around nose after Retinol')..."
                    className="w-full p-2.5 rounded-xl border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none"
                  />
                </div>

                {/* Submit Daily Log Button */}
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(255, 105, 180, 0.35)" }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => handleSubmitDailyLog()}
                  className="w-full py-3 bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Submit Today's Log & Notes</span>
                </motion.button>

                {saveSuccessMsg && (
                  <div className="p-2.5 bg-[#FFE4EC] border border-[#FFD1DC] text-[#FF69B4] text-xs font-semibold rounded-xl text-center animate-fade-in">
                    {saveSuccessMsg}
                  </div>
                )}
              </div>

              {/* Layering Absorption Wait Timer */}
              <div className="bg-white p-5 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-3.5">
                <div className="flex items-center space-x-2 text-[#4A1525]">
                  <Timer className="w-4 h-4 text-[#FF69B4]" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Absorption Wait Timer</h3>
                </div>
                <p className="text-[11px] text-[#8E5A6B]">
                  Wait 60-120s between active serums & moisturizers for max penetration.
                </p>

                <div className="p-4 bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white rounded-xl text-center space-y-2">
                  <div className="font-mono text-3xl font-extrabold tracking-wider text-white">
                    {Math.floor(timerSeconds / 60)}:{timerSeconds % 60 < 10 ? '0' : ''}{timerSeconds % 60}
                  </div>

                  <div className="flex items-center justify-center space-x-2 pt-1">
                    <button
                      onClick={() => setTimerRunning(!timerRunning)}
                      className="px-3 py-1.5 bg-white text-[#FF69B4] hover:bg-[#FFE4EC] rounded-lg text-xs font-bold flex items-center space-x-1 transition"
                    >
                      {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{timerRunning ? 'Pause' : 'Start Timer'}</span>
                    </button>
                    <button
                      onClick={resetTimer}
                      className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => startAbsorptionTimer(60)}
                      className="py-1 bg-white/10 hover:bg-white/20 text-[11px] rounded text-white"
                    >
                      60s Wait
                    </button>
                    <button
                      onClick={() => startAbsorptionTimer(120)}
                      className="py-1 bg-white/10 hover:bg-white/20 text-[11px] rounded text-white"
                    >
                      120s Wait
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: WEEKLY ADHERENCE & MATRIX (PERCENTAGE BASED) */}
      {timeframeView === 'weekly' && (() => {
        const amSteps = customSteps.filter((s) => s.timeOfDay === 'AM');
        const pmSteps = customSteps.filter((s) => s.timeOfDay === 'PM');
        const totalRoutineStepsPerDay = customSteps.length;

        let totalPossibleStepsWeek = currentWeekDays.length * totalRoutineStepsPerDay;
        let totalCompletedStepsWeek = 0;

        let amPossibleStepsWeek = currentWeekDays.length * amSteps.length;
        let amCompletedStepsWeek = 0;

        let pmPossibleStepsWeek = currentWeekDays.length * pmSteps.length;
        let pmCompletedStepsWeek = 0;

        let positiveDaysWeekCount = 0;
        let loggedDaysWeekCount = 0;

        currentWeekDays.forEach((d) => {
          const dayLog = trackingLogs[d];
          if (dayLog) {
            loggedDaysWeekCount++;
            if (dayLog.outcomeResult === 'positive') positiveDaysWeekCount++;

            customSteps.forEach((s) => {
              if (dayLog.stepStatuses[s.id] === 'completed') {
                totalCompletedStepsWeek++;
                if (s.timeOfDay === 'AM') amCompletedStepsWeek++;
                if (s.timeOfDay === 'PM') pmCompletedStepsWeek++;
              }
            });
          }
        });

        const weeklyOverallPct = totalPossibleStepsWeek > 0 ? Math.round((totalCompletedStepsWeek / totalPossibleStepsWeek) * 100) : 0;
        const weeklyAmPct = amPossibleStepsWeek > 0 ? Math.round((amCompletedStepsWeek / amPossibleStepsWeek) * 100) : 0;
        const weeklyPmPct = pmPossibleStepsWeek > 0 ? Math.round((pmCompletedStepsWeek / pmPossibleStepsWeek) * 100) : 0;
        const weeklyPositivePct = loggedDaysWeekCount > 0 ? Math.round((positiveDaysWeekCount / loggedDaysWeekCount) * 100) : 0;

        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Weekly Performance Summary Cards in % */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div whileHover={{ y: -2 }} className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E5A6B]">Weekly Adherence</span>
                <div className="text-2xl font-black text-[#FF69B4] flex items-center justify-between">
                  <span>{weeklyOverallPct}%</span>
                  <Sparkles className="w-4 h-4 text-[#FF69B4]" />
                </div>
                <div className="w-full bg-[#FFE4EC] h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weeklyOverallPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] h-full rounded-full"
                  />
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E5A6B]">☀️ AM Morning Routine</span>
                <div className="text-2xl font-black text-[#FF85B3]">{weeklyAmPct}%</div>
                <div className="w-full bg-[#FFE4EC] h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weeklyAmPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] h-full rounded-full"
                  />
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E5A6B]">🌙 PM Evening Routine</span>
                <div className="text-2xl font-black text-[#4A1525]">{weeklyPmPct}%</div>
                <div className="w-full bg-[#FFE4EC] h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weeklyPmPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="bg-[#4A1525] h-full rounded-full"
                  />
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E5A6B]">✨ Skin Glow Rate</span>
                <div className="text-2xl font-black text-[#059669]">{weeklyPositivePct}%</div>
                <div className="w-full bg-[#E6F4EA] h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weeklyPositivePct}%` }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="bg-[#059669] h-full rounded-full"
                  />
                </div>
              </motion.div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#FFD1DC] shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#FFD1DC] pb-3">
                <div>
                  <h2 className="text-base font-serif-luxury font-bold text-[#4A1525]">Weekly Execution Matrix (%)</h2>
                  <p className="text-xs text-[#8E5A6B]">7-Day percentage breakdown of morning & evening skincare adherence</p>
                </div>
                <span className="text-xs font-bold text-[#FF69B4] bg-[#FFE4EC] px-3 py-1 rounded-full border border-[#FFD1DC]">
                  Week of {currentWeekDays[0]} to {currentWeekDays[6]}
                </span>
              </div>

              {/* Weekly Days Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                {currentWeekDays.map((dateStr, idx) => {
                  const dayLog = trackingLogs[dateStr] || { date: dateStr, stepStatuses: {}, notes: '', outcomeResult: 'unrecorded' };
                  const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNumber = new Date(dateStr).getDate();
                  const isSelected = dateStr === selectedDate;

                  const amDone = amSteps.filter((s) => dayLog.stepStatuses[s.id] === 'completed').length;
                  const pmDone = pmSteps.filter((s) => dayLog.stepStatuses[s.id] === 'completed').length;

                  const dayDone = amDone + pmDone;
                  const dayPct = totalRoutineStepsPerDay > 0 ? Math.round((dayDone / totalRoutineStepsPerDay) * 100) : 0;
                  const amPct = amSteps.length > 0 ? Math.round((amDone / amSteps.length) * 100) : 0;
                  const pmPct = pmSteps.length > 0 ? Math.round((pmDone / pmSteps.length) * 100) : 0;

                  return (
                    <motion.div
                      key={dateStr}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      whileHover={{ scale: 1.025, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setTimeframeView('daily');
                      }}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-[#FFE4EC] border-[#FF69B4] ring-2 ring-[#FF69B4] shadow-md'
                          : 'bg-white border-[#FFD1DC] hover:border-[#FF85B3]'
                      }`}
                    >
                      <div className="text-center pb-2 border-b border-[#FFD1DC] flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold uppercase text-[#8E5A6B]">{dayName}</div>
                          <div className="text-sm font-black text-[#4A1525]">{dayNumber}</div>
                        </div>
                        <div className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#FF69B4] text-white border border-[#FFD1DC] shadow-2xs">
                          {dayPct}%
                        </div>
                      </div>

                      <div className="space-y-1.5 text-center text-[10px]">
                        <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#FFE4EC]/70 border border-[#FFD1DC]">
                          <span className="text-[#8E5A6B] font-medium">☀️ AM</span>
                          <span className="font-extrabold text-[#FF69B4]">{amPct}%</span>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#FFE4EC]/70 border border-[#FFD1DC]">
                          <span className="text-[#8E5A6B] font-medium">🌙 PM</span>
                          <span className="font-extrabold text-[#4A1525]">{pmPct}%</span>
                        </div>
                      </div>

                      <div className="pt-1 text-center">
                        {dayLog.outcomeResult === 'positive' && (
                          <span className="inline-block px-2 py-0.5 bg-[#059669] text-white text-[10px] font-bold rounded-full shadow-2xs">
                            (+) Glow
                          </span>
                        )}
                        {dayLog.outcomeResult === 'negative' && (
                          <span className="inline-block px-2 py-0.5 bg-[#E11D48] text-white text-[10px] font-bold rounded-full shadow-2xs">
                            (-) Flare
                          </span>
                        )}
                        {dayLog.outcomeResult === 'neutral' && (
                          <span className="inline-block px-2 py-0.5 bg-[#4A1525] text-white text-[10px] font-bold rounded-full shadow-2xs">
                            (=) Calm
                          </span>
                        )}
                        {dayLog.outcomeResult === 'unrecorded' && (
                          <span className="inline-block text-[10px] text-[#8E5A6B] font-medium">No Log</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* VIEW 3: MONTHLY LOG & TRENDS (PERCENTAGE BASED) */}
      {timeframeView === 'monthly' && (() => {
        const amSteps = customSteps.filter((s) => s.timeOfDay === 'AM');
        const pmSteps = customSteps.filter((s) => s.timeOfDay === 'PM');
        const totalRoutineStepsPerDay = customSteps.length;

        let totalPossibleStepsMonth = currentMonthDays.length * totalRoutineStepsPerDay;
        let totalCompletedStepsMonth = 0;

        let amPossibleStepsMonth = currentMonthDays.length * amSteps.length;
        let amCompletedStepsMonth = 0;

        let pmPossibleStepsMonth = currentMonthDays.length * pmSteps.length;
        let pmCompletedStepsMonth = 0;

        let positiveDaysCount = 0;
        let loggedDaysCount = 0;

        currentMonthDays.forEach((d) => {
          const dayLog = trackingLogs[d];
          if (dayLog) {
            loggedDaysCount++;
            if (dayLog.outcomeResult === 'positive') positiveDaysCount++;

            customSteps.forEach((s) => {
              if (dayLog.stepStatuses[s.id] === 'completed') {
                totalCompletedStepsMonth++;
                if (s.timeOfDay === 'AM') amCompletedStepsMonth++;
                if (s.timeOfDay === 'PM') pmCompletedStepsMonth++;
              }
            });
          }
        });

        const monthlyOverallPct = totalPossibleStepsMonth > 0 ? Math.round((totalCompletedStepsMonth / totalPossibleStepsMonth) * 100) : 0;
        const monthlyAmPct = amPossibleStepsMonth > 0 ? Math.round((amCompletedStepsMonth / amPossibleStepsMonth) * 100) : 0;
        const monthlyPmPct = pmPossibleStepsMonth > 0 ? Math.round((pmCompletedStepsMonth / pmPossibleStepsMonth) * 100) : 0;
        const monthlyPositivePct = loggedDaysCount > 0 ? Math.round((positiveDaysCount / loggedDaysCount) * 100) : 0;

        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Monthly Performance Summary Bar in % */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div whileHover={{ y: -2 }} className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E5A6B]">Overall Monthly Adherence</span>
                <div className="text-2xl font-black text-[#FF69B4] flex items-center justify-between">
                  <span>{monthlyOverallPct}%</span>
                  <Sparkles className="w-4 h-4 text-[#FF69B4]" />
                </div>
                <div className="w-full bg-[#FFE4EC] h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${monthlyOverallPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] h-full rounded-full"
                  />
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E5A6B]">☀️ AM Morning Routine</span>
                <div className="text-2xl font-black text-[#FF85B3]">{monthlyAmPct}%</div>
                <div className="w-full bg-[#FFE4EC] h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${monthlyAmPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] h-full rounded-full"
                  />
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E5A6B]">🌙 PM Evening Routine</span>
                <div className="text-2xl font-black text-[#4A1525]">{monthlyPmPct}%</div>
                <div className="w-full bg-[#FFE4EC] h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${monthlyPmPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="bg-[#4A1525] h-full rounded-full"
                  />
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E5A6B]">✨ Skin Glow Rate</span>
                <div className="text-2xl font-black text-[#059669]">{monthlyPositivePct}%</div>
                <div className="w-full bg-[#E6F4EA] h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${monthlyPositivePct}%` }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="bg-[#059669] h-full rounded-full"
                  />
                </div>
              </motion.div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-[#FFD1DC] shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#FFD1DC] pb-3">
                <div>
                  <h2 className="text-base font-serif-luxury font-bold text-[#4A1525]">Monthly Routine Completion (%) Calendar</h2>
                  <p className="text-xs text-[#8E5A6B]">Daily adherence percentages calculated from recorded morning & evening execution</p>
                </div>
                <span className="text-xs font-bold text-[#FF69B4] bg-[#FFE4EC] px-3 py-1 rounded-full border border-[#FFD1DC]">
                  {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Monthly Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-2 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-[10px] font-bold uppercase text-[#8E5A6B] py-1">
                    {d}
                  </div>
                ))}

                {currentMonthDays.map((dateStr, idx) => {
                  const dayLog = trackingLogs[dateStr];
                  const dayNum = new Date(dateStr).getDate();
                  const isSelected = dateStr === selectedDate;

                  let dayDoneCount = 0;
                  if (dayLog) {
                    customSteps.forEach((s) => {
                      if (dayLog.stepStatuses[s.id] === 'completed') dayDoneCount++;
                    });
                  }
                  const dayPct = totalRoutineStepsPerDay > 0 ? Math.round((dayDoneCount / totalRoutineStepsPerDay) * 100) : 0;

                  let bgClass = 'bg-white text-[#4A1525] border-[#FFD1DC] hover:border-[#FF85B3]';
                  if (dayPct === 100) {
                    bgClass = 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white border-[#FF69B4] font-bold shadow-xs';
                  } else if (dayPct >= 50) {
                    bgClass = 'bg-[#FFE4EC] text-[#4A1525] border-[#FFD1DC] font-bold';
                  } else if (dayPct > 0) {
                    bgClass = 'bg-[#FFF5F5] text-[#9F1239] border-[#FECDD3] font-medium';
                  }

                  return (
                    <motion.button
                      key={dateStr}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: idx * 0.01 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setTimeframeView('daily');
                      }}
                      className={`p-2 rounded-2xl border text-xs transition flex flex-col items-center justify-between min-h-[58px] ${bgClass} ${
                        isSelected ? 'ring-2 ring-[#FF69B4] shadow-md' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between w-full text-[11px]">
                        <span className="font-extrabold">{dayNum}</span>
                        <span className="text-[9px] font-bold opacity-90">
                          {dayLog?.outcomeResult === 'positive' && '(+)'}
                          {dayLog?.outcomeResult === 'negative' && '(-)'}
                          {dayLog?.outcomeResult === 'neutral' && '(=)'}
                        </span>
                      </div>
                      <div className="text-[10px] font-black mt-1 px-1.5 py-0.5 rounded-full bg-black/10 text-current">
                        {dayPct}%
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* Add Custom Step Modal Dialog */}
      {showAddStepModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#FFD1DC] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#FFD1DC]">
              <h3 className="text-base font-bold text-[#4A1525]">Add Custom Skincare Step</h3>
              <button
                onClick={() => setShowAddStepModal(false)}
                className="text-[#8E5A6B] hover:text-[#FF69B4]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomStep} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#4A1525] mb-1">
                  Step Name *
                </label>
                <input
                  type="text"
                  value={newStepName}
                  onChange={(e) => setNewStepName(e.target.value)}
                  placeholder="e.g. Snail Mucin 96% Essence"
                  className="w-full px-3 py-2 rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4A1525] mb-1">
                    Time of Day
                  </label>
                  <select
                    value={newStepTime}
                    onChange={(e) => setNewStepTime(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none"
                  >
                    <option value="AM">Morning (AM)</option>
                    <option value="PM">Evening (PM)</option>
                    <option value="Both">Both AM & PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4A1525] mb-1">
                    Category
                  </label>
                  <select
                    value={newStepCategory}
                    onChange={(e) => setNewStepCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none"
                  >
                    <option value="Cleanser">Cleanser</option>
                    <option value="Toner/Essence">Toner/Essence</option>
                    <option value="Active/Serum">Active/Serum</option>
                    <option value="Eye Cream">Eye Cream</option>
                    <option value="Moisturizer">Moisturizer</option>
                    <option value="Sunscreen">Sunscreen</option>
                    <option value="Face Oil/Mask">Face Oil/Mask</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A1525] mb-1">
                  Product Name (Optional)
                </label>
                <input
                  type="text"
                  value={newStepProduct}
                  onChange={(e) => setNewStepProduct(e.target.value)}
                  placeholder="e.g. COSRX Advanced Snail 96"
                  className="w-full px-3 py-2 rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A1525] mb-1">
                  Active Ingredients (Optional)
                </label>
                <input
                  type="text"
                  value={newStepIngredients}
                  onChange={(e) => setNewStepIngredients(e.target.value)}
                  placeholder="e.g. Snail Secretion Filtrate, Sodium Hyaluronate"
                  className="w-full px-3 py-2 rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A1525] mb-1">
                  Application Tip (Optional)
                </label>
                <input
                  type="text"
                  value={newStepTip}
                  onChange={(e) => setNewStepTip(e.target.value)}
                  placeholder="e.g. Pat onto damp skin after toner."
                  className="w-full px-3 py-2 rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStepModal(false)}
                  className="px-3 py-1.5 text-xs text-[#8E5A6B] hover:text-[#4A1525]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] hover:opacity-90 text-white text-xs font-bold rounded-lg transition shadow-2xs"
                >
                  Save Step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
