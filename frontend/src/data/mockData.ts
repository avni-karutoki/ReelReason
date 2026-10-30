import { Project, Clip, UserSettings } from '../types';

export const HERO_PODCAST_IMG = '/src/assets/images/hero_podcast_studio_1793292917369.jpg';
export const THUMB_TUTORIAL_IMG = '/src/assets/images/thumb_creator_tutorial_1793292918151.jpg';
export const THUMB_KEYNOTE_IMG = '/src/assets/images/thumb_keynote_stage_1793292918433.jpg';
export const AVATAR_CREATOR_IMG = '/src/assets/images/avatar_creator_profile_1793292918650.jpg';

export const initialClipsProject1: Clip[] = [
  {
    id: 'clip-101',
    projectId: 'proj-001',
    category: 'Strong Opinion',
    hook: 'Most creators spend hours editing but overlook the one decision that matters.',
    title: 'The Hidden Editing Mistake Creators Make',
    caption: 'You can spend 12 hours tweaking motion graphics and color grading, but if the core thesis doesn\'t punch within 3 seconds, retention collapses. The real cut happens before you even open your timeline.',
    hashtags: ['#ContentStrategy', '#VideoEditing', '#CreatorEconomy', '#ReelsTips', '#ShortsGrowth'],
    targetAudience: 'Indie creators, video editors, and brand storytellers',
    startTime: 254, // 04:14
    endTime: 308,   // 05:08
    duration: 54,
    scores: {
      overall: 95,
      hookStrength: 97,
      clarity: 92,
      audienceFit: 96,
      shareability: 94
    },
    reasoning: {
      selectionReason: 'Contains an immediate contrarian stance that directly challenges conventional creator effort, followed by actionable editorial logic that keeps retention high.',
      targetAudienceAnalysis: 'High resonance with video creators who feel fatigued by low engagement despite heavy post-production effort.',
      hookBreakdown: 'Directly disrupts expectations in the first 2.8 seconds by naming a universal creator pain point: hours spent vs zero yield.',
      clarityNotes: 'Single unbroken argument without conversational filler or meandering context.',
      shareabilityFactor: 'High quote potential. Likely to be bookmarked and shared in editing and creator community Discords.',
      suggestedPostingPosition: 'Post 1: Attention Magnet (Launch reel of the week)',
      recommendedPlatform: 'Instagram Reels & YouTube Shorts (High debate factor)',
      retentionWarning: 'At 0:42 there is a slight breath pause; our trimmer keeps it tight to avoid drop-off.'
    },
    alternativeHooks: [
      'Stop spending 10 hours in Premiere until you solve this one problem.',
      'The reason your high-effort reels are getting 200 views isn\'t the algorithm.',
      'Every viral short shares this exact narrative pivot within the first 4 seconds.'
    ],
    alternativeCaptions: [
      'Hot take: High production value cannot rescue a weak narrative premise. Here is how we restructure long-form footage before touching a single transition.',
      'Editing is subtracting everything that isn\'t the truth. When you repurpose video, focus on the single emotional punch.'
    ],
    approvalStatus: 'approved',
    renderStatus: 'ready',
    renderProgress: 100,
    styleConfig: {
      subtitleStyle: 'bold-punch',
      fontSize: 26,
      textColor: '#FFFFFF',
      position: 'lower-third',
      watermarkEnabled: true,
      creatorHandle: '@reelreason'
    },
    transcriptSegments: [
      { start: 254, end: 259, text: "Most creators spend hours editing but overlook the one decision that matters." },
      { start: 259, end: 265, text: "They will keyframe subtitles, sync audio drops, and color match for twelve straight hours." },
      { start: 265, end: 273, text: "Yet the hook never creates an unanswered question in the viewer's mind." },
      { start: 273, end: 284, text: "If the first sentence doesn't challenge what someone already believes, they swipe." },
      { start: 284, end: 296, text: "The real editing happens before you even open your timeline: it is deciding what is indispensable." },
      { start: 296, end: 308, text: "Protect the core insight with your life, and trim everything else to zero." }
    ]
  },
  {
    id: 'clip-102',
    projectId: 'proj-001',
    category: 'Practical Lesson',
    hook: 'Use these three questions before turning any long video into a reel.',
    title: 'The 3-Question Video Repurposing Filter',
    caption: 'Never extract a clip just because the speaker said something smart. Ask: 1) Does it stand alone without 10 minutes of backstory? 2) Can someone implement it today? 3) Does it provoke an emotion?',
    hashtags: ['#CreatorPlaybook', '#VideoProduction', '#SocialMediaGrowth', '#ReelsFramework', '#Podcasting'],
    targetAudience: 'Podcasters, educators, and course creators',
    startTime: 820,  // 13:40
    endTime: 878,  // 14:38
    duration: 58,
    scores: {
      overall: 92,
      hookStrength: 90,
      clarity: 98,
      audienceFit: 94,
      shareability: 91
    },
    reasoning: {
      selectionReason: 'Structured 3-part framework delivered with crisp pacing. The educational utility guarantees high bookmark-to-view ratios.',
      targetAudienceAnalysis: 'Ideal for busy founders and podcasters wanting a repeatable heuristic instead of guesswork.',
      hookBreakdown: 'Promises structured guidance with an explicit cognitive number (3 questions) that sets a clear mental roadmap.',
      clarityNotes: 'Numbered cadence ensures viewers stay hooked from step 1 through step 3.',
      shareabilityFactor: 'Saves and DM shares will outperform comments due to its checklist nature.',
      suggestedPostingPosition: 'Post 2: Authority & Utility (Mid-week educational anchor)',
      recommendedPlatform: 'YouTube Shorts & LinkedIn Video (Professional audience)'
    },
    alternativeHooks: [
      'The 3-step checklist that turns dead podcasts into high-retention shorts.',
      'Before you clip your next podcast episode, ask these 3 specific questions.',
      'If your clips don\'t pass this 30-second filter, don\'t post them.'
    ],
    alternativeCaptions: [
      'Repurposing isn\'t cutting down duration; it\'s distilling insight. Save this 3-question rubric for your next batch editing session.',
      'How top media teams turn 1-hour interviews into 8 evergreen clips without watering down the message.'
    ],
    approvalStatus: 'approved',
    renderStatus: 'ready',
    renderProgress: 100,
    styleConfig: {
      subtitleStyle: 'clean-editorial',
      fontSize: 24,
      textColor: '#FAF8F5',
      position: 'lower-third',
      watermarkEnabled: true,
      creatorHandle: '@reelreason'
    },
    transcriptSegments: [
      { start: 820, end: 826, text: "Use these three questions before turning any long video into a reel." },
      { start: 826, end: 835, text: "Question one: Does this 45-second moment make complete sense without hearing the previous ten minutes?" },
      { start: 835, end: 846, text: "If it relies on prior context, kill it. Question two: Can someone implement or remember this today?" },
      { start: 846, end: 859, text: "And question three: Does it provoke curiosity, disagreement, or relief? If it's neutral, it dies." },
      { start: 859, end: 878, text: "Run your clips through that filter and you will never post filler content again." }
    ]
  },
  {
    id: 'clip-103',
    projectId: 'proj-001',
    category: 'Unexpected Story',
    hook: 'The moment nobody expected became the most memorable part of the conversation.',
    title: 'The Spontaneous Studio Epiphany',
    caption: 'We were 45 minutes in, talking about balance sheets, when she stopped and admitted the real reason she almost walked away from her venture. Unrehearsed vulnerability is undefeated on short-form feeds.',
    hashtags: ['#Storytelling', '#PodcastClips', '#Authenticity', '#FounderStories', '#DeepConversations'],
    targetAudience: 'Entrepreneurs, founders, and community builders',
    startTime: 1410, // 23:30
    endTime: 1466, // 24:26
    duration: 56,
    scores: {
      overall: 89,
      hookStrength: 91,
      clarity: 88,
      audienceFit: 90,
      shareability: 96
    },
    reasoning: {
      selectionReason: 'Spontaneous emotional turnaround with high human warmth. Breaks pattern from analytical advice into personal narrative.',
      targetAudienceAnalysis: 'High empathy resonance across diverse demographic groups; performs well beyond niche tech audiences.',
      hookBreakdown: 'Uses an open curiosity loop ("the moment nobody expected") that delays resolution until mid-reel.',
      clarityNotes: 'Vocal inflection and genuine laughter/pause create organic cadence that feels alive.',
      shareabilityFactor: 'Exceptional word-of-mouth momentum and comment-section dialogue.',
      suggestedPostingPosition: 'Post 3: Emotional Connection (Weekend or evening release)',
      recommendedPlatform: 'Instagram Reels & Facebook Reels (High emotional resonance)',
      retentionWarning: 'Slight audio volume drop when the speaker leaned back; leveled in audio pass.'
    },
    alternativeHooks: [
      'She paused for 5 seconds, looked at the mic, and said something I\'ll never forget.',
      'The rawest moment in 100 podcast episodes wasn\'t on the prep sheet.',
      'What happens when a seasoned founder admits their biggest failure on camera.'
    ],
    alternativeCaptions: [
      'The best podcast moments are never in the script. When a guest lets their guard down, listen with both ears.',
      'Real conversation isn\'t a soundbite. Here is the unvarnished moment from episode 42 that struck a nerve.'
    ],
    approvalStatus: 'pending',
    renderStatus: 'pending',
    renderProgress: 0,
    styleConfig: {
      subtitleStyle: 'karaoke-pop',
      fontSize: 28,
      textColor: '#FFFFFF',
      position: 'middle',
      watermarkEnabled: false,
      creatorHandle: '@reelreason'
    },
    transcriptSegments: [
      { start: 1410, end: 1417, text: "The moment nobody expected became the most memorable part of the conversation." },
      { start: 1417, end: 1428, text: "We had prepared two pages of structured questions about retention curves and unit economics." },
      { start: 1428, end: 1438, text: "Then she put her water glass down and said: 'Can I tell you what actually happened that Tuesday?'" },
      { start: 1438, end: 1450, text: "And for the next two minutes, the entire room was dead silent. No jargon, just pure truth." },
      { start: 1450, end: 1466, text: "Audiences crave that vulnerability because they are suffocated by rehearsed PR answers." }
    ]
  }
];

