-- ============================================================
-- QOVEE — Schéma base de données Supabase
-- À coller dans : Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Extension UUID (activée par défaut sur Supabase)
create extension if not exists "uuid-ossp";


-- ────────────────────────────────────────────────────────────
-- TABLE : profiles
-- Une ligne par utilisateur (créée automatiquement à l'inscription)
-- ────────────────────────────────────────────────────────────
create table if not exists profiles (
  id                  uuid references auth.users primary key,
  agency_name         text not null default '',
  email               text,
  phone               text,
  address             text,
  atout_france_number text,
  garantie_financiere text default 'APST',
  rcp_assurance       text default 'AXA France',
  logo_url            text,
  accent_color        text not null default '#C4714A',
  created_at          timestamptz default now()
);

-- Trigger : créer automatiquement le profil lors de l'inscription
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, agency_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'agency_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ────────────────────────────────────────────────────────────
-- TABLE : devis
-- ────────────────────────────────────────────────────────────

-- Séquence pour numérotation auto (QOV-2026-0001, 0002, etc.)
create sequence if not exists devis_number_seq start 1;

create table if not exists devis (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid references profiles(id) on delete cascade not null,

  -- Numéro de devis auto-généré (QOV-2026-XXXX)
  devis_number       text unique,

  -- Infos générales
  title              text,
  destination        text,

  -- Groupe
  travelers          int,
  group_type         text check (group_type in ('solo', 'couple', 'famille', 'amis', 'groupe')),

  -- Budget
  budget             numeric,
  budget_type        text check (budget_type in ('par_personne', 'total')) default 'total',

  -- Dates
  duration           int,
  start_date         date,
  end_date           date,
  dates_flexibles    boolean default false,

  -- Questionnaire
  experience_type    text[],
  client_description text,     -- La demande brute du client (killer feature)
  contraintes        text,

  -- Résultat IA
  generated_content  jsonb,    -- JSON complet retourné par Claude
  total_price        numeric,

  -- Workflow agent
  status             text check (status in ('brouillon', 'envoye', 'accepte', 'refuse', 'expire'))
                     not null default 'brouillon',
  sent_at            timestamptz,
  client_name        text,
  client_email       text,

  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- Trigger : générer le numéro de devis automatiquement
create or replace function set_devis_number()
returns trigger as $$
begin
  if new.devis_number is null then
    new.devis_number :=
      'QOV-' || extract(year from now())::text
      || '-' || lpad(nextval('devis_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_devis_number on devis;
create trigger trigger_devis_number
  before insert on devis
  for each row execute function set_devis_number();

-- Trigger : mettre à jour updated_at automatiquement
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_devis_updated_at on devis;
create trigger trigger_devis_updated_at
  before update on devis
  for each row execute function update_updated_at();

-- Index pour les requêtes fréquentes
create index if not exists idx_devis_user_id on devis (user_id);
create index if not exists idx_devis_status  on devis (status);
create index if not exists idx_devis_created on devis (created_at desc);


-- ────────────────────────────────────────────────────────────
-- TABLE : feedback
-- L'agent évalue la qualité du devis généré
-- ────────────────────────────────────────────────────────────
create table if not exists feedback (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete cascade not null,
  devis_id    uuid references devis(id) on delete cascade,
  rating      text check (rating in ('parfait', 'a_ameliorer', 'pas_utilisable')),
  comment     text,
  created_at  timestamptz default now()
);

create index if not exists idx_feedback_user_id on feedback (user_id);


-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Chaque utilisateur ne voit QUE ses propres données
-- ────────────────────────────────────────────────────────────
alter table profiles  enable row level security;
alter table devis     enable row level security;
alter table feedback  enable row level security;

-- Profiles : lecture et modification de son propre profil
drop policy if exists "profiles_own" on profiles;
create policy "profiles_own"
  on profiles for all
  using (auth.uid() = id);

-- Devis : toutes les opérations sur ses propres devis
drop policy if exists "devis_own" on devis;
create policy "devis_own"
  on devis for all
  using (auth.uid() = user_id);

-- Feedback : toutes les opérations sur ses propres feedbacks
drop policy if exists "feedback_own" on feedback;
create policy "feedback_own"
  on feedback for all
  using (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- VÉRIFICATION
-- ────────────────────────────────────────────────────────────
-- Après exécution, tu dois voir :
-- ✅ Tables : profiles, devis, feedback
-- ✅ RLS activé sur les 3 tables
-- ✅ Triggers : on_auth_user_created, trigger_devis_number, trigger_devis_updated_at
-- ✅ Séquence : devis_number_seq
