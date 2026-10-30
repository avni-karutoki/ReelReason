import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-subtle bg-surface-main/90 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                <Film className="w-3.5 h-3.5" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-main font-sans">
                Reel<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Reason</span>
              </span>
            </div>
            <p className="text-xs text-sub leading-relaxed">
              Purpose-driven video repurposing. Transform long recordings into high-retention vertical reels with transparent, explainable AI reasoning.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-main uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-xs text-sub">
              <li><Link to="/upload" className="hover:text-indigo-400 transition-colors">Video Studio</Link></li>
              <li><Link to="/projects" className="hover:text-indigo-400 transition-colors">Project History</Link></li>
              <li><Link to="/settings" className="hover:text-indigo-400 transition-colors">Brand Kit & Presets</Link></li>
              <li><a href="#how-it-works" className="hover:text-indigo-400 transition-colors">Explainable AI Rubric</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-main uppercase tracking-wider mb-3">Target Audiences</h4>
            <ul className="space-y-2 text-xs text-sub">
              <li><span className="hover:text-main cursor-default">Podcast & Show Hosts</span></li>
              <li><span className="hover:text-main cursor-default">Educators & Course Creators</span></li>
              <li><span className="hover:text-main cursor-default">Founders & Keynote Speakers</span></li>
              <li><span className="hover:text-main cursor-default">Content & Growth Agencies</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-main uppercase tracking-wider mb-3">Architecture</h4>
            <p className="text-xs text-sub leading-relaxed mb-3">
              100% Client-Side Studio. Ready for direct connection with transcription, LLM, and video rendering pipelines.
            </p>
            <div className="text-xs text-cyan-400/90 font-mono">
              Privacy-first: Local media remains isolated inside browser memory.
            </div>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-sub">
          <div>
            © {new Date().getFullYear()} ReelReason AI Studio. Built for high-conversion creator workflows.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/upload" className="hover:text-indigo-400 transition-colors">Launch Studio</Link>
            <Link to="/settings" className="hover:text-indigo-400 transition-colors">Settings</Link>
            <span className="text-sub/50">·</span>
            <span className="inline-flex items-center gap-1.5 text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Frontend-Ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
