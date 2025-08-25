const { createClient } = supabase;
const supa = createClient('https://seweuyiyvicoqvtgjwss.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNld2V1eWl5dmljb3F2dGdqd3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxODkxMDQsImV4cCI6MjA1OTc2NTEwNH0.VmAIM06-p4MZz8fxB3HbTzo1QiA9-JBoabp-Aehu2ko');

// --- GENERAZIONE AUTOMATICA CHECK-IN RANDOM ITALIA ---
const fakeNames = [
  "Luca", "Giulia", "Marco", "Sara", "Ale", "Vale", "Ste", "Marty", "Fede", "Roby",
  "Simone", "Anna", "Gio", "Fra", "Cri", "Teo", "Simo", "Dani", "Leo", "Miki"
];

// Centri dei principali capoluoghi (lat, lon)
const cityCenters = [
  [45.4642, 9.19],    // Milano
  [41.9028, 12.4964], // Roma
  [40.8522, 14.2681], // Napoli
  [45.0703, 7.6869],  // Torino
  [43.7696, 11.2558], // Firenze
  [44.4949, 11.3426], // Bologna
  [44.4056, 8.9463],  // Genova
  [38.1157, 13.3615], // Palermo
  [41.1171, 16.8719], // Bari
  [45.4384, 10.9916], // Verona
];

// Italia bounds
const ITALY_BOUNDS = {
  minLat: 36.5,
  maxLat: 47,
  minLon: 6.6,
  maxLon: 18.5
};

// Calcola distanza tra due punti (km)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Genera coordinate random in Italia, evitando centro città (entro 3km) e solo su terraferma
async function randomItalyCoordsAvoidCenters() {
  let lat, lon, tooClose, isLand = false;
  while (!isLand) {
    do {
      lat = Math.random() * (ITALY_BOUNDS.maxLat - ITALY_BOUNDS.minLat) + ITALY_BOUNDS.minLat;
      lon = Math.random() * (ITALY_BOUNDS.maxLon - ITALY_BOUNDS.minLon) + ITALY_BOUNDS.minLon;
      tooClose = cityCenters.some(([clat, clon]) => haversine(lat, lon, clat, clon) < 3);
    } while (tooClose);
    // Verifica se è terraferma usando Nominatim
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.address && !data.address.ocean && !data.address.sea && !data.address.water) {
        isLand = true;
      }
    } catch {}
  }
  return [parseFloat(lat.toFixed(5)), parseFloat(lon.toFixed(5))];
}

// Quanti check-in generare in base all'ora
function getCheckinCountForHour(hour) {
  if (hour >= 1 && hour <= 4) return 0;
  if (hour >= 18 && hour <= 23) return Math.floor(Math.random() * 19) + 18;
  if (hour >= 10 && hour < 18) return Math.floor(Math.random() * 10) + 8;
  return Math.floor(Math.random() * 6) + 4;
}

// Descrizioni realistiche per check-in fake
const fakeDescriptions = [
  "Zona tranquilla, parcheggio facile",
  "Ottimo posto per incontrarsi",
  "Vista panoramica, poco traffico",
  "Area appartata, consigliata la sera",
  "Spazio ampio, privacy garantita",
  "Perfetto per chi cerca discrezione",
  "Frequentato da coppie",
  "Luogo sicuro, illuminato",
  "Consigliato dopo le 21",
  "Facile da raggiungere in auto"
];

// Genera un singolo check-in (async per attendere verifica terraferma)
async function generateCheckinData() {
  const [lat, lon] = await randomItalyCoordsAvoidCenters();
  return {
    nickname: fakeNames[Math.floor(Math.random() * fakeNames.length)],
    description: fakeDescriptions[Math.floor(Math.random() * fakeDescriptions.length)],
    gender: ["M", "F", "Trav", "Trans"][Math.floor(Math.random() * 4)],
    status: ["Coppia", "Single"][Math.floor(Math.random() * 2)],
    lat,
    lon,
    created_at: new Date().toISOString()
  };
}

// Inserisce un check-in su Supabase
async function insertFakeCheckin() {
  const data = await generateCheckinData();
  await supa.from('checkins').insert([data]);
}

// Scheduler: ogni ora genera N check-in distribuiti casualmente
function scheduleFakeCheckins() {
  function scheduleNextHour() {
    const now = new Date();
    const hour = now.getHours();
    const count = getCheckinCountForHour(hour);
    if (count === 0) {
      setTimeout(scheduleNextHour, 60 * 60 * 1000);
      return;
    }
    for (let i = 0; i < count; i++) {
      const delay = Math.floor(Math.random() * 60 * 60 * 1000);
      setTimeout(() => {
        insertFakeCheckin();
      }, delay);
    }
    setTimeout(scheduleNextHour, 60 * 60 * 1000);
  }
  scheduleNextHour();
}

