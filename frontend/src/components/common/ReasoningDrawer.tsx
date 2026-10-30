import React from 'react';
import { X, Sparkles, Target, Zap, Eye, Share2, Compass, Layers, AlertCircle, CheckCircle2, ScanSearch, GitBranch } from 'lucide-react';
import { Clip } from '../../types';
import { resolveAnalysis, weightedOverall } from '../../utils/analysis';

interface ReasoningDrawerProps {
  clip: Clip | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (clipId: string) => void;
  onEdit?: (clipId: string) => void;
}

export const ReasoningDrawer: React.FC<ReasoningDrawerProps> = ({
  clip,
  isOpen,
  onClose,
  onApprove,
  onEdit
}) => {
  if (!isOpen || !clip) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-surface-main border-l border-subtle shadow-2xl flex flex-col justify-between overflow-y-auto transition-transform duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-subtle flex items-start justify-between gap-4 bg-gradient-to-r from-indigo-950/20 via-transparent to-transparent">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Explainable AI Selection Logic</span>
              </div>
              <h2 className="text-xl font-extrabold text-main font-sans tracking-tight">
                Why This Moment Was Chosen
              </h2>
              <p className="text-xs text-sub mt-1">
                Algorithmic rationale for: <span className="text-main font-semibold">{clip.title}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-sub hover:text-main hover:bg-surface-sub transition-colors border border-transparent hover:border-subtle"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 space-y-6 flex-1 text-sm">

            {/* Scorecard Strip with Electric Neon Accents */}
            <div className="bg-surface-sub/60 p-5 rounded-2xl border border-subtle relative overflow-hidden group">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-xs font-semibold text-sub block">Predicted Virality Potential</span>
                  <span className="text-[11px] text-muted">Multi-factor engagement index</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black font-mono text-cyan-400 tabular-nums">
                    {clip.scores.overall}
                  </span>
                  <span className="text-xs font-normal text-sub">/100</span>
                </div>
              </div>

              {/* Progress metrics */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-subtle text-xs">
                <div>
                  <div className="flex justify-between text-sub mb-1.5 font-medium">
                    <span className="flex items-center gap-1.5 text-main"><Zap className="w-3.5 h-3.5 text-amber-400" /> Hook Strength</span>
                    <span className="font-mono tabular-nums font-bold text-amber-400">{clip.scores.hookStrength}%</span>
                  </div>
                  <div className="w-full bg-surface-ter rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${clip.scores.hookStrength}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sub mb-1.5 font-medium">
                    <span className="flex items-center gap-1.5 text-main"><Eye className="w-3.5 h-3.5 text-cyan-400" /> Story Clarity</span>
                    <span className="font-mono tabular-nums font-bold text-cyan-400">{clip.scores.clarity}%</span>
                  </div>
                  <div className="w-full bg-surface-ter rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${clip.scores.clarity}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sub mb-1.5 font-medium">
                    <span className="flex items-center gap-1.5 text-main"><Target className="w-3.5 h-3.5 text-emerald-400" /> Target Fit</span>
                    <span className="font-mono tabular-nums font-bold text-emerald-400">{clip.scores.audienceFit}%</span>
                  </div>
                  <div className="w-full bg-surface-ter rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${clip.scores.audienceFit}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sub mb-1.5 font-medium">
                    <span className="flex items-center gap-1.5 text-main"><Share2 className="w-3.5 h-3.5 text-indigo-400" /> Shareability</span>
                    <span className="font-mono tabular-nums font-bold text-indigo-400">{clip.scores.shareability}%</span>
                  </div>
                  <div className="w-full bg-surface-ter rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500" style={{ width: `${clip.scores.shareability}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Transparent Weighted Scoring Breakdown */}
            {(() => {
              const analysis = resolveAnalysis(clip);
              const derived = weightedOverall(analysis.factors);
              return (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5 font-mono">
                    <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                    Scoring Weights & Formula
                  </h3>

                  <div className="bg-surface-sub/50 p-4 rounded-xl border border-subtle space-y-3">
                    {/* Stacked contribution bar */}
                    <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-surface-ter">
                      {analysis.factors.map((f, fi) => (
                        <div
                          key={f.label}
                          className={[
                            'h-full transition-all duration-700',
                            'bg-gradient-to-r', fi === 0 ? 'from-amber-400 to-amber-500' :
                            fi === 1 ? 'from-cyan-400 to-blue-500' :
                            fi === 2 ? 'from-emerald-400 to-teal-500' :
                            'from-indigo-500 to-violet-500'
                          ].join(' ')}
                          style={{ width: `${(f.score * f.weight) / derived}%` }}
                          title={`${f.label}: ${Math.round((f.score * f.weight) / derived)} pts`}
                        />
                      ))}
                    </div>

                    {/* Formula line */}
                    <p className="text-[11px] text-sub font-mono leading-relaxed">
                      <span className="text-main font-semibold">Overall = </span>
                      {analysis.factors.map((f, fi) => (
                        <span key={f.label}>
                          {fi > 0 && <span className="text-muted"> + </span>}
                          <span>
                            ({f.score}<span className="text-muted">×</span>{f.weight}%)
                          </span>
                        </span>
                      ))}
                      <span className="text-muted"> / 100 </span>
                      <span className="text-muted">= </span>
                      <span className="text-cyan-400 font-bold">{derived}/100</span>
                    </p>

                    {/* Factor rows */}
                    <div className="space-y-2 pt-1">
                      {analysis.factors.map((f, fi) => (
                        <div key={f.label} className="p-3 rounded-lg bg-surface-main border border-subtle">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-main flex items-center gap-1.5">
                              <span className={[
                                'w-1.5 h-1.5 rounded-full',
                                fi === 0 ? 'bg-amber-400' : fi === 1 ? 'bg-cyan-400' :
                                fi === 2 ? 'bg-emerald-400' : 'bg-indigo-400'
                              ].join(' ')} />
                              {f.label}
                            </span>
                            <span className="flex items-center gap-2 font-mono text-[10px]">
                              <span className="px-1.5 py-0.5 rounded bg-surface-sub border border-subtle text-sub">
                                weight {f.weight}%
                              </span>
                              <span className={[
                                'font-bold tabular-nums',
                                fi === 0 ? 'text-amber-400' : fi === 1 ? 'text-cyan-400' :
                                fi === 2 ? 'text-emerald-400' : 'text-indigo-400'
                              ].join(' ')}>
                                {f.score}%
                              </span>
                            </span>
                          </div>
                          <p className="text-[11px] text-sub leading-relaxed">{f.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Candidate Scan Funnel */}
            {(() => {
              const analysis = resolveAnalysis(clip);
              return (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5 font-mono">
                    <ScanSearch className="w-3.5 h-3.5 text-cyan-400" />
                    Selection Scan
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { value: analysis.candidatesScanned, label: 'Windows Scanned' },
                      { value: analysis.finalistsConsidered, label: 'Finalists Ranked' },
                      { value: 1, label: 'Moment Selected' },
                    ].map((s, si) => (
                      <div key={s.label} className={`p-3 rounded-xl border ${
                        si === 2
                          ? 'bg-cyan-500/10 border-cyan-500/30'
                          : 'bg-surface-sub/40 border-subtle'
                      }`}>
                        <span className={`text-lg font-black font-mono tabular-nums block ${
                          si === 2 ? 'text-cyan-400' : 'text-main'
                        }`}>
                          {s.value}
                        </span>
                        <span className="text-[10px] text-sub font-mono">{s.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px]">
                    <span className="text-sub">
                      Runner-up scored <strong className="text-main font-mono">{clip.scores.overall - analysis.runnerUpGap}/100</strong>
                      <span className="text-muted"> · +{analysis.runnerUpGap} pt gap justified selection</span>
                    </span>
                    <span className="shrink-0 px-2 py-1 rounded-lg bg-surface-main border border-subtle font-mono font-bold text-emerald-400">
                      Confidence {analysis.confidence}%
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Why The Moment Was Selected */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5 font-mono">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Primary Selection Factor
              </h3>
              <p className="text-main leading-relaxed bg-surface-sub/50 p-4 rounded-xl border border-subtle">
                {clip.reasoning.selectionReason}
              </p>
            </div>

            {/* Hook Breakdown */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5 font-mono">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Opening Hook Mechanics
              </h3>
              <div className="p-4 rounded-xl border border-subtle bg-surface-sub/50 space-y-2.5">
                <p className="italic text-main font-semibold border-b border-subtle pb-2 text-sm text-indigo-300">
                  "{clip.hook}"
                </p>
                <p className="text-xs text-sub leading-relaxed">
                  {clip.reasoning.hookBreakdown}
                </p>
              </div>
            </div>

            {/* Audience & Category Alignment */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-subtle bg-surface-sub/40 space-y-1">
                <span className="text-[11px] text-muted block font-mono">Format Taxonomy</span>
                <span className="font-semibold text-main text-xs">{clip.category}</span>
              </div>
              <div className="p-3.5 rounded-xl border border-subtle bg-surface-sub/40 space-y-1">
                <span className="text-[11px] text-muted block font-mono">Optimized Destination</span>
                <span className="font-semibold text-main text-xs text-cyan-400">{clip.reasoning.recommendedPlatform}</span>
              </div>
            </div>

            {/* Suggested Posting Position */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5 font-mono">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Strategic Posting Order
              </h3>
              <p className="text-xs text-main bg-indigo-500/10 p-3.5 rounded-xl border border-indigo-500/20">
                {clip.reasoning.suggestedPostingPosition}
              </p>
            </div>

            {/* Retention Warning if any */}
            {clip.reasoning.retentionWarning && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <span className="font-bold block text-amber-300">Editorial Advisory</span>
                  <span className="text-amber-200/90">{clip.reasoning.retentionWarning}</span>
                </div>
              </div>
            )}

            {/* Simulation disclosure */}
            <div className="text-[11px] text-muted font-mono italic border-t border-subtle pt-4">
              * Demo mode: scoring metrics are generated by local client-side heuristics. In production, these run server-side against full transcripts and platform metadata.
            </div>

          </div>

          {/* Footer actions */}
          <div className="p-5 border-t border-subtle bg-surface-sub/50 flex items-center justify-end gap-3">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(clip.id);
                }}
                className="px-4 py-2 text-xs font-semibold text-main hover:bg-surface-main border border-subtle rounded-xl transition-all hover:border-indigo-500/50"
              >
                Open in Editor
              </button>
            )}
            {onApprove && clip.approvalStatus !== 'approved' && (
              <button
                onClick={() => {
                  onApprove(clip.id);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Clip</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
