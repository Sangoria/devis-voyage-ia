-- ============================================================
-- QOVEE — Migration Stripe
-- À coller dans : Supabase Dashboard → SQL Editor → New query
-- À exécuter APRÈS avoir exécuté schema.sql
-- ============================================================

-- Ajoute les colonnes Stripe à la table profiles
alter table profiles add column if not exists stripe_customer_id  text;
alter table profiles add column if not exists subscription_status text default 'free'
  check (subscription_status in ('free', 'trialing', 'active', 'past_due', 'canceled'));
alter table profiles add column if not exists subscription_id     text;

-- Index pour les lookups Stripe (webhook cherche par stripe_customer_id)
create index if not exists idx_profiles_stripe_customer on profiles (stripe_customer_id);

-- Vérification : tu dois voir les 3 nouvelles colonnes dans la table profiles
-- select stripe_customer_id, subscription_status, subscription_id from profiles limit 5;
