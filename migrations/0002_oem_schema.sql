-- VIN-native OEM catalog: vehicle and OEM part are canonical;
-- marketplace listings are inventory instances attached to both.

create table if not exists yards (
  id     text primary key,
  name   text not null,
  city   text not null,
  state  text not null
);

create table if not exists vehicles (
  vin           text primary key,
  year          integer not null,
  make          text not null,
  model         text not null,
  trim          text not null,
  body          text not null,
  engine        text not null,
  engine_code   text,
  transmission  text not null,
  drivetrain    text not null,
  color         text not null,
  plant         text,
  mileage       integer not null,
  yard_id       text not null references yards(id),
  intake_at     date not null,
  title_status  text not null,
  damage        text,
  photo         text not null
);

create index if not exists vehicles_make_model_idx on vehicles (make, model, year);
create index if not exists vehicles_yard_idx on vehicles (yard_id);

create table if not exists assemblies (
  id          text primary key,
  name        text not null,
  short_name  text not null,
  sort_order  integer not null
);

create table if not exists oem_parts (
  oem_number   text primary key,
  name         text not null,
  assembly_id  text not null references assemblies(id),
  brand        text not null,
  description  text not null,
  supercedes   text,
  msrp_cents   integer,
  photo        text
);

create index if not exists oem_parts_assembly_idx on oem_parts (assembly_id);
create index if not exists oem_parts_brand_idx on oem_parts (brand);

create table if not exists part_fitment (
  id          serial primary key,
  oem_number  text not null references oem_parts(oem_number),
  year_start  integer not null,
  year_end    integer not null,
  make        text not null,
  model       text not null,
  notes       text
);

create index if not exists part_fitment_oem_idx on part_fitment (oem_number);
create index if not exists part_fitment_ymm_idx on part_fitment (make, model, year_start, year_end);

create table if not exists vehicle_bom (
  vin         text not null references vehicles(vin),
  oem_number  text not null references oem_parts(oem_number),
  position    text not null default '',
  qty         integer not null default 1,
  primary key (vin, oem_number, position)
);

create index if not exists vehicle_bom_oem_idx on vehicle_bom (oem_number);

create table if not exists inventory (
  sku           text primary key,
  vin           text not null references vehicles(vin),
  oem_number    text not null references oem_parts(oem_number),
  position      text not null default '',
  condition     text not null,
  grade         text not null,
  status        text not null,
  price_cents   integer,
  photo         text,
  notes         text,
  removed_at    date,
  marketplace   text,
  tested        boolean not null default false
);

create index if not exists inventory_vin_idx on inventory (vin);
create index if not exists inventory_oem_idx on inventory (oem_number);
create index if not exists inventory_status_idx on inventory (status);