// Avvia la generazione automatica
scheduleFakeCheckins();
// --- FINE GENERAZIONE AUTOMATICA ---

// --- NOTIFICHE PUSH AVANZATE ---
let preferredCity = localStorage.getItem('preferredCity') || '';
function setPreferredCity(city) {
  preferredCity = city;
  localStorage.setItem('preferredCity', city);
}

// Notifiche in tempo reale per i check-in
supa.channel('realtime:checkins')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, payload => {
    renderCheckins();
    // Notifica per città preferita
    if (window.Notification && Notification.permission === 'granted' && preferredCity) {
      const c = payload.new;
      if (c && c.city && c.city.toLowerCase().includes(preferredCity.toLowerCase())) {
        new Notification('Nuovo check-in nella tua città preferita!', {
          body: `${c.nickname}: ${c.description}`,
          icon: 'logo.png'
        });
      }
    }
  })
  .subscribe();

let map = L.map('map').setView([41.9, 12.5], 13);
let tempLat = null, tempLon = null;
let markers = [], expirationTimers = [];

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

function geoCheckIn() {
  if (!navigator.geolocation) return alert("Geolocalizzazione non supportata.");
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 15);
      showModal(latitude, longitude);
    },
    () => alert("Errore durante il recupero della posizione."),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

map.on('click', e => {
  const { lat, lng } = e.latlng;
  showModal(lat, lng);
});

function showModal(lat, lon) {
  tempLat = lat;
  tempLon = lon;
  document.getElementById('nickname').value = '';
  document.getElementById('description').value = '';
  document.getElementById('photoInput').value = '';
  document.getElementById('modal').style.display = 'flex';
}

function hideModal() {
  document.getElementById('modal').style.display = 'none';
}

