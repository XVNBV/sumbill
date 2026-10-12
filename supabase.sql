-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)
-- Versi idempotent: aman dijalankan berulang kali (tanpa error "already exists").
-- TIDAK menyentuh tabel sistem storage.objects (hindari error "must be owner").

-- 1. Buat bucket storage 'notas' (public, max 15MB)
insert into storage.buckets (id, name, public, file_size_limit)
values ('notas', 'notas', true, 15728640)
on conflict (id) do update
  set public = true, file_size_limit = 15728640;

-- 2. Tabel bills (idempotent)
create table if not exists public.bills (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  file_path text,
  nominal numeric,
  kategori text not null default 'Lainnya',
  tipe text not null default 'offline',
  sumber_bayar text not null default 'Lainnya',
  tanggal date,
  catatan text,
  ocr_text text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

drop index if exists bills_user_idx;
create index if not exists bills_user_idx on public.bills (user_id);
drop index if exists bills_tanggal_idx;
create index if not exists bills_tanggal_idx on public.bills (tanggal);
drop index if exists bills_kategori_idx;
create index if not exists bills_kategori_idx on public.bills (kategori);
drop index if exists bills_tipe_idx;
create index if not exists bills_tipe_idx on public.bills (tipe);

-- 3. Trigger: set user_id otomatis dari JWT (idempotent)
-- coalesce: saat dipanggil oleh service role (Edge Function) auth.uid() null,
-- sehingga user_id yang dikirim tetap dipakai.
create or replace function public.set_bill_user_id()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.user_id := coalesce(auth.uid(), new.user_id);
  return new;
end;
$$;

drop trigger if exists trg_bill_user on public.bills;
create trigger trg_bill_user before insert on public.bills
  for each row execute function public.set_bill_user_id();

-- 4. Row Level Security untuk tabel bills (idempotent)
alter table public.bills enable row level security;

drop policy if exists "bills_select_own" on public.bills;
create policy "bills_select_own" on public.bills
  for select using (auth.uid() = user_id);

drop policy if exists "bills_insert_own" on public.bills;
create policy "bills_insert_own" on public.bills
  for insert with check (auth.uid() = user_id);

drop policy if exists "bills_update_own" on public.bills;
create policy "bills_update_own" on public.bills
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "bills_delete_own" on public.bills;
create policy "bills_delete_own" on public.bills
  for delete using (auth.uid() = user_id);

-- 5. Tabel api_tokens (token akses untuk integrasi iOS Shortcuts)
create table if not exists public.api_tokens (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  label text,
  token_hash text not null,
  created_at timestamptz not null default now()
);

drop index if exists api_tokens_user_idx;
create index if not exists api_tokens_user_idx on public.api_tokens (user_id);
drop index if exists api_tokens_hash_idx;
create index if not exists api_tokens_hash_idx on public.api_tokens (token_hash);

-- Trigger: set user_id otomatis dari JWT (idempotent)
create or replace function public.set_api_token_user_id()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_api_token_user on public.api_tokens;
create trigger trg_api_token_user before insert on public.api_tokens
  for each row execute function public.set_api_token_user_id();

-- Row Level Security untuk tabel api_tokens (idempotent)
alter table public.api_tokens enable row level security;

drop policy if exists "api_tokens_select_own" on public.api_tokens;
create policy "api_tokens_select_own" on public.api_tokens
  for select using (auth.uid() = user_id);

drop policy if exists "api_tokens_insert_own" on public.api_tokens;
create policy "api_tokens_insert_own" on public.api_tokens
  for insert with check (auth.uid() = user_id);

drop policy if exists "api_tokens_delete_own" on public.api_tokens;
create policy "api_tokens_delete_own" on public.api_tokens
  for delete using (auth.uid() = user_id);