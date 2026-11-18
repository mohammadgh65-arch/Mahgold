-- Preserve both the provider's market update timestamp and the time we
-- successfully verified/fetched a live quote. Checkout freshness uses observed_at.
alter table public.market_quotes
  add column if not exists provider_updated_at timestamptz;
