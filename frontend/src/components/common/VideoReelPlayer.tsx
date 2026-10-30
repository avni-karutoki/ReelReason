import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Smartphone, Eye, Flame } from 'lucide-react';
import { Clip, SubtitleStyle, SubtitlePosition } from '../../types';
import { formatSecondsToTime } from '../../utils/time';

interface VideoReelPlayerProps {
  clip: Clip;
  videoUrl?: string | null;
  backdropUrl?: string;
  autoplay?: boolean;
}

export const VideoReelPlayer: React.FC<VideoReelPlayerProps> = ({
  clip,
  videoUrl,
  backdropUrl,
  autoplay = false
}) => {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [currentTime, setCurrentTime] = useState(0); // relative to clip (0 to clip.duration)
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // If a real video file is loaded
  const hasRealVideo = Boolean(videoUrl && videoUrl.length > 0);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(autoplay);
  }, [clip.id, autoplay]);

  // Synchronize playback simulation when no real HTML5 video exists
  useEffect(() => {
    if (!hasRealVideo) {
      if (isPlaying) {
        timerRef.current = window.setInterval(() => {
          setCurrentTime(prev => {
            if (prev >= clip.duration) {
              return 0; // loop
            }
            return prev + 0.2;
          });
        }, 200);
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
      }
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isPlaying, hasRealVideo, clip.duration]);

  // Find active subtitle text at relative currentTime
  const absoluteCurrentTime = clip.startTime + currentTime;
  const activeSegment = clip.transcriptSegments?.find(
    s => absoluteCurrentTime >= s.start && absoluteCurrentTime <= s.end
  );
  const displaySubtitle = activeSegment ? activeSegment.text : clip.hook;

  const togglePlay = () => {
    if (hasRealVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    setCurrentTime(0);
    if (hasRealVideo && videoRef.current) {
      videoRef.current.currentTime = clip.startTime;
      videoRef.current.play().catch(console.error);
    }
    setIsPlaying(true);
  };

  // Helper for subtitle position classes
  const getPositionClass = (pos: SubtitlePosition) => {
    switch (pos) {
      case 'top':
        return 'top-16';
      case 'middle':
        return 'top-1/2 -translate-y-1/2';
      case 'lower-third':
      default:
        return 'bottom-20';
    }
  };

  // Helper for subtitle styles
  const getSubtitleStyling = (style: SubtitleStyle, color: string, fontSize: number) => {
    const baseStyle = { color, fontSize: `${fontSize}px` };
    switch (style) {
      case 'bold-punch':
        return {
          wrapper: 'bg-black/90 px-4 py-2 rounded-xl font-black tracking-tight text-center shadow-[0_4px_20px_rgba(0,0,0,0.8)] uppercase leading-tight border border-yellow-400/30 text-yellow-300 scale-105',
          style: { ...baseStyle, color: '#FACC15' }
        };
      case 'clean-editorial':
        return {
          wrapper: 'bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-xl font-medium text-center border border-white/15 leading-snug shadow-xl',
          style: baseStyle
        };
      case 'minimal-bottom':
        return {
          wrapper: 'text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] font-bold leading-relaxed tracking-wide',
          style: baseStyle
        };
      case 'karaoke-pop':
        return {
          wrapper: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-xl font-extrabold text-center shadow-[0_0_25px_rgba(99,102,241,0.5)] tracking-tight leading-snug border border-indigo-400/40',
          style: { ...baseStyle, color: '#FFFFFF' }
        };
      default:
        return { wrapper: 'bg-black/80 px-3.5 py-2 rounded-lg', style: baseStyle };
    }
  };

  const styleConfig = clip.styleConfig;
  const subtitleVisuals = getSubtitleStyling(
    styleConfig.subtitleStyle,
    styleConfig.textColor,
    styleConfig.fontSize
  );

  return (
    <div className="relative w-full max-w-[320px] mx-auto aspect-9/16 bg-neutral-950 rounded-3xl overflow-hidden border-2 border-indigo-500/25 shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex flex-col justify-between select-none group/player">
      
      {/* Background: Video or High-Fidelity Poster Backdrop */}
      {hasRealVideo ? (
        <video
          ref={videoRef}
          src={videoUrl || undefined}
          className="absolute inset-0 w-full h-full object-cover"
          muted={isMuted}
          playsInline
          onTimeUpdate={() => {
            if (videoRef.current) {
              const rel = videoRef.current.currentTime - clip.startTime;
              setCurrentTime(Math.max(0, rel));
              if (videoRef.current.currentTime >= clip.endTime) {
                videoRef.current.currentTime = clip.startTime;
              }
            }
          }}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full">
          <img
            src={backdropUrl || '/src/assets/images/hero_podcast_studio_1793292917369.jpg'}
            alt="Video preview background"
            className="w-full h-full object-cover opacity-85 transition-transform duration-700 ease-out"
            style={{ transform: isPlaying ? 'scale(1.04)' : 'scale(1)' }}
          />
          {/* Studio Vignette Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/60" />
        </div>
      )}

      {/* Top Header Overlay: Category, Audio Visualizer & Mute Toggle */}
      <div className="relative z-10 p-3.5 flex items-center justify-between text-white/95">
        <span className="text-[11px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-sm">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span className="text-white">{clip.category}</span>
        </span>

        {/* Dynamic Audio Visualizer wave bars */}
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
          <div className={`w-1 bg-cyan-400 rounded-full transition-all ${isPlaying ? 'animate-wave-1' : 'h-1.5'}`} />
          <div className={`w-1 bg-indigo-400 rounded-full transition-all ${isPlaying ? 'animate-wave-2' : 'h-3'}`} />
          <div className={`w-1 bg-violet-400 rounded-full transition-all ${isPlaying ? 'animate-wave-3' : 'h-2'}`} />
          <div className={`w-1 bg-cyan-300 rounded-full transition-all ${isPlaying ? 'animate-wave-4' : 'h-4'}`} />
          <div className={`w-1 bg-indigo-300 rounded-full transition-all ${isPlaying ? 'animate-wave-5' : 'h-2'}`} />
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-1.5 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/75 transition-colors text-white/90"
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
        </button>
      </div>

      {/* Subtitles Overlay */}
      <div
        className={`absolute inset-x-3 z-20 flex justify-center pointer-events-none transition-all duration-200 ${getPositionClass(
          styleConfig.position
        )}`}
      >
        <div
          className={`${subtitleVisuals.wrapper} max-w-[92%] transition-transform duration-150`}
          style={subtitleVisuals.style}
        >
          {displaySubtitle}
        </div>
      </div>

      {/* Watermark Overlay */}
      {styleConfig.watermarkEnabled && (
        <div className="absolute top-14 right-3 z-10 text-[10px] font-mono tracking-wider font-semibold text-white/90 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md border border-white/10">
          {styleConfig.creatorHandle || '@reelreason'}
        </div>
      )}

      {/* Center Play/Pause tap target */}
      <div
        onClick={togglePlay}
        className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer group"
      >
        {!isPlaying && (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.6)] group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(99,102,241,0.8)] transition-all duration-200 border border-indigo-400/40">
            <Play className="w-7 h-7 ml-1 fill-white" />
          </div>
        )}
      </div>

      {/* Bottom Bar: Timeline Scrubber, Playback Controls & Timestamp */}
      <div className="relative z-20 p-4 pt-8 bg-gradient-to-t from-black via-black/60 to-transparent">
        {/* Scrubber with glowing progress bar */}
        <div
          className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mb-3.5 cursor-pointer relative group/scrub"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const newSec = Math.max(0, Math.min(clip.duration, pos * clip.duration));
            setCurrentTime(newSec);
            if (hasRealVideo && videoRef.current) {
              videoRef.current.currentTime = clip.startTime + newSec;
            }
          }}
        >
          <div
            className="bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 h-full rounded-full transition-all duration-150 shadow-[0_0_10px_rgba(34,211,238,0.7)]"
            style={{ width: `${Math.min(100, (currentTime / (clip.duration || 1)) * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1 hover:text-cyan-400 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={restart}
              className="p-1 hover:text-cyan-400 transition-colors"
              aria-label="Restart clip"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="font-mono text-[11px] tabular-nums text-white/90 bg-black/40 px-2 py-0.5 rounded border border-white/10">
            {formatSecondsToTime(currentTime)} / {formatSecondsToTime(clip.duration)}
          </div>
        </div>
      </div>

    </div>
  );
};