export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    title: 'The Unfiltered Truth About Content Architecture',
    sourceFilename: 'podcast_ep42_content_systems_master.mp4',
    sourceFileSize: '1.42 GB',
    sourceVideoUrl: null,
    thumbnailUrl: HERO_PODCAST_IMG,
    duration: 2900,
    formattedDuration: '48:20',
    createdAt: '2026-10-28',
    status: 'completed',
    videoType: 'podcast',
    platform: 'reels',
    primaryGoal: 'Grow engaged creator audience & highlight counter-intuitive editing lessons',
    targetAudience: 'Indie creators, video editors, and brand storytellers',
    tone: 'Thoughtful & Analytical',
    clipTypes: ['Strong Opinion', 'Practical Lesson', 'Unexpected Story'],
    numClipsRequested: 3,
    language: 'English',
    clips: initialClipsProject1,
    exportCount: 2
  },
  {
    id: 'proj-002',
    title: 'Building Zero to One: Scaling Developer Tools',
    sourceFilename: 'devtool_founder_keynote_2026.mp4',
    sourceFileSize: '890 MB',
    sourceVideoUrl: null,
    thumbnailUrl: THUMB_KEYNOTE_IMG,
    duration: 2055,
    formattedDuration: '34:15',
    createdAt: '2026-10-24',
    status: 'completed',
    videoType: 'keynote',
    platform: 'shorts',
    primaryGoal: 'Drive signups for developer framework and establish founder authority',
    targetAudience: 'Full-stack engineers, CTOs, and technical founders',
    tone: 'Punchy & Energetic',
    clipTypes: ['Practical Lesson', 'Framework Breakdown'],
    numClipsRequested: 3,
    language: 'English',
    clips: [
      {
        id: 'clip-201',
        projectId: 'proj-002',
        category: 'Framework Breakdown',
        hook: 'Why 90% of internal developer tools get abandoned within six weeks.',
        title: 'The Dev Tool Adoption Death Spiral',
        caption: 'Engineers love building bespoke CLI tools for their teams. But if setup takes longer than 90 seconds, people revert to manual scripts.',
        hashtags: ['#DevTools', '#SoftwareEngineering', '#DeveloperExperience', '#TechLeadership'],
        targetAudience: 'Staff engineers and tech leads',
        startTime: 180,
        endTime: 235,
        duration: 55,
        scores: { overall: 93, hookStrength: 94, clarity: 95, audienceFit: 96, shareability: 90 },
        reasoning: {
          selectionReason: 'Direct diagnostic of an engineering team antipattern with an explicit 90-second benchmark.',
          targetAudienceAnalysis: 'High empathy with engineering managers battling fragmented internal toolchains.',
          hookBreakdown: 'Quantified failure rate (90%) creates immediate cognitive curiosity for senior devs.',
          clarityNotes: 'Crisp diagrams visible in background slides supporting the argument.',
          shareabilityFactor: 'Shared widely in internal engineering Slack channels.',
          suggestedPostingPosition: 'Post 1: Problem Teardown',
          recommendedPlatform: 'YouTube Shorts & LinkedIn'
        },
        alternativeHooks: [
          'If your dev tool takes more than 90 seconds to install, it will fail.',
          'The real reason developers secretly hate your new internal platform.'
        ],
        alternativeCaptions: ['Developer experience is not aesthetic; it is time saved. Here is the 90-second rule.'],
        approvalStatus: 'approved',
        renderStatus: 'ready',
        renderProgress: 100,
        styleConfig: {
          subtitleStyle: 'clean-editorial',
          fontSize: 24,
          textColor: '#FAF8F5',
          position: 'lower-third',
          watermarkEnabled: true,
          creatorHandle: '@reelreason'
        },
        transcriptSegments: [
          { start: 180, end: 195, text: "Why 90% of internal developer tools get abandoned within six weeks." },
          { start: 195, end: 215, text: "The friction threshold for developers during an active incident is literally ninety seconds." },
          { start: 215, end: 235, text: "If they cannot pipe data directly without reading three pages of docs, they will fall back to bash." }
        ]
      }
    ],
    exportCount: 1
  },
  {
    id: 'proj-003',
    title: 'Mastering Spatial Sound & Visual Rhythm',
    sourceFilename: 'studio_sound_design_masterclass.mov',
    sourceFileSize: '620 MB',
    sourceVideoUrl: null,
    thumbnailUrl: THUMB_TUTORIAL_IMG,
    duration: 1360,
    formattedDuration: '22:40',
    createdAt: '2026-10-21',
    status: 'draft',
    videoType: 'tutorial',
    platform: 'facebook_reels',
    primaryGoal: 'Teach practical sound layering and spark viewer saves',
    targetAudience: 'Music producers and creative audio designers',
    tone: 'Educational & Calm',
    clipTypes: ['Practical Lesson'],
    numClipsRequested: 3,
    language: 'English',
    clips: [],
    exportCount: 0
  }
];

export const defaultUserSettings: UserSettings = {
  displayName: 'Maya Chen',
  email: 'maya@studioforward.co',
  avatarUrl: AVATAR_CREATOR_IMG,
  creatorHandle: '@reelreason',
  brandColor: '#6366F1',
  fontPreference: 'Inter',
  watermarkEnabled: true,
  defaultSubtitleStyle: 'bold-punch',
  defaultPlatform: 'reels',
  defaultAudience: 'Founders, creative producers, and indie storytellers',
  defaultTone: 'Punchy & Energetic',
  preferredClipTypes: ['Strong Opinion', 'Practical Lesson', 'Unexpected Story'],
  defaultNumberClips: 3,
  theme: 'system'
};

