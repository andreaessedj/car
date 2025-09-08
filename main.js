
/* ======= Supabase client ======= */
const { createClient } = supabase;
/* Sostituisci con i tuoi valori reali se non già inizializzato altrove */
const SUPABASE_URL = typeof window.SUPABASE_URL === 'string' ? window.SUPABASE_URL : 'https://seweuyiyvicoqvtgjwss.supabase.co';
const SUPABASE_ANON = typeof window.SUPABASE_ANON === 'string' ? window.SUPABASE_ANON : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNld2V1eWl5dmljb3F2dGdqd3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxODkxMDQsImV4cCI6MjA1OTc2NTEwNH0.VmAIM06-p4MZz8fxB3HbTzo1QiA9-JBoabp-Aehu2ko';
const supa = createClient(SUPABASE_URL, SUPABASE_ANON);

/* ======= Random check-in SEMPRE su terra in Italia =======
   Strategia: scegliamo una città "interna" e generiamo un punto casuale entro 5 km.
   Questo garantisce che il punto sia su terraferma e dentro i confini italiani. */
const inlandCityCenters = [
  // Nord-Ovest / Nord
  {name:'Aosta', lat:45.7370, lon:7.3170},
  {name:'Torino', lat:45.0703, lon:7.6869},
  {name:'Cuneo', lat:44.3845, lon:7.5426},
  {name:'Asti', lat:44.9000, lon:8.2064},
  {name:'Alessandria', lat:44.9120, lon:8.6150},
  {name:'Novara', lat:45.4450, lon:8.6222},
  {name:'Pavia', lat:45.1860, lon:9.1556},
  {name:'Milano', lat:45.4642, lon:9.1900},
  {name:'Bergamo', lat:45.6983, lon:9.6773},
  {name:'Brescia', lat:45.5416, lon:10.2118},
  {name:'Cremona', lat:45.1333, lon:10.0227},
  {name:'Mantova', lat:45.1564, lon:10.7914},
  {name:'Trento', lat:46.0700, lon:11.1200},
  {name:'Bolzano', lat:46.4993, lon:11.3566},

  // Nord-Est / Pianura Padana
  {name:'Verona', lat:45.4384, lon:10.9916},
  {name:'Vicenza', lat:45.5455, lon:11.5354},
  {name:'Padova', lat:45.4064, lon:11.8768},
  {name:'Treviso', lat:45.6669, lon:12.2430},
  {name:'Udine', lat:46.0626, lon:13.2340},

  // Centro
  {name:'Parma', lat:44.8015, lon:10.3280},
  {name:'Reggio Emilia', lat:44.6970, lon:10.6313},
  {name:'Modena', lat:44.6471, lon:10.9252},
  {name:'Bologna', lat:44.4949, lon:11.3426},
  {name:'Firenze', lat:43.7696, lon:11.2558},
  {name:'Prato', lat:43.8800, lon:11.1000},
  {name:'Pistoia', lat:43.9300, lon:10.9200},
  {name:'Siena', lat:43.3188, lon:11.3308},
  {name:'Arezzo', lat:43.4633, lon:11.8797},
  {name:'Perugia', lat:43.1107, lon:12.3908},
  {name:'Terni', lat:42.5636, lon:12.6427},
  {name:"L'Aquila", lat:42.3512, lon:13.3984},
  {name:'Viterbo', lat:42.4207, lon:12.1077},
  {name:'Rieti', lat:42.4040, lon:12.8570},

  // Sud (interno)
  {name:'Frosinone', lat:41.6400, lon:13.3500},
  {name:'Benevento', lat:41.1300, lon:14.7800},
  {name:'Avellino', lat:40.9140, lon:14.7950},
  {name:'Campobasso', lat:41.5600, lon:14.6600},
  {name:'Potenza', lat:40.6403, lon:15.8050},
  {name:'Matera', lat:40.6663, lon:16.6043},
  {name:'Cosenza', lat:39.2989, lon:16.2533},
  {name:'Catanzaro', lat:38.9108, lon:16.5878},

  // Isole (interno)
  {name:'Nuoro', lat:40.3215, lon:9.3293},     // Sardegna
  {name:'Sassari', lat:40.7272, lon:8.5597},
  {name:'Enna', lat:37.5667, lon:14.2833},    // Sicilia
  {name:'Caltanissetta', lat:37.4900, lon:14.0613}
];

