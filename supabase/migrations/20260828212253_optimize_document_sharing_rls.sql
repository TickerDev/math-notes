drop policy "Shared documents are readable with their token" on public.documents;
drop policy "Users can read their documents" on public.documents;

create policy "Users can read their documents"
  on public.documents for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or (
      share_token is not null
      and share_token::text = coalesce(
        (select current_setting('request.headers', true))::jsonb ->> 'x-share-token',
        ''
      )
    )
  );

create policy "Shared documents are readable with their token"
  on public.documents for select
  to anon
  using (
    share_token is not null
    and share_token::text = coalesce(
      (select current_setting('request.headers', true))::jsonb ->> 'x-share-token',
      ''
    )
  );
