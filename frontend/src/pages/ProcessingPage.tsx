import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  RotateCcw,
  FastForward,
  Film,
  Zap,
  Info,
  Layers,
  Cpu,
  Cloud
} from 'lucide-react';
import { toast } from 'sonner';
import { useProjects } from '../context/ProjectContext';
import { isBackendAvailable, projectStatus, listProjectClips } from '../api/client';
import { ensureBackendProbed, getBackendProjectId } from '../api/realMode';
import { backendStatusToStepIndex, backendClipToFrontend } from '../api/adapters';

const PROCESSING_STEPS = [
  { id: 1, label: 'Decoding Video Stream', detail: 'Parsing audio tracks and verifying codec keyframes' },
  { id: 2, label: 'Audio Vocal Isolation', detail: 'Separating background noise and normalizing dynamic decibels' },
  { id: 3, label: 'Timestamped Transcription', detail: 'Generating high-accuracy, word-level synchronized transcript' },
  { id: 4, label: 'Intent & Audience Synthesis', detail: 'Aligning with target platform, tone, and strategic goal' },
  { id: 5, label: 'High-Retention Moment Extraction', detail: 'Scoring emotional peaks, tension curves, and contrarian claims' },
  { id: 6, label: 'Audience Fit & Virality Ranking', detail: 'Auditing standalone clarity, hook retention, and shareability' },
  { id: 7, label: 'Writing Alternative Hooks & Captions', detail: 'Crafting 3 punchy opening angles, hashtags, and titles' },
  { id: 8, label: 'Synthesizing Vertical Reels', detail: 'Compiling 9:16 aspect previews, SRT tracks, and AI dossiers' }
];

