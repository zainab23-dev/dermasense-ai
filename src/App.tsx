import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { AssessmentForm } from './components/AssessmentForm';
import { AnalysisResults } from './components/AnalysisResults';
import { IngredientConflictChecker } from './components/IngredientConflictChecker';
import { RoutineTracker } from './components/RoutineTracker';
import { SkinJournal } from './components/SkinJournal';
import { AuthView } from './components/AuthView';
import { UserSkinProfile, FullDermaAnalysisResponse, UserAccount } from './types';
import { getCurrentUser, logoutUser, getUserData, saveUserData } from './lib/authStore';
import { generateFallbackRoutine } from './lib/fallbackRoutine';
import { AlertCircle, Sparkles, Linkedin, Github } from 'lucide-react';

export default function App() {
  // Active Logged-In User State (Defaults to null so auth screen shows first)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());

  const [activeTab, setActiveTab] = useState<
    'assessment' | 'routine' | 'conflicts' | 'tracker' | 'journal' | 'auth'
  >(() => (getCurrentUser() ? 'assessment' : 'auth'));

  const [profile, setProfile] = useState<UserSkinProfile | null>(null);
  const [analysis, setAnalysis] = useState<FullDermaAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load user data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      const userData = getUserData(currentUser.id);
      if (userData.profile) setProfile(userData.profile);
      else setProfile(null);

      if (userData.analysisData) setAnalysis(userData.analysisData);
      else setAnalysis(null);
    } else {
      setProfile(null);
      setAnalysis(null);
    }
  }, [currentUser]);

  // Sync profile and analysis to user-scoped storage whenever they update
  useEffect(() => {
    if (currentUser && (profile || analysis)) {
      const currentData = getUserData(currentUser.id);
      saveUserData(currentUser.id, {
        ...currentData,
        profile: profile || currentData.profile,
        analysisData: analysis || currentData.analysisData,
      });
    }
  }, [profile, analysis, currentUser]);

  const handleAssessmentSubmit = async (userProfile: UserSkinProfile) => {
    setIsLoading(true);
    setErrorMsg(null);
    setProfile(userProfile);

    try {
      let analysisData: FullDermaAnalysisResponse | null = null;

      const response = await fetch('/api/analyze-skin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile),
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const resData = await response.json();
        if (resData.success && resData.data) {
          analysisData = resData.data;
        }
      } else {
        const rawText = await response.text();
        console.warn('API non-JSON response or route unavailable (using client synthesizer):', response.status, rawText.substring(0, 100));
      }

      // If server response couldn't be parsed or GEMINI_API_KEY isn't set on host, generate complete local routine
      if (!analysisData) {
        analysisData = generateFallbackRoutine(userProfile);
      }

      setAnalysis(analysisData);
      setActiveTab('routine');

      // Immediately save to current user vault
      if (currentUser) {
        const currentData = getUserData(currentUser.id);
        saveUserData(currentUser.id, {
          ...currentData,
          profile: userProfile,
          analysisData,
        });
      }
    } catch (err: any) {
      console.warn('Analysis network error, generating local routine fallback:', err);
      const fallback = generateFallbackRoutine(userProfile);
      setAnalysis(fallback);
      setActiveTab('routine');
      if (currentUser) {
        const currentData = getUserData(currentUser.id);
        saveUserData(currentUser.id, {
          ...currentData,
          profile: userProfile,
          analysisData: fallback,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoutine = () => {
    setAnalysis(null);
    setProfile(null);
    if (currentUser) {
      const currentData = getUserData(currentUser.id);
      saveUserData(currentUser.id, {
        profile: null,
        analysisData: null,
        journalLogs: currentData.journalLogs,
        trackingLogs: currentData.trackingLogs,
      });
    }
    setActiveTab('assessment');
  };

  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setActiveTab('assessment');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setProfile(null);
    setAnalysis(null);
    setActiveTab('auth');
  };

  // Social Links for footer
  const savedSocials = {
    linkedin: 'https://www.linkedin.com/in/zainab-asif-dev23/',
    github: 'https://github.com/zainab23-dev',
  };

  return (
    <div className="min-h-screen bg-[#FFF0F5] text-[#4A1525] font-sans antialiased flex flex-col selection:bg-[#FFD1DC] selection:text-[#FF69B4]">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasAnalysisData={!!analysis}
        currentUser={currentUser}
        onOpenAuth={() => setActiveTab('auth')}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto mb-6 p-4 bg-[#FFE4EC] border border-[#FF85B3] rounded-2xl flex items-center space-x-3 text-xs text-[#9F1239] shadow-sm"
            >
              <AlertCircle className="w-5 h-5 text-[#FF69B4] flex-shrink-0" />
              <div className="flex-1">
                <strong>Error:</strong> {errorMsg}
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-[#9F1239] hover:underline text-[11px] font-semibold"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!currentUser ? (
            <motion.div
              key="unauth"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <AuthView onSuccess={handleAuthSuccess} />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.995 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {activeTab === 'auth' && (
                <AuthView
                  onSuccess={handleAuthSuccess}
                  onCancel={() => setActiveTab('assessment')}
                />
              )}

              {activeTab === 'assessment' && (
                <AssessmentForm onSubmit={handleAssessmentSubmit} isLoading={isLoading} />
              )}

              {activeTab === 'routine' && (
                analysis && profile ? (
                  <AnalysisResults
                    data={analysis}
                    profile={profile}
                    onReset={() => setActiveTab('assessment')}
                    onNavigateToTracker={() => setActiveTab('tracker')}
                    onDelete={handleDeleteRoutine}
                  />
                ) : (
                  <div className="max-w-2xl mx-auto text-center py-16 space-y-4 bg-white/95 backdrop-blur-md rounded-3xl border border-[#FFD1DC] p-8 shadow-sm">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-12 h-12 bg-[#FFE4EC] text-[#FF69B4] rounded-2xl flex items-center justify-center mx-auto border border-[#FF85B3]/40 shadow-inner"
                    >
                      <Sparkles className="w-6 h-6 text-[#FF69B4]" />
                    </motion.div>
                    <h2 className="text-xl font-serif-luxury font-bold text-[#4A1525]">No Assessment Recorded Yet</h2>
                    <p className="text-xs text-[#8E5A6B] max-w-md mx-auto">
                      Please complete the Skin Assessment form to let DermaSense AI generate your tailored skincare routine and scientific diagnosis.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 8px 22px rgba(255, 105, 180, 0.35)" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveTab('assessment')}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      Go to Assessment Form
                    </motion.button>
                  </div>
                )
              )}

              {activeTab === 'conflicts' && <IngredientConflictChecker />}

              {activeTab === 'tracker' && (
                <RoutineTracker analysis={analysis} userId={currentUser.id} />
              )}

              {activeTab === 'journal' && (
                <SkinJournal userId={currentUser.id} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Integrated Baby Pink Theme Footer */}
      <footer className="border-t border-[#FFD1DC] bg-gradient-to-r from-[#FFF0F5] via-[#FFE4EC] to-[#FFF0F5] text-[#4A1525] py-7 mt-12 text-[11px] shadow-xs relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div>
            <p className="font-serif-luxury font-bold text-[#4A1525] text-xs sm:text-sm tracking-wide flex items-center gap-1.5">
              <span className="text-[#FF69B4]">DermaSense AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF85B3] inline-block"></span>
              <span className="font-medium text-[#8E5A6B]">Skincare Laboratory</span>
            </p>
            <p className="text-[#8E5A6B] text-[10px] mt-1 max-w-xl">
              Medical Disclaimer: Educational & routine optimization. Consult a board-certified dermatologist for clinical skin conditions.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-semibold">
            <motion.a
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              href={savedSocials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-white/80 hover:bg-white text-[#4A1525] px-3.5 py-1.5 rounded-xl border border-[#FFD1DC] shadow-2xs hover:border-[#FF85B3] transition-all"
            >
              <Linkedin className="w-3.5 h-3.5 text-[#FF69B4]" />
              <span>LinkedIn</span>
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              href={savedSocials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-white/80 hover:bg-white text-[#4A1525] px-3.5 py-1.5 rounded-xl border border-[#FFD1DC] shadow-2xs hover:border-[#FF85B3] transition-all"
            >
              <Github className="w-3.5 h-3.5 text-[#FF69B4]" />
              <span>GitHub</span>
            </motion.a>
          </div>
        </div>
      </footer>
    </div>
  );
}

