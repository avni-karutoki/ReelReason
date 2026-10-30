-- ==============================================================================
-- ReelReason Production Supabase Database Schema
-- Includes Tables, Enums, Constraints, Triggers, RLS Policies, and Storage Setup
-- ==============================================================================

-- 1. Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. CORE APPLICATION TABLES
-- ==============================================================================

-- 2.1 Users table (mirrored from auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  avatar_url text,
  default_platform text default 'Instagram Reels',
  default_audience text default 'Creators',
  default_tone text default 'Bold',
  preferred_clip_types text[] default array['strong_opinion', 'practical_lesson', 'story'],
  clips_per_video int default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2.2 Video Projects table
create table if not exists public.video_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text,
  source_type text not null check (source_type in ('upload', 'youtube')),
  source_url text,
  video_path text,
  audio_path text,
  duration_seconds int,
  language text default 'English',
  platform text,
  audience text,
  goal text,
  tone text,
  preferred_clip_types text[],
  number_of_clips int default 3,
  status text not null default 'uploaded'
    check (status in (
      'uploaded',
      'extracting_audio',
      'transcribing',
      'analyzing',
      'ranking_clips',
      'generating_reels',
      'completed',
      'failed'
    )),
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2.3 Transcripts table
create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.video_projects(id) on delete cascade,
  provider text,
  language text,
  full_text text,
  word_timestamps jsonb,
  segment_timestamps jsonb,
  created_at timestamptz default now()
);

-- 2.4 Transcript Segments table
create table if not exists public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references public.transcripts(id) on delete cascade,
  project_id uuid not null references public.video_projects(id) on delete cascade,
  start_time numeric not null,
  end_time numeric not null,
  text text not null,
  summary text,
  speaker text,
  segment_index int,
  created_at timestamptz default now()
);

-- 2.5 Clip Suggestions table
create table if not exists public.clip_suggestions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.video_projects(id) on delete cascade,
  segment_id uuid references public.transcript_segments(id) on delete set null,
  start_time numeric not null,
  end_time numeric not null,
  duration_seconds int,
  clip_type text not null
    check (clip_type in (
      'strong_opinion',
      'practical_lesson',
      'story',
      'emotional_moment',
      'contrarian_take',
      'insight',
      'humor'
    )),
  hook text not null,
  title text not null,
  caption text not null,
  hashtags text[] default '{}',
  target_audience text,
  reasoning text not null,
  hook_strength int,
  clarity int,
  audience_fit int,
  shareability int,
  overall_score int,
  confidence numeric,
  status text not null default 'suggested'
    check (status in (
      'suggested',
      'approved',
      'rejected',
      'edited',
      'rendering',
      'rendered',
      'failed'
    )),
  posting_order int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2.6 Rendered Reels table
