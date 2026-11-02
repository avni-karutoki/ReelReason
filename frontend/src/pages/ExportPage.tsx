import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download,
  Copy,
  Check,
  Film,
  FileText,
  Sparkles,
  ArrowLeft,
  Share2,
  AlertCircle,
  Play,
  CheckCircle2,
  ExternalLink,
  Layers,
  Flame,
  Instagram,
  Youtube,
  Facebook,
  Linkedin
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { Clip } from '../types';
import { VideoReelPlayer } from '../components/common/VideoReelPlayer';
import { downloadSrtFile, downloadMetadataPackage } from '../utils/srt';
import { formatSecondsToTime } from '../utils/time';
import { toast } from 'sonner';

export const ExportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getProject, simulateClipRender, renderAllApproved, getVideoBlobUrl } = useProjects();

  const project = getProject(id || '');
  const localBlob = project ? getVideoBlobUrl(project.id) : null;

  const approvedClips = project?.clips.filter(c => c.approvalStatus === 'approved') || [];
  const [selectedClipId, setSelectedClipId] = useState<string>(
    approvedClips[0]?.id || project?.clips[0]?.id || ''
  );

  const [copiedType, setCopiedType] = useState<string | null>(null);

  const activeClip = project?.clips.find(c => c.id === selectedClipId) || approvedClips[0] || project?.clips[0];
  // Prefer the backend-rendered 9:16 reel MP4 when it exists; otherwise preview the raw source.
  const renderedVideoUrl = activeClip?.renderedVideoUrl || null;
  const previewVideoUrl = renderedVideoUrl || localBlob;

  if (!project) {
    return (
      <div className="min-h-screen bg-canvas text-main flex items-center justify-center p-4">
        <div className="studio-card p-8 rounded-2xl border border-subtle max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-bold font-sans text-main">Project Not Found</h2>
          <Link to="/projects" className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-md">
            Return to Projects
          </Link>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success(`Copied ${type} to clipboard`);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadSrt = (clip: Clip) => {
    downloadSrtFile(clip);
    toast.success('Downloaded .srt subtitle file');
  };

  const handleDownloadPackage = (clip: Clip) => {
    downloadMetadataPackage(clip);
    toast.success('Downloaded complete reel package (text & captions)');
  };

  const handleDownloadMp4 = async () => {
    // 1) Prefer the actual backend-rendered vertical reel
    if (renderedVideoUrl) {
      try {
        const res = await fetch(renderedVideoUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `${activeClip ? activeClip.title.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'reel'}_9x16.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
        toast.success('Downloaded the rendered 9:16 reel');
      } catch {
        // CORS or network hiccup — open the MP4 directly as a fallback
        window.open(renderedVideoUrl, '_blank');
        toast.info('Opened the rendered reel in a new tab — use your browser to save it');
      }
      return;
    }
    // 2) Fall back to the raw source asset attached in this session
    if (localBlob) {
      const link = document.createElement('a');
      link.href = localBlob;
      link.download = `${activeClip ? activeClip.title.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'reel'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Downloading raw source footage (render first for the 9:16 reel)');
    } else {
      toast.info('No rendered reel yet — trigger a render to export the final 9:16 MP4.');
    }
  };

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div className="flex items-center gap-3">
          <Link
            to={`/project/${project.id}/clips`}
            className="p-2 rounded-xl text-sub hover:text-main hover:bg-surface-main transition-colors border border-subtle"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-sub font-mono">
              <Link to={`/project/${project.id}/clips`} className="hover:text-indigo-400">{project.title}</Link>
              <span>/</span>
              <span className="text-cyan-400 font-semibold">Export & Publishing Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-sans text-main">
              Publishing & Export Hub
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => renderAllApproved(project.id)}
            className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-all flex items-center gap-1.5"
          >
            <Film className="w-3.5 h-3.5 text-cyan-300" />
            <span>Render Reels ({approvedClips.length})</span>
          </button>
        </div>
      </div>

      {/* Informational Banner */}
      <div className="p-4 rounded-xl bg-surface-sub/60 border border-subtle flex flex-wrap items-center justify-between gap-4 text-xs text-sub shadow-sm">
        <div className="flex items-center gap-3">
          <Share2 className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-main">
            <strong className="text-indigo-600 dark:text-indigo-400">Publishing Workflow:</strong> Download synchronized SRT captions, copy optimized copy, and publish to supported vertical video platforms.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 font-semibold border border-pink-500/20">
            <Instagram className="w-3 h-3" /> Instagram Reels
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-semibold border border-red-500/20">
            <Youtube className="w-3 h-3" /> YouTube Shorts
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
            <Facebook className="w-3 h-3" /> Facebook Reels
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20">
            <Linkedin className="w-3 h-3" /> LinkedIn
          </span>
        </div>
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Approved Clips List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="studio-card p-4 rounded-2xl border border-subtle shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-subtle">
              <h2 className="text-xs font-bold text-main uppercase tracking-wider font-mono">
                Approved Reels ({approvedClips.length})
              </h2>
              <Link
                to={`/project/${project.id}/clips`}
                className="text-xs font-semibold text-cyan-400 hover:underline font-mono"
              >
                Review Clips
              </Link>
            </div>

            {approvedClips.length === 0 ? (
              <div className="p-8 text-center text-xs text-sub space-y-2">
                <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                <p>No clips have been marked approved yet.</p>
                <Link
                  to={`/project/${project.id}/clips`}
                  className="inline-block text-cyan-400 font-bold hover:underline font-mono"
                >
                  Go back to approve clips →
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {approvedClips.map((clip) => {
                  const isSelected = clip.id === selectedClipId;
                  return (
                    <div
                      key={clip.id}
                      onClick={() => setSelectedClipId(clip.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-indigo-500/15 border-indigo-500 text-main shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                          : 'bg-surface-main border-subtle hover:border-indigo-500/40 text-sub'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                          {clip.category}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-muted">
                          {clip.duration}s
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-main mt-1 line-clamp-1">
                        "{clip.hook}"
                      </h4>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-subtle text-[11px] font-mono">
                        <span className="flex items-center gap-1">
                          Score: <strong className="text-cyan-400">{clip.scores.overall}/100</strong>
                        </span>
                        <span className={`font-bold ${
                          clip.renderStatus === 'ready'
                            ? 'text-emerald-400'
                            : clip.renderStatus === 'rendering'
                            ? 'text-cyan-400'
                            : 'text-muted'
                        }`}>
                          {clip.renderStatus === 'ready'
                            ? 'Ready to Post'
                            : clip.renderStatus === 'rendering'
                            ? `Rendering ${clip.renderProgress}%`
                            : 'Render Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Simulated Rendering Status Card */}
          {activeClip && (
            <div className="studio-card p-5 rounded-2xl border border-subtle shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-main">Selected Reel Render State</span>
                <span className="font-bold text-cyan-400">
                  {activeClip.renderStatus === 'ready' ? '100% (Completed)' : `${activeClip.renderProgress}%`}
                </span>
              </div>

              <div className="w-full bg-surface-ter h-2.5 rounded-full overflow-hidden border border-subtle">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                  style={{ width: `${activeClip.renderStatus === 'ready' ? 100 : activeClip.renderProgress}%` }}
                />
              </div>

              {activeClip.renderStatus !== 'ready' && (
                <button
                  onClick={() => simulateClipRender(project.id, activeClip.id)}
                  className="w-full py-2.5 rounded-xl bg-surface-sub hover:bg-surface-main border border-subtle text-xs font-semibold text-main transition-colors"
                >
                  Render 9:16 Reel
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Preview & Download Actions (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {activeClip ? (
            <div className="studio-card p-6 rounded-2xl border border-subtle shadow-md space-y-6">
              
              {/* Visual split: 9:16 player on left, copy & downloads on right */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Vertical Player (5 cols) */}
                <div className="md:col-span-5">
                  <VideoReelPlayer
                    clip={activeClip}
                    videoUrl={previewVideoUrl}
                    backdropUrl={project.thumbnailUrl}
                    autoplay={false}
                  />
                </div>

                {/* Actions & Copy Controls (7 cols) */}
                <div className="md:col-span-7 space-y-4">
                  
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                      {activeClip.category}
                    </span>
                    <h3 className="text-lg font-bold font-sans text-main mt-0.5">
                      {activeClip.title}
                    </h3>
                    <p className="text-xs text-muted font-mono tabular-nums mt-0.5">
                      {formatSecondsToTime(activeClip.startTime)} – {formatSecondsToTime(activeClip.endTime)} ({activeClip.duration}s)
                    </p>
                  </div>

                  {/* Copy Caption Strip */}
                  <div className="p-3.5 bg-surface-sub/60 rounded-xl border border-subtle space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-main font-mono">Optimized Caption</span>
                      <button
                        onClick={() => copyToClipboard(activeClip.caption, 'caption')}
                        className="text-cyan-400 font-semibold hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
                      >
                        {copiedType === 'caption' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedType === 'caption' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-sub text-xs leading-relaxed line-clamp-3">
                      {activeClip.caption}
                    </p>
                  </div>

                  {/* Copy Hashtags Strip */}
                  <div className="p-3.5 bg-surface-sub/60 rounded-xl border border-subtle space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-main font-mono">Hashtags</span>
                      <button
                        onClick={() => copyToClipboard(activeClip.hashtags.join(' '), 'hashtags')}
                        className="text-cyan-400 font-semibold hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
                      >
                        {copiedType === 'hashtags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedType === 'hashtags' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="font-mono text-cyan-400/90 text-xs">
                      {activeClip.hashtags.join(' ')}
                    </p>
                  </div>

                  {/* Download Buttons Group */}
                  <div className="pt-2 border-t border-subtle space-y-2.5">
                    <button
                      onClick={() => handleDownloadSrt(activeClip)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-sub hover:bg-surface-main border border-subtle hover:border-indigo-500/40 text-xs font-semibold text-main transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span>Download Synchronized Subtitles (.SRT)</span>
                    </button>

                    <button
                      onClick={() => handleDownloadPackage(activeClip)}
                      className="w-full px-4 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-xs font-bold text-indigo-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Download className="w-4 h-4 text-indigo-400" />
                      <span>Download Complete Package (Text + SRT)</span>
                    </button>

                    <button
                      onClick={handleDownloadMp4}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-sub hover:bg-surface-main border border-subtle text-xs font-semibold text-muted hover:text-main transition-colors flex items-center justify-center gap-2"
                    >
                      <Film className="w-4 h-4" />
                      <span>{renderedVideoUrl ? 'Download Rendered 9:16 Reel (.MP4)' : localBlob ? 'Download Raw Source (Render First for Final 9:16)' : 'Render to Export the Final MP4'}</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>
          ) : null}
        </div>

      </div>

    </div>
  );
};
