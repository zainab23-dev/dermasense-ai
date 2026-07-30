import React, { useState } from 'react';
import { UserAccount } from '../types';
import { loginUser, registerUser, DEMO_USERS } from '../lib/authStore';
import {
  Lock,
  Mail,
  User,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Heart,
  Layers,
  Dna,
} from 'lucide-react';

interface AuthViewProps {
  onSuccess: (user: UserAccount) => void;
  onCancel?: () => void;
  initialMode?: 'login' | 'register';
}

const AVATAR_COLORS = [
  { label: 'Rose Pink', class: 'bg-[#FF85B3]' },
  { label: 'Deep Pink', class: 'bg-[#FF69B4]' },
  { label: 'Emerald', class: 'bg-emerald-600' },
  { label: 'Amber', class: 'bg-amber-600' },
  { label: 'Purple', class: 'bg-purple-600' },
];

export const AuthView: React.FC<AuthViewProps> = ({
  onSuccess,
  onCancel,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [skinGoal, setSkinGoal] = useState('Acne & Barrier Repair');
  const [avatarColor, setAvatarColor] = useState('bg-[#FF85B3]');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleQuickDemoLogin = (demoEmail: string, demoPass: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setEmail(demoEmail);
    setPassword(demoPass);
    const res = loginUser(demoEmail, demoPass);
    if (res.success && res.user) {
      setSuccessMsg(`Welcome back, ${res.user.name}!`);
      setTimeout(() => onSuccess(res.user!), 500);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setErrorMsg('Please enter both email and password.');
        return;
      }
      const res = loginUser(email, password);
      if (res.success && res.user) {
        setSuccessMsg(`Welcome back, ${res.user.name}!`);
        setTimeout(() => onSuccess(res.user!), 500);
      } else {
        setErrorMsg(res.message);
      }
    } else {
      if (!name.trim() || !email.trim() || !password) {
        setErrorMsg('Please fill in all required fields.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      const res = registerUser(name, email, password, avatarColor, skinGoal);
      if (res.success && res.user) {
        setSuccessMsg(`Account created successfully for ${res.user.name}! Please enter your password to sign in.`);
        setPassword('');
        setMode('login');
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4">
      <div className="bg-white rounded-3xl border border-[#FFD1DC] shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Side: Modern Visual Banner */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#FF85B3] via-[#FF69B4] to-[#4A1525] text-white p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
          <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 text-[#FFE4EC] text-xs font-semibold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD1DC]" />
              <span>Personal Dermasense Vault</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {mode === 'login' ? 'Welcome Back to Your Skin Vault' : 'Join DermaSense AI'}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#FFE4EC] leading-relaxed">
                Unlock isolated personal profiles, saved morning & evening routines, ingredient collision checks, and barrier journals.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3 text-xs text-white/90">
                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Dna className="w-3.5 h-3.5 text-[#FFD1DC]" />
                </div>
                <span>Isolated data profile per user account</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-white/90">
                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FFD1DC]" />
                </div>
                <span>Custom active ingredient safety guardrails</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-white/90">
                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-3.5 h-3.5 text-[#FFD1DC]" />
                </div>
                <span>Daily skin barrier & tracking log history</span>
              </div>
            </div>
          </div>

          {/* Demo Login Quick Switcher Banner */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/20 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#FFE4EC]">
              Instant Demo Accounts:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(demo.email, demo.passwordHash)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium border border-white/20 transition flex items-center space-x-1"
                >
                  <span className={`w-2 h-2 rounded-full ${demo.avatarColor}`}></span>
                  <span>{demo.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Form & Controls */}
        <div className="md:col-span-7 p-7 sm:p-9 flex flex-col justify-between bg-white">
          <div>
            {/* Header Mode Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-[#FFD1DC] pb-4 mb-6">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    mode === 'login'
                      ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white shadow-xs'
                      : 'text-[#4A1525] bg-[#FFE4EC] hover:bg-[#FFE4EC]/80'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    mode === 'register'
                      ? 'bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] text-white shadow-xs'
                      : 'text-[#4A1525] bg-[#FFE4EC] hover:bg-[#FFE4EC]/80'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {onCancel && (
                <button
                  onClick={onCancel}
                  className="text-xs text-[#8E5A6B] hover:text-[#FF69B4] font-semibold"
                >
                  Continue as Guest
                </button>
              )}
            </div>

            {/* Error or Success Alert */}
            {errorMsg && (
              <div className="mb-5 p-3.5 bg-[#FFF5F5] border border-[#FECDD3] rounded-xl flex items-center space-x-2 text-xs text-[#9F1239]">
                <AlertCircle className="w-4 h-4 text-[#E11D48] flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center space-x-2 text-xs text-[#166534]">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#4A1525] mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#8E5A6B] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Dr. Maya Lin"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-2 focus:ring-[#FF69B4] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#4A1525] mb-1">
                        Primary Skin Goal
                      </label>
                      <input
                        type="text"
                        value={skinGoal}
                        onChange={(e) => setSkinGoal(e.target.value)}
                        placeholder="e.g. Barrier Recovery & Hydration"
                        className="w-full px-3 py-2 rounded-xl border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-2 focus:ring-[#FF69B4] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#4A1525] mb-1">
                        Profile Avatar Color
                      </label>
                      <div className="flex items-center space-x-1.5 pt-1">
                        {AVATAR_COLORS.map((c) => (
                          <button
                            key={c.class}
                            type="button"
                            onClick={() => setAvatarColor(c.class)}
                            className={`w-6 h-6 rounded-full ${c.class} transition ${
                              avatarColor === c.class ? 'ring-2 ring-offset-1 ring-[#FF69B4] scale-110' : 'opacity-70 hover:opacity-100'
                            }`}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-[#4A1525] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8E5A6B] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-2 focus:ring-[#FF69B4] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A1525] mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#8E5A6B] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-[#FFD1DC] text-xs text-[#4A1525] focus:ring-2 focus:ring-[#FF69B4] outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#8E5A6B] hover:text-[#FF69B4]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#FF85B3] to-[#FF69B4] hover:opacity-90 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center space-x-2 mt-2"
              >
                <span>{mode === 'login' ? 'Sign In to Account' : 'Register New Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick Help Footer */}
          <div className="pt-4 border-t border-[#FFD1DC] mt-6 flex items-center justify-between text-[11px] text-[#8E5A6B]">
            <span>DermaSense AI Multi-User Security</span>
            <div className="flex items-center space-x-1">
              <Lock className="w-3 h-3 text-[#FF69B4]" />
              <span className="font-semibold text-[#4A1525]">Private Storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
