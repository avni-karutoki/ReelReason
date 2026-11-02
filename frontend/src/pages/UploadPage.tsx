import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileVideo,
  X,
  Sparkles,
  ArrowRight,
  Info,
  Youtube,
  ShieldCheck,
  Clock,
  Layers,
  HelpCircle,
  Play,
  Check,
  RefreshCw,
  Video,
  CheckCircle2,
  Instagram,
  Facebook,
  Linkedin
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { isBackendAvailable, createProject as registerProjectWithBackend } from '../api/client';
import { ensureBackendProbed, registerRealProject } from '../api/realMode';
import { VideoType, TargetPlatform, ClipCategory } from '../types';
import { HERO_PODCAST_IMG, THUMB_KEYNOTE_IMG, THUMB_TUTORIAL_IMG } from '../data/mockData';
import { toast } from 'sonner';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { createProject, userSettings } = useProjects();
  const { openAuthModal } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  
  // Creator Context Fields
  const [videoType, setVideoType] = useState<VideoType>('podcast');
  const [platform, setPlatform] = useState<TargetPlatform>(userSettings.defaultPlatform || 'reels');
  const [primaryGoal, setPrimaryGoal] = useState('Grow engaged creator audience & highlight counter-intuitive editing lessons');
  const [targetAudience, setTargetAudience] = useState(userSettings.defaultAudience || 'Indie creators, founders, and video editors');
  const [tone, setTone] = useState(userSettings.defaultTone || 'Punchy & Energetic');
  
  const [selectedClipTypes, setSelectedClipTypes] = useState<ClipCategory[]>([
    'Strong Opinion',
    'Practical Lesson',
    'Unexpected Story'
  ]);
  
  const [numClips, setNumClips] = useState<number>(3);
  const [language, setLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
  const [isWaking, setIsWaking] = useState(false);

  const validFormats = ['video/mp4', 'video/quicktime', 'video/webm'];

  const handleFile = (file: File) => {
    setFileError(null);
    if (!validFormats.includes(file.type) && !file.name.match(/\.(mp4|mov|webm)$/i)) {
      setFileError('Unsupported file type. Please upload an MP4, MOV, or WEBM video file.');
      toast.error('Unsupported file format');
      return;
    }

    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);
    toast.success(`Loaded "${file.name}" locally in browser`);

    if (!projectTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setProjectTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Removed selected video');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const toggleClipType = (type: ClipCategory) => {
    setSelectedClipTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  };

  const loadSamplePreset = (preset: 'podcast' | 'keynote' | 'tutorial') => {
    if (preset === 'podcast') {
      setProjectTitle('The Unfiltered Truth About Content Architecture');
      setYoutubeUrl('https://youtube.com/watch?v=sample-content-architecture');
      setVideoType('podcast');
      setPrimaryGoal('Hook high-intent founders into full podcast episodes');
    } else if (preset === 'keynote') {
      setProjectTitle('Keynote: The Architecture of Sovereign AI Models');
      setYoutubeUrl('https://youtube.com/watch?v=sample-sovereign-ai-models');
      setVideoType('keynote');
      setPrimaryGoal('Establish contrarian engineering authority');
    } else {
      setProjectTitle('Masterclass: 3-Word Subtitle Retention Psychology');
      setYoutubeUrl('https://youtube.com/watch?v=sample-subtitle-psychology');
      setVideoType('tutorial');
      setPrimaryGoal('Deliver actionable micro-lessons that drive bookmarks');
    }
    setSelectedFile(null);
    setFileError(null);
    toast.info(`Loaded ${preset} studio preset`);
  };

  /** Wake a sleeping free-tier backend before settling for demo clips: retry the
   *  availability probe for up to ~75s (Render cold start), then give up gracefully. */
  const wakeBackend = async (): Promise<boolean> => {
    for (let attempt = 0; attempt < 12; attempt++) {
      const ok = await ensureBackendProbed(isBackendAvailable);
      if (ok) return true;
      if (attempt === 0) {
        toast.info('Waking up the cloud engine — free-tier hosting can take up to a minute to boot once in a while', { duration: 12000 });
      }
      await new Promise(r => setTimeout(r, 6000));
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile && !youtubeUrl.trim() && !projectTitle.trim()) {
      setFileError('Please select a video file, enter a YouTube URL, or load sample project data.');
      toast.error('Please provide a video file or title');
      return;
    }

    // Wake the backend BEFORE creating the local mirror + navigating, so the
    // processing screen never settles for demo clips that a pending real
    // pipeline would come back to replace.
    setIsWaking(true);
    let backendUp = false;
    try {
      backendUp = await wakeBackend();
    } finally {
      setIsWaking(false);
    }
    if (!backendUp) {
      toast.warning('Cloud engine unreachable — continuing with local demo simulation');
    }

    const title = projectTitle.trim() || (selectedFile ? selectedFile.name : 'Untitled Creator Session');
    const fileSizeFormatted = selectedFile 
      ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
      : '720 MB (Stream)';

    const newProjectId = createProject({
      title,
      sourceFilename: selectedFile ? selectedFile.name : 'session_interview_master.mp4',
      sourceFileSize: fileSizeFormatted,
      youtubeUrl: youtubeUrl.trim() || null,
      thumbnailUrl: videoType === 'keynote' ? THUMB_KEYNOTE_IMG : videoType === 'tutorial' ? THUMB_TUTORIAL_IMG : HERO_PODCAST_IMG,
      duration: 2900,
      videoType,
      platform,
      primaryGoal,
      targetAudience,
      tone,
      clipTypes: selectedClipTypes,
      numClipsRequested: numClips,
      language
    }, selectedFile);

    // Navigate immediately — the processing page reconciles with the backend while it runs
    navigate(`/project/${newProjectId}/processing`);

    // Full pipeline submission against the FastAPI backend (already confirmed awake)
    if (backendUp) {
      const platformLabel = platform === 'reels' ? 'Instagram Reels'
        : platform === 'shorts' ? 'YouTube Shorts'
        : platform === 'facebook_reels' ? 'Facebook Reels'
        : 'LinkedIn';
      try {
        const backendProject = await registerProjectWithBackend({
          file: selectedFile,
          youtubeUrl: youtubeUrl.trim() || null,
          title,
          platform: platformLabel,
          audience: targetAudience || 'Creators',
          goal: primaryGoal || 'Views',
          tone: tone || 'Bold',
          numberOfClips: numClips,
          language: language || 'English',
        });
        registerRealProject(newProjectId, backendProject.id);
        toast.success('Project submitted to the processing pipeline');
      } catch (err) {
        const message = (err as Error)?.message || '';
        console.warn('Backend submission failed — running local analysis:', message || err);
        if (message.includes('401')) {
          // Backend answered but this visitor is not signed in — guide them to auth.
          toast.warning('Sign in to unlock real cloud processing — running local preview for now', {
            description: 'Your project and clips still work in this browser session.',
            action: {
              label: 'Sign In',
              onClick: () => openAuthModal('signup'),
            },
          });
        } else {
          toast.warning('Backend unreachable — continuing with local preview');
        }
      }
    }
  };

  const availableClipCategories: ClipCategory[] = [
    'Strong Opinion',
    'Practical Lesson',
    'Unexpected Story',
    'Framework Breakdown',
    'Counter-Intuitive Truth'
  ];

  return (
    <div className="w-full min-w-0 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 text-[11px] font-bold uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Studio Ingestion</span>
            </span>
            <span className="text-xs text-sub">· Step 1 of 3</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-main font-sans">
            Upload & Set Repurposing Intent
          </h1>
          <p className="text-xs sm:text-sm text-sub mt-1">
            ReelReason needs your raw video and editorial intent to discover moments that hold high viewer retention.
          </p>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadSamplePreset('podcast')}
            className="px-3 py-2 rounded-xl bg-surface-main hover:bg-surface-sub border border-subtle text-xs font-semibold text-main transition-all hover:border-indigo-500/40 flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Podcast Preset</span>
          </button>
          <button
            type="button"
            onClick={() => loadSamplePreset('keynote')}
            className="px-3 py-2 rounded-xl bg-surface-main hover:bg-surface-sub border border-subtle text-xs font-semibold text-main transition-all hover:border-cyan-500/40 flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Keynote</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: VIDEO UPLOAD AREA */}
        <div className="studio-card p-6 sm:p-8 rounded-2xl border border-subtle space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-main uppercase tracking-wider flex items-center gap-2 font-mono">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-mono font-bold shadow-[0_0_10px_rgba(99,102,241,0.4)]">
                1
              </span>
              <span>Source Video Input</span>
            </h2>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Client-side Isolated
            </span>
          </div>

          {/* Drag & Drop Upload Zone */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 group relative ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01] shadow-[0_0_30px_rgba(99,102,241,0.25)]'
                  : 'border-subtle hover:border-indigo-500/50 hover:bg-surface-sub/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.mov,.webm"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />

              <div className="w-16 h-16 rounded-2xl bg-surface-sub group-hover:bg-indigo-500/15 flex items-center justify-center mx-auto mb-4 text-sub group-hover:text-indigo-400 transition-all duration-200 border border-subtle group-hover:border-indigo-500/30 shadow-md">
                <UploadCloud className="w-8 h-8 stroke-[2]" />
              </div>

              <h3 className="text-lg font-bold text-main font-sans">
                Drag and drop your long video here
              </h3>
              
              <p className="text-xs text-sub mt-1 max-w-sm mx-auto">
                Supports <strong className="text-indigo-400 font-mono">MP4, MOV, WEBM</strong>. Processed locally in browser memory without server uploads.
              </p>

              {/* Prominent Select Video Button */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileInput();
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] inline-flex items-center gap-2 group-hover:scale-105"
                >
                  <FileVideo className="w-4 h-4" />
                  <span>Select Video from Device</span>
                </button>
              </div>

              {/* Format badges */}
              <div className="mt-6 pt-4 border-t border-subtle/50 flex items-center justify-center gap-3 text-[11px] text-muted font-mono">
                <span>MP4 (H.264)</span>
                <span>·</span>
                <span>QuickTime (.MOV)</span>
                <span>·</span>
                <span>WebM Video</span>
              </div>
            </div>
          ) : (
            /* Selected File State */
            <div className="p-5 rounded-2xl bg-surface-sub border border-indigo-500/30 space-y-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <FileVideo className="w-6 h-6" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-bold text-main truncate font-sans">
                      {selectedFile.name}
                    </h4>
                    <p className="text-xs font-mono text-cyan-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB · Ready for studio clipping
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="px-3 py-1.5 rounded-lg bg-surface-main hover:bg-surface-sub border border-subtle text-xs font-semibold text-main transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-2 rounded-lg text-sub hover:text-rose-400 hover:bg-surface-main transition-colors"
                    aria-label="Remove video"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Local HTML5 Video Preview */}
              {videoPreviewUrl && (
                <div className="relative rounded-xl overflow-hidden max-h-64 bg-black flex items-center justify-center border border-white/10 shadow-inner">
                  <video
                    src={videoPreviewUrl}
                    controls
                    className="max-h-64 w-auto mx-auto rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {fileError && (
            <p className="text-xs text-rose-400 font-semibold">{fileError}</p>
          )}

          {/* YouTube Stream Option */}
          <div className="pt-2 border-t border-subtle">
            <label className="block text-xs font-bold text-main mb-1.5 flex items-center gap-2 font-mono">
              <Youtube className="w-4 h-4 text-red-500" />
              <span>Or Enter YouTube / Remote Stream URL</span>
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main placeholder:text-muted focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <p className="text-[11px] text-muted mt-1 font-mono">
              Simulates audio/narrative transcription indexing for remote URLs.
            </p>
          </div>

          {/* Project Title Input */}
          <div>
            <label className="block text-xs font-bold text-main mb-1.5 font-mono">
              Project Title
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g. Unfiltered Truth About Content Architecture"
              className="w-full px-4 py-2.5 rounded-xl bg-canvas border border-subtle text-sm text-main placeholder:text-muted focus:outline-none focus:border-indigo-500 transition-colors font-medium"
            />
          </div>

        </div>

        {/* SECTION 2: CREATOR CONTEXT & STRATEGY */}
        <div className="studio-card p-6 sm:p-8 rounded-2xl border border-subtle space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-main uppercase tracking-wider flex items-center gap-2 font-mono">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center text-xs font-mono font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                2
              </span>
              <span>Creator Context & Strategic Intent</span>
            </h2>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Editorial Rules
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Video Type */}
            <div>
              <label className="block text-xs font-semibold text-main mb-1.5">
                Video Type
              </label>
              <select
                value={videoType}
                onChange={(e) => setVideoType(e.target.value as VideoType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main focus:outline-none focus:border-indigo-500"
              >
                <option value="podcast">Podcast Episode (Conversation)</option>
                <option value="keynote">Keynote / Conference Talk (Presentation)</option>
                <option value="tutorial">Tutorial / Course Lecture (Instruction)</option>
                <option value="interview">1-on-1 Interview (Dialogue)</option>
                <option value="vlog">Vlog / Studio Diary (Narrative)</option>
                <option value="panel">Panel Discussion (Multi-speaker)</option>
              </select>
            </div>

            {/* Target Platform */}
            <div>
              <label className="block text-xs font-semibold text-main mb-1.5">
                Target Platform
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2.5">
                {[
                  { id: 'reels', name: 'Instagram Reels', ratio: '9:16 Vertical', icon: Instagram, color: 'text-pink-500' },
                  { id: 'shorts', name: 'YouTube Shorts', ratio: '9:16 Vertical', icon: Youtube, color: 'text-red-500' },
                  { id: 'facebook_reels', name: 'Facebook Reels', ratio: '9:16 Vertical', icon: Facebook, color: 'text-blue-500' },
                  { id: 'linkedin', name: 'LinkedIn Video', ratio: '9:16 / 4:5', icon: Linkedin, color: 'text-sky-600' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = platform === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPlatform(item.id as TargetPlatform)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-main shadow-sm scale-[1.01]'
                          : 'border-subtle bg-surface-sub/50 hover:bg-surface-sub hover:border-border text-sub hover:text-main'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isSelected ? 'text-indigo-600 dark:text-indigo-400 scale-110' : item.color}`} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate leading-tight">{item.name}</div>
                        <div className="text-[10px] text-sub truncate">{item.ratio}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as TargetPlatform)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="reels">Instagram Reels (9:16)</option>
                <option value="shorts">YouTube Shorts (9:16)</option>
                <option value="facebook_reels">Facebook Reels (9:16)</option>
                <option value="linkedin">LinkedIn Video (9:16 / 4:5)</option>
              </select>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-xs font-semibold text-main mb-1.5">
                Delivery Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main focus:outline-none focus:border-indigo-500"
              >
                <option value="Punchy & Energetic">Punchy & Energetic</option>
                <option value="Thoughtful & Analytical">Thoughtful & Analytical</option>
                <option value="Raw & Candid">Raw & Candid</option>
                <option value="Educational & Calm">Educational & Calm</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-main mb-1.5">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'English' | 'Hindi' | 'Hinglish')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main focus:outline-none focus:border-indigo-500"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Hinglish">Hinglish</option>
              </select>
            </div>

          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-semibold text-main mb-1.5">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Founders, indie creators, technical team leads"
              className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main placeholder:text-muted focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Primary Goal */}
          <div>
            <label className="block text-xs font-semibold text-main mb-1.5">
              Primary Goal
            </label>
            <input
              type="text"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              placeholder="e.g. Highlight counter-intuitive lesson to drive newsletter signups"
              className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main placeholder:text-muted focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Preferred Clip Types */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-main font-mono">
              Preferred Clip Narrative Types
            </label>
            <div className="flex flex-wrap gap-2">
              {availableClipCategories.map((type) => {
                const isSelected = selectedClipTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleClipType(type)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isSelected
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm'
                        : 'bg-canvas text-sub border border-subtle hover:text-main hover:border-indigo-500/30'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reel Yield (3, 5, 7) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-main font-mono">
              Reels to Discover
            </label>
            <div className="flex items-center gap-3">
              {[3, 5, 7].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNumClips(num)}
                  className={`px-5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                    numClips === num
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                      : 'bg-canvas text-sub border border-subtle hover:text-main'
                  }`}
                >
                  {num} Clips
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* SECTION 3: PRIVACY & LAUNCH BANNER */}
        <div className="p-4 rounded-2xl bg-surface-main border border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs text-sub">
              <span className="font-bold text-main block">Client-Side Privacy Guarantee</span>
              Video processing analysis simulates locally in browser memory.
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Est. Pipeline: ~10 seconds</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end">
          {isWaking && (
            <span className="mr-3 text-xs font-mono text-cyan-400 animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Waking cloud engine…
            </span>
          )}
          <button
            type="submit"
            disabled={isWaking}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-bold text-sm transition-all inline-flex items-center justify-center gap-2 group ${
              isWaking
                ? 'bg-surface-main border border-subtle cursor-wait text-sub'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(99,102,241,0.7)]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-300 group-hover:rotate-12 transition-transform" />
            <span>{isWaking ? 'Connecting to pipeline…' : 'Start AI Analysis Pipeline'}</span>
            {!isWaking && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </div>

      </form>

    </div>
  );
};
