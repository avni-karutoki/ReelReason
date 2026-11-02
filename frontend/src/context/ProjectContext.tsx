import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Project, Clip, UserSettings, ApprovalStatus, ClipCategory } from '../types';
import { mockProjects, defaultUserSettings, HERO_PODCAST_IMG } from '../data/mockData';
import * as api from '../api/client';
import { isRealProject, getBackendProjectId, looksLikeBackendClipId } from '../api/realMode';

interface ProjectContextType {
  projects: Project[];
  userSettings: UserSettings;
  theme: 'light' | 'dark' | 'system';
  isDarkMode: boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
  getProject: (id: string) => Project | undefined;
  getClip: (projectId: string, clipId: string) => Clip | undefined;
  createProject: (params: Partial<Project>, videoFile?: File | null) => string;
  /** Insert a backend project mirror without overwriting existing local state */
  upsertBackendProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  deleteAllProjects: () => void;
  updateClip: (projectId: string, clipId: string, updates: Partial<Clip>) => void;
  setClipApproval: (projectId: string, clipId: string, status: ApprovalStatus) => void;
  simulateClipRender: (projectId: string, clipId: string) => void;
  renderAllApproved: (projectId: string) => void;
  updateUserSettings: (updates: Partial<UserSettings>) => void;
  resetToMockData: () => void;
  getVideoBlobUrl: (projectId: string) => string | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY_PROJECTS = 'reelreason_projects_v1';
const STORAGE_KEY_SETTINGS = 'reelreason_settings_v1';
const STORAGE_KEY_THEME = 'reelreason_theme_v1';

// In-memory cache for user-uploaded video blob URLs
const localVideoBlobCache = new Map<string, string>();

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Projects State with localStorage fallback
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load projects from localStorage:', e);
    }
    return mockProjects;
  });

  // 2. Settings State
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...defaultUserSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load settings from localStorage:', e);
    }
    return defaultUserSettings;
  });

  // 3. Theme State
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME) as 'light' | 'dark' | 'system' | null;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.warn('Failed to load theme from localStorage:', e);
    }
    return 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Sync with system theme media query
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isDarkMode = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return systemIsDark;
  }, [theme, systemIsDark]);

  // Apply dark class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, newTheme);
    } catch (e) {
      console.warn('Failed to persist theme:', e);
    }
  };

  const toggleTheme = () => {
    if (isDarkMode) {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  // Sync projects to localStorage (excluding huge binary data)
  useEffect(() => {
    try {
      // Clean projects to ensure no large base64 or circular objects get serialized
      const serializableProjects = projects.map(p => ({
        ...p,
        // Do not store blob URLs in localStorage as they expire on refresh
        sourceVideoUrl: p.sourceVideoUrl?.startsWith('blob:') ? null : p.sourceVideoUrl
      }));
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(serializableProjects));
    } catch (e) {
      console.warn('Failed to persist projects to localStorage:', e);
    }
  }, [projects]);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(userSettings));
    } catch (e) {
      console.warn('Failed to persist settings to localStorage:', e);
    }
  }, [userSettings]);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);

  const getClip = useCallback((projectId: string, clipId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.clips.find(c => c.id === clipId);
  }, [projects]);

  const getVideoBlobUrl = useCallback((projectId: string) => {
    return localVideoBlobCache.get(projectId) || null;
  }, []);

  const createProject = useCallback((params: Partial<Project>, videoFile?: File | null): string => {
    const newId = `proj-${Date.now().toString(36)}`;
    
    // If a real video file is supplied, create a client-side object URL for local playback
    if (videoFile) {
      try {
        const objectUrl = URL.createObjectURL(videoFile);
        localVideoBlobCache.set(newId, objectUrl);
      } catch (e) {
        console.warn('Could not generate object URL for video file:', e);
      }
    }

    const durationSec = params.duration || 1800;
    const mins = Math.floor(durationSec / 60);
    const secs = durationSec % 60;
    const formattedDuration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    // Generate dynamic mock clips based on user's target parameters
    const clipTypesRequested = (params.clipTypes && params.clipTypes.length > 0)
      ? params.clipTypes
      : ['Strong Opinion', 'Practical Lesson', 'Unexpected Story'] as ClipCategory[];

    // New uploads must only show clips returned by analysis of this video.
    // The former local templates looked like real results even when the API
    // was offline, so keep the requested count but don't fabricate clips.
    const numClips = 0;
    const createdClips: Clip[] = [];

    const hookTemplates: Record<string, string[]> = {
      'Strong Opinion': [
        'Most creators spend hours editing but overlook the one decision that matters.',
        'The conventional advice on video growth is broken. Here is why.',
        'Why the most polished reels are actually getting ignored in 2026.'
      ],
      'Practical Lesson': [
        'Use these three questions before turning any long video into a reel.',
        'The exact 60-second retention framework top teams use every day.',
        'How to turn a 40-minute interview into 3 high-impact reels in minutes.'
      ],
      'Unexpected Story': [
        'The moment nobody expected became the most memorable part of the conversation.',
        'She stopped the recording and admitted what actually happened that night.',
        'We scrapped the entire agenda after this one unexpected realization.'
      ],
      'Framework Breakdown': [
        'The 3-stage mental model that completely changed how we think about content.',
        'A diagnostic teardown of why good videos fail to hold attention.',
        'The simple equation behind high-converting organic video.'
      ],
      'Counter-Intuitive Truth': [
        'Cutting your video shorter might actually be killing your watch time.',
        'The secret to high engagement isn\'t rapid pacing; it is cognitive tension.',
        'Why perfection in camera quality is hurting your audience connection.'
      ]
    };

    for (let i = 0; i < numClips; i++) {
      const cat = clipTypesRequested[i % clipTypesRequested.length] as ClipCategory;
      const hooks = hookTemplates[cat] || hookTemplates['Strong Opinion'];
      const hookText = hooks[i % hooks.length];

      const start = (i + 1) * 180 + Math.floor(Math.random() * 40);
      const dur = 45 + Math.floor(Math.random() * 20); // 45-65s

      createdClips.push({
        id: `clip-${newId}-${i + 1}`,
        projectId: newId,
        category: cat,
        hook: hookText,
        title: `${cat}: Key Takeaway #${i + 1}`,
        caption: `Extracted from ${params.title || 'the session'}. Focuses on high-impact insights tailored for ${params.targetAudience || 'your core audience'}.`,
        hashtags: ['#ReelsStrategy', '#ContentCreation', '#ShortFormVideo', '#VideoMarketing'],
        targetAudience: params.targetAudience || 'Curious professionals and creators',
        startTime: start,
        endTime: start + dur,
        duration: dur,
        scores: {
          overall: 91 + (i === 0 ? 4 : (i === 1 ? 1 : -2)),
          hookStrength: 93 + (i === 0 ? 4 : -1),
          clarity: 90 + (i === 1 ? 6 : 0),
          audienceFit: 92 + (i === 0 ? 3 : -1),
          shareability: 91 + (i === 2 ? 4 : 0)
        },
        reasoning: {
          selectionReason: `Identified as a high-density segment with an explicit thesis statement and zero conversational drag.`,
          targetAudienceAnalysis: `Strong alignment with ${params.targetAudience || 'target viewers'} interested in actionable strategies.`,
          hookBreakdown: `Opens with a clear, tension-driven hook that establishes immediate value.`,
          clarityNotes: `Crisp verbal structure with defined problem-solution arc.`,
          shareabilityFactor: `High standalone shareability for social DMs and bookmarks.`,
          suggestedPostingPosition: `Post ${i + 1}: ${i === 0 ? 'Lead Hook Reel' : (i === 1 ? 'Educational Anchor' : 'Perspective Shift')}`,
          recommendedPlatform: params.platform ? `${params.platform.replace('_', ' ').toUpperCase()}` : 'Instagram Reels & Facebook Reels',
          retentionWarning: i === 0 ? 'Tightened opening breath to ensure 0-second immediate drop into speech.' : undefined
        },
        analysis: {
          factors: [
            { label: 'Hook Tension', weight: 30, score: 93 + (i === 0 ? 4 : -1), note: 'Opens with a clear, tension-driven hook that establishes immediate value.' },
            { label: 'Clarity Arc', weight: 25, score: 90 + (i === 1 ? 6 : 0), note: 'Crisp verbal structure with a defined problem-solution arc.' },
            { label: 'Audience Fit', weight: 25, score: 92 + (i === 0 ? 3 : -1), note: `Strong alignment with ${params.targetAudience || 'target viewers'} and their current intent.` },
            { label: 'Share Trigger', weight: 20, score: 91 + (i === 2 ? 4 : 0), note: 'Stands alone without backstory, making it shareable in DMs and saves.' }
          ],
          confidence: 82 + Math.floor(Math.random() * 14),
          candidatesScanned: 140 + Math.floor(Math.random() * 180),
          finalistsConsidered: 5 + Math.floor(Math.random() * 3),
          runnerUpGap: 2 + Math.floor(Math.random() * 7)
        },
        alternativeHooks: [
          `Alternative angle: What happens when you test this principle in real life.`,
          `The counter-narrative that experienced creators swear by.`,
          `If you only remember one insight from this 30-minute talk, remember this.`
        ],
        alternativeCaptions: [
          `Full breakdown of this moment from our recent discussion. Bookmark this for your next video planning session.`,
          `Why this single segment provoked the most questions during the live conversation.`
        ],
        approvalStatus: i === 0 ? 'approved' : 'pending',
        renderStatus: i === 0 ? 'ready' : 'pending',
        renderProgress: i === 0 ? 100 : 0,
        styleConfig: {
          subtitleStyle: userSettings.defaultSubtitleStyle || 'bold-punch',
          fontSize: 26,
          textColor: '#FFFFFF',
          position: 'lower-third',
          watermarkEnabled: userSettings.watermarkEnabled,
          creatorHandle: userSettings.creatorHandle || '@reelreason'
        },
        transcriptSegments: [
          { start: start, end: start + 6, text: hookText },
          { start: start + 6, end: start + 16, text: "When you analyze the difference between what holds attention and what gets swiped past, the pattern is obvious." },
          { start: start + 16, end: start + 30, text: "It is never about louder sound effects or faster jumps. It is about emotional coherence and singular clarity." },
          { start: start + 30, end: start + dur, text: "If the audience understands why this moment matters to their own life, they will watch every single frame." }
        ]
      });
    }

    const newProject: Project = {
      id: newId,
      title: params.title || 'Untitled Studio Video',
      sourceFilename: params.sourceFilename || 'uploaded_video.mp4',
      sourceFileSize: params.sourceFileSize || '450 MB',
      sourceVideoUrl: localVideoBlobCache.get(newId) || null,
      youtubeUrl: params.youtubeUrl || null,
      thumbnailUrl: params.thumbnailUrl || HERO_PODCAST_IMG,
      duration: durationSec,
      formattedDuration,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'processing', // starts in processing, will be updated when simulation completes
      videoType: params.videoType || 'podcast',
      platform: params.platform || 'reels',
      primaryGoal: params.primaryGoal || 'Repurpose key highlights into high-performing short clips',
      targetAudience: params.targetAudience || 'General creator audience',
      tone: params.tone || 'Thoughtful & Analytical',
      clipTypes: clipTypesRequested,
      numClipsRequested: params.numClipsRequested || 3,
      language: params.language || 'English',
      clips: createdClips,
      exportCount: 0
    };

    setProjects(prev => [newProject, ...prev]);
    return newId;
  }, [userSettings]);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, ...updates };
      }
      return p;
    }));
  }, []);

  const upsertBackendProject = useCallback((project: Project) => {
    setProjects(prev => (prev.some(p => p.id === project.id) ? prev : [project, ...prev]));
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    // Server-side cascade delete (transcripts, clips, storage objects) for mirrored projects
    if (isRealProject(projectId)) {
      const backendId = getBackendProjectId(projectId);
      if (backendId) {
        api.deleteProject(backendId).catch((e) => console.warn('Backend project delete failed:', (e as Error)?.message || e));
      }
    }

    // Revoke cached blob URL if any
    const existingBlob = localVideoBlobCache.get(projectId);
    if (existingBlob && existingBlob.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(existingBlob);
      } catch (e) {
        console.warn('Error revoking blob url:', e);
      }
      localVideoBlobCache.delete(projectId);
    }

    setProjects(prev => prev.filter(p => p.id !== projectId));
  }, []);

  const deleteAllProjects = useCallback(() => {
    // Revoke all cached blob URLs
    localVideoBlobCache.forEach(url => {
      if (url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn('Error revoking blob url:', e);
        }
      }
    });
    localVideoBlobCache.clear();
    setProjects([]);
  }, []);

  const updateClip = useCallback((projectId: string, clipId: string, updates: Partial<Clip>) => {
    // Write-through sync: keep the FastAPI backend authoritative for mirrored projects
    if (isRealProject(projectId) && looksLikeBackendClipId(clipId)) {
      const patch: api.ClipPatch = {};
      if (updates.hook !== undefined) patch.hook = updates.hook;
      if (updates.title !== undefined) patch.title = updates.title;
      if (updates.caption !== undefined) patch.caption = updates.caption;
      if (updates.hashtags !== undefined) patch.hashtags = updates.hashtags;
      if (updates.startTime !== undefined) patch.start_time = updates.startTime;
      if (updates.endTime !== undefined) patch.end_time = updates.endTime;
      if (updates.targetAudience !== undefined) patch.target_audience = updates.targetAudience;
      if (Object.keys(patch).length > 0) {
        api.updateClip(clipId, patch).catch((e) => console.warn('Backend clip sync failed:', (e as Error)?.message || e));
      }
    }

    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const updatedClips = p.clips.map(c => {
        if (c.id !== clipId) return c;
        const newDuration = (updates.startTime !== undefined || updates.endTime !== undefined)
          ? Math.max(1, (updates.endTime ?? c.endTime) - (updates.startTime ?? c.startTime))
          : c.duration;
        return {
          ...c,
          ...updates,
          duration: newDuration
        };
      });
      return { ...p, clips: updatedClips };
    }));
  }, []);

  const setClipApproval = useCallback((projectId: string, clipId: string, status: ApprovalStatus) => {
    // Write-through sync: approvals are a backend-side status change + feedback signal
    if (isRealProject(projectId) && looksLikeBackendClipId(clipId)) {
      (status === 'approved' ? api.approveClip(clipId) : api.rejectClip(clipId))
        .catch((e) => console.warn('Backend approval sync failed:', (e as Error)?.message || e));
    }
    updateClip(projectId, clipId, { approvalStatus: status });
  }, [updateClip]);

  const simulateClipRender = useCallback((projectId: string, clipId: string) => {
    const startLocalTicks = () => {
      updateClip(projectId, clipId, { renderStatus: 'rendering', renderProgress: 15 });
      let progress = 15;
      const interval = setInterval(() => {
        progress += 25;
        if (progress >= 100) {
          clearInterval(interval);
          updateClip(projectId, clipId, { renderStatus: 'ready', renderProgress: 100 });
        } else {
          updateClip(projectId, clipId, { renderStatus: 'rendering', renderProgress: progress });
        }
      }, 450);
    };

    // Real pipeline: queue a Remotion render job and poll the reels endpoint
    if (isRealProject(projectId) && looksLikeBackendClipId(clipId)) {
      updateClip(projectId, clipId, { renderStatus: 'rendering', renderProgress: 5 });
      (async () => {
        let reelId: string | null = null;
        try {
          const reel = await api.requestRender(clipId);
          reelId = reel.id;
        } catch (e) {
          console.warn('Render queueing failed, continuing in local preview mode:', (e as Error)?.message || e);
          startLocalTicks();
          return;
        }

        let attempts = 0;
        const poll = setInterval(async () => {
          attempts += 1;
          if (attempts > 240) {
            // Server render is taking unusually long — stop polling but stay honest:
            // the reel hydration effect will attach the real MP4 when it lands.
            clearInterval(poll);
            toast.info('Render is still running on the server — reopen this project in a minute to see the finished reel');
            updateClip(projectId, clipId, { renderStatus: 'pending', renderProgress: 0 });
            return;
          }
          try {
            const reel = await api.getRenderStatus(reelId!);
            if (reel.render_status === 'completed' || reel.video_url) {
              clearInterval(poll);
              updateClip(projectId, clipId, { renderStatus: 'ready', renderProgress: 100, renderedVideoUrl: reel.video_url || reel.video_path || undefined });
            } else if (reel.render_status === 'failed') {
              clearInterval(poll);
              console.warn('Render failed on backend:', reel.error_message);
              toast.error(`Reel render failed on the server: ${reel.error_message || 'unknown error'} — the clip reverts to raw-footage preview`);
              updateClip(projectId, clipId, { renderStatus: 'pending', renderProgress: 0 });
            } else {
              updateClip(projectId, clipId, {
                renderStatus: 'rendering',
                renderProgress: reel.render_status === 'processing' ? 65 : 15,
              });
            }
          } catch (e) {
            if (attempts >= 5) {
              clearInterval(poll);
              startLocalTicks();
            }
          }
        }, 2000);
      })();
      return;
    }

    // Local simulated render ticks
    startLocalTicks();
  }, [updateClip]);

  const renderAllApproved = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const approvedClips = project.clips.filter(c => c.approvalStatus === 'approved');
    approvedClips.forEach(clip => {
      simulateClipRender(projectId, clip.id);
    });
  }, [projects, simulateClipRender]);

  const updateUserSettings = useCallback((updates: Partial<UserSettings>) => {
    setUserSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resetToMockData = useCallback(() => {
    setProjects(mockProjects);
    setUserSettings(defaultUserSettings);
    setTheme('system');
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        userSettings,
        theme,
        isDarkMode,
        setTheme,
        toggleTheme,
        getProject,
        getClip,
        createProject,
        updateProject,
        upsertBackendProject,
        deleteProject,
        deleteAllProjects,
        updateClip,
        setClipApproval,
        simulateClipRender,
        renderAllApproved,
        updateUserSettings,
        resetToMockData,
        getVideoBlobUrl
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
