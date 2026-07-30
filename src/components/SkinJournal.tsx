import React, { useState, useEffect, useMemo } from 'react';
import { JournalLogEntry } from '../types';
import { BookOpen, Plus, Calendar, Trash2, TrendingUp, Sparkles, Activity, HeartHandshake, Smile, Meh, Frown } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface SkinJournalProps {
  userId?: string;
}

// Recharts YAxis custom tick renderer using clean text labels
const RenderYAxisLabelTick = (props: any) => {
  const { x, y, payload } = props;
  const val = payload.value;
  let label = 'Great';
  let color = '#FF69B4';
  if (val === 3) {
    label = 'Great';
    color = '#FF69B4';
  } else if (val === 2) {
    label = 'Fair';
    color = '#D97706';
  } else if (val === 1) {
    label = 'Irritated';
    color = '#E11D48';
  }

  return (
    <text x={x - 8} y={y + 4} textAnchor="end" fill={color} fontSize="11" fontWeight="700">
      {label}
    </text>
  );
};

// Default past month demo logs to ensure beautiful 30-day timeline right out of the box
const generateDefaultLogs = (): JournalLogEntry[] => {
  const today = new Date();
  const demoData: { daysAgo: number; barrierScore: number; skinFeeling: JournalLogEntry['skinFeeling']; sentiment: '😊' | '😐' | '🙁'; notes: string }[] = [
    { daysAgo: 0, barrierScore: 9, skinFeeling: 'Calm & Hydrated', sentiment: '😊', notes: 'Barrier feels super plump and glowing after overnight ceramide mask.' },
    { daysAgo: 1, barrierScore: 8, skinFeeling: 'Calm & Hydrated', sentiment: '😊', notes: 'Routine adhered to 100%. Niacinamide serum absorbed smoothly.' },
    { daysAgo: 2, barrierScore: 7, skinFeeling: 'Slight Redness', sentiment: '😐', notes: 'Slight redness on cheeks after cold wind exposure.' },
    { daysAgo: 3, barrierScore: 8, skinFeeling: 'Calm & Hydrated', sentiment: '😊', notes: 'Skin calm and hydrated today.' },
    { daysAgo: 4, barrierScore: 6, skinFeeling: 'Dry/Flaky', sentiment: '😐', notes: 'A bit dry around chin. Added extra layer of hyaluronic acid.' },
    { daysAgo: 5, barrierScore: 5, skinFeeling: 'Irritated/Stinging', sentiment: '🙁', notes: 'Tingling after Retinol application. Skipped active serums tonight.' },
    { daysAgo: 6, barrierScore: 6, skinFeeling: 'Slight Redness', sentiment: '😐', notes: 'Focusing on pure barrier repair cream.' },
    { daysAgo: 7, barrierScore: 7, skinFeeling: 'Calm & Hydrated', sentiment: '😊', notes: 'Redness calmed down significantly.' },
    { daysAgo: 10, barrierScore: 8, skinFeeling: 'Calm & Hydrated', sentiment: '😊', notes: 'Great hydration balance.' },
    { daysAgo: 14, barrierScore: 6, skinFeeling: 'Active Purging', sentiment: '😐', notes: 'Small bumps on forehead - normal purging phase.' },
    { daysAgo: 18, barrierScore: 7, skinFeeling: 'Calm & Hydrated', sentiment: '😊', notes: 'Purging cleared up.' },
    { daysAgo: 22, barrierScore: 8, skinFeeling: 'Calm & Hydrated', sentiment: '😊', notes: 'Skin texture feels smoother.' },
    { daysAgo: 26, barrierScore: 5, skinFeeling: 'Dry/Flaky', sentiment: '🙁', notes: 'Dry weather spell in city.' },
    { daysAgo: 29, barrierScore: 7, skinFeeling: 'Calm & Hydrated', sentiment: '😊', notes: 'Baseline assessment recorded.' },
  ];

  return demoData.map((d, idx) => {
    const logDate = new Date(today);
    logDate.setDate(today.getDate() - d.daysAgo);
    return {
      id: `demo_${idx}_${logDate.getTime()}`,
      date: logDate.toISOString().split('T')[0],
      barrierScore: d.barrierScore,
      skinFeeling: d.skinFeeling,
      sentiment: d.sentiment,
      amCompleted: true,
      pmCompleted: true,
      notes: d.notes,
    };
  });
};

