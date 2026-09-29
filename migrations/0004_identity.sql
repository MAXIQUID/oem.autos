-- Normalized vehicle identity. Cascade menus and VIN decodes resolve here.
-- Unowned catalog rows: no accounts.

create table if not exists identity_menus (
  cache_key  text primary key,
  payload    text not null,
  fetched_at timestamptz not null default now()
);

create table if not exists identity_vehicles (
  id             text primary key,
  year           integer not null,
  make           text not null,
  model          text not null,
  generation     text,
  configuration  text not null,
  displacement_l numeric,
  cylinders      integer,
  fuel           text,
  induction      text,
  transmission   text,
  drive          text,
  body           text,
  source         text not null,
  source_id      text not null,
  fetched_at     timestamptz not null default now(),
  unique (source, source_id)
);

create table if not exists identity_vins (
  vin         text primary key,
  vehicle_id  text not null references identity_vehicles (id),
  fetched_at  timestamptz not null default now()
);