async function confirmCheckIn() {
  const nickname = document.getElementById('nickname').value.trim();
  const description = document.getElementById('description').value.trim();
  const photoInput = document.getElementById('photoInput');
  const gender = document.querySelector('input[name="gender"]:checked')?.value || "";
  const status = document.querySelector('input[name="status"]:checked')?.value || "";
  if (!nickname || !description || tempLat === null || tempLon === null || !gender || !status) return alert("Compila tutti i campi e seleziona genere e stato.");

  const insertCheckin = async (photoData) => {
    const city = await getCityFromCoords(tempLat, tempLon);
    const { error } = await supa.from('checkins').insert({ nickname, description, lat: tempLat, lon: tempLon, city, photo: photoData ?? null, gender, status });
    if (error) {
      alert("Errore nel salvataggio del check-in: " + (error.message || error));
      return;
    }
    hideModal();
    renderCheckins();
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
  return fetch(url).then(res => res.json()).then(data => data.address?.city || data.address?.town || data.address?.village || "");
}

let renderCheckinsLock = false;
    async function renderCheckins() {
      if (renderCheckinsLock) return;
      renderCheckinsLock = true;
      const list = document.getElementById("checkinList");
      list.innerHTML = "";
      // Rimuovi tutti i marker dalla mappa solo se sono presenti
      if (markers && markers.length) {
        markers.forEach(m => {
          if (m && map.hasLayer(m)) map.removeLayer(m);
        });
        markers = [];
      }
      expirationTimers.forEach(clearInterval);
      expirationTimers = [];

      const { data, error } = await supa.from('checkins').select('*');
      if (error) {
        renderCheckinsLock = false;
        // Nascondi loader anche in caso di errore
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
        return alert("Errore nel caricamento dei check-in");
      }

      const now = new Date();
      const cityFilter = document.getElementById('cityFilter').value.toLowerCase();
      const genderFilter = document.getElementById('genderFilter')?.value || "";
      const statusFilter = document.getElementById('statusFilter')?.value || "";
      const distanceFilter = parseInt(document.getElementById('distanceFilter').value, 10);

      // Ottieni posizione utente (se disponibile)
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
        const created = new Date(c.created_at);
        const diff = (now - created) / 1000 / 3600;
        const matchCity = (c.city || "").toLowerCase().includes(cityFilter);
        let matchDistance = true;
        if (userLat != null && userLon != null) {
          const dist = getDistanceKm(userLat, userLon, c.lat, c.lon);
          matchDistance = dist <= distanceFilter;
        }
        const matchGender = genderFilter ? c.gender === genderFilter : true;
        const matchStatus = statusFilter ? c.status === statusFilter : true;
        return diff <= 6 && matchCity && matchDistance && matchGender && matchStatus;
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Rimuovi la dicitura 'Check-in automatico' da tutti i check-in visualizzati
      for (const c0 of filtered) {
        // Clona l'oggetto per non modificare l'originale
        const c = { ...c0 };
        if (typeof c.description === 'string' && c.description.trim().toLowerCase().startsWith('check-in automatico')) {
          // Sostituisci con una descrizione realistica random
          c.description = fakeDescriptions[Math.floor(Math.random() * fakeDescriptions.length)];
        }
        const createdAt = new Date(c.created_at);
        const expiresAt = new Date(createdAt.getTime() + 6 * 60 * 60 * 1000);

        // Mostra stringa vuota se gender/status non presenti
        const genderLabel = c.gender ? c.gender : "";
        const statusLabel = c.status ? c.status : "";

        const item = document.createElement("div");
        item.className = "checkin-item";
        // Like system: salva i like in localStorage per utente
        let likes = JSON.parse(localStorage.getItem('checkinLikes') || '{}');
        let likeCount = c.like_count || 0;
        let liked = likes[c.id] === true;

        // Pulsante chat anonima per ogni check-in
        const chatBtn = `<button class='chat-btn' data-checkin='${c.id}' style='background:#fff6f6;color:#ff3366;border:1px solid #ff3366;border-radius:8px;padding:2px 10px;font-size:14px;margin:4px 0 4px 8px;cursor:pointer;'>💬 Chat</button>`;
        // Pulsante segnala abuso
        const reportBtn = `<button class='report-btn' data-id='${c.id}' style='background:#ffe3e3;color:#ff3366;border:1px solid #ff3366;border-radius:8px;padding:2px 8px;font-size:13px;margin:4px 0 4px 8px;cursor:pointer;'>🚩 Segnala</button>`;
        // Pulsante condividi
        const shareBtn = `<button class='share-btn' data-lat='${c.lat}' data-lon='${c.lon}' data-nick='${c.nickname}' style='background:#e3f7ff;color:#3366ff;border:1px solid #3366ff;border-radius:8px;padding:2px 8px;font-size:13px;margin:4px 0 4px 8px;cursor:pointer;'>🔗 Condividi</button>`;

        item.innerHTML = `
          <b>${c.nickname}</b> 
          ${genderLabel ? `<span style=\"background:#ffe3e3;color:#ff3366;font-size:13px;padding:2px 8px;border-radius:8px;margin-left:6px;\">${genderLabel}</span>` : ""}
          ${statusLabel ? `<span style=\"background:#e3f7ff;color:#3366ff;font-size:13px;padding:2px 8px;border-radius:8px;margin-left:4px;\">${statusLabel}</span>` : ""}
          : ${c.description} (${c.city || ""})<br>
          <button class='like-btn' data-id='${c.id}' style='background:${liked ? "#ff3366" : "#e3f7ff"};color:${liked ? "#fff" : "#3366ff"};border:none;border-radius:8px;padding:2px 10px;font-size:14px;margin:4px 0 4px 0;cursor:pointer;'>❤️ ${likeCount + (liked ? 1 : 0)}</button>
          ${chatBtn}
          ${reportBtn}
          ${shareBtn}
          <div class='expiration-timer' id='timer-${c.id}'>Scade tra...</div>
          <div id="comments-${c.id}"></div>
          <div class='comment-input'>
            <input type='text' id='comment-input-${c.id}' placeholder='Scrivi un commento...'>
            <button onclick='addComment(${c.id})'>Invia</button>
          </div>
        `;
        // Eventi per segnalazione e condivisione
        item.querySelector('.report-btn').onclick = function(ev) {
          ev.stopPropagation();
          alert('Grazie per la segnalazione. Il check-in sarà revisionato.');
          // Qui puoi aggiungere logica per inviare la segnalazione a Supabase
        };
        item.querySelector('.share-btn').onclick = function(ev) {
          ev.stopPropagation();
          const url = `https://maps.google.com/?q=${c.lat},${c.lon}`;
          if (navigator.share) {
            navigator.share({
              title: `Check-in di ${c.nickname}`,
              text: `${c.nickname}: ${c.description}`,
              url
            });
          } else {
            prompt('Copia questo link per condividere:', url);
          }
        };
        item.onclick = (e) => { 
          if (e.target.classList.contains('like-btn')) return;
          if (e.target.classList.contains('chat-btn')) {
            openChatForCheckin(e.target.getAttribute('data-checkin'));
            e.stopPropagation();
            return;
          }
          map.setView([c.lat, c.lon], 16); 
        };
        list.appendChild(item);
      // Notifica push locale per nuovi check-in vicini
      if (window.Notification && Notification.permission === 'granted' && filtered.length > 0) {
        const lastCheckin = filtered[0];
        const notifiedIds = JSON.parse(localStorage.getItem('notifiedCheckins') || '[]');
        if (notifiedIds.indexOf(lastCheckin.id) === -1) {
          // Solo se il check-in è entro 10km dall'utente
          if (userLat && userLon && getDistanceKm(userLat, userLon, lastCheckin.lat, lastCheckin.lon) <= 10) {
            new Notification('Nuovo check-in vicino!', {
              body: `${lastCheckin.nickname}: ${lastCheckin.description}`,
              icon: 'logo.png'
            });
            notifiedIds.push(lastCheckin.id);
            localStorage.setItem('notifiedCheckins', JSON.stringify(notifiedIds));
          }
        }
      }

        // Like button event
        item.querySelector('.like-btn').onclick = function(ev) {
          ev.stopPropagation();
          let likes = JSON.parse(localStorage.getItem('checkinLikes') || '{}');
          if (likes[c.id]) return; // già messo like
          likes[c.id] = true;
          localStorage.setItem('checkinLikes', JSON.stringify(likes));
          this.style.background = '#ff3366';
          this.style.color = '#fff';
          let n = parseInt(this.textContent.replace(/[^0-9]/g, '')) || 0;
          this.innerHTML = `❤️ ${n+1}`;
        };

        const marker = L.marker([c.lat, c.lon]).addTo(map);
        marker.bindPopup(`<b>${c.nickname}</b> ${genderLabel ? `<span style='background:#ffe3e3;color:#ff3366;font-size:13px;padding:2px 8px;border-radius:8px;margin-left:6px;'>${genderLabel}</span>` : ""} ${statusLabel ? `<span style='background:#e3f7ff;color:#3366ff;font-size:13px;padding:2px 8px;border-radius:8px;margin-left:4px;'>${statusLabel}</span>` : ""}<br>${c.description}<br><a href='https://maps.google.com?q=${c.lat},${c.lon}' target='_blank'>Naviga</a>`);
        markers.push(marker);

        loadComments(c.id);

        const timerElement = document.getElementById(`timer-${c.id}`);
        const interval = setInterval(() => {
          const now = new Date();
          const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
          if (diff <= 0) {
            timerElement.textContent = "Scaduto";
            clearInterval(interval);
            renderCheckins();
          } else {
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            timerElement.textContent = `Scade tra ${h}h ${m}m ${s}s`;
          }
        }, 1000);
        expirationTimers.push(interval);
      }
      renderCheckinsLock = false;
      // Nascondi loader dopo il caricamento
      const loader = document.getElementById('loader');
      if (loader) loader.style.display = 'none';
    }