export const SkinJournal: React.FC<SkinJournalProps> = ({ userId = 'guest' }) => {
  const journalKey = `dermasense_user_${userId}_journal_logs`;

  const [logs, setLogs] = useState<JournalLogEntry[]>(() => {
    const saved = localStorage.getItem(journalKey) || localStorage.getItem('dermasense_journal_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return generateDefaultLogs();
  });

  // Reload when userId changes
  useEffect(() => {
    const saved = localStorage.getItem(`dermasense_user_${userId}_journal_logs`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setLogs(parsed);
      } catch (e) {}
    } else {
      setLogs(generateDefaultLogs());
    }
  }, [userId]);

  // Persist to user-scoped key
  useEffect(() => {
    localStorage.setItem(journalKey, JSON.stringify(logs));
  }, [logs, journalKey]);

  // Input states
  const [newScore, setNewScore] = useState<number>(8);
  const [newFeeling, setNewFeeling] = useState<JournalLogEntry['skinFeeling']>('Calm & Hydrated');
  const [newSentiment, setNewSentiment] = useState<'😊' | '😐' | '🙁'>('😊');
  const [newNotes, setNewNotes] = useState<string>('');

  // Timeline view range filter
  const [timelineRangeDays, setTimelineRangeDays] = useState<7 | 14 | 30>(30);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];

    // Remove existing log for today if user is updating today's log
    const filteredLogs = logs.filter((l) => l.date !== todayStr);

    const entry: JournalLogEntry = {
      id: Date.now().toString(),
      date: todayStr,
      barrierScore: newScore,
      skinFeeling: newFeeling,
      sentiment: newSentiment,
      amCompleted: true,
      pmCompleted: true,
      notes: newNotes.trim() || 'Daily skin condition logged.',
    };

    setLogs([entry, ...filteredLogs]);
    setNewNotes('');
  };

  const handleDeleteLog = (id: string) => {
    setLogs(logs.filter((l) => l.id !== id));
  };

  // Helper to resolve numerical value for sentiment (Great = 3, Fair = 2, Irritated = 1)
  const getSentimentValue = (sentiment?: '😊' | '😐' | '🙁', skinFeeling?: string, barrierScore?: number): number => {
    if (sentiment === '😊') return 3;
    if (sentiment === '😐') return 2;
    if (sentiment === '🙁') return 1;

    // Fallback inference if missing
    if (skinFeeling === 'Calm & Hydrated' || (barrierScore && barrierScore >= 8)) return 3;
    if (skinFeeling === 'Irritated/Stinging' || (barrierScore && barrierScore <= 4)) return 1;
    return 2;
  };

  const getSentimentText = (val: number): string => {
    if (val >= 2.6) return 'Great / Glowing';
    if (val >= 1.8) return 'Fair / Neutral';
    return 'Irritated / Low';
  };

  // Build continuous timeline chart data
  const chartData = useMemo(() => {
    const result = [];
    const today = new Date();
    const logMap = new Map<string, JournalLogEntry>();
    
    logs.forEach((log) => {
      logMap.set(log.date, log);
    });

    let lastKnownSentimentVal = 2.5;

    for (let i = timelineRangeDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const shortLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const entry = logMap.get(dateStr);

      if (entry) {
        const val = getSentimentValue(entry.sentiment, entry.skinFeeling, entry.barrierScore);
        lastKnownSentimentVal = val;
        result.push({
          date: dateStr,
          displayDate: shortLabel,
          moodValue: val,
          barrierScore: entry.barrierScore,
          skinFeeling: entry.skinFeeling,
          notes: entry.notes,
          hasUserLog: true,
        });
      } else {
        // Interpolated baseline curve point
        const interpolatedVal = Math.max(1, Math.min(3, lastKnownSentimentVal + (Math.sin(i * 0.8) * 0.2)));
        result.push({
          date: dateStr,
          displayDate: shortLabel,
          moodValue: Number(interpolatedVal.toFixed(1)),
          barrierScore: Math.round(interpolatedVal * 3),
          skinFeeling: interpolatedVal >= 2.5 ? 'Calm & Hydrated' : 'Slight Redness',
          notes: 'No direct entry logged for this day.',
          hasUserLog: false,
        });
      }
    }
    return result;
  }, [logs, timelineRangeDays]);

  // Analytics Metrics
  const validLoggedCount = logs.length;
  const positiveCount = logs.filter((l) => getSentimentValue(l.sentiment, l.skinFeeling, l.barrierScore) === 3).length;
  const positivePercentage = validLoggedCount > 0 ? Math.round((positiveCount / validLoggedCount) * 100) : 100;

  const avgBarrierScore = validLoggedCount > 0
    ? (logs.reduce((acc, l) => acc + l.barrierScore, 0) / validLoggedCount).toFixed(1)
    : '8.0';

  // Custom Recharts Tooltip Component
  const CustomMoodTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#4A1525] text-white p-3.5 rounded-2xl shadow-xl border border-[#FFD1DC] text-xs space-y-1.5 max-w-xs">
          <div className="flex items-center justify-between border-b border-white/20 pb-1.5 gap-3">
            <span className="font-bold text-[#FFD1DC]">{data.date}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FF85B3] text-white">
              {data.hasUserLog ? 'User Logged Entry' : 'Estimated Trend'}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-sm pt-0.5">
            <span className="font-bold text-white">
              {getSentimentText(data.moodValue)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#FFE4EC]">
            <span>Barrier Score:</span>
            <span className="font-bold text-[#FFD1DC]">{data.barrierScore}/10</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#FFE4EC]">
            <span>Skin Feeling:</span>
            <span className="font-semibold">{data.skinFeeling}</span>
          </div>

          {data.notes && (
            <p className="text-[11px] text-[#FFE4EC]/80 italic border-t border-white/10 pt-1.5 mt-1 line-clamp-2">
              "{data.notes}"
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Title Banner */}
      <div className="bg-gradient-to-r from-[#FF85B3] via-[#FF69B4] to-[#4A1525] text-white rounded-2xl p-6 sm:p-7 shadow-2xs">
        <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-white/15 text-[#FFE4EC] text-xs font-semibold mb-3 border border-white/20">
          <BookOpen className="w-3.5 h-3.5 text-[#FFD1DC]" />
          <span>Epidermal Barrier & Sentiment Diary</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Skin Journal & Mood Timeline</h1>
        <p className="mt-2 text-[#FFE4EC] text-xs sm:text-sm leading-relaxed max-w-2xl">
          Track daily skin mood sentiment (Great, Fair, Irritated) mapped onto a smooth, color-coded wave chart over the past month. Detect barrier damage recovery trends at a glance.
        </p>
      </div>

      {/* Analytics High-Level Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E5A6B]">Monthly Mood Glow Rate</span>
          <div className="text-2xl font-black text-[#FF69B4] flex items-center justify-between">
            <span>{positivePercentage}%</span>
            <Sparkles className="w-4 h-4 text-[#FF85B3]" />
          </div>
          <p className="text-[11px] text-[#8E5A6B]">Positive / Glowing Days</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E5A6B]">Avg Barrier Score</span>
          <div className="text-2xl font-black text-[#4A1525]">{avgBarrierScore} / 10</div>
          <p className="text-[11px] text-[#8E5A6B]">Epidermal Resilience</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E5A6B]">Recorded Entries</span>
          <div className="text-2xl font-black text-[#FF85B3]">{validLoggedCount}</div>
          <p className="text-[11px] text-[#8E5A6B]">Log Journal Days</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E5A6B]">Current Trend</span>
          <div className="text-sm font-bold text-[#059669] flex items-center space-x-1 mt-1">
            <Activity className="w-4 h-4 text-[#059669]" />
            <span>Barrier Restored</span>
          </div>
          <p className="text-[11px] text-[#8E5A6B]">Low Inflammatory Risk</p>
        </div>
      </div>

      {/* 30-Day Mood Wave Chart Container */}
      <div className="bg-white rounded-2xl border border-[#FFD1DC] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#FFD1DC] pb-3.5">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#FF69B4]" />
              <h2 className="text-sm font-bold text-[#4A1525]">Skin Mood Trend Wave</h2>
            </div>
            <div className="text-xs text-[#8E5A6B] mt-1 flex items-center flex-wrap gap-1.5">
              <span>Daily sentiment mapping:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#FF69B4]">
                Great (Top)
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#D97706]">
                Fair (Mid)
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#E11D48]">
                Irritated (Bottom)
              </span>
            </div>
          </div>

          {/* Timeframe selector pills */}
          <div className="flex items-center space-x-1 bg-[#FFE4EC] p-1 rounded-xl border border-[#FFD1DC]">
            <button
              type="button"
              onClick={() => setTimelineRangeDays(7)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                timelineRangeDays === 7
                  ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white shadow-2xs'
                  : 'text-[#4A1525] hover:text-[#FF69B4]'
              }`}
            >
              Past 7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimelineRangeDays(14)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                timelineRangeDays === 14
                  ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white shadow-2xs'
                  : 'text-[#4A1525] hover:text-[#FF69B4]'
              }`}
            >
              Past 14 Days
            </button>
            <button
              type="button"
              onClick={() => setTimelineRangeDays(30)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                timelineRangeDays === 30
                  ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white shadow-2xs'
                  : 'text-[#4A1525] hover:text-[#FF69B4]'
              }`}
            >
              Past 30 Days
            </button>
          </div>
        </div>

        {/* Legend Indicator */}
        <div className="flex items-center justify-end space-x-5 text-xs font-semibold text-[#8E5A6B]">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF69B4]"></span>
            <span>Great (3.0)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]"></span>
            <span>Fair (2.0)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]"></span>
            <span>Irritated (1.0)</span>
          </span>
        </div>

        {/* Smooth Color-Coded Wave Chart */}
        <div className="w-full h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="skinMoodWaveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF69B4" stopOpacity={0.85} />
                  <stop offset="50%" stopColor="#FBBF24" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.25} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 10, fill: '#8E5A6B', fontWeight: 600 }}
                axisLine={{ stroke: '#FFD1DC' }}
                tickLine={false}
              />
              <YAxis
                domain={[0.8, 3.2]}
                ticks={[1, 2, 3]}
                tick={<RenderYAxisLabelTick />}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomMoodTooltip />} />

              <ReferenceLine y={2} stroke="#FFD1DC" strokeDasharray="3 3" />

              <Area
                type="monotone"
                dataKey="moodValue"
                stroke="#FF69B4"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#skinMoodWaveGradient)"
                activeDot={{ r: 6, fill: '#FF85B3', stroke: '#4A1525', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Log Input Card */}
      <form onSubmit={handleAddLog} className="bg-white rounded-2xl border border-[#FFD1DC] p-6 sm:p-7 shadow-2xs space-y-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#4A1525] flex items-center space-x-2">
          <Plus className="w-4 h-4 text-[#FF69B4]" />
          <span>Log Today's Skin Condition & Mood Sentiment</span>
        </h2>

        {/* Daily Sentiment Picker Pills */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-[#4A1525] mb-2">
            1. Daily Skin Sentiment Mood
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setNewSentiment('😊')}
              className={`p-3 rounded-xl border text-center transition flex flex-col items-center space-y-1.5 ${
                newSentiment === '😊'
                  ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white border-[#FF85B3] shadow-2xs'
                  : 'bg-white border-[#FFD1DC] text-[#4A1525] hover:bg-[#FFE4EC]'
              }`}
            >
              <Smile className="w-6 h-6" />
              <span className="text-xs font-bold">Great / Glowing</span>
            </button>

            <button
              type="button"
              onClick={() => setNewSentiment('😐')}
              className={`p-3 rounded-xl border text-center transition flex flex-col items-center space-y-1.5 ${
                newSentiment === '😐'
                  ? 'bg-[#FBBF24] text-white border-[#FBBF24] shadow-2xs'
                  : 'bg-white border-[#FFD1DC] text-[#4A1525] hover:bg-[#FFE4EC]'
              }`}
            >
              <Meh className="w-6 h-6" />
              <span className="text-xs font-bold">Fair / Neutral</span>
            </button>

            <button
              type="button"
              onClick={() => setNewSentiment('🙁')}
              className={`p-3 rounded-xl border text-center transition flex flex-col items-center space-y-1.5 ${
                newSentiment === '🙁'
                  ? 'bg-[#F43F5E] text-white border-[#F43F5E] shadow-2xs'
                  : 'bg-white border-[#FFD1DC] text-[#4A1525] hover:bg-[#FFE4EC]'
              }`}
            >
              <Frown className="w-6 h-6" />
              <span className="text-xs font-bold">Irritated / Low</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#4A1525] mb-2">
              2. Skin Barrier Comfort Score ({newScore}/10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={newScore}
              onChange={(e) => setNewScore(parseInt(e.target.value))}
              className="w-full accent-[#FF69B4] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[#8E5A6B] font-medium mt-1">
              <span>1 - Compromised</span>
              <span>5 - Neutral</span>
              <span>10 - Resilient</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#4A1525] mb-2">
              3. Primary Sensation
            </label>
            <select
              value={newFeeling}
              onChange={(e) => setNewFeeling(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none"
            >
              <option value="Calm & Hydrated">Calm & Hydrated</option>
              <option value="Slight Redness">Slight Redness</option>
              <option value="Dry/Flaky">Dry/Flaky</option>
              <option value="Active Purging">Active Purging (Small bumps in usual spots)</option>
              <option value="Irritated/Stinging">Irritated / Stinging (Barrier Warning)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-[#4A1525] mb-2">
            4. Notes / Observations
          </label>
          <textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Started Retinol 0.25% tonight; skin feels calm after ceramide cream..."
            className="w-full px-3 py-2 rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-1 focus:ring-[#FF69B4] outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] hover:opacity-90 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-2xs flex items-center justify-center space-x-2"
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Save Daily Skin Mood Log</span>
        </button>
      </form>

      {/* Logs History */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#4A1525]">Journal History ({logs.length})</h2>
        {logs.length === 0 ? (
          <p className="text-xs text-[#8E5A6B] italic">No logs recorded yet.</p>
        ) : (
          logs.map((log) => {
            const sentimentVal = getSentimentValue(log.sentiment, log.skinFeeling, log.barrierScore);
            return (
              <div key={log.id} className="p-4 sm:p-5 bg-white rounded-2xl border border-[#FFD1DC] shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-[#FF69B4]" />
                    <span className="text-xs font-bold text-[#4A1525]">{log.date}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFE4EC] text-[#FF69B4] border border-[#FFD1DC]">
                      {getSentimentText(sentimentVal)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFE4EC] text-[#4A1525] border border-[#FFD1DC]">
                      Barrier: {log.barrierScore}/10
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="text-[#8E5A6B] hover:text-[#E11D48] transition"
                    title="Delete log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                      log.skinFeeling === 'Calm & Hydrated'
                        ? 'bg-[#FFE4EC] text-[#FF69B4] border-[#FFD1DC]'
                        : log.skinFeeling === 'Irritated/Stinging'
                        ? 'bg-[#FFF5F5] text-[#E11D48] border-[#FECDD3]'
                        : 'bg-[#FFF5F5] text-[#9F1239] border-[#FECDD3]'
                    }`}
                  >
                    {log.skinFeeling}
                  </span>
                </div>

                <p className="text-xs text-[#4A1525] leading-relaxed bg-[#FFE4EC]/40 p-2.5 rounded-lg border border-[#FFD1DC]">
                  {log.notes}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