export const ProcessingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, updateProject } = useProjects();

  const project = getProject(id || '');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(12);
  const [remainingSeconds, setRemainingSeconds] = useState(10);
  const [isError, setIsError] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFastForward, setIsFastForward] = useState(false);
  const [realBackendId, setRealBackendId] = useState<string | null>(null);

  // Detect whether this project is mirrored on the FastAPI backend
  // (upload flow registers the mapping asynchronously, so poll the registry briefly)
  useEffect(() => {
    if (!project) return;
    let cancelled = false;

    const existing = getBackendProjectId(project.id);
    if (existing) {
      setRealBackendId(existing);
      return;
    }

    const interval = setInterval(async () => {
      const backendId = getBackendProjectId(project.id);
      if (backendId && !cancelled) {
        clearInterval(interval);
        setRealBackendId(backendId);
        return;
      }
      const up = await ensureBackendProbed(isBackendAvailable);
      if (!up && !cancelled) clearInterval(interval); // pure local mode — simulation runs
    }, 1200);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [project?.id]);

  // Real pipeline polling: FastAPI drives progress, steps, and ETA
  useEffect(() => {
    if (!project || !realBackendId || isError || isPaused) return;
    let cancelled = false;

    const finalize = async () => {
      // Pull real generated clips into the local mirror so dashboard /
      // editor / export pages work against backend data
      try {
        const backendClips = await listProjectClips(realBackendId, { sortBy: 'score' });
        const projectTitle = project.title || 'Studio Video';
        const mappedClips = backendClips.map(c => backendClipToFrontend(c, projectTitle));
        if (mappedClips.length > 0) {
          updateProject(project.id, { status: 'completed', clips: mappedClips });
        } else {
          updateProject(project.id, { status: 'completed' });
        }
      } catch (e) {
        console.warn('Failed to load generated clips:', (e as Error)?.message || e);
        updateProject(project.id, { status: 'completed' });
      }
      if (!cancelled) toast.success('Analysis complete — reels ready');
      navigate(`/project/${project.id}/clips`);
    };

    const poll = async () => {
      try {
        const status = await projectStatus(realBackendId);
        if (cancelled) return;
        setProgress(status.progress_percentage);
        setCurrentStepIndex(Math.max(0, Math.min(7, backendStatusToStepIndex(status))));
        if (status.estimated_time_remaining_seconds !== null) {
          setRemainingSeconds(status.estimated_time_remaining_seconds);
        }
        if (status.status === 'completed') {
          clearInterval(timer);
          await finalize();
        } else if (status.status === 'failed') {
          clearInterval(timer);
          if (!cancelled) {
            setIsError(true);
            console.error('Pipeline failed:', status.error_message);
            toast.error(`Pipeline failed: ${status.error_message || 'unknown error'}`);
          }
        }
      } catch (e) {
        // Backend unreachable mid-run — gracefully continue with local simulation
        if (!cancelled) {
          setRealBackendId(null);
          toast.info('Backend connection lost — continuing local preview');
        }
      }
    };

    poll();
    const timer = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [project, realBackendId, isError, isPaused, navigate, updateProject]);

  // Local simulated pipeline (demo mode / offline fallback)
  useEffect(() => {
    if (!project) return;
    if (isError || isPaused) return;
    if (realBackendId) return; // real pipeline drives progress instead

    const intervalSpeed = isFastForward ? 200 : 1000;

    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const nextProgress = prevProgress + (isFastForward ? 20 : 12);

        // Calculate step index based on progress
        const stepIdx = Math.min(
          PROCESSING_STEPS.length - 1,
          Math.floor((nextProgress / 100) * PROCESSING_STEPS.length)
        );
        setCurrentStepIndex(stepIdx);

        // Update remaining seconds
        setRemainingSeconds((prevSec) => Math.max(0, prevSec - (isFastForward ? 3 : 1.3)));

        if (nextProgress >= 100) {
          clearInterval(interval);
          updateProject(project.id, { status: 'completed' });
          setTimeout(() => {
            navigate(`/project/${project.id}/clips`);
          }, 350);
          return 100;
        }

        return nextProgress;
      });
    }, intervalSpeed);

    return () => clearInterval(interval);
  }, [project, isError, isPaused, isFastForward, realBackendId, navigate, updateProject]);

  if (!project) {
    return (
      <div className="min-h-screen bg-canvas text-main flex items-center justify-center p-4">
        <div className="studio-card p-8 rounded-2xl border border-subtle max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold font-sans text-main">Project Not Found</h2>
          <p className="text-xs text-sub">
            The project ID "{id}" could not be retrieved from client storage.
          </p>
          <Link
            to="/upload"
            className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold"
          >
            Create New Project
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = PROCESSING_STEPS[currentStepIndex];

  return (
    <div className="w-full min-w-0 max-w-3xl mx-auto space-y-6 sm:space-y-8 py-3 sm:py-4">
      
      {/* Header Badge & Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 text-xs font-semibold tracking-wide font-mono">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span>AI Pipeline Active</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-sans text-main tracking-tight">
          {project.title}
        </h1>
        <p className="text-xs text-sub flex items-center justify-center gap-2 font-mono">
          <span>{project.sourceFilename}</span>
          <span>·</span>
          <span className="tabular-nums text-cyan-400">{project.sourceFileSize}</span>
          <span>·</span>
          <span>{project.numClipsRequested || 3} reels discovering</span>
        </p>
      </div>

      {/* Pipeline Mode Notice Banner */}
      <div className="p-3.5 rounded-xl bg-surface-sub/60 border border-subtle flex items-center justify-between text-xs text-sub">
        <div className="flex items-center gap-2">
          {realBackendId ? (
            <>
              <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><span className="text-emerald-400 font-bold">Live API mode</span> — structured pipeline runs on the backend engine</span>
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Simulating local inference pipeline — word-level attention heuristics</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsFastForward(!isFastForward)}
          disabled={Boolean(realBackendId)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            isFastForward
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)]'
              : 'bg-surface-main text-sub border-subtle hover:text-main'
          }`}
        >
          <FastForward className="w-3.5 h-3.5 text-cyan-300" />
          <span>{isFastForward ? 'Turbo Active' : 'Speed Up'}</span>
        </button>
      </div>

      {/* Main Processing Box */}
      <div className="studio-card p-6 sm:p-8 rounded-2xl border border-subtle space-y-8">
        
        {/* Progress Bar & ETA */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-main font-mono">
              Step {currentStepIndex + 1} of {PROCESSING_STEPS.length}: <span className="text-cyan-400">{currentStep.label}</span>
            </span>
            <span className="font-mono font-black text-cyan-400 tabular-nums text-base">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Visual Bar with glowing gradient */}
          <div className="w-full bg-surface-ter h-3 rounded-full overflow-hidden border border-subtle relative">
            <div
              className="bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(34,211,238,0.6)]"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-sub">
            <span className="text-muted truncate mr-2">{currentStep.detail}</span>
            <span className="font-mono tabular-nums flex items-center gap-1 text-cyan-400 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              ~{Math.round(remainingSeconds)}s remaining
            </span>
          </div>
        </div>

        {/* Detailed Steps Checklist */}
        <div className="space-y-2 pt-2 border-t border-subtle">
          {PROCESSING_STEPS.map((step, idx) => {
            const isPast = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-xl text-xs transition-all duration-200 ${
                  isCurrent
                    ? 'bg-indigo-500/15 border border-indigo-500/40 text-main shadow-sm'
                    : isPast
                    ? 'text-sub/90'
                    : 'text-sub/40'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isPast ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-subtle flex items-center justify-center text-[10px] font-mono text-muted">
                      {step.id}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`font-semibold ${isCurrent ? 'text-indigo-300 font-bold' : ''}`}>
                    {step.label}
                  </span>
                  {isCurrent && (
                    <p className="text-[11px] text-cyan-300/80 mt-0.5">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls: Cancel or Skip */}
        <div className="pt-4 border-t border-subtle flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setIsPaused(true);
              if (confirm('Cancel video analysis and return to upload?')) {
                navigate('/upload');
              } else {
                setIsPaused(false);
              }
            }}
            className="text-xs font-medium text-sub hover:text-rose-400 transition-colors flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              setProgress(100);
              updateProject(project.id, { status: 'completed' });
              navigate(`/project/${project.id}/clips`);
            }}
            className="px-4 py-2 text-xs font-semibold text-main hover:bg-surface-sub border border-subtle rounded-xl transition-all hover:border-indigo-500/50 flex items-center gap-1.5"
          >
            <span>Jump to Clip Dashboard</span>
            <FastForward className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>

      </div>

    </div>
  );
};
