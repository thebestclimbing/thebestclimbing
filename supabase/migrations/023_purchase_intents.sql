create table if not exists purchase_intents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  product_id  uuid references public.products(id) on delete cascade not null,
  memo        text,
  created_at  timestamptz default now(),
  unique(user_id, product_id)
);

alter table purchase_intents enable row level security;

create policy "buyers manage own intents" on purchase_intents
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sellers view product intents" on purchase_intents
  for select using (
    exists (
      select 1 from public.products
      where id = product_id and seller_id = auth.uid()
    )
  );

create policy "admin view all intents" on purchase_intents
  for select using (public.is_admin());
