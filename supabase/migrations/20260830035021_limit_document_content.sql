alter table public.documents
  add constraint documents_content_length
  check (char_length(content) <= 1000000);
