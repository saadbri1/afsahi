import { getSupabase, isSupabaseConfigured } from "./supabase.js";

export async function getAuthorizedAdmin() {
  if (!isSupabaseConfigured) return { user: null, authorized: false, configurationError: true };

  const supabase = getSupabase();
  // getUser() validates the access token with Supabase Auth. Browser storage is
  // only a persistence mechanism and is never accepted as proof of identity.
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { user: null, authorized: false };

  const { data: authorized, error: roleError } = await supabase.rpc("is_admin");
  if (roleError) throw roleError;

  return { user: userData.user, authorized: authorized === true };
}

export async function signInAdmin(email, password) {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;

  const result = await getAuthorizedAdmin();
  if (!result.authorized) {
    await supabase.auth.signOut();
    throw new Error("This account is authenticated but is not approved for admin access.");
  }
  return result;
}

export async function signOutAdmin() {
  if (!isSupabaseConfigured) return;
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

export function onAdminAuthChange(callback) {
  if (!isSupabaseConfigured) return () => {};
  const { data } = getSupabase().auth.onAuthStateChange((event) => callback(event));
  return () => data.subscription.unsubscribe();
}
