import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Sliders,
  Filter,
  ArrowUpDown,
  Download,
  Share2,
  Zap,
  Target,
  Eye,
  Info,
  ChevronRight,
  Edit3,
  Film,
  Layers,
  ArrowRight,
  Compass,
  Flame,
  Check
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { Clip, ClipCategory, ApprovalStatus } from '../types';
import { formatSecondsToTime } from '../utils/time';
import { ReasoningDrawer } from '../components/common/ReasoningDrawer';
import { VideoReelPlayer } from '../components/common/VideoReelPlayer';
import { StaggerGroup, StaggerItem } from '../components/common/Reveal';
import { isBackendAvailable, listProjectClips, listProjectReels } from '../api/client';
import { ensureBackendProbed } from '../api/realMode';
import { backendClipToFrontend } from '../api/adapters';
import { toast } from 'sonner';

export const ClipDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, setClipApproval, simulateClipRender, getVideoBlobUrl, updateProject, updateClip } = useProjects();

  const project = getProject(id || '');

  // If this project lives on the backend but clips haven't been mirrored locally
  // yet (e.g. opened directly from another device), hydrate them from the API.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!project || project.clips.length > 0) return;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(project.id)) return;
      const up = await ensureBackendProbed(isBackendAvailable);
      if (!up || cancelled) return;
      try {
        const backendClips = await listProjectClips(project.id, { sortBy: 'score' });
        if (cancelled || backendClips.length === 0) return;
        const projectTitle = project.title || 'Studio Video';
        updateProject(project.id, {
          status: 'completed',
          clips: backendClips.map(c => backendClipToFrontend(c, projectTitle)),
        });
      } catch (e) {
        console.warn('Could not load clips from backend:', (e as Error)?.message || e);
      }
    })();
    return () => { cancelled = true; };
  }, [project?.id, project?.clips.length]);

  // Attach already-rendered reel MP4s from the backend so the real 9:16 videos
  // survive page reloads and other devices (rendered_reels table is the source).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!project || !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(project.id)) return;
      const up = await ensureBackendProbed(isBackendAvailable);
      if (!up || cancelled) return;
      try {
        const reels = await listProjectReels(project.id);
        if (cancelled) return;
        reels.forEach(r => {
          if (!r.clip_id || !r.video_url) return;
          updateClip(project.id, r.clip_id, {
            renderedVideoUrl: r.video_url || undefined,
            renderStatus: r.render_status === 'completed' ? 'ready' : r.render_status === 'processing' ? 'rendering' : 'pending',
            renderProgress: r.render_status === 'completed' ? 100 : r.render_status === 'processing' ? 60 : 0,
          });
        });
      } catch (e) {
        console.warn('Could not hydrate rendered reels:', (e as Error)?.message || e);
      }
    })();
    return () => { cancelled = true; };
  }, [project?.id]);

  // Filter & Sort State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'duration' | 'timestamp'>('score');

  // Drawer & Modal States
  const [selectedClipForReasoning, setSelectedClipForReasoning] = useState<Clip | null>(null);
  const [previewModalClip, setPreviewModalClip] = useState<Clip | null>(null);

  const localBlob = project ? getVideoBlobUrl(project.id) : null;
  const clips = project?.clips || [];

  // Summary Metrics
  const approvedCount = clips.filter(c => c.approvalStatus === 'approved').length;
  const rejectedCount = clips.filter(c => c.approvalStatus === 'rejected').length;
  const pendingCount = clips.filter(c => c.approvalStatus === 'pending').length;

  // Filter & Sort logic
  const filteredAndSortedClips = useMemo(() => {
    return clips
      .filter(clip => {
        if (selectedCategory !== 'all' && clip.category !== selectedCategory) return false;
        if (selectedStatus !== 'all' && clip.approvalStatus !== selectedStatus) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.scores.overall - a.scores.overall;
        if (sortBy === 'duration') return b.duration - a.duration;
        if (sortBy === 'timestamp') return a.startTime - b.startTime;
        return 0;
      });
  }, [clips, selectedCategory, selectedStatus, sortBy]);

  if (!project) {
    return (
      <div className="studio-card p-8 rounded-2xl border border-subtle max-w-md mx-auto text-center space-y-4 my-12">
        <h2 className="text-xl font-bold font-sans text-main">Project Not Found</h2>
        <p className="text-xs text-sub">We could not locate this project in your local session.</p>
        <Link
          to="/projects"
          className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-md"
        >
          Go to Project Library
        </Link>
      </div>
    );
  }

  const handleApprove = (clipId: string) => {
    setClipApproval(project.id, clipId, 'approved');
    toast.success('Clip marked as Approved');
  };

  const handleReject = (clipId: string) => {
    setClipApproval(project.id, clipId, 'rejected');
    toast.info('Clip marked as Rejected');
  };

  const handleRender = (clipId: string) => {
    simulateClipRender(project.id, clipId);
    toast.info('Simulating browser video render...');
  };

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs text-sub mb-1.5 font-mono">
            <Link to="/projects" className="hover:text-indigo-400 transition-colors">Projects</Link>
            <span>/</span>
            <span className="text-main font-semibold truncate max-w-xs">{project.title}</span>
            <span>/</span>
            <span className="text-cyan-400 font-bold">Clip Discovery Dossier</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-main font-sans">
            {project.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/project/${project.id}/export`}
            className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] flex items-center gap-2 whitespace-nowrap group"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span>Export Hub ({approvedCount} Approved)</span>
          </Link>
        </div>
      </div>

      {/* Project Overview Card with Source Video & Metrics */}
      <div className="studio-card p-6 rounded-2xl border border-subtle shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Source Thumbnail & File Specs */}
          <div className="md:col-span-5 flex items-center gap-4">
            <div className="relative w-32 sm:w-40 aspect-16/10 rounded-xl overflow-hidden border border-subtle shrink-0 bg-neutral-900 shadow-sm group">
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/80 text-cyan-300 font-bold tabular-nums border border-white/10">
                {project.formattedDuration}
              </span>
            </div>
            
            <div className="space-y-1 text-xs truncate">
              <div className="font-bold text-main truncate font-sans text-sm">{project.sourceFilename}</div>
              <div className="text-muted font-mono tabular-nums">{project.sourceFileSize}</div>
              <div className="flex items-center gap-2 text-[11px] text-sub pt-1 font-mono">
                <span className="capitalize font-semibold text-indigo-400">{project.videoType}</span>
                <span>·</span>
                <span className="capitalize font-semibold text-cyan-400">{project.platform}</span>
                <span>·</span>
                <span>{project.language}</span>
              </div>
            </div>
          </div>

          {/* Strategy & Target */}
          <div className="md:col-span-4 space-y-1 text-xs border-t md:border-t-0 md:border-l border-subtle pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider block font-mono">Audience Target</span>
              <span className="font-semibold text-main">{project.targetAudience}</span>
            </div>
            <div className="pt-1.5">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider block font-mono">Goal & Tone</span>
              <span className="text-sub line-clamp-2 leading-relaxed">{project.primaryGoal} ({project.tone})</span>
            </div>
          </div>

          {/* Stat KPIs with Neon Accents */}
          <div className="md:col-span-3 grid grid-cols-1 min-[360px]:grid-cols-3 gap-2 text-center border-t md:border-t-0 md:border-l border-subtle pt-4 md:pt-0 md:pl-6">
            <div className="bg-surface-sub/60 p-3 rounded-xl border border-subtle">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block font-mono">Discovered</span>
              <span className="text-xl font-black font-mono text-main tabular-nums">{clips.length}</span>
            </div>
            <div className="bg-surface-sub/60 p-3 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block font-mono">Approved</span>
              <span className="text-xl font-black font-mono text-emerald-400 tabular-nums">{approvedCount}</span>
            </div>
            <div className="bg-surface-sub/60 p-3 rounded-xl border border-amber-500/20">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block font-mono">Pending</span>
              <span className="text-xl font-black font-mono text-amber-400 tabular-nums">{pendingCount}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Strategic Posting Order Strip */}
      <div className="p-4 rounded-xl bg-surface-sub/60 border border-indigo-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-main shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <strong className="font-bold text-indigo-300">Recommended Publishing Cadence:</strong>{' '}
            <span className="text-sub">
              Launch with Clip 1 (Strong Opinion) to capture peak algorithm velocity, followed by the Practical Lesson on Day 3.
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono text-[11px] font-bold uppercase tracking-wider shrink-0">
          <Flame className="w-3.5 h-3.5 fill-current" />
          Ranked by Virality Index
        </span>
      </div>

      {/* Toolbar: Category Filter Tabs & Sort Selects */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {['all', 'Strong Opinion', 'Practical Lesson', 'Unexpected Story', 'Framework Breakdown'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                  : 'bg-surface-main text-sub hover:text-main border border-subtle hover:border-indigo-500/30'
              }`}
            >
              {cat === 'all' ? 'All Reel Types' : cat}
            </button>
          ))}
        </div>

        {/* Status Filter & Sort Dropdown */}
        <div className="flex items-center gap-3 text-xs shrink-0">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-surface-main border border-subtle text-main focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved Only</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected Only</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3.5 py-2 rounded-xl bg-surface-main border border-subtle text-main focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="score">Sort by Overall Score</option>
            <option value="duration">Sort by Duration</option>
            <option value="timestamp">Sort by Start Time</option>
          </select>
        </div>

      </div>

      {/* Recommended Clips List */}
      <StaggerGroup className="space-y-6">
        {filteredAndSortedClips.map((clip, idx) => {
          const isApproved = clip.approvalStatus === 'approved';
          const isRejected = clip.approvalStatus === 'rejected';

          return (
            <StaggerItem key={clip.id}>
            <div
              className={`studio-card rounded-2xl border transition-all duration-300 overflow-hidden ${
                isApproved
                  ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : isRejected
                  ? 'border-subtle opacity-60'
                  : 'border-subtle hover:border-indigo-500/50'
              }`}
            >
              <div className="p-6 sm:p-7">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Narrative Thesis, Hook & Metadata (8 cols) */}
                  <div className="lg:col-span-8 space-y-4">
                    
                    {/* Metadata Header with Glowing Badges */}
                    <div className="flex items-center gap-2 text-xs text-sub flex-wrap font-mono">
                      <span className="font-bold text-cyan-400 uppercase tracking-wider">{clip.category}</span>
                      <span>·</span>
                      <span className="tabular-nums font-semibold text-main">
                        {formatSecondsToTime(clip.startTime)} – {formatSecondsToTime(clip.endTime)}
                      </span>
                      <span>·</span>
                      <span className="tabular-nums text-muted">{clip.duration}s length</span>
                      <span>·</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                        isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        isRejected ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {isApproved ? '✓ Approved' : isRejected ? '✕ Rejected' : '● Needs Review'}
                      </span>
                    </div>

                    {/* Opening Hook (The Primary Display Text) */}
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-main font-sans leading-snug">
                        "{clip.hook}"
                      </h2>
                      <h3 className="text-sm font-semibold text-indigo-300 mt-1.5">
                        {clip.title}
                      </h3>
                    </div>

                    {/* Caption Preview */}
                    <p className="text-xs text-sub leading-relaxed line-clamp-2">
                      {clip.caption}
                    </p>

                    {/* Hashtags as clean text */}
                    <div className="text-xs text-cyan-400/80 font-mono space-x-2">
                      {clip.hashtags.map(tag => (
                        <span key={tag} className="hover:text-cyan-300 cursor-pointer">{tag}</span>
                      ))}
                    </div>

                    {/* AI Moment Selection Explanation & Drawer Trigger */}
                    <div className="p-4 bg-surface-sub/50 rounded-xl border border-subtle text-xs text-main flex items-start justify-between gap-4">
                      <p className="line-clamp-2 leading-relaxed">
                        <strong className="text-indigo-400 font-bold font-mono">Why Chosen: </strong>
                        {clip.reasoning.selectionReason}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedClipForReasoning(clip)}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 shrink-0 whitespace-nowrap inline-flex items-center gap-1 font-mono transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span>Selection Logic</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* Right Column: Scorecard & Interactive Actions (4 cols) */}
                  <div className="lg:col-span-4 bg-surface-sub/60 p-5 rounded-2xl border border-subtle space-y-4">
                    
                    {/* Overall Score Badge */}
                    <div className="flex items-center justify-between pb-3 border-b border-subtle">
                      <span className="text-xs font-bold text-muted uppercase tracking-wider font-mono">Moment Score</span>
                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-cyan-400 tabular-nums">
                          {clip.scores.overall}
                        </span>
                        <span className="text-xs font-normal text-muted font-mono">/100</span>
                      </div>
                    </div>

                    {/* Micro Score Progression Bars */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="flex justify-between text-sub mb-1 text-[11px]">
                          <span className="font-medium text-main">Hook Power</span>
                          <span className="font-mono tabular-nums font-bold text-amber-400">{clip.scores.hookStrength}%</span>
                        </div>
                        <div className="w-full bg-surface-ter h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full" style={{ width: `${clip.scores.hookStrength}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sub mb-1 text-[11px]">
                          <span className="font-medium text-main">Clarity</span>
                          <span className="font-mono tabular-nums font-bold text-cyan-400">{clip.scores.clarity}%</span>
                        </div>
                        <div className="w-full bg-surface-ter h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full" style={{ width: `${clip.scores.clarity}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sub mb-1 text-[11px]">
                          <span className="font-medium text-main">Audience Fit</span>
                          <span className="font-mono tabular-nums font-bold text-emerald-400">{clip.scores.audienceFit}%</span>
                        </div>
                        <div className="w-full bg-surface-ter h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full" style={{ width: `${clip.scores.audienceFit}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sub mb-1 text-[11px]">
                          <span className="font-medium text-main">Shareability</span>
                          <span className="font-mono tabular-nums font-bold text-indigo-400">{clip.scores.shareability}%</span>
                        </div>
                        <div className="w-full bg-surface-ter h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full" style={{ width: `${clip.scores.shareability}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Controls Row */}
                    <div className="pt-2 border-t border-subtle space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewModalClip(clip)}
                          className="px-3 py-2 text-xs font-bold text-main bg-surface-main hover:bg-surface-sub border border-subtle rounded-xl transition-all hover:border-indigo-500/40 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
                          <span>Preview</span>
                        </button>

                        <Link
                          to={`/project/${project.id}/clips/${clip.id}`}
                          className="px-3 py-2 text-xs font-bold text-main bg-surface-main hover:bg-surface-sub border border-subtle rounded-xl transition-all hover:border-indigo-500/40 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Edit Reel</span>
                        </Link>
                      </div>

                      {/* Approval & Rejection Handlers */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(clip.id)}
                          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                            isApproved
                              ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                              : 'bg-surface-main text-sub hover:text-emerald-400 border border-subtle'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isApproved ? 'Approved' : 'Approve'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReject(clip.id)}
                          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                            isRejected
                              ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                              : 'bg-surface-main text-sub hover:text-rose-400 border border-subtle'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{isRejected ? 'Rejected' : 'Reject'}</span>
                        </button>
                      </div>

                      {/* Render Reel button */}
                      <button
                        type="button"
                        onClick={() => handleRender(clip.id)}
                        disabled={clip.renderStatus === 'rendering'}
                        className="w-full px-3 py-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>
                          {clip.renderStatus === 'rendering'
                            ? `Rendering (${clip.renderProgress}%)`
                            : clip.renderStatus === 'ready'
                            ? '✓ Rendered & Ready'
                            : 'Simulate Render'}
                        </span>
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            </div>
            </StaggerItem>
          );
        })}
      </StaggerGroup>

      {/* Empty Filter State */}
      {filteredAndSortedClips.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-surface-main border border-subtle space-y-3">
          <Info className="w-8 h-8 text-sub mx-auto" />
          <h3 className="text-base font-bold text-main font-sans">No clips match your current filter</h3>
          <p className="text-xs text-sub">Try changing category or status filters to view other recommendations.</p>
          <button
            onClick={() => { setSelectedCategory('all'); setSelectedStatus('all'); }}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-md"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Slide-out Reasoning Drawer */}
      <ReasoningDrawer
        clip={selectedClipForReasoning}
        isOpen={Boolean(selectedClipForReasoning)}
        onClose={() => setSelectedClipForReasoning(null)}
        onApprove={handleApprove}
        onEdit={(clipId) => navigate(`/project/${project.id}/clips/${clipId}`)}
      />

      {/* Quick 9:16 Preview Modal */}
      {previewModalClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="studio-card p-6 max-w-sm w-full space-y-4 shadow-2xl border border-indigo-500/30">
            <div className="flex items-center justify-between pb-2 border-b border-subtle">
              <h3 className="text-sm font-bold text-main truncate max-w-[200px]">
                {previewModalClip.title}
              </h3>
              <button
                onClick={() => setPreviewModalClip(null)}
                className="text-sub hover:text-main text-xs font-bold"
              >
                Close
              </button>
            </div>

            <VideoReelPlayer
              clip={previewModalClip}
              videoUrl={previewModalClip.renderedVideoUrl || localBlob}
              backdropUrl={project.thumbnailUrl}
              autoplay={true}
            />

            <div className="flex items-center justify-between pt-2">
              <Link
                to={`/project/${project.id}/clips/${previewModalClip.id}`}
                className="text-xs font-bold text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono"
              >
                <span>Open in Studio Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setPreviewModalClip(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-surface-sub border border-subtle text-main hover:bg-surface-main"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
