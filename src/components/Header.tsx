import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShieldAlert, User, LogOut, LogIn, ChevronDown, UserCheck } from 'lucide-react';
import { UserAccount } from '../types';

interface HeaderProps {
  activeTab: 'assessment' | 'routine' | 'conflicts' | 'tracker' | 'journal' | 'auth';
  setActiveTab: (tab: 'assessment' | 'routine' | 'conflicts' | 'tracker' | 'journal' | 'auth') => void;
  hasAnalysisData: boolean;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasAnalysisData,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/92 backdrop-blur-md border-b border-[#FFD1DC] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setActiveTab('assessment')}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-[#FF85B3] to-[#FF69B4] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md border border-[#FFD1DC]">
              <span>D+</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-serif-luxury font-bold text-[#4A1525] tracking-tight">DermaSense</span>
                <span className="text-xl font-light text-[#FF69B4]">AI</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFE4EC] text-[#FF69B4] border border-[#FF85B3]/40 shadow-2xs">
                  LABS <Sparkles className="w-2.5 h-2.5 ml-1 text-[#FF69B4] animate-pulse" />
                </span>
              </div>
              <p className="text-[11px] text-[#8E5A6B] font-medium hidden sm:block">Minimal Skincare Routine & Ingredient Intelligence</p>
            </div>
          </motion.div>

          {/* Navigation Tabs (Only visible when user is logged in) */}
          {currentUser && (
            <nav className="hidden md:flex items-center space-x-1 bg-[#FFE4EC]/60 p-1 rounded-2xl border border-[#FFD1DC]">
              {[
                { id: 'assessment', label: 'Skin Assessment' },
                { id: 'routine', label: 'Custom Routine', badge: hasAnalysisData },
                { id: 'conflicts', label: 'Ingredient Checker' },
                { id: 'tracker', label: 'Daily Tracker' },
                { id: 'journal', label: 'Barrier Journal' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white shadow-xs border border-[#FF85B3]'
                        : 'text-[#4A1525]/80 hover:text-[#FF69B4] hover:bg-white/80'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="w-2 h-2 rounded-full bg-[#FF69B4] animate-ping"></span>
                    )}
                  </motion.button>
                );
              })}
            </nav>
          )}

          {/* Account Profile, Social Links & Safety Notice Buttons */}
          <div className="flex items-center space-x-2">
            {/* User Account Controls */}
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 p-1.5 pr-2.5 rounded-xl border border-[#FFD1DC] bg-[#FFE4EC]/50 hover:bg-[#FFE4EC] transition shadow-2xs"
                >
                  <div className={`w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center ${currentUser.avatarColor || 'bg-[#FF85B3]'}`}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-bold text-[#4A1525] leading-none">{currentUser.name}</div>
                    <div className="text-[10px] text-[#8E5A6B] mt-0.5 truncate max-w-[120px]">{currentUser.skinGoal || 'Active Vault'}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#FF85B3]" />
                </button>

                {/* Account Dropdown Menu */}
                {showUserDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#FFD1DC] p-2 space-y-1 z-50"
                  >
                    <div className="p-2.5 bg-[#FFE4EC] rounded-xl border border-[#FFD1DC]">
                      <p className="text-xs font-bold text-[#4A1525]">{currentUser.name}</p>
                      <p className="text-[10px] text-[#8E5A6B] truncate">{currentUser.email}</p>
                      {currentUser.skinGoal && (
                        <p className="text-[10px] text-[#FF69B4] font-semibold mt-1">Goal: {currentUser.skinGoal}</p>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenAuth();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-[#4A1525] hover:bg-[#FFE4EC] rounded-xl flex items-center space-x-2 transition"
                    >
                      <UserCheck className="w-4 h-4 text-[#FF85B3]" />
                      <span>Switch / Manage Accounts</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-[#E11D48] hover:bg-[#FFF5F5] rounded-xl flex items-center space-x-2 transition"
                    >
                      <LogOut className="w-4 h-4 text-[#E11D48]" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 8px 22px rgba(255, 105, 180, 0.35)" }}
                whileTap={{ scale: 0.96 }}
                onClick={onOpenAuth}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] hover:opacity-90 rounded-xl transition shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </motion.button>
            )}

            <button
              onClick={() => setShowDisclaimerModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-[#8E5A6B] bg-[#FFE4EC] hover:bg-[#FFD1DC]/60 rounded-xl border border-[#FFD1DC] transition"
              title="Medical Safety Protocol"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF85A1]" />
              <span className="hidden sm:inline">Safety Notice</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs (Only visible when logged in) */}
        {currentUser && (
          <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-[#FFD1DC] no-scrollbar">
            <button
              onClick={() => setActiveTab('assessment')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeTab === 'assessment' ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white' : 'bg-[#FFE4EC] text-[#4A1525]'
              }`}
            >
              Assessment
            </button>
            <button
              onClick={() => setActiveTab('routine')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                activeTab === 'routine' ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white' : 'bg-[#FFE4EC] text-[#4A1525]'
              }`}
            >
              <span>Custom Routine</span>
              {hasAnalysisData && <span className="w-1.5 h-1.5 rounded-full bg-[#FFD1DC]"></span>}
            </button>
            <button
              onClick={() => setActiveTab('conflicts')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeTab === 'conflicts' ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white' : 'bg-[#FFE4EC] text-[#4A1525]'
              }`}
            >
              Ingredient Checker
            </button>
            <button
              onClick={() => setActiveTab('tracker')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeTab === 'tracker' ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white' : 'bg-[#FFE4EC] text-[#4A1525]'
              }`}
            >
              Daily Tracker
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeTab === 'journal' ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white' : 'bg-[#FFE4EC] text-[#4A1525]'
              }`}
            >
              Barrier Journal
            </button>
            <button
              onClick={() => setActiveTab('auth')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold ${
                activeTab === 'auth' ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white' : 'bg-[#FFE4EC] text-[#4A1525]'
              }`}
            >
              Account / Auth
            </button>
          </div>
        )}
      </div>


      {/* Medical Disclaimer Quick Dialog */}
      {showDisclaimerModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#FFD1DC]">
            <div className="flex items-start space-x-3 text-[#4A1525]">
              <ShieldAlert className="w-6 h-6 flex-shrink-0 mt-0.5 text-[#FF69B4]" />
              <div>
                <h3 className="text-base font-bold text-[#4A1525]">Safety Protocol & Educational Notice</h3>
                <p className="mt-2 text-xs text-[#4A1525] leading-relaxed">
                  <strong>DermaSense AI</strong> provides educational advice and routine guidance, not medical diagnosis.
                </p>
                <p className="mt-2 text-xs text-[#8E5A6B] leading-relaxed">
                  For severe acne, persistent eczema, suspicious moles, or acute barrier damage, consult a board-certified dermatologist.
                </p>
                <div className="mt-4 p-3 bg-[#FFE4EC] rounded-lg border border-[#FFD1DC] text-xs text-[#4A1525]">
                  <strong>Pregnancy Safety Guardrail:</strong> If marked pregnant/breastfeeding, retinoids, hydroquinone, and high-concentration salicylic acid are strictly excluded.
                </div>
              </div>
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowDisclaimerModal(false)}
                className="px-4 py-2 bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
