import { supabase } from './supabaseClient';

export async function signUp({ email, password, role, fullName, phone, state, lga }) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) return { error: authError };
  if (!authData.user) return { error: { message: 'Sign up did not return a user.' } };

  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    role,
    full_name: fullName,
    phone,
    state,
    lga,
  });

  if (profileError) return { error: profileError };
  return { data: authData };
}

export async function signIn({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
        }
