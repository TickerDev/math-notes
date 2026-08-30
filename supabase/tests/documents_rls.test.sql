begin;

select plan(16);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.documents'::regclass),
  'documents has row level security enabled'
);

select ok(
  not has_table_privilege('anon', 'public.documents', 'insert,update,delete'),
  'anonymous users hold no write grants'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$insert into public.documents (user_id, title, content)
    values ('11111111-1111-1111-1111-111111111111', 'Owner note', 'Private text')
    returning title$$,
  array['Owner note'],
  'the owner creates their own document'
);

select results_eq(
  $$select content from public.documents where title = 'Owner note'$$,
  array['Private text'],
  'the owner reads their own document'
);

select results_eq(
  $$update public.documents
    set content = 'Owner update',
        share_token = '33333333-3333-4333-8333-333333333333',
        shared_at = now()
    where title = 'Owner note'
    returning content$$,
  array['Owner update'],
  'the owner updates their own document'
);

select throws_ok(
  $$update public.documents
    set user_id = '22222222-2222-2222-2222-222222222222'
    where title = 'Owner note'$$,
  '42501',
  null,
  'the owner cannot reassign document ownership'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select is_empty(
  $$select content from public.documents where title = 'Owner note'$$,
  'another user cannot read the owner document'
);

select is_empty(
  $$update public.documents
    set content = 'Stolen update'
    where title = 'Owner note'
    returning content$$,
  'another user cannot update the owner document'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$select content from public.documents where title = 'Owner note'$$,
  array['Owner update'],
  'the denied update leaves the owner document intact'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select is_empty(
  $$delete from public.documents where title = 'Owner note' returning title$$,
  'another user cannot delete the owner document'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$select title from public.documents where title = 'Owner note'$$,
  array['Owner note'],
  'the denied delete leaves the owner document intact'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select throws_ok(
  $$insert into public.documents (user_id, title, content)
    values ('11111111-1111-1111-1111-111111111111', 'Forged note', 'Not allowed')$$,
  '42501',
  null,
  'another user cannot create a document for the owner'
);

set local role anon;
set local request.headers = '{"x-share-token":"33333333-3333-4333-8333-333333333333"}';

select results_eq(
  $$select title from public.documents where title = 'Owner note'$$,
  array['Owner note'],
  'an anonymous visitor can read a document with its share token'
);

select throws_ok(
  $$update public.documents set content = 'Anonymous update' where title = 'Owner note'$$,
  '42501',
  null,
  'an anonymous visitor cannot update a shared document'
);

set local role authenticated;
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select is_empty(
  $$update public.documents
    set content = 'Shared-link update'
    where title = 'Owner note'
    returning content$$,
  'a signed-in non-owner cannot update through a share token'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$delete from public.documents where title = 'Owner note' returning title$$,
  array['Owner note'],
  'the owner deletes their own document'
);

select * from finish();

rollback;
