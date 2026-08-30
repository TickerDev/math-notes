create table public.documents (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled document',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_title_length check (char_length(title) between 1 and 200)
);

create index documents_user_updated_idx
  on public.documents (user_id, updated_at desc);

alter table public.documents enable row level security;

create policy "Users can read their documents"
  on public.documents for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their documents"
  on public.documents for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their documents"
  on public.documents for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their documents"
  on public.documents for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.documents from anon;
grant select, insert, update, delete on table public.documents to authenticated;
grant usage, select on sequence public.documents_id_seq to authenticated;
