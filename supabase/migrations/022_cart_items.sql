create table if not exists cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  product_id  uuid references products(id) on delete cascade not null,
  quantity    int not null default 1 check (quantity > 0),
  created_at  timestamptz default now(),
  unique(user_id, product_id)
);

alter table cart_items enable row level security;

create policy "users manage own cart" on cart_items
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
