create table if not exists purchase_history (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid references public.products(id) on delete set null,
  buyer_id     uuid references public.profiles(id) on delete cascade not null,
  seller_id    uuid references public.profiles(id) on delete cascade not null,
  title        text not null,
  price        integer not null,
  image_url    text,
  confirmed_at timestamptz default now()
);

alter table purchase_history enable row level security;

create policy "buyers view own history" on purchase_history
  for select using (auth.uid() = buyer_id);

create policy "sellers view own sales" on purchase_history
  for select using (auth.uid() = seller_id);
