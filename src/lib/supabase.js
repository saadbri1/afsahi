// ─────────────────────────────────────────────────────────────────────────────
// Supabase client — single shared instance.
//
// The publishable (anon) key is DESIGNED to ship in client code; data access is
// governed by Row Level Security policies on the tables (see the SQL in
// src/lib/reservations.js). Values can be overridden via .env.
//
// ⚠️ Current policies allow anonymous read/write on `reservations` so the
// frontend-only admin works without a login backend. For a hardened setup,
// add Supabase Auth and restrict SELECT/UPDATE/DELETE to authenticated admins.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://dglqrbyvhazthmijoclm.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_NS143L7tBw88IMnuAM2PVQ_7h6q9rZu";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