const fakeNames = [
  "Luca", "Giulia", "Marco", "Sara", "Ale", "Vale", "Ste", "Marty", "Fede", "Roby",
  "Simone", "Anna", "Gio", "Fra", "Cri", "Teo", "Simo", "Dani", "Leo", "Miki"
];

/* ---- Utils ---- */
function deg2rad(d){ return d * Math.PI / 180; }
function haversineKm(a, b){
  const R = 6371; // km
  const dLat = deg2rad(b.lat - a.lat);
  const dLng = deg2rad(b.lon - a.lon);
  const lat1 = deg2rad(a.lat);
  const lat2 = deg2rad(b.lat);
  const s = Math.sin(dLat/2)**2 + Math.sin(dLng/2)**2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(s));
}
function randomPointNear(lat, lon, maxKm = 5){
  // distribuzione uniforme per area
  const u = Math.random(); // 0..1
  const v = Math.random();
  const r = maxKm * Math.sqrt(u); // 0..maxKm
  const theta = 2 * Math.PI * v;
  const dLat = (r * Math.cos(theta)) / 111; // ~km->deg
  const dLon = (r * Math.sin(theta)) / (111 * Math.cos(deg2rad(lat)));
  return { lat: lat + dLat, lon: lon + dLon };
}

function getCheckinCountForHour(hour) {
  // 00:00–02:00 → 14–20
  if (hour >= 0 && hour < 2) return 14 + Math.floor(Math.random() * 7); // 14-20
  // 02:00–07:00 → 3–8
  if (hour >= 2 && hour < 7) return 3 + Math.floor(Math.random() * 6); // 3-8
  // 07:00–12:00 → 11–26
  if (hour >= 7 && hour < 12) return 11 + Math.floor(Math.random() * 16); // 11-26
  // 12:00–14:00 → 9–18
  if (hour >= 12 && hour < 14) return 9 + Math.floor(Math.random() * 10); // 9-18
  // 14:00–18:00 → 6–15
  if (hour >= 14 && hour < 18) return 6 + Math.floor(Math.random() * 10); // 6-15
  // 18:00–20:00 → 14–20
  if (hour >= 18 && hour < 20) return 14 + Math.floor(Math.random() * 7); // 14-20
  // 20:00–00:00 → 18–28
  if (hour >= 20 && hour < 24) return 18 + Math.floor(Math.random() * 11); // 18-28
  return 0;
}
function generateCheckinData() {
  const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
  const genders = ["M", "F", "Trans", "Trav"];
  const statuses = ["Single", "Coppia"];
  const gender = genders[Math.floor(Math.random() * genders.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const descriptions = [
    "Luogo tranquillo, facile parcheggio",
    "Zona discreta, pochi passanti",
    "Vicino a parco, ottima copertura",
    "Perfetto al tramonto",
    "Area riservata, consigliata la sera",
    "Facile accesso dalla strada principale",
    "Luogo con ottima privacy",
    "Panchine e alberi, ottimo per attesa",
    "Vicino a fermata bus",
    "Zona coperta in caso di pioggia",
    "Punto panoramico, vista mozzafiato",
    "Area poco frequentata, molta privacy",
    "Ottima illuminazione notturna",
    "Luogo silenzioso, lontano dal traffico",
    "Perfetto per incontri riservati",
    "Parcheggio sempre disponibile",
    "Spazio nascosto tra gli alberi",
    "Area ben curata e pulita",
    "Facile accesso dalla tangenziale",
    "Luogo discreto vicino al centro",
    "Ottimo per chi ama la natura",
    "Panchine disponibili, zona ombreggiata",
    "Perfetto per una pausa serale",
    "Zona poco illuminata, massima privacy",
  ];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  return { name, gender, status, description };
}

/* ======= Fake check-in inserter (terraferma garantita) ======= */
async function insertFakeCheckin() {
  const center = inlandCityCenters[Math.floor(Math.random() * inlandCityCenters.length)];
  const { lat, lon } = randomPointNear(center.lat, center.lon, 5); // ≤5 km
  const d = generateCheckinData();
  const nickname = d.name;
  const gender = d.gender;
  const status = d.status;
  const description = d.description + " (auto)";
  const city = center.name; // opzionale: reverse geocoding per maggiore precisione
  try {
    console.log(`[FAKE CHECKIN] ${nickname}, ${gender}, ${status}, ${description}, ${city}, ${lat}, ${lon}`);
    await supa.from('checkins').insert({
      nickname, description, lat, lon, city, photo: null, gender, status
    });
  } catch (e) {
    console.error('Errore insert fake check-in', e);
  }
}

async function scheduleFakeCheckins() {
  const now = new Date();
  const hour = now.getHours();
  const count = getCheckinCountForHour(hour);
  for (let i = 0; i < count; i++) {
    setTimeout(insertFakeCheckin, Math.random() * 60 * 60 * 1000);
  }
}

async function doCatchup() {
  const now = new Date();
  const hh = now.getHours();
  if (hh >= 1 && hh <= 6) {
    for (let i = 0; i < 30; i++) setTimeout(insertFakeCheckin, Math.random() * 10 * 60 * 1000);
  }
}

function startHourlyScheduler() {
  scheduleFakeCheckins();
  doCatchup();
  scheduleNextHour();
}

function scheduleNextHour() {
  const now = new Date();
  const msToNextHour = (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds();
  setTimeout(() => { scheduleFakeCheckins(); scheduleNextHour(); }, msToNextHour + 100);
}

/* ======= Realtime notif ======= */
try{
  supa.channel('public:checkins')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'checkins' }, payload => {
    const c = payload.new;
    const stored = JSON.parse(localStorage.getItem('notifiedCheckins') || '[]');
    if (!stored.includes(c.id)) {
      if (Notification && Notification.permission === 'granted') {
        new Notification('Nuovo check-in!', { body: `${c.nickname}: ${c.description}`, icon: 'logo.png' });
      }
    }
  }).subscribe();
} catch(e){ console.warn('Realtime non attivato', e); }

/* ======= MAPPA / MARKERS ======= */
let map = null;             // creata lazy
let tempLat = null, tempLon = null;
let markers = [], expirationTimers = [];
let markerCluster = null;

window.AM_initMap = function() {
  if (map) return;
  if (typeof L === 'undefined') { console.warn('Leaflet non caricato'); return; }
  map = L.map('map').setView([41.9, 12.5], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  if (L.markerClusterGroup) {
    markerCluster = L.markerClusterGroup();
    map.addLayer(markerCluster);
  }
  map.on('click', e => {
    const { lat, lng } = e.latlng;
    showModal(lat, lng);
  });
  try { renderCheckins(); } catch(e) { console.error(e); }
};

/* ======= GEOLOCALIZZAZIONE / MODALE ======= */
function geoCheckIn() {
  if (!navigator.geolocation) {
    window.showToast && showToast('Geolocalizzazione non supportata nel browser', 'error');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      if (map) { map.setView([latitude, longitude], 15); }
      showModal(latitude, longitude);
    },
    () => window.showToast ? showToast('Errore durante il recupero della posizione', 'error') : alert('Errore durante il recupero della posizione.'),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

function showModal(lat, lon) {
  tempLat = lat;
  tempLon = lon;
  document.getElementById('nickname').value = '';
  document.getElementById('description').value = '';
  document.getElementById('photoInput').value = '';
  const modal = document.getElementById('modal');
  modal.style.display = 'flex';
  modal.hidden = false;
  // focus primo campo
  setTimeout(()=>{ document.getElementById('nickname').focus(); }, 50);
}

function hideModal() {
  const modal = document.getElementById('modal');
  modal.style.display = 'none';
  modal.hidden = true;
}

/* ======= VALIDAZIONE MICRO-FEEDBACK ======= */
function validateForm(){
  const nickname = document.getElementById('nickname');
  const description = document.getElementById('description');
  const gender = document.querySelector('input[name="gender"]:checked');
  const status = document.querySelector('input[name="status"]:checked');

  let ok = true;
  if (!nickname.value.trim()){ nickname.setAttribute('aria-invalid','true'); ok = false; }
  else nickname.removeAttribute('aria-invalid');

  if (!description.value.trim()){ description.setAttribute('aria-invalid','true'); ok = false; }
  else description.removeAttribute('aria-invalid');

  if (!gender){ window.showToast && showToast('Seleziona un genere', 'error'); ok = false; }
  if (!status){ window.showToast && showToast('Seleziona uno stato', 'error'); ok = false; }
  if (tempLat === null || tempLon === null){ window.showToast && showToast('Seleziona una posizione sulla mappa o abilita la geolocalizzazione', 'error'); ok = false; }

  return ok;
}

/* ======= CONFERMA CHECK-IN ======= */
async function confirmCheckIn() {
  if (!validateForm()) return;

  const nickname = document.getElementById('nickname').value.trim();
  const description = document.getElementById('description').value.trim();
  const photoInput = document.getElementById('photoInput');
  const gender = document.querySelector('input[name="gender"]:checked')?.value || "";
  const status = document.querySelector('input[name="status"]:checked')?.value || "";

  const btn = document.getElementById('checkinConfirmBtn');
  if (btn){ btn.disabled = true; btn.textContent = 'Pubblico…'; }

  const insertCheckin = async (photoData) => {
    const city = await getCityFromCoords(tempLat, tempLon);
    try{
      const { error } = await supa.from('checkins').insert({ nickname, description, lat: tempLat, lon: tempLon, city, photo: photoData ?? null, gender, status });
      if (error) throw error;
      hideModal();
      renderCheckins();
      window.showToast && showToast('Check-in pubblicato!', 'success');
    } catch(e){
      console.error(e);
      window.showToast ? showToast('Errore nel salvataggio del check-in', 'error') : alert('Errore nel salvataggio del check-in');
    } finally {
      if (btn){ btn.disabled = false; btn.textContent = 'Conferma'; }
    }
  };

  if (photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function () { insertCheckin(reader.result); };
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    insertCheckin(null);
  }
}

function getCityFromCoords(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  return fetch(url)
    .then(res => res.json())
    .then(data => data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || "Sconosciuta")
    .catch(() => "Sconosciuta");
}

/* ======= RENDER CHECK-INS / LISTA / MARKERS ======= */
let renderCheckinsLock = false;

async function renderCheckins() {
  if (renderCheckinsLock) return;
  renderCheckinsLock = true;

  const list = document.getElementById("checkinList");
  list.setAttribute('aria-busy','true');
  list.innerHTML = "";

  // Pulisci markers
  if (markers && markers.length) {
    if (markerCluster) {
      try { markerCluster.clearLayers(); } catch(e){}
    } else if (map) {
      markers.forEach(m => { try { if (m && map.hasLayer(m)) map.removeLayer(m); } catch(e){} });
    }
    markers = [];
  }
  expirationTimers.forEach(clearInterval);
  expirationTimers = [];

  let data, error;
  try {
    const res = await supa.from('checkins').select('*');
    data = res.data;
    error = res.error;
    console.log('[CHECKINS SUPABASE]', data);
    if (error) throw error;
  } catch (e) {
    renderCheckinsLock = false;
    list.setAttribute('aria-busy','false');
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
    window.showToast ? showToast('Errore nel caricamento dei check-in', 'error') : alert('Errore nel caricamento dei check-in');
    return;
  }

  const now = new Date();
  const cityFilter = (document.getElementById('cityFilter').value || '').toLowerCase();
  const genderFilter = document.getElementById('genderFilter')?.value || "";
  const statusFilter = document.getElementById('statusFilter')?.value || "";
  const onlineOnly = !!document.getElementById('onlineFilter')?.checked;
  const photoOnly  = !!document.getElementById('photoFilter')?.checked;
  const radiusKm   = parseInt(document.getElementById('radiusFilter')?.value || '0', 10) || 0;

  const cutoffOnline = new Date(Date.now() - 15 * 60 * 1000);

  // Posizione utente (per raggio)
  let userLat = null, userLon = null;
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 });
      });
      userLat = pos.coords.latitude;
      userLon = pos.coords.longitude;
    } catch {}
  }

  function getDistanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const filtered = data.filter(c => {
    // parse created_at robusto
    let createdRaw = c.created_at;
    if (typeof createdRaw === 'string' && !createdRaw.endsWith('Z') && !/[+-][0-9]{2}:[0-9]{2}$/.test(createdRaw)) createdRaw += 'Z';
    const created = new Date(createdRaw);
    const cityValue = (c.city || "").toLowerCase();
    const matchCity = cityFilter === "" ? true : cityValue.includes(cityFilter);
    const matchGender = genderFilter ? c.gender === genderFilter : true;
    const matchStatus = statusFilter ? c.status === statusFilter : true;
    const onlinePass = onlineOnly ? (created >= cutoffOnline) : true;
    const photoPass  = photoOnly ? !!c.photo : true;
    const radiusPass = (radiusKm <= 0 || userLat == null || userLon == null) ? true : (getDistanceKm(userLat, userLon, c.lat, c.lon) <= radiusKm);
  // 6 ore di durata
  const notExpired = (now - created) <= (6 * 60 * 60 * 1000);
    // city obbligatoria per scartare mare (per sicurezza aggiuntiva)
    const isLand = c.city && typeof c.city === 'string' && c.city.trim().length > 0;
    const result = notExpired && matchCity && matchGender && matchStatus && onlinePass && photoPass && radiusPass && isLand;
    console.log('[CHECKIN FILTER]', {
      id: c.id,
      nickname: c.nickname,
      created_at: c.created_at,
      created,
      city: c.city,
      notExpired,
      matchCity,
      matchGender,
      matchStatus,
      onlinePass,
      photoPass,
      radiusPass,
      isLand,
      result
    });
    return result;
  }).sort((a, b) => {
    let aRaw = a.created_at, bRaw = b.created_at;
    if (typeof aRaw === 'string' && !aRaw.endsWith('Z') && !/[+-][0-9]{2}:[0-9]{2}$/.test(aRaw)) aRaw += 'Z';
    if (typeof bRaw === 'string' && !bRaw.endsWith('Z') && !/[+-][0-9]{2}:[0-9]{2}$/.test(bRaw)) bRaw += 'Z';
    return new Date(bRaw) - new Date(aRaw);
  });

  // Rimuovi “(auto)” per UI
  for (const c0 of filtered) {
    if (c0.description && typeof c0.description === 'string') {
      c0.description = c0.description.replace(/\s*\(auto\)\s*$/i, '');
    }
  }

  // Render lista + marker
  for (const c of filtered) {
    const createdAtStr = typeof c.created_at === 'string' && !/[+-][0-9]{2}:[0-9]{2}$/.test(c.created_at) && !c.created_at.endsWith('Z') ? c.created_at + 'Z' : c.created_at;
    const createdAt = new Date(createdAtStr);
    const expiresAt = new Date(createdAt.getTime() + 6 * 60 * 60 * 1000);

    const genderLabel = c.gender || "";
    const statusLabel = c.status || "";

    const item = document.createElement("div");
    item.className = "checkin-item";
    item.setAttribute('role','button');
    item.setAttribute('tabindex','0');
    item.setAttribute('aria-label', `${c.nickname}, ${genderLabel || 'genere non indicato'}, ${statusLabel || 'stato non indicato'}`);

    // Likes persistenti per utente
    let likes = JSON.parse(localStorage.getItem('checkinLikes') || '{}');
    let likeCount = c.like_count || 0;
    let liked = likes[c.id] === true;

    const chatBtn = `<button class='chat-btn' data-checkin='${c.id}' style='background:var(--chip-rose-bg);color:var(--chip-rose-fg);border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-weight:600;font-size:14px;margin:4px 0 4px 8px;cursor:pointer;'>💬 Chat</button>`;
    const reportBtn = `<button class='report-btn' data-id='${c.id}' style='background:#fffaf0;color:#b86b00;border:1px solid #ffe1b3;border-radius:8px;padding:6px 10px;font-weight:600;font-size:14px;margin:4px 0 4px 8px;cursor:pointer;'>🚩 Segnala</button>`;
    const shareBtn = `<button class='share-btn' data-lat='${c.lat}' data-lon='${c.lon}' style='background:#f0f9ff;color:#1466a8;border:1px solid #bfe8ff;border-radius:8px;padding:6px 10px;font-weight:600;font-size:14px;margin:4px 0 4px 8px;cursor:pointer;'>🔗 Condividi</button>`;

    item.innerHTML = `
      <b>${c.nickname}</b> 
      ${genderLabel ? `<span style="background:var(--chip-rose-bg);color:var(--chip-rose-fg);padding:2px 8px;border-radius:8px;margin-left:6px;">${genderLabel}</span>` : ""}
      ${statusLabel ? `<span style="background:var(--chip-blue-bg);color:var(--chip-blue-fg);padding:2px 8px;border-radius:8px;margin-left:4px;">${statusLabel}</span>` : ""}
      : ${c.description} ${c.city ? `(${c.city})` : ""}<br>
      <button class='like-btn' data-id='${c.id}' style='background:#fff0f4;color:#c2185b;border:1px solid #ffc1d6;border-radius:8px;padding:6px 10px;font-weight:600;margin:6px 0;cursor:pointer;'>❤️ ${likeCount + (liked ? 1 : 0)}</button>
      ${chatBtn}
      ${reportBtn}
      ${shareBtn}
      <div class='expiration-timer' id='timer-${c.id}'>Scade tra …</div>
      <div class='comment-input'>
        <input type='text' id='comment-${c.id}' placeholder='Aggiungi un commento (anonimo)…' aria-label='Commento per ${c.nickname}' />
        <button data-id='${c.id}'>Invia</button>
      </div>
      <div id='comments-${c.id}'></div>
    `;
    list.appendChild(item);

    // Accesso tastiera
    item.addEventListener('keydown', (ev)=>{
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        if (map) {
          map.flyTo([c.lat, c.lon], Math.max(map.getZoom(), 13), { duration: 0.5 });
          try{
            const m = markers.find(mk => mk.getLatLng && mk.getLatLng().lat===c.lat && mk.getLatLng().lng===c.lon);
            m && m.openPopup();
          }catch{}
        }
      }
    });

    // Marker + popup
    if (typeof L !== 'undefined') {
      const marker = L.marker([c.lat, c.lon]);
      if (markerCluster) { markerCluster.addLayer(marker); }
      else if (map) { marker.addTo(map); }
      marker.bindPopup(`
        <b>${c.nickname}</b> ${genderLabel ? `<span style='background:var(--chip-rose-bg);color:var(--chip-rose-fg);padding:2px 8px;border-radius:8px;margin-left:6px;'>${genderLabel}</span>` : ""} ${statusLabel ? `<span style='background:var(--chip-blue-bg);color:var(--chip-blue-fg);padding:2px 8px;border-radius:8px;margin-left:4px;'>${statusLabel}</span>` : ""}<br>
        ${c.description}<br>
        <a href='https://maps.google.com?q=${c.lat},${c.lon}' target='_blank' rel='noopener'>Naviga</a><br>
        <button onclick='openChatForCheckin(${c.id})' style='margin-top:6px;background:var(--chip-rose-bg);border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:15px;font-weight:600;cursor:pointer;'>💬 Chatta</button>
      `);
      markers.push(marker);
    }

    loadComments(c.id);

    const timerElement = document.getElementById(`timer-${c.id}`);
    const interval = setInterval(() => {
      const now2 = new Date();
      const diff = Math.max(0, Math.floor((expiresAt - now2) / 1000));
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      timerElement.textContent = `Scade tra ${h}h ${m}m ${s}s`;
      if (diff <= 0) {
        clearInterval(interval);
        timerElement.textContent = 'Scaduto';
      }
    }, 1000);
    expirationTimers.push(interval);

    // Like
    item.querySelector('.like-btn').addEventListener('click', async (ev) => {
      let likes = JSON.parse(localStorage.getItem('checkinLikes') || '{}');
      if (likes[c.id]) return;
      likes[c.id] = true;
      localStorage.setItem('checkinLikes', JSON.stringify(likes));
      ev.currentTarget.textContent = `❤️ ${likeCount + 1}`;
      try { await supa.rpc('increment_like', { checkin_id: c.id }); } catch {}
    });

    // Chat
    item.querySelector('.chat-btn').addEventListener('click', () => { openChatForCheckin(c.id); });

    // Report
    item.querySelector('.report-btn').addEventListener('click', async () => {
      const reason = prompt("Perché vuoi segnalare questo check-in?");
      if (!reason) return;
      try { await supa.from('reports').insert({ checkin_id: c.id, reason }); window.showToast && showToast('Grazie per la segnalazione.', 'success'); } catch (e) { window.showToast ? showToast('Errore durante la segnalazione.', 'error') : alert('Errore'); }
    });

    // Share
    item.querySelector('.share-btn').addEventListener('click', async (ev) => {
      const lat = ev.currentTarget.getAttribute('data-lat');
      const lon = ev.currentTarget.getAttribute('data-lon');
      const url = `https://maps.google.com?q=${lat},${lon}`;
      try {
        await navigator.clipboard.writeText(url);
        window.showToast && showToast('Link copiato negli appunti!', 'success');
      } catch {
        window.open(url, '_blank', 'noopener');
      }
    });

    // Commento
    item.querySelector('.comment-input button').addEventListener('click', async () => {
      const input = document.getElementById(`comment-${c.id}`);
      const text = (input.value || '').trim();
      if (!text) return;
      input.value = '';
      try {
        await supa.from('comments').insert({ checkin_id: c.id, text });
        loadComments(c.id);
      } catch (e) { window.showToast ? showToast('Errore durante l’invio del commento.', 'error') : alert('Errore'); }
    });
  }

  // Notifica vicinanza
  try {
    if (Notification && Notification.permission === 'granted') {
      const stored = JSON.parse(localStorage.getItem('notifiedCheckins') || '[]');
      const lastCheckin = filtered[0];
      if (lastCheckin && !stored.includes(lastCheckin.id) && userLat && userLon) {
        const dist = getDistanceKm(userLat, userLon, lastCheckin.lat, lastCheckin.lon);
        if (dist <= 10) {
          new Notification('Nuovo check-in vicino!', { body: `${lastCheckin.nickname}: ${lastCheckin.description}`, icon: 'logo.png' });
          stored.push(lastCheckin.id);
          localStorage.setItem('notifiedCheckins', JSON.stringify(stored));
        }
      }
    }
  } catch {}

  renderCheckinsLock = false;
  list.setAttribute('aria-busy','false');
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';
}

