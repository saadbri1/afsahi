import { createClient } from "@supabase/supabase-js";

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function parseProjectUrl(value) {
  if (!value) return null;

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("VITE_SUPABASE_URL must be a valid URL such as https://project.supabase.co.");
  }

  const path = parsed.pathname.replace(/\/+$/, "");
  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname.endsWith(".supabase.co") ||
    path ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error(
      "VITE_SUPABASE_URL must contain only the Supabase project origin (https://project.supabase.co), without /v1, /rest, or /rest/v1."
    );
  }

  return parsed.origin;
}

let url = null;
let configurationError = null;

try {
  url = parseProjectUrl(configuredUrl);
} catch (error) {
  configurationError = error;
}

export const isSupabaseConfigured = Boolean(url && publishableKey && !configurationError);

let client;

export function getSupabase() {
  if (configurationError) throw configurationError;

  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the deployment environment."
    );
  }

  if (!client) {
    client = createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
      global: { headers: { "X-Client-Info": "afsahi-web/2" } },
    });
  }

  return client;
}
