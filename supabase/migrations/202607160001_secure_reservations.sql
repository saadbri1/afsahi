-- AFSAHI production security baseline.
-- Run with `supabase db push`, or paste this complete file into Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'New',
  client_name text,
  client_phone text,
  client_email text,
  pickup text,
  dropoff text,
  date text,
  time text,
  vehicle text,
  passengers integer,
  luggage integer,
  distance_km numeric,
  duration_text text,
  price_mad numeric,
  price_eur numeric,
  message text
);

alter table public.reservations
  add column if not exists client_name text,
  add column if not exists client_phone text,
  add column if not exists client_email text;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  constraint admin_users_email_normalized check (email = lower(email))
);

alter table public.reservations enable row level security;
alter table public.reservations force row level security;
alter table public.admin_users enable row level security;
alter table public.admin_users force row level security;

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select check_user_id is not null
    and exists (select 1 from public.admin_users where user_id = check_user_id);
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated;

drop policy if exists "anon insert" on public.reservations;
drop policy if exists "anon select" on public.reservations;
drop policy if exists "anon update" on public.reservations;
drop policy if exists "anon delete" on public.reservations;
drop policy if exists "public can submit reservation requests" on public.reservations;
drop policy if exists "admins can read reservations" on public.reservations;
drop policy if exists "admins can update reservations" on public.reservations;
drop policy if exists "admins can delete reservations" on public.reservations;

revoke all on table public.reservations from anon, authenticated;
grant insert on table public.reservations to anon, authenticated;
grant select, update, delete on table public.reservations to authenticated;

create policy "public can submit reservation requests"
on public.reservations for insert
to anon, authenticated
with check (
  status = 'New'
  and length(coalesce(client_name, '')) between 2 and 120
  and length(coalesce(client_phone, '')) between 8 and 40
  and length(coalesce(client_email, '')) <= 254
  and length(coalesce(pickup, '')) between 2 and 300
  and length(coalesce(dropoff, '')) between 2 and 300
  and length(coalesce(vehicle, '')) between 2 and 120
  and passengers between 1 and 50
  and luggage between 0 and 100
  and distance_km between 0 and 5000
  and price_mad between 0 and 1000000
  and price_eur between 0 and 100000
  and length(coalesce(message, '')) <= 5000
);

create policy "admins can read reservations"
on public.reservations for select to authenticated
using (public.is_admin());

create policy "admins can update reservations"
on public.reservations for update to authenticated
using (public.is_admin())
with check (public.is_admin() and status in ('New', 'Confirmed', 'Cancelled'));

create policy "admins can delete reservations"
on public.reservations for delete to authenticated
using (public.is_admin());

-- Aggregate the complete dashboard data in Postgres. This keeps accurate KPIs
-- while the browser only downloads one paginated reservation page at a time.
create or replace function public.get_admin_reservation_analytics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  with
  totals as (
    select
      coalesce(sum(price_mad) filter (where status = 'Confirmed'), 0) as total_revenue,
      coalesce(sum(price_mad) filter (
        where status = 'Confirmed'
          and date_trunc('month', created_at) = date_trunc('month', now())
      ), 0) as monthly_revenue,
      coalesce(sum(price_mad) filter (
        where status = 'Confirmed' and created_at::date = current_date
      ), 0) as today_revenue,
      count(*) as total_reservations,
      count(*) filter (where status = 'New') as new_count,
      count(*) filter (where status = 'Confirmed') as confirmed_count,
      count(*) filter (where status = 'Cancelled') as cancelled_count,
      coalesce(sum(price_mad) filter (where status = 'New'), 0) as pending_value
    from public.reservations
  ),
  months as (
    select month_start
    from generate_series(
      date_trunc('month', current_date) - interval '5 months',
      date_trunc('month', current_date),
      interval '1 month'
    ) month_start
  ),
  monthly as (
    select
      m.month_start,
      to_char(m.month_start, 'Mon') as month,
      coalesce(sum(r.price_mad) filter (where r.status = 'Confirmed'), 0) as revenue
    from months m
    left join public.reservations r
      on date_trunc('month', r.created_at) = m.month_start
    group by m.month_start
    order by m.month_start
  ),
  status_rows as (
    select status as name, count(*) as value,
      case status
        when 'New' then '#C9A86A'
        when 'Confirmed' then '#3f9c6b'
        else '#c0564a'
      end as color
    from public.reservations
    group by status
  ),
  vehicle_rows as (
    select coalesce(nullif(vehicle, ''), '—') as vehicle, count(*) as count
    from public.reservations
    group by coalesce(nullif(vehicle, ''), '—')
    order by count desc, vehicle
    limit 6
  ),
  route_rows as (
    select
      concat(
        coalesce(nullif(trim(split_part(pickup, ',', 1)), ''), '—'),
        ' → ',
        coalesce(nullif(trim(split_part(dropoff, ',', 1)), ''), '—')
      ) as route,
      count(*) as count,
      coalesce(sum(price_mad) filter (where status = 'Confirmed'), 0) as revenue
    from public.reservations
    group by 1
    order by count desc, route
    limit 5
  )
  select jsonb_build_object(
    'kpis', jsonb_build_object(
      'totalRevenue', t.total_revenue,
      'monthlyRevenue', t.monthly_revenue,
      'todayRevenue', t.today_revenue,
      'totalReservations', t.total_reservations,
      'newCount', t.new_count,
      'confirmedCount', t.confirmed_count,
      'cancelledCount', t.cancelled_count,
      'avgBookingValue', case
        when t.confirmed_count > 0 then round(t.total_revenue / t.confirmed_count)
        else 0
      end,
      'pendingValue', t.pending_value
    ),
    'revenueByMonth', (select coalesce(jsonb_agg(to_jsonb(m) - 'month_start' order by month_start), '[]'::jsonb) from monthly m),
    'reservationsByStatus', (select coalesce(jsonb_agg(to_jsonb(s) order by name), '[]'::jsonb) from status_rows s),
    'bookingsByVehicle', (select coalesce(jsonb_agg(to_jsonb(v) order by count desc, vehicle), '[]'::jsonb) from vehicle_rows v),
    'topRoutes', (select coalesce(jsonb_agg(to_jsonb(r) order by count desc, route), '[]'::jsonb) from route_rows r)
  ) into result
  from totals t;

  return result;
end;
$$;

revoke all on function public.get_admin_reservation_analytics() from public;
grant execute on function public.get_admin_reservation_analytics() to authenticated;

drop policy if exists "admins can read own allowlist entry" on public.admin_users;
revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;
create policy "admins can read own allowlist entry"
on public.admin_users for select to authenticated
using (user_id = auth.uid());

create index if not exists reservations_created_at_idx
  on public.reservations (created_at desc);
create index if not exists reservations_status_created_at_idx
  on public.reservations (status, created_at desc);

-- After creating/inviting the administrator in Authentication > Users, approve
-- that exact account once (replace the email):
-- insert into public.admin_users (user_id, email)
-- select id, lower(email) from auth.users where lower(email) = lower('owner@example.com')
-- on conflict (user_id) do update set email = excluded.email;
