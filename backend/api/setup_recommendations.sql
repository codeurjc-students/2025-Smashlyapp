-- Create recommendations table
create table if not exists recommendations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  form_type text check (form_type in ('basic', 'advanced')),
  form_data jsonb not null,
  recommendation_result jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table recommendations enable row level security;

create policy "Users can view their own recommendations"
  on recommendations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own recommendations"
  on recommendations for insert
  with check (auth.uid() = user_id);

-- Optional: Add index for faster queries by user
create index if not exists recommendations_user_id_idx on recommendations(user_id);
