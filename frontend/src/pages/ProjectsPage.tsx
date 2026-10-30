import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Filter,
  Film,
  Trash2,
  ExternalLink,
  Clock,
  Sparkles,
  Layers,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { Project } from '../types';
import { StaggerGroup, StaggerItem } from '../components/common/Reveal';
import { toast } from 'sonner';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, deleteProject } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'draft'>('all');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Brief skeleton state so the grid fades in gracefully on first paint
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesPlatform = p.platform.toLowerCase().includes(query);
        const matchesAudience = p.targetAudience.toLowerCase().includes(query);
        const matchesType = p.videoType.toLowerCase().includes(query);
        return matchesTitle || matchesPlatform || matchesAudience || matchesType;
      }
      return true;
    });
  }, [projects, statusFilter, searchQuery]);

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      toast.success(`Deleted "${projectToDelete.title}"`);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Library</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-main font-sans">
            Video Repurposing Projects
          </h1>
          <p className="text-xs text-sub mt-1">
            All long-form source videos and their generated reels dossiers.
          </p>
        </div>

        <div>
          <Link
            to="/upload"
            className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 text-cyan-300" />
            <span>New Video Project</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, audience, or platform..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-main border border-subtle text-xs text-main placeholder:text-muted focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'all', label: 'All Projects' },
            { id: 'completed', label: 'Completed' },
            { id: 'processing', label: 'Processing' },
            { id: 'draft', label: 'Drafts' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/40 shadow-sm'
                  : 'text-sub hover:text-main hover:bg-surface-main/80 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Projects Grid */}
      {!isReady ? (
        /* Loading skeleton grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Loading projects">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="studio-card rounded-2xl border border-subtle overflow-hidden animate-pulse">
              <div className="aspect-16/9 bg-surface-ter" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-surface-ter rounded-md w-4/5" />
                <div className="h-3 bg-surface-ter rounded-md w-2/3" />
                <div className="flex gap-2 pt-1">
                  <div className="h-6 w-16 bg-surface-ter rounded-md" />
                  <div className="h-6 w-12 bg-surface-ter rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-surface-main border border-subtle space-y-4">
          <FolderOpen className="w-10 h-10 text-muted mx-auto" />
          <h3 className="text-lg font-bold font-sans text-main">No projects found</h3>
          <p className="text-xs text-sub max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No projects match your current search criteria. Try resetting your search or filter.'
              : 'You have not uploaded any video projects yet. Create your first project to get started.'}
          </p>
          <div className="pt-2">
            <Link
              to="/upload"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-md"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create First Project</span>
            </Link>
          </div>
        </div>
      ) : (
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {filteredProjects.map((project, idx) => {
            const approvedCount = project.clips.filter(c => c.approvalStatus === 'approved').length;

            return (
              <StaggerItem key={project.id}>
              <div
                className="studio-card rounded-2xl border border-subtle overflow-hidden shadow-sm flex flex-col justify-between group h-full"
              >
                <div>
                  {/* Thumbnail banner */}
                  <div className="relative aspect-16/9 bg-neutral-900 overflow-hidden">
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
                    
                    {/* Top badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-mono">
                      <span className="font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 text-cyan-300">
                        {project.videoType}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold border ${
                        project.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : project.status === 'processing'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-neutral-800/80 text-white/80 border-white/10'
                      }`}>
                        {project.status === 'completed' ? 'Completed' : project.status === 'processing' ? 'Processing' : 'Draft'}
                      </span>
                    </div>

                    {/* Bottom duration overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-mono">
                      <span className="tabular-nums font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">{project.formattedDuration}</span>
                      <span className="text-[11px] text-white/80">{project.createdAt}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold font-sans text-main line-clamp-1 group-hover:text-indigo-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-sub line-clamp-2 leading-relaxed">
                      {project.primaryGoal}
                    </p>

                    {/* Clean Metadata Strip */}
                    <div className="pt-2 border-t border-subtle flex items-center justify-between text-xs text-sub font-mono">
                      <span>
                        <strong className="text-cyan-400">{project.clips.length}</strong> reels found
                      </span>
                      <span>·</span>
                      <span>
                        <strong className="text-emerald-400">{approvedCount}</strong> approved
                      </span>
                      <span>·</span>
                      <span className="capitalize text-main">
                        {project.platform}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3.5 bg-surface-sub/50 border-t border-subtle flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(project)}
                    className="p-1.5 rounded-lg text-sub hover:text-rose-400 hover:bg-surface-main transition-colors"
                    aria-label="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link
                    to={project.status === 'processing' ? `/project/${project.id}/processing` : `/project/${project.id}/clips`}
                    className="px-3.5 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 rounded-xl transition-all inline-flex items-center gap-1.5 group-hover:border-indigo-500/50"
                  >
                    <span>{project.status === 'processing' ? 'View Pipeline' : 'Open Studio'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="studio-card p-6 max-w-sm w-full space-y-4 shadow-2xl border border-rose-500/30">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-main font-sans">Delete Project?</h3>
            </div>
            <p className="text-xs text-sub leading-relaxed">
              Are you sure you want to delete <strong className="text-main">"{projectToDelete.title}"</strong> and all its extracted clips? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl text-sub hover:text-main hover:bg-surface-sub border border-subtle"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-500 shadow-md"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
