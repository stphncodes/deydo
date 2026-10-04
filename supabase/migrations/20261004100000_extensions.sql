-- Extensions used across the schema. Supabase keeps extensions in the
-- `extensions` schema; everything below references them fully qualified.
create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;
