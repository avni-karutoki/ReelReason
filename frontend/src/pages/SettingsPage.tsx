import React, { useState } from 'react';
import {
  User,
  Sparkles,
  Palette,
  Sliders,
  Sun,
  Moon,
  Monitor,
  AlertTriangle,
  Save,
  RotateCcw,
  Upload,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Zap,
  Instagram,
  Youtube,
  Facebook,
  Linkedin
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { SubtitleStyle, TargetPlatform, ClipCategory } from '../types';
import { AVATAR_CREATOR_IMG } from '../data/mockData';
import { isBackendAvailable, updateProfile } from '../api/client';
import { ensureBackendProbed } from '../api/realMode';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const {
    userSettings,
    updateUserSettings,
    theme,
    setTheme,
    deleteAllProjects,
    resetToMockData
  } = useProjects();
  const { isAuthenticated, isGuest } = useAuth();

  // Form State initialized from userSettings
  const [displayName, setDisplayName] = useState(userSettings.displayName);
  const [email, setEmail] = useState(userSettings.email);
  const [creatorHandle, setCreatorHandle] = useState(userSettings.creatorHandle);
  const [brandColor, setBrandColor] = useState(userSettings.brandColor);
  const [fontPreference, setFontPreference] = useState(userSettings.fontPreference);
  const [watermarkEnabled, setWatermarkEnabled] = useState(userSettings.watermarkEnabled);
  const [defaultSubtitleStyle, setDefaultSubtitleStyle] = useState<SubtitleStyle>(userSettings.defaultSubtitleStyle);
  
  const [defaultPlatform, setDefaultPlatform] = useState<TargetPlatform>(userSettings.defaultPlatform);
  const [defaultAudience, setDefaultAudience] = useState(userSettings.defaultAudience);
  const [defaultTone, setDefaultTone] = useState(userSettings.defaultTone);
  const [preferredClipTypes, setPreferredClipTypes] = useState<ClipCategory[]>(userSettings.preferredClipTypes);
  const [defaultNumberClips, setDefaultNumberClips] = useState(userSettings.defaultNumberClips);

  const [confirmDeleteAllModal, setConfirmDeleteAllModal] = useState(false);

  const availableCategories: ClipCategory[] = [
    'Strong Opinion',
    'Practical Lesson',
    'Unexpected Story',
    'Framework Breakdown',
    'Counter-Intuitive Truth'
  ];

  const toggleCategory = (cat: ClipCategory) => {
    setPreferredClipTypes(prev => {
      if (prev.includes(cat)) {
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== cat);
      }
      return [...prev, cat];
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserSettings({
      displayName,
      email,
      creatorHandle,
      brandColor,
      fontPreference,
      watermarkEnabled,
      defaultSubtitleStyle,
      defaultPlatform,
      defaultAudience,
      defaultTone,
      preferredClipTypes,
      defaultNumberClips
    });
    toast.success('Settings saved to local storage');

    // Sync creator preferences to the authenticated backend profile
    if (isAuthenticated && !isGuest) {
      const platformLabel = defaultPlatform === 'reels' ? 'Instagram Reels'
        : defaultPlatform === 'shorts' ? 'YouTube Shorts'
        : defaultPlatform === 'facebook_reels' ? 'Facebook Reels'
        : 'LinkedIn';
      const categoryToBackend: Record<ClipCategory, string> = {
        'Strong Opinion': 'strong_opinion',
        'Practical Lesson': 'practical_lesson',
        'Unexpected Story': 'story',
        'Framework Breakdown': 'insight',
        'Counter-Intuitive Truth': 'contrarian_take'
      };
      ensureBackendProbed(isBackendAvailable).then(up => {
        if (!up) return;
        updateProfile({
          name: displayName,
          default_platform: platformLabel,
          default_audience: defaultAudience,
          default_tone: defaultTone,
          preferred_clip_types: preferredClipTypes.map(c => categoryToBackend[c] || 'insight'),
          clips_per_video: defaultNumberClips,
        }).then(() => toast.success('Preferences synced to your account'))
          .catch((err) => console.warn('Profile sync failed:', (err as Error)?.message || err));
      });
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Reset all settings and demo projects back to defaults?')) {
      resetToMockData();
      toast.info('Restored default demo environment');
    }
  };

  const handleDeleteAll = () => {
    deleteAllProjects();
    setConfirmDeleteAllModal(false);
    toast.success('All local projects cleared');
  };

  return (
    <div className="w-full min-w-0 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-main font-sans">
            Settings & Brand Kit
          </h1>
          <p className="text-xs text-sub mt-1">
            Customize brand overlays, default algorithmic targets, and interface themes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 text-xs font-semibold text-sub hover:text-main hover:bg-surface-main border border-subtle rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="submit"
            form="settings-form"
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      <form id="settings-form" onSubmit={handleSaveSettings} className="space-y-8">
        
        {/* SECTION 1: APPEARANCE (Light / Dark / System) */}
        <div className="studio-card p-6 sm:p-8 rounded-2xl border border-subtle space-y-4">
          <h2 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2 font-mono">
            <Palette className="w-4 h-4 text-indigo-400" />
            <span>Studio Appearance</span>
          </h2>
          <p className="text-xs text-sub">
            Select your theme. ReelReason is tuned for high-contrast obsidian dark mode or ultra-clean cool slate in light mode.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200 ${
                theme === 'light'
                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500 font-bold shadow-sm'
                  : 'bg-canvas text-sub border-subtle hover:text-main hover:border-indigo-500/30'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-semibold">Cool Slate</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-indigo-500/20 text-cyan-300 border-indigo-500 font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                  : 'bg-canvas text-sub border-subtle hover:text-main hover:border-indigo-500/30'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-semibold">Electric Obsidian</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200 ${
                theme === 'system'
                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500 font-bold shadow-sm'
                  : 'bg-canvas text-sub border-subtle hover:text-main hover:border-indigo-500/30'
              }`}
            >
              <Monitor className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-semibold">Sync System</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: PROFILE */}
        <div className="studio-card p-6 sm:p-8 rounded-2xl border border-subtle space-y-6">
          <h2 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2 font-mono">
            <User className="w-4 h-4 text-cyan-400" />
            <span>Creator Profile</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-subtle">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-500/40 shrink-0 shadow-md">
              <img
                src={userSettings.avatarUrl || AVATAR_CREATOR_IMG}
                alt={displayName}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-black rounded-full" />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-black text-main font-sans">{displayName}</h3>
              <p className="text-xs text-sub font-mono">{email}</p>
              <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-mono font-bold mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Creator Studio Account
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-main block mb-1 font-mono">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-main block mb-1 font-mono">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: BRAND KIT */}
        <div className="studio-card p-6 sm:p-8 rounded-2xl border border-subtle space-y-6">
          <h2 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2 font-mono">
            <Palette className="w-4 h-4 text-indigo-400" />
            <span>Brand Kit & Overlays</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-main block mb-1 font-mono">Creator Social Handle</label>
              <input
                type="text"
                value={creatorHandle}
                onChange={(e) => setCreatorHandle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs font-mono text-cyan-400 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-muted mt-1 block font-mono">Rendered on vertical watermark overlays</span>
            </div>

            <div>
              <label className="text-xs font-bold text-main block mb-1 font-mono">Brand Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-10 h-10 p-0.5 rounded-xl cursor-pointer border border-subtle bg-canvas shrink-0"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-canvas border border-subtle text-xs font-mono text-main"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-main block mb-1 font-mono">Display Font</label>
              <select
                value={fontPreference}
                onChange={(e) => setFontPreference(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main focus:outline-none focus:border-indigo-500"
              >
                <option value="Inter">Inter (Flagship High-Legibility)</option>
                <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                <option value="Outfit">Outfit (Clean Modern)</option>
                <option value="JetBrains Mono">JetBrains Mono (Technical)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-main block mb-1 font-mono">Default Subtitle Style</label>
              <select
                value={defaultSubtitleStyle}
                onChange={(e) => setDefaultSubtitleStyle(e.target.value as SubtitleStyle)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main focus:outline-none focus:border-indigo-500"
              >
                <option value="bold-punch">Bold Punch (High Impact Neon)</option>
                <option value="clean-editorial">Clean Editorial</option>
                <option value="minimal-bottom">Minimal Lower</option>
                <option value="karaoke-pop">Karaoke Pop</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-main block font-mono">Enable Watermark by Default</span>
              <span className="text-[11px] text-muted">Embed handle in exported video overlays</span>
            </div>
            <input
              type="checkbox"
              checked={watermarkEnabled}
              onChange={(e) => setWatermarkEnabled(e.target.checked)}
              className="w-4 h-4 accent-indigo-500 rounded"
            />
          </div>
        </div>

        {/* SECTION 4: AI PREFERENCES */}
        <div className="studio-card p-6 sm:p-8 rounded-2xl border border-subtle space-y-6">
          <h2 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2 font-mono">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Algorithmic Discovery Presets</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-main block mb-1 font-mono">Default Target Platform</label>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {[
                  { id: 'reels', name: 'Reels', icon: Instagram, color: 'text-pink-500' },
                  { id: 'shorts', name: 'Shorts', icon: Youtube, color: 'text-red-500' },
                  { id: 'facebook_reels', name: 'FB Reels', icon: Facebook, color: 'text-blue-500' },
                  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-sky-600' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = defaultPlatform === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDefaultPlatform(item.id as TargetPlatform)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left text-xs transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-main font-bold shadow-xs'
                          : 'border-subtle bg-surface-sub/40 hover:bg-surface-sub text-sub hover:text-main'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : item.color}`} />
                      <span className="truncate">{item.name}</span>
                    </button>
                  );
                })}
              </div>
              <select
                value={defaultPlatform}
                onChange={(e) => setDefaultPlatform(e.target.value as TargetPlatform)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="reels">Instagram Reels (9:16)</option>
                <option value="shorts">YouTube Shorts (9:16)</option>
                <option value="facebook_reels">Facebook Reels (9:16)</option>
                <option value="linkedin">LinkedIn Video (9:16 / 4:5)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-main block mb-1 font-mono">Default Delivery Tone</label>
              <select
                value={defaultTone}
                onChange={(e) => setDefaultTone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main focus:outline-none focus:border-indigo-500"
              >
                <option value="Punchy & Energetic">Punchy & Energetic</option>
                <option value="Thoughtful & Analytical">Thoughtful & Analytical</option>
                <option value="Raw & Candid">Raw & Candid</option>
                <option value="Educational & Calm">Educational & Calm</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-main block mb-1 font-mono">Default Target Audience</label>
            <input
              type="text"
              value={defaultAudience}
              onChange={(e) => setDefaultAudience(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Preferred Clip Types */}
          <div>
            <label className="text-xs font-bold text-main block mb-2 font-mono">Preferred Clip Angles</label>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(cat => {
                const isChecked = preferredClipTypes.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 ${
                      isChecked
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 font-bold shadow-sm'
                        : 'bg-canvas text-sub border-subtle hover:text-main hover:border-indigo-500/30'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default number of clips */}
          <div>
            <label className="text-xs font-bold text-main block mb-2 font-mono">Default Reel Yield</label>
            <div className="flex items-center gap-3">
              {[3, 5, 7].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setDefaultNumberClips(num)}
                  className={`px-5 py-2 rounded-xl font-mono text-xs font-bold border transition-all ${
                    defaultNumberClips === num
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                      : 'bg-canvas text-sub border-subtle hover:text-main'
                  }`}
                >
                  {num} Clips
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 5: DANGER ZONE */}
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-4">
          <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Danger Zone</span>
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <h4 className="text-xs font-bold text-main">Delete All Local Projects</h4>
              <p className="text-[11px] text-muted">
                Clear all stored video metadata and extracted reels from browser memory.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmDeleteAllModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All Projects</span>
            </button>
          </div>

          <div className="pt-3 border-t border-rose-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-main">Delete Creator Account</h4>
              <p className="text-[11px] text-muted font-mono">
                Simulated UI trigger for account lifecycle management.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toast.info('Account deletion UI simulation (client-side only).')}
              className="px-4 py-2 rounded-xl bg-surface-main border border-rose-500/30 text-rose-400 text-xs font-medium hover:bg-rose-500/10 transition-colors shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] text-white text-xs font-bold shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-cyan-300" />
            <span>Save All Settings</span>
          </button>
        </div>

      </form>

      {/* Confirmation Modal */}
      {confirmDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="studio-card p-6 max-w-sm w-full space-y-4 shadow-2xl border border-rose-500/30">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-main font-sans">Clear All Projects?</h3>
            </div>
            <p className="text-xs text-sub leading-relaxed">
              This will permanently delete all projects and clips currently saved in your browser storage.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteAllModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl text-sub hover:text-main hover:bg-surface-sub border border-subtle"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-500 shadow-md"
              >
                Confirm Delete All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
