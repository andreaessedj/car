// auth.js
// UI/logic per login, registrazione, logout e profilo (tabella public.profiles)
(function(){
  const supabase = window.sb?.client;
  if (!supabase) {
    console.error('Supabase client non inizializzato.');
    return;
  }

  // ---- Helpers UI ----
  const $ = (sel) => document.querySelector(sel);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  const userCard = $('#userCard');
  const userAvatar = $('#userAvatar');
  const userDisplay = $('#userDisplay');
  const userStatus = $('#userStatus');
  const openAuthBtn = $('#openAuthBtn');
  const openProfileBtn = $('#openProfileBtn');
  const logoutBtn = $('#logoutBtn');

  const authModal = $('#authModal');
  const profileModal = $('#profileModal');

  const signInBtn = $('#signInBtn');
  const signUpBtn = $('#signUpBtn');
  const resetBtn = $('#resetBtn');
  const authEmail = $('#authEmail');
  const authPassword = $('#authPassword');

  const pf_display_name = $('#pf_display_name');
  const pf_avatar_url = $('#pf_avatar_url');
  const pf_avatar_file = $('#pf_avatar_file');
  const pf_bio = $('#pf_bio');
  const pf_gender = $('#pf_gender');
  const pf_status = $('#pf_status');
  const saveProfileBtn = $('#saveProfileBtn');
  const deleteAccountBtn = $('#deleteAccountBtn');

  function show(el){ if(el) el.hidden = false; document.body.classList.add('no-scroll'); }
  function hide(el){ if(el) el.hidden = true; document.body.classList.remove('no-scroll'); }
  function toast(msg, type){ window.showToast ? showToast(msg, type||'info') : alert(msg); }

  // ---- Modal wiring ----
  on($('#authModal .auth-close'), 'click', ()=> hide(authModal));
  on($('#profileModal .auth-close'), 'click', ()=> hide(profileModal));
  on(openAuthBtn, 'click', ()=> show(authModal));
  on(openProfileBtn, 'click', ()=> { loadProfile().then(()=>show(profileModal)); });

  // ---- Auth actions ----
  async function signIn(){
    const email = authEmail.value.trim();
    const password = authPassword.value;
    if (!email || !password) return toast('Compila email e password', 'error');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return toast(error.message || 'Accesso non riuscito', 'error');
    toast('Bentornato!', 'success');
    hide(authModal);
    await ensureProfile(data.user);
    renderUser();
  }

  async function signUp(){
    const email = authEmail.value.trim();
    const password = authPassword.value;
    if (!email || !password) return toast('Compila email e password', 'error');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return toast(error.message || 'Registrazione non riuscita', 'error');
    toast(`Controlla la tua email per confermare l'account.`, 'info');
    hide(authModal);
    // Il profilo verrà creato al primo login confermato; proviamo comunque
    if (data.user) await ensureProfile(data.user);
    renderUser();
  }

  async function resetPassword(){
    const email = authEmail.value.trim();
    if (!email) return toast('Inserisci la tua email', 'error');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) return toast(error.message || 'Impossibile inviare il reset', 'error');
    toast(`Se esiste un account, riceverai un'email per il reset.`, 'success');
  }

  async function logout(){
    await supabase.auth.signOut();
    toast(`Sei uscito dall'account`, 'info');
    renderUser();
  }

  on(signInBtn, 'click', signIn);
  on(signUpBtn, 'click', signUp);
  on(resetBtn, 'click', resetPassword);
  on(logoutBtn, 'click', logout);

  // ---- Profiles table helpers ----
  async function ensureProfile(user){
    if (!user) {
      const { data: s } = await supabase.auth.getUser();
      user = s?.user;
      if (!user) return null;
    }
    const uid = user.id;
    // Prova a leggere
    const { data: existing, error: readErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (readErr) {
      console.warn('Read profile error', readErr);
      return null;
    }

    if (!existing) {
      // crea default
      const display_name = user.email?.split('@')[0] || 'Utente';
      const { data: inserted, error: insErr } = await supabase
        .from('profiles')
        .insert({
          id: uid,
          display_name,
          avatar_url: null,
          bio: null,
          gender: null,
          status: null
        })
        .select()
        .single();
      if (insErr) {
        console.warn('Insert profile error', insErr);
        return null;
      }
      return inserted;
    }
    return existing;
  }

  async function loadProfile(){
    const { data: s } = await supabase.auth.getUser();
    const user = s?.user;
    if (!user) return null;
    const { data: prof, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) { console.warn(error); return null; }

    pf_display_name.value = prof.display_name || '';
    pf_avatar_url.value = prof.avatar_url || '';
    pf_bio.value = prof.bio || '';
    pf_gender.value = prof.gender || '';
    pf_status.value = prof.status || '';
    return prof;
  }

  async function uploadAvatarIfAny(userId){
    const f = pf_avatar_file.files?.[0];
    if (!f) return null;
    try {
      // richiede un bucket "avatars" pubblico in Supabase Storage
      const path = `${userId}/${Date.now()}_${f.name}`;
      const { data, error } = await supabase.storage.from('avatars').upload(path, f, { upsert: true });
      if (error) { toast('Upload avatar fallito (configura il bucket "avatars")', 'error'); return null; }
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(data.path);
      return pub?.publicUrl || null;
    } catch (e) {
      console.warn(e); return null;
    }
  }

  async function saveProfile(){
    const { data: s } = await supabase.auth.getUser();
    const user = s?.user;
    if (!user) return toast('Devi essere loggato', 'error');

    let avatarUrl = (pf_avatar_url.value || '').trim() || null;
    const uploaded = await uploadAvatarIfAny(user.id);
    if (uploaded) avatarUrl = uploaded;

    const payload = {
      display_name: (pf_display_name.value || '').trim() || 'Utente',
      avatar_url: avatarUrl,
      bio: (pf_bio.value || '').trim() || null,
      gender: pf_gender.value || null,
      status: pf_status.value || null
    };

    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
    if (error) return toast(error.message || 'Salvataggio non riuscito', 'error');
    toast('Profilo aggiornato ✅', 'success');
    hide(profileModal);
    renderUser();
  }

  async function deleteAccount(){
    // Nota: il client anon non può cancellare utenti da auth.users.
    // Forniamo una richiesta di supporto via mail, oppure se c'è una funzione Edge, si può richiamare lì.
    toast(`Per eliminare l'account contatta il supporto.`, 'info');
  }

  on(saveProfileBtn, 'click', saveProfile);
  on(deleteAccountBtn, 'click', deleteAccount);

  // ---- Render user card ----
  async function renderUser(){
    const { data: s } = await supabase.auth.getUser();
    const user = s?.user;
    if (!user) {
      userAvatar.src = 'https://api.dicebear.com/7.x/initials/svg?seed=Guest';
      userDisplay.textContent = 'Ospite';
      userStatus.textContent = 'Non connesso';
      openAuthBtn.style.display = '';
      openProfileBtn.style.display = 'none';
      logoutBtn.style.display = 'none';
      return;
    }
    const prof = await ensureProfile(user);
    userDisplay.textContent = prof?.display_name || (user.email || 'Utente');
    userAvatar.src = prof?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.email||'U')}`;
    userStatus.textContent = prof?.status || 'Connesso';
    openAuthBtn.style.display = 'none';
    openProfileBtn.style.display = '';
    logoutBtn.style.display = '';
  }

  // ---- Session bootstrap & listener ----
  supabase.auth.onAuthStateChange((_event, _session) => {
    renderUser();
  });

  // Boot
  document.addEventListener('DOMContentLoaded', renderUser);
})();
