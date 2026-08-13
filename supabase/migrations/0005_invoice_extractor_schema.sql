create table extractions (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  vendor_name text,
  invoice_number text,
  invoice_date date,
  currency text,
  total numeric(10, 2),
  line_items jsonb not null default '[]',
  created_at timestamptz not null default now()
);
