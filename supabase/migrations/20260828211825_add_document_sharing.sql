alter table public.documents
  add column share_token uuid,
  add column shared_at timestamptz,
  add constraint documents_share_state_check
    check ((share_token is null and shared_at is null) or (share_token is not null and shared_at is not null));

create unique index documents_share_token_idx
  on public.documents (share_token)
  where share_token is not null;

create policy "Shared documents are readable with their token"
  on public.documents for select
  to anon, authenticated
  using (
    share_token is not null
    and share_token::text = coalesce(
      current_setting('request.headers', true)::jsonb ->> 'x-share-token',
      ''
    )
  );

revoke all on table public.documents from anon;
grant select (title, content, updated_at) on table public.documents to anon;