// Funzione per caricare i commenti (deve essere fuori da renderCheckins)
async function loadComments(checkinId) {
  const div = document.getElementById(`comments-${checkinId}`);
// ...existing code...
  const { data, error } = await supa.from('comments').select('*').eq('checkin_id', checkinId).order('created_at', { ascending: false });
  if (error) return;
  div.innerHTML = data.map(c => {
    const date = new Date(c.created_at);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = date.toLocaleDateString();
    // Like ai commenti
    let commentLikes = JSON.parse(localStorage.getItem('commentLikes') || '{}');
    let liked = commentLikes[c.id] === true;
    return `<div class='comment'>🔈 ${c.content} <span style='color:#888;font-size:11px;'>(${dateString} ${timeString})</span>
      <button class='like-comment-btn' data-id='${c.id}' style='background:${liked ? "#ff3366" : "#e3f7ff"};color:${liked ? "#fff" : "#3366ff"};border:none;border-radius:8px;padding:1px 8px;font-size:12px;margin-left:8px;cursor:pointer;'>👍</button>
      <button class='report-comment-btn' data-id='${c.id}' style='background:#ffe3e3;color:#ff3366;border:1px solid #ff3366;border-radius:8px;padding:1px 8px;font-size:12px;margin-left:4px;cursor:pointer;'>🚩</button>
    </div>`;
  }).join("");
  // Eventi like e segnalazione commenti
  div.querySelectorAll('.like-comment-btn').forEach(btn => {
    btn.onclick = function(ev) {
      ev.stopPropagation();
      let commentLikes = JSON.parse(localStorage.getItem('commentLikes') || '{}');
      const id = btn.getAttribute('data-id');
      if (commentLikes[id]) return;
      commentLikes[id] = true;
      localStorage.setItem('commentLikes', JSON.stringify(commentLikes));
      btn.style.background = '#ff3366';
      btn.style.color = '#fff';
    };
  });
  div.querySelectorAll('.report-comment-btn').forEach(btn => {
    btn.onclick = function(ev) {
      ev.stopPropagation();
      alert('Grazie per la segnalazione. Il commento sarà revisionato.');
      // Qui puoi aggiungere logica per inviare la segnalazione a Supabase
    };
  });
}

function toggleSidebar() {}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 15);
      renderCheckins();
    },
    () => { renderCheckins(); },
    { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
  );
} else {
  renderCheckins();
}
