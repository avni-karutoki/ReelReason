import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Play,
  ChevronRight,
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  Activity,
  Clock,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Reveal, StaggerGroup, StaggerItem } from '../components/common/Reveal';

export const LandingPage: React.FC = () => {
  const { user, openAuthModal, loginAsGuest } = useAuth();

  return (
    <div className="min-h-screen bg-canvas text-main transition-colors duration-200 overflow-hidden">
      
      {/* Ambient background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-violet-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 border-b border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Headline & Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <Reveal>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 text-xs font-semibold tracking-wide shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Explainable AI Video Repurposing Studio</span>
              </div>
              </Reveal>

              <Reveal delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-main text-balance font-sans">
                Turn long videos into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">purposeful reels</span> worth watching.
              </h1>

              <p className="text-base sm:text-lg text-sub leading-relaxed max-w-xl mt-6">
                Extract high-converting moments, craft hook-driven captions, and understand the exact algorithmic reason why each clip deserves to be posted.
              </p>
              </Reveal>

              {/* Action Buttons */}
              <Reveal delay={0.2}>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/upload"
                  className="px-6 py-3.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 inline-flex items-center gap-2.5 group cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                  <span>Launch Video Studio</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    loginAsGuest();
                    window.location.href = '/projects';
                  }}
                  className="px-5 py-3.5 text-xs font-bold text-main bg-surface-main hover:bg-surface-sub border border-subtle hover:border-indigo-500/40 rounded-xl transition-all duration-200 inline-flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-indigo-500" />
                  <span>Try Demo (Instant Access)</span>
                </button>

                {(!user || user.isGuest) && (
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="px-4 py-3.5 text-xs font-semibold text-sub hover:text-main hover:bg-surface-sub/60 rounded-xl transition-all duration-200 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
              </Reveal>

              {/* Supported Multi-Platform Strip */}
              <Reveal delay={0.3}>
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-sub uppercase tracking-wider mb-2 font-mono">
                  Optimized Export For
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 text-xs font-semibold">
                    <Instagram className="w-3.5 h-3.5" />
                    Instagram Reels
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold">
                    <Youtube className="w-3.5 h-3.5" />
                    YouTube Shorts
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold">
                    <Facebook className="w-3.5 h-3.5" />
                    Facebook Reels
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-semibold">
                    <Linkedin className="w-3.5 h-3.5" />
                    LinkedIn Video
                  </span>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-sub">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  100% Client-Side Privacy
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  Explainable Virality Scores
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-violet-500" />
                  Export Ready .SRT Subtitles
                </span>
              </div>
              </Reveal>
            </div>

            {/* Right Column: Explainable analysis preview */}
            <div className="lg:col-span-5 relative">
              <Reveal delay={0.25} y={28} scale={0.97}>
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-cyan-400/15 blur-2xl" />
                  <div className="relative rounded-3xl bg-surface-main p-5 sm:p-6 border border-subtle shadow-2xl">
                    <div className="flex items-start justify-between gap-4 pb-5 border-b border-subtle">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-main">Moment intelligence</p>
                          <p className="text-[11px] text-sub mt-0.5">A clear reason behind every pick</p>
                        </div>
                      </div>
                      <span className="shrink-0 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold uppercase tracking-wide">
                        Analysis ready
                      </span>
                    </div>

                    <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/5 border border-indigo-500/20">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider">Top recommendation</p>
                          <h3 className="text-base sm:text-lg font-bold text-main mt-1 leading-snug">The 3-question test before you post</h3>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="block text-2xl font-black font-mono text-cyan-300 leading-none">96</span>
                          <span className="text-[9px] text-sub font-mono">/ 100</span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-sub leading-relaxed">
                        A curiosity-led opening, a complete takeaway, and a clear reason to share.
                      </p>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <span className="font-semibold text-main">Why this moment works</span>
                        <span className="text-sub font-mono shrink-0">3 signals</span>
                      </div>
                      {[
                        { label: 'Hook strength', score: 97, color: 'from-amber-400 to-orange-400' },
                        { label: 'Story clarity', score: 92, color: 'from-cyan-400 to-blue-400' },
                        { label: 'Audience fit', score: 94, color: 'from-indigo-400 to-violet-400' },
                      ].map((signal) => (
                        <div key={signal.label} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2 text-[10px]">
                          <span className="text-sub">{signal.label}</span>
                          <div className="h-1.5 rounded-full bg-surface-ter overflow-hidden">
                            <div className={`h-full rounded-full bg-gradient-to-r ${signal.color}`} style={{ width: `${signal.score}%` }} />
                          </div>
                          <span className="text-main font-mono text-right">{signal.score}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 pt-4 border-t border-subtle">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="text-[11px] font-bold text-main">Recommended moments</span>
                        <span className="text-[10px] text-sub font-mono">3 of 8 ranked</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { time: '00:42', title: 'A counter-intuitive lesson', score: 96 },
                          { time: '01:18', title: 'The founder’s turning point', score: 91 },
                          { time: '02:46', title: 'One practical editing rule', score: 88 },
                        ].map((moment, index) => (
                          <div key={moment.time} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-sub/60 border border-subtle">
                            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-300 flex items-center justify-center text-[9px] font-mono font-bold shrink-0">0{index + 1}</span>
                            <span className="text-[10px] text-sub font-mono shrink-0">{moment.time}</span>
                            <span className="text-[11px] text-main truncate flex-1 min-w-0">{moment.title}</span>
                            <span className="text-[10px] text-cyan-300 font-mono font-bold shrink-0">{moment.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-[10px] text-sub truncate">Hours of footage, ranked with context</span>
                      </div>
                      <Link to="/upload" className="text-cyan-400 hover:underline shrink-0 text-[11px] font-semibold inline-flex items-center gap-1">
                        Try now <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

          </div>

        </div>
      </section>

      {/* Value Metrics Band */}
      <section className="py-12 border-b border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { metric: '10+ hrs', label: 'of weekly editing reclaimed per creator', accent: 'text-indigo-400' },
              { metric: '< 1 hr', label: 'from raw upload to fully captioned reels', accent: 'text-cyan-400' },
              { metric: '100%', label: 'explainable — every clip cites its reason', accent: 'text-emerald-400' },
              { metric: '0', label: 'files uploaded — analysis stays on your machine', accent: 'text-amber-400' },
            ].map((stat) => (
              <div key={stat.metric} className="flex flex-col gap-1.5 p-5 rounded-2xl bg-surface-main/50 border border-subtle">
                <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${stat.accent}`}>
                  {stat.metric}
                </span>
                <span className="text-[11px] text-sub leading-relaxed">{stat.label}</span>
              </div>
            ))}
          </div>
          </Reveal>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-28 border-b border-subtle bg-surface-main/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              The ReelReason Engine
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-sans text-main">
              Four steps from long video to viral reels
            </h2>
            <p className="text-sm text-sub">
              No generic automated chopping. ReelReason operates like a seasoned video director who identifies the true narrative crux.
            </p>
          </div>
          </Reveal>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <StaggerItem>
            <div className="studio-card p-6 rounded-2xl border border-subtle space-y-4 group h-full">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform">
                01
              </div>
              <h3 className="text-base font-bold text-main">Upload & Set Objective</h3>
              <p className="text-xs text-sub leading-relaxed">
                Drop your MP4/MOV or choose a sample masterclass. Set your target platform, audience, tone, and angle.
              </p>
            </div>
            </StaggerItem>

            <StaggerItem>
            <div className="studio-card p-6 rounded-2xl border border-subtle space-y-4 group h-full">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform">
                02
              </div>
              <h3 className="text-base font-bold text-main">Deep Narrative Extraction</h3>
              <p className="text-xs text-sub leading-relaxed">
                Identifies self-contained arguments, tension peaks, and contrarian claims that don't need 10 minutes of backstory.
              </p>
            </div>
            </StaggerItem>

            <StaggerItem>
            <div className="studio-card p-6 rounded-2xl border border-subtle space-y-4 group h-full">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-[0_0_15px_rgba(139,92,246,0.4)] group-hover:scale-105 transition-transform">
                03
              </div>
              <h3 className="text-base font-bold text-main">Transparent AI Reasoning</h3>
              <p className="text-xs text-sub leading-relaxed">
                Every recommended clip includes an auditable breakdown: hook strength, clarity score, and strategic posting order.
              </p>
            </div>
            </StaggerItem>

            <StaggerItem>
            <div className="studio-card p-6 rounded-2xl border border-subtle space-y-4 group h-full">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform">
                04
              </div>
              <h3 className="text-base font-bold text-main">Polish, Preview & Export</h3>
              <p className="text-xs text-sub leading-relaxed">
                Fine-tune hooks with 1-click alternative suggestions, customize subtitle styles, preview in 9:16, and download ready .SRT files.
              </p>
            </div>
            </StaggerItem>

          </StaggerGroup>

        </div>
      </section>

      {/* Purposeful Clipping vs Generic AI Slop */}
      <section className="py-20 md:py-24 border-b border-subtle bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <Reveal>
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                The Purposeful Advantage
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-sans text-main leading-tight">
                Why generic clippers create dead content
              </h2>
              <p className="text-sm text-sub leading-relaxed">
                Traditional tools slice by audio loudness or arbitrary silence cuts. The result is confusing mid-sentence fragments that viewers scroll past within two seconds.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-surface-main border border-rose-500/20 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs mt-0.5 shrink-0">
                    ✕
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-main">Generic AI Clippers</h4>
                    <p className="text-xs text-sub mt-0.5">
                      Extracts awkward fragments, generates robotic emoji-stuffed captions, and offers zero editorial rationale for why the clip would perform.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-main border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs mt-0.5 shrink-0">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-main">ReelReason Framework</h4>
                    <p className="text-xs text-sub mt-0.5">
                      Detects self-contained narrative arcs, pairs each moment with a tension-driven opening hook, and provides strategic posting placement.
                    </p>
                  </div>
                </div>
              </div>

            </div>
            </Reveal>

            {/* Before and After Card Comparison */}
            <Reveal delay={0.15}>
            <div className="studio-card p-6 rounded-2xl border border-subtle space-y-6">
              <h3 className="text-sm font-bold text-main uppercase tracking-wider flex items-center justify-between">
                <span>Before & After Transformation</span>
                <span className="font-mono text-xs text-cyan-400">Source: 48-Min Talk</span>
              </h3>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-surface-sub/50 border border-subtle">
                  <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1 font-mono">Before: Raw Fragment</div>
                  <p className="text-xs text-sub italic leading-relaxed">
                    "...and so if you think about how we did things back then, it was kinda like that other company where people just waited around..."
                  </p>
                  <span className="text-[10px] text-rose-400 font-mono font-medium mt-1 inline-block">
                    Weak hook · Missing thesis · 12% watch-through
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                  <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1 font-mono">After: ReelReason Hook Cut</div>
                  <p className="text-xs font-bold text-main leading-relaxed">
                    "Most creators spend 40 hours editing, but fail because they miss this one rule."
                  </p>
                  <p className="text-xs text-sub mt-1">
                    Direct thesis, sharp emotional stake, standalone takeaway, 97% hook score.
                  </p>
                </div>
              </div>
            </div>
            </Reveal>

          </div>

        </div>
      </section>

      {/* Creator-Aware Recommendations & Use Cases */}
      <section className="py-20 md:py-28 border-b border-subtle bg-surface-main/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
              Designed for Creators
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-sans text-main">
              Built for depth across content formats
            </h2>
            <p className="text-sm text-sub">
              Different formats require completely different cutting logic. ReelReason adapts seamlessly.
            </p>
          </div>
          </Reveal>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <StaggerItem>
            <div className="studio-card p-6 rounded-2xl border border-subtle space-y-3 group h-full">
              <h3 className="text-base font-bold text-main group-hover:text-indigo-400 transition-colors">Podcasters & Hosts</h3>
              <p className="text-xs text-sub leading-relaxed">
                Extract spontaneous vulnerability and unfiltered anecdotes that drive full-episode downloads and subscriber growth.
              </p>
              <div className="text-[11px] font-semibold text-cyan-400 pt-2 font-mono">
                Optimal format: Unexpected Story
              </div>
            </div>
            </StaggerItem>

            <StaggerItem>
            <div className="studio-card p-6 rounded-2xl border border-subtle space-y-3 group h-full">
              <h3 className="text-base font-bold text-main group-hover:text-indigo-400 transition-colors">Educators & Coaches</h3>
              <p className="text-xs text-sub leading-relaxed">
                Transform 60-minute webinars into 3-question filters and actionable micro-lessons that viewers save and bookmark.
              </p>
              <div className="text-[11px] font-semibold text-cyan-400 pt-2 font-mono">
                Optimal format: Actionable Framework
              </div>
            </div>
            </StaggerItem>

            <StaggerItem>
            <div className="studio-card p-6 rounded-2xl border border-subtle space-y-3 group h-full">
              <h3 className="text-base font-bold text-main group-hover:text-indigo-400 transition-colors">Technical Founders</h3>
              <p className="text-xs text-sub leading-relaxed">
                Clip keynote presentations into sharp engineering contrarian stances that build organic developer respect and talent pipeline.
              </p>
              <div className="text-[11px] font-semibold text-cyan-400 pt-2 font-mono">
                Optimal format: Contrarian Breakdown
              </div>
            </div>
            </StaggerItem>

          </StaggerGroup>

        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-24 bg-canvas text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-indigo-600/10 via-transparent to-transparent pointer-events-none" />
        <Reveal y={30}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black font-sans text-main tracking-tight">
            Ready to give every reel a reason?
          </h2>
          <p className="text-base text-sub max-w-xl mx-auto">
            Test the studio experience instantly in your browser. Upload your own video file or explore with our curated masterclasses.
          </p>
          <div className="pt-4">
            <Link
              to="/upload"
              className="px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_40px_rgba(99,102,241,0.7)] transition-all inline-flex items-center gap-2.5 group"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>Launch Studio Experience</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        </Reveal>
      </section>

    </div>
  );
};
