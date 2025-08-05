// chat.js
// Gestione chat privata tra utenti tramite Supabase

// chat.js - Chat completamente anonima legata al check-in

// Crea il modal chat se non esiste
if (!document.getElementById('chatModal')) {
  const chatModal = document.createElement('div');
  chatModal.id = 'chatModal';
  chatModal.innerHTML = `
    <div id="chatBox">
      <div id="chatHeader">
        <span id="chatTitle">Chat check-in</span>
        <span id="closeChatBtn">✖</span>
      </div>
      <div id="chatMessages"></div>
      <div id="chatInputBox">
        <input type="text" id="chatInput" placeholder="Scrivi un messaggio...">
        <button id="sendChatBtn">Invia</button>
      </div>
    </div>
  `;
  document.body.appendChild(chatModal);
}

document.getElementById('closeChatBtn').onclick = () => {
  document.getElementById('chatModal').style.display = 'none';
};

let currentCheckinId = null;

// Chiedi nickname anonimo se non presente
function getAnonNickname() {
  let nick = localStorage.getItem('anon_nickname');
  if (!nick) {
    nick = prompt('Scegli un nickname anonimo per la chat:');
    if (!nick) nick = 'Anonimo';
    localStorage.setItem('anon_nickname', nick);
  }
  return nick;
}

// Apri la chat per un check-in
window.openChatForCheckin = function(checkinId) {
  currentCheckinId = checkinId;
  document.getElementById('chatTitle').textContent = 'Chat check-in #' + checkinId;
  document.getElementById('chatModal').style.display = 'flex';
  loadChatMessages();
};

async function loadChatMessages() {
  if (!currentCheckinId) return;
  const { data, error } = await supa.from('checkin_chats')
    .select('*')
    .eq('checkin_id', currentCheckinId)
    .order('created_at', { ascending: true });
  if (error) return;
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.innerHTML = data.map(m =>
    `<div class="msg${m.nickname === getAnonNickname() ? ' mine' : ''}"><b>${m.nickname}:</b> ${m.message}</div>`
  ).join('');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.getElementById('sendChatBtn').onclick = async function() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message || !currentCheckinId) return;
  const nickname = getAnonNickname();
  await supa.from('checkin_chats').insert({ checkin_id: currentCheckinId, nickname, message });
  input.value = '';
  loadChatMessages();
};

// Aggiorna chat in tempo reale
supa.channel('realtime:checkin_chats')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'checkin_chats' }, payload => {
    if (document.getElementById('chatModal').style.display === 'flex') loadChatMessages();
  })
  .subscribe();