create table if not exists public.rendered_reels (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.clip_suggestions(id) on delete cascade,
  project_id uuid not null references public.video_projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  render_status text not null default 'queued'
    check (render_status in (
      'queued',
      'processing',
      'completed',
      'failed'
    )),
  renderer_job_id text,
  video_path text,
  video_url text,
  thumbnail_path text,
  thumbnail_url text,
  subtitle_path text,
  subtitle_url text,
  aspect_ratio text default '9:16',
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2.7 Clip Feedback table
create table if not exists public.clip_feedback (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.clip_suggestions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  feedback_type text not null
    check (feedback_type in (
      'approved',
      'rejected',
      'edited',
      'rendered',
      'downloaded'
    )),
  notes text,
  created_at timestamptz default now()
);

-- 2.8 Job Logs table
create table if not exists public.job_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.video_projects(id) on delete cascade,
  job_type text not null,
  status text not null,
  message text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- ==============================================================================
-- 3. CRUCIAL USER TRIGGER: Auto-populate public.users from auth.users
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, public.users.name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if re-running
drop trigger if exists on_auth_user_created on auth.users;

-- Create AFTER INSERT trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger helper
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger set_video_projects_updated_at
  before update on public.video_projects
  for each row execute function public.handle_updated_at();

create trigger set_clip_suggestions_updated_at
  before update on public.clip_suggestions
  for each row execute function public.handle_updated_at();

create trigger set_rendered_reels_updated_at
  before update on public.rendered_reels
  for each row execute function public.handle_updated_at();

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on every table
alter table public.users enable row level security;
alter table public.video_projects enable row level security;
alter table public.transcripts enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.clip_suggestions enable row level security;
alter table public.rendered_reels enable row level security;
alter table public.clip_feedback enable row level security;
alter table public.job_logs enable row level security;

-- 4.1 Users table policies
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- 4.2 Video projects policies
create policy "Users can view own projects"
  on public.video_projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.video_projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.video_projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.video_projects for delete
  using (auth.uid() = user_id);

-- 4.3 Transcripts policies (via project ownership)
create policy "Users can view own project transcripts"
  on public.transcripts for select
  using (
    exists (
      select 1 from public.video_projects
      where public.video_projects.id = public.transcripts.project_id
        and public.video_projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own project transcripts"
  on public.transcripts for insert
  with check (
    exists (
      select 1 from public.video_projects
      where public.video_projects.id = public.transcripts.project_id
        and public.video_projects.user_id = auth.uid()
    )
  );

create policy "Users can update own project transcripts"
  on public.transcripts for update
  using (
    exists (
      select 1 from public.video_projects
      where public.video_projects.id = public.transcripts.project_id
        and public.video_projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own project transcripts"
  on public.transcripts for delete
  using (
    exists (
      select 1 from public.video_projects
      where public.video_projects.id = public.transcripts.project_id
        and public.video_projects.user_id = auth.uid()
    )
  );

-- 4.4 Transcript segments policies
create policy "Users can view own project segments"
  on public.transcript_segments for select
  using (
    exists (
      select 1 from public.video_projects
      where public.video_projects.id = public.transcript_segments.project_id
        and public.video_projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own project segments"
  on public.transcript_segments for insert
  with check (
    exists (
      select 1 from public.video_projects
      where public.video_projects.id = public.transcript_segments.project_id
        and public.video_projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own project segments"
  on public.transcript_segments for delete
  using (
    exists (
      select 1 from public.video_projects
      where public.video_projects.id = public.transcript_segments.project_id
        and public.video_projects.user_id = auth.uid()
    )
  );

-- 4.5 Clip suggestions policies
create policy "Users can view own project clips"
  on public.clip_suggestions for select
  using (
    exists (
      select 1 from public.video_projects
      where public.video_projects.id = public.clip_suggestions.project_id
        and public.video_projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own project clips"
  on public.clip_suggestions for insert
  with check (
    exists (
      select 1 from public.video_projects
      where public.video_projects.id = public.clip_suggestions.project_id
        and public.video_projects.user_id = auth.uid()
    )
  );

create policy "Users can update own project clips"
  on public.clip_suggestions for update
  using (
    exists (
      select 1 from public.video_projects
      where public.video_projects.id = public.clip_suggestions.project_id
        and public.video_projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own project clips"
  on public.clip_suggestions for delete
  using (
    exists (
      select 1 from public.video_projects
      where public.video_projects.id = public.clip_suggestions.project_id
        and public.video_projects.user_id = auth.uid()
    )
  );

-- 4.6 Rendered reels policies
create policy "Users can view own rendered reels"
  on public.rendered_reels for select
  using (auth.uid() = user_id);

create policy "Users can insert own rendered reels"
  on public.rendered_reels for insert
  with check (auth.uid() = user_id);

create policy "Users can update own rendered reels"
  on public.rendered_reels for update
  using (auth.uid() = user_id);

create policy "Users can delete own rendered reels"
  on public.rendered_reels for delete
  using (auth.uid() = user_id);

-- 4.7 Clip feedback policies
create policy "Users can view own clip feedback"
  on public.clip_feedback for select
  using (auth.uid() = user_id);

create policy "Users can insert own clip feedback"
  on public.clip_feedback for insert
  with check (auth.uid() = user_id);

-- 4.8 Job logs policies
create policy "Users can view own project job logs"
  on public.job_logs for select
  using (
    exists (
      select 1 from public.video_projects
      where public.video_projects.id = public.job_logs.project_id
        and public.video_projects.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 5. SUPABASE STORAGE BUCKETS & POLICIES
-- ==============================================================================

-- Create Storage buckets
insert into storage.buckets (id, name, public)
values 
  ('reelreason-videos', 'reelreason-videos', false),
  ('reelreason-audio', 'reelreason-audio', false),
  ('reelreason-rendered', 'reelreason-rendered', true),
  ('reelreason-thumbnails', 'reelreason-thumbnails', true)
on conflict (id) do nothing;

-- 5.1 Storage policies for videos
create policy "Users can upload to own video folder"
  on storage.objects for insert
  with check (
    bucket_id = 'reelreason-videos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own uploaded videos"
  on storage.objects for select
  using (
    bucket_id = 'reelreason-videos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own uploaded videos"
  on storage.objects for delete
  using (
    bucket_id = 'reelreason-videos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5.2 Storage policies for audio
create policy "Users can upload to own audio folder"
  on storage.objects for insert
  with check (
    bucket_id = 'reelreason-audio' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own audio files"
  on storage.objects for select
  using (
    bucket_id = 'reelreason-audio' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5.3 Storage policies for rendered reels (publicly readable via signed/public URL)
create policy "Users can read rendered reels"
  on storage.objects for select
  using (bucket_id = 'reelreason-rendered');

create policy "Users can upload rendered reels"
  on storage.objects for insert
  with check (
    bucket_id = 'reelreason-rendered' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5.4 Storage policies for thumbnails
create policy "Users can read thumbnails"
  on storage.objects for select
  using (bucket_id = 'reelreason-thumbnails');

-- Indexes for performance
create index if not exists idx_video_projects_user_id on public.video_projects(user_id);
create index if not exists idx_video_projects_status on public.video_projects(status);
create index if not exists idx_transcripts_project_id on public.transcripts(project_id);
create index if not exists idx_transcript_segments_project_id on public.transcript_segments(project_id);
create index if not exists idx_clip_suggestions_project_id on public.clip_suggestions(project_id);
create index if not exists idx_clip_suggestions_status on public.clip_suggestions(status);
create index if not exists idx_rendered_reels_clip_id on public.rendered_reels(clip_id);
create index if not exists idx_rendered_reels_user_id on public.rendered_reels(user_id);
create index if not exists idx_job_logs_project_id on public.job_logs(project_id);
