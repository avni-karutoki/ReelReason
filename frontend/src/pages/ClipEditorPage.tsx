import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Save,
  RotateCcw,
  Film,
  RefreshCw,
  Clock,
  Type,
  Palette,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Zap,
  Target,
  Eye,
  Share2,
  Sliders,
  ChevronRight,
  Flame,
  Check
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import {
  Clip,
  SubtitleStyle,
  SubtitlePosition,
  ClipCategory
} from '../types';
import { VideoReelPlayer } from '../components/common/VideoReelPlayer';
import { formatSecondsToTime, parseTimeToSeconds } from '../utils/time';
import { toast } from 'sonner';

export const ClipEditorPage: React.FC = () => {
  const { id, clipId } = useParams<{ id: string; clipId: string }>();
  const navigate = useNavigate();
  const { getProject, getClip, updateClip, simulateClipRender, getVideoBlobUrl } = useProjects();

  const project = getProject(id || '');
  const originalClip = getClip(id || '', clipId || '');
  const localBlob = project ? getVideoBlobUrl(project.id) : null;

  // Local Editable Form State
  const [hook, setHook] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtagsStr, setHashtagsStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('00:00');
  const [endTimeStr, setEndTimeStr] = useState('00:00');
  const [category, setCategory] = useState<ClipCategory>('Strong Opinion');
  const [targetAudience, setTargetAudience] = useState('');
  
  // Subtitle & Style config
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('bold-punch');
  const [fontSize, setFontSize] = useState<number>(26);
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [position, setPosition] = useState<SubtitlePosition>('lower-third');
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(true);
  const [creatorHandle, setCreatorHandle] = useState<string>('@reelreason');

  // Alternative hooks index for cycling
  const [altHookIdx, setAltHookIdx] = useState(0);
  const [altCaptionIdx, setAltCaptionIdx] = useState(0);
  const [timeError, setTimeError] = useState<string | null>(null);

  // Sync state from originalClip
  useEffect(() => {
    if (originalClip) {
      setHook(originalClip.hook);
      setTitle(originalClip.title);
      setCaption(originalClip.caption);
      setHashtagsStr(originalClip.hashtags.join(' '));
      setStartTimeStr(formatSecondsToTime(originalClip.startTime));
      setEndTimeStr(formatSecondsToTime(originalClip.endTime));
      setCategory(originalClip.category);
      setTargetAudience(originalClip.targetAudience);

      const cfg = originalClip.styleConfig;
      setSubtitleStyle(cfg.subtitleStyle);
      setFontSize(cfg.fontSize);
      setTextColor(cfg.textColor);
      setPosition(cfg.position);
      setWatermarkEnabled(cfg.watermarkEnabled);
      setCreatorHandle(cfg.creatorHandle);
    }
  }, [originalClip]);

  if (!project || !originalClip) {
    return (
      <div className="min-h-screen bg-canvas text-main flex items-center justify-center p-4">
        <div className="studio-card p-8 rounded-2xl border border-subtle max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-bold font-sans text-main">Clip Not Found</h2>
          <p className="text-xs text-sub">Could not find clip ID {clipId}</p>
          <Link
            to={project ? `/project/${project.id}/clips` : '/projects'}
            className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Calculate live duration and validate timestamps
  const parsedStart = parseTimeToSeconds(startTimeStr);
  const parsedEnd = parseTimeToSeconds(endTimeStr);
  const calculatedDuration = Math.max(1, parsedEnd - parsedStart);

  // Construct draft clip object for live vertical preview
  const livePreviewClip: Clip = {
    ...originalClip,
    hook,
    title,
    caption,
    category,
    startTime: parsedStart,
    endTime: parsedEnd,
    duration: calculatedDuration,
    styleConfig: {
      subtitleStyle,
      fontSize,
      textColor,
      position,
      watermarkEnabled,
      creatorHandle
    }
  };

  // Regeneration Handlers
  const handleRegenerateHook = () => {
    if (originalClip.alternativeHooks && originalClip.alternativeHooks.length > 0) {
      const nextIndex = (altHookIdx + 1) % originalClip.alternativeHooks.length;
      setAltHookIdx(nextIndex);
      const chosen = originalClip.alternativeHooks[nextIndex];
      setHook(chosen);
      toast.success('Generated alternative hook');
    }
  };

  const handleUseSpecificHook = (alt: string) => {
    setHook(alt);
    toast.success('Selected hook updated');
  };

  const handleRegenerateCaption = () => {
    if (originalClip.alternativeCaptions && originalClip.alternativeCaptions.length > 0) {
      const nextIndex = (altCaptionIdx + 1) % originalClip.alternativeCaptions.length;
      setAltCaptionIdx(nextIndex);
      setCaption(originalClip.alternativeCaptions[nextIndex]);
      toast.success('Generated alternative caption');
    }
  };

  const handleReset = () => {
    if (confirm('Discard all unsaved edits and reset to original recommendation?')) {
      setHook(originalClip.hook);
      setTitle(originalClip.title);
      setCaption(originalClip.caption);
      setHashtagsStr(originalClip.hashtags.join(' '));
      setStartTimeStr(formatSecondsToTime(originalClip.startTime));
      setEndTimeStr(formatSecondsToTime(originalClip.endTime));
      setCategory(originalClip.category);
      setTargetAudience(originalClip.targetAudience);
      setSubtitleStyle(originalClip.styleConfig.subtitleStyle);
      setFontSize(originalClip.styleConfig.fontSize);
      setTextColor(originalClip.styleConfig.textColor);
      setPosition(originalClip.styleConfig.position);
      setWatermarkEnabled(originalClip.styleConfig.watermarkEnabled);
      setCreatorHandle(originalClip.styleConfig.creatorHandle);
      setTimeError(null);
      toast.info('Changes reset');
    }
  };

  const handleSave = () => {
    if (parsedEnd <= parsedStart) {
      setTimeError('End timestamp must be strictly greater than start timestamp.');
      toast.error('Invalid timestamp bounds');
      return;
    }
    setTimeError(null);

    const parsedHashtags = hashtagsStr
      .split(/\s+/)
      .filter(t => t.length > 0)
      .map(t => (t.startsWith('#') ? t : `#${t}`));

    updateClip(project.id, originalClip.id, {
      hook,
      title,
      caption,
      category,
      targetAudience,
      hashtags: parsedHashtags,
      startTime: parsedStart,
      endTime: parsedEnd,
      duration: calculatedDuration,
      styleConfig: {
        subtitleStyle,
        fontSize,
        textColor,
        position,
        watermarkEnabled,
        creatorHandle
      }
    });

    toast.success('Clip modifications saved to project');
  };

  const handleRender = () => {
    handleSave();
    simulateClipRender(project.id, originalClip.id);
    toast.success('Rendering reel simulated in browser');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div className="flex items-center gap-3">
          <Link
            to={`/project/${project.id}/clips`}
            className="p-2 rounded-xl text-sub hover:text-main hover:bg-surface-main transition-colors border border-subtle"
            aria-label="Back to clips dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-sub font-mono">
              <Link to={`/project/${project.id}/clips`} className="hover:text-indigo-400">{project.title}</Link>
              <span>/</span>
              <span className="text-cyan-400 font-semibold">Studio Reel Editor</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-sans text-main">
              {title || 'Clip Editor'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 text-xs font-semibold text-sub hover:text-main hover:bg-surface-main border border-subtle rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>

          <button
            type="button"
            onClick={handleRender}
            className="px-4 py-2 text-xs font-bold text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span>Render Reel</span>
          </button>
        </div>
      </div>

      {/* 3-Column Desktop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Column 1: Vertical Reel 9:16 Preview (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="studio-card p-4 rounded-2xl border border-subtle shadow-md">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-subtle text-xs">
              <span className="font-bold text-main font-mono">Live 9:16 Vertical Preview</span>
              <span className="font-mono text-cyan-400 font-bold tabular-nums">{calculatedDuration}s</span>
            </div>

            {/* Reel Player Component */}
            <VideoReelPlayer
              clip={livePreviewClip}
              videoUrl={localBlob}
              backdropUrl={project.thumbnailUrl}
              autoplay={false}
            />

            <div className="pt-3 mt-3 border-t border-subtle text-[11px] text-sub text-center font-mono">
              Subtitle style: <strong className="capitalize text-indigo-400">{subtitleStyle}</strong> · {position}
            </div>
          </div>

          {/* Quick Timeline Trimmer Box */}
          <div className="studio-card p-4 rounded-2xl border border-subtle shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-main uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Segment Boundaries</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-muted block mb-1 font-mono">Start (MM:SS)</label>
                <input
                  type="text"
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-subtle font-mono tabular-nums text-main text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted block mb-1 font-mono">End (MM:SS)</label>
                <input
                  type="text"
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-subtle font-mono tabular-nums text-main text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {timeError && (
              <div className="text-[11px] text-rose-400 font-medium">
                {timeError}
              </div>
            )}

            {/* Visual timeline bar */}
            <div className="pt-2">
              <div className="text-[11px] text-sub flex justify-between mb-1 font-mono">
                <span>Source Placement</span>
                <span className="tabular-nums text-cyan-400">{startTimeStr} of {project.formattedDuration}</span>
              </div>
              <div className="w-full bg-surface-ter h-2 rounded-full overflow-hidden border border-subtle relative">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full transition-all"
                  style={{
                    marginLeft: `${Math.min(90, (parsedStart / (project.duration || 1)) * 100)}%`,
                    width: `${Math.max(5, (calculatedDuration / (project.duration || 1)) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Center Editing Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Hook, Title & Narrative Content Card */}
          <div className="studio-card p-6 rounded-2xl border border-subtle shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-main uppercase tracking-wider flex items-center justify-between font-mono">
              <span>Hook & Narrative Controls</span>
              <span className="text-xs text-cyan-400">{category}</span>
            </h2>

            {/* Hook text field with Regenerate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-main font-mono">Opening Hook (First 3s)</label>
                <button
                  type="button"
                  onClick={handleRegenerateHook}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Cycle Hook</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                className="w-full p-3 rounded-xl bg-canvas border border-subtle text-sm text-main font-sans leading-snug focus:outline-none focus:border-indigo-500 resize-none font-semibold"
              />
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-bold text-main block mb-1 font-mono">Clip Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Caption with Regenerate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-main font-mono">Social Caption Description</label>
                <button
                  type="button"
                  onClick={handleRegenerateCaption}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Cycle Caption</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-canvas border border-subtle text-xs text-main leading-relaxed focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Hashtags */}
            <div>
              <label className="text-xs font-bold text-main block mb-1 font-mono">Hashtags</label>
              <input
                type="text"
                value={hashtagsStr}
                onChange={(e) => setHashtagsStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs font-mono text-cyan-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Target Audience */}
            <div>
              <label className="text-xs font-bold text-main block mb-1 font-mono">Audience Target</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-canvas border border-subtle text-xs text-main focus:outline-none focus:border-indigo-500"
              />
            </div>

          </div>

          {/* Subtitle & Brand Kit Controls Card */}
          <div className="studio-card p-6 rounded-2xl border border-subtle shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2 font-mono">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Typography & Subtitle Styling</span>
            </h2>

            {/* Style selector */}
            <div>
              <label className="text-xs font-semibold text-main block mb-1.5">Subtitle Style Preset</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'bold-punch', label: 'Bold Punch (Neon)' },
                  { id: 'clean-editorial', label: 'Clean Editorial' },
                  { id: 'minimal-bottom', label: 'Minimal Lower' },
                  { id: 'karaoke-pop', label: 'Karaoke Pop' },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSubtitleStyle(style.id as SubtitleStyle)}
                    className={`p-3 rounded-xl border text-left font-medium transition-all duration-200 ${
                      subtitleStyle === style.id
                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/50 font-bold shadow-sm'
                        : 'bg-canvas text-sub border-subtle hover:text-main hover:border-indigo-500/30'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position and Font size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-main block mb-1.5">Vertical Position</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as SubtitlePosition)}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-subtle text-xs text-main focus:outline-none focus:border-indigo-500"
                >
                  <option value="lower-third">Lower Third (Standard)</option>
                  <option value="middle">Middle (High Attention)</option>
                  <option value="top">Top (Headlines)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-main block mb-1.5">
                  Font Size ({fontSize}px)
                </label>
                <input
                  type="range"
                  min="18"
                  max="34"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-indigo-500 mt-2"
                />
              </div>
            </div>

            {/* Watermark & Handle */}
            <div className="pt-2 border-t border-subtle flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-main block">Creator Handle Watermark</span>
                <span className="text-[11px] text-muted font-mono">Rendered on reel corner</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={creatorHandle}
                  onChange={(e) => setCreatorHandle(e.target.value)}
                  className="w-28 px-2.5 py-1 rounded-lg bg-canvas border border-subtle text-xs font-mono text-cyan-400"
                />
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Column 3: Reasoning & Quality Insights (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Scorecard Strip */}
          <div className="studio-card p-5 rounded-2xl border border-subtle shadow-sm space-y-3">
            <div className="flex items-baseline justify-between pb-2 border-b border-subtle">
              <span className="text-xs font-bold text-muted uppercase tracking-wider font-mono">Moment Score</span>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-cyan-400 tabular-nums">
                  {originalClip.scores.overall}
                </span>
                <span className="text-xs font-normal text-muted font-mono">/100</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-sub mb-1 text-[11px]">
                  <span className="text-main">Hook Strength</span>
                  <span className="font-mono tabular-nums font-bold text-amber-400">{originalClip.scores.hookStrength}%</span>
                </div>
                <div className="w-full bg-surface-ter h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full" style={{ width: `${originalClip.scores.hookStrength}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sub mb-1 text-[11px]">
                  <span className="text-main">Story Clarity</span>
                  <span className="font-mono tabular-nums font-bold text-cyan-400">{originalClip.scores.clarity}%</span>
                </div>
                <div className="w-full bg-surface-ter h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full" style={{ width: `${originalClip.scores.clarity}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sub mb-1 text-[11px]">
                  <span className="text-main">Audience Fit</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-400">{originalClip.scores.audienceFit}%</span>
                </div>
                <div className="w-full bg-surface-ter h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full" style={{ width: `${originalClip.scores.audienceFit}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sub mb-1 text-[11px]">
                  <span className="text-main">Shareability</span>
                  <span className="font-mono tabular-nums font-bold text-indigo-400">{originalClip.scores.shareability}%</span>
                </div>
                <div className="w-full bg-surface-ter h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full" style={{ width: `${originalClip.scores.shareability}%` }} />
                </div>
              </div>
            </div>

            {originalClip.reasoning.retentionWarning && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span>{originalClip.reasoning.retentionWarning}</span>
              </div>
            )}
          </div>

          {/* Alternative Hooks Panel */}
          <div className="studio-card p-5 rounded-2xl border border-subtle shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-main uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Alternative Hooks</span>
            </h3>
            <p className="text-[11px] text-muted">
              Click any angle below to immediately apply:
            </p>

            <div className="space-y-2.5">
              {originalClip.alternativeHooks.map((alt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleUseSpecificHook(alt)}
                  className="w-full p-3 rounded-xl bg-surface-sub/50 hover:bg-indigo-500/15 border border-subtle hover:border-indigo-500/40 text-left text-xs text-main transition-all group"
                >
                  <p className="line-clamp-2 italic font-sans font-medium text-indigo-200 group-hover:text-cyan-300">"{alt}"</p>
                  <span className="text-[10px] text-cyan-400 font-bold mt-1.5 inline-block opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    Apply this hook →
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
