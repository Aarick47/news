-- Create table saved_articles
create table saved_articles (
  id uuid default gen_random_uuid() primary key,
  user_id text,
  title text,
  summary text,
  sentiment text,
  url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
