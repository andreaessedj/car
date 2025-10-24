// supabase/functions/delete-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  // 1. Creo un client admin usando la SERVICE_ROLE_KEY
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // chiave con privilegi admin
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization') || '' }
      }
    }
  );

  // 2. Recupero l'utente loggato che sta chiedendo l'eliminazione
  const {
    data: { user },
    error: authError
  } = await supabaseAdmin.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Non autenticato' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const userId = user.id;

  // 3. Prendo info profilo per capire se è "club"
  const { data: prof } = await supabaseAdmin
    .from('profiles')
    .select('profile_type')
    .eq('id', userId)
    .single();

  // 4. Cancello dati correlati all'utente

  // messaggi inviati o ricevuti
  await supabaseAdmin
    .from('messages')
    .delete()
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

  // check-in dell'utente
  await supabaseAdmin
    .from('checkins')
    .delete()
    .eq('user_id', userId);

  // commenti dell'utente
  await supabaseAdmin
    .from('comments')
    .delete()
    .eq('user_id', userId);

  // se profilo "club", cancella eventi/orari e venue
  if (prof?.profile_type === 'club') {
    await supabaseAdmin
      .from('events')
      .delete()
      .eq('venue_id', userId);

    await supabaseAdmin
      .from('weekly_schedules')
      .delete()
      .eq('venue_id', userId);

    await supabaseAdmin
      .from('venues')
      .delete()
      .eq('id', userId);
  }

  // profilo
  await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);

  // 5. Cancello l’utente dall’auth
  const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteErr) {
    return new Response(
      JSON.stringify({ error: deleteErr.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 6. Risposta finale OK
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