/* ======= COMMENTI ======= */
async function loadComments(checkinId) {
  try {
    const { data, error } = await supa.from('comments').select('*').eq('checkin_id', checkinId).order('created_at', { ascending: false });
    if (error) throw error;
    const container = document.getElementById(`comments-${checkinId}`);
    container.innerHTML = data.map(c => {
      const created = new Date(c.created_at);
      const hh = created.getHours().toString().padStart(2,'0');
      const mm = created.getMinutes().toString().padStart(2,'0');
      return `<div class='comment'>${c.text} <small style="color:#888">(${hh}:${mm})</small></div>`;
    }).join('');
  } catch (e) {
    console.error('Errore caricando commenti:', e);
  }
}

/* ======= Avvio scheduler (opzionale) ======= */
try { 
  startHourlyScheduler(); 
  insertFakeCheckin().then(() => {
    renderCheckins(); // Aggiorna la lista subito dopo aver generato il check-in automatico
  });
} catch(e){ 
  console.warn('Scheduler non avviato', e); 
}

/* ======= Export globals richiesti ======= */
window.geoCheckIn = geoCheckIn;
window.showModal = showModal;
window.hideModal = hideModal;
window.confirmCheckIn = confirmCheckIn;
window.renderCheckins = renderCheckins;
window.loadComments = loadComments;
