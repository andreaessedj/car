import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';

// handleLike: mette like e ritorna { matched: boolean }
export async function handleLike(currentUserId: string, otherUserId: string) {
  // 1. salvo il like (ignoro errore unique)
  const { error: likeError } = await supabase
    .from('likes')
    .insert({
      from_user: currentUserId,
      to_user: otherUserId
    });

  if (likeError && likeError.code !== '23505') { // 23505 = unique_violation Postgres
    console.error('likeError', likeError);
    toast.error('Errore nel mettere like');
  }

  // 2. controllo match reciproco
  const { data: mutualLike, error: mutualErr } = await supabase
    .from('likes')
    .select('*')
    .eq('from_user', otherUserId)
    .eq('to_user', currentUserId)
    .maybeSingle();

  if (mutualErr) {
    console.error('mutualErr', mutualErr);
  }

  if (mutualLike) {
    toast.success('È un match! Ora potete scrivervi 😏');
    return { matched: true };
  } else {
    toast.success('Interesse inviato ✔');
    return { matched: false };
  }
}
