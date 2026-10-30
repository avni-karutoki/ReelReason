import { Clip } from '../types';

function formatSrtTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  const hh = String(hrs).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const ms = String(millis).padStart(3, '0');

  return `${hh}:${mm}:${ss},${ms}`;
}

export function generateSrtContent(clip: Clip): string {
  if (!clip.transcriptSegments || clip.transcriptSegments.length === 0) {
    // Generate fallback segment from hook & caption
    return `1\n00:00:00,000 --> 00:00:04,500\n${clip.hook}\n\n2\n00:00:04,500 --> 00:00:15,000\n${clip.caption.slice(0, 80)}...\n`;
  }

  // Adjust relative to clip start time
  return clip.transcriptSegments
    .map((seg, index) => {
      const relStart = Math.max(0, seg.start - clip.startTime);
      const relEnd = Math.max(relStart + 1, seg.end - clip.startTime);
      return `${index + 1}\n${formatSrtTimestamp(relStart)} --> ${formatSrtTimestamp(relEnd)}\n${seg.text}\n`;
    })
    .join('\n');
}

export function downloadSrtFile(clip: Clip): void {
  const content = generateSrtContent(clip);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const safeTitle = clip.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${safeTitle || 'reel_captions'}.srt`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateMetadataPackage(clip: Clip): string {
  return [
    `REELREASON EXPORT PACKAGE`,
    `========================`,
    `Title: ${clip.title}`,
    `Category: ${clip.category}`,
    `Duration: ${clip.duration}s (${clip.startTime}s - ${clip.endTime}s)`,
    `Overall Score: ${clip.scores.overall}/100 (Hook: ${clip.scores.hookStrength}, Clarity: ${clip.scores.clarity}, Fit: ${clip.scores.audienceFit})`,
    ``,
    `HOOK:`,
    clip.hook,
    ``,
    `CAPTION:`,
    clip.caption,
    ``,
    `HASHTAGS:`,
    clip.hashtags.join(' '),
    ``,
    `AI SELECTION REASONING:`,
    clip.reasoning.selectionReason,
    ``,
    `RECOMMENDED PLATFORM & POSTING:`,
    `Platform: ${clip.reasoning.recommendedPlatform}`,
    `Sequence: ${clip.reasoning.suggestedPostingPosition}`,
    ``,
    `SUBTITLES (SRT FORMAT):`,
    `------------------------`,
    generateSrtContent(clip)
  ].join('\n');
}

export function downloadMetadataPackage(clip: Clip): void {
  const text = generateMetadataPackage(clip);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const safeTitle = clip.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${safeTitle || 'reel'}_complete_package.txt`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
