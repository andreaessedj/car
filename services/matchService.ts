import { supabase } from '../services/supabase';

// verifica se due utenti sono matchati
export async function areWeMatched(userA: string, userB: string) {
  const { data, error } = await supabase
    .from('likes')
    .select('from_user, to_user')
    .in('from_user', [userA, userB])
    .in('to_user', [userA, userB]);

  if (error) {
    console.error(error);
    return false;
  }

  const aLikesB = data.some(l => l.from_user === userA && l.to_user === userB);
  const bLikesA = data.some(l => l.from_user === userB && l.to_user === userA);

  return aLikesB && bLikesA;
}

// prende i candidati "matchabili" in base alle preferenze dell'utente loggato
export async function fetchMatchCandidates(currentUserId: string) {
  // prendo il profilo dell'utente loggato (per leggere looking_for_gender)
  const { data: meData, error: meErr } = await supabase
    .from('profiles')
    .select('gender, looking_for_gender')
    .eq('id', currentUserId)
    .single();

  if (meErr || !meData) {
    console.error('meErr', meErr);
    return [];
  }

  const myLookingFor = meData.looking_for_gender || 'Tutti';

  // costruisco la query dinamica
  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .neq('profile_type', 'club')
    .not('avatar_url', 'is', null); // solo chi ha foto

  if (myLookingFor !== 'Tutti') {
    query = query.eq('gender', myLookingFor);
  }

  const { data: candidates, error: candErr } = await query
    .order('last_active', { ascending: false })
    .limit(50);

  if (candErr) {
    console.error('candErr', candErr);
    return [];
  }

  return candidates || [];
}
