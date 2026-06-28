document.addEventListener('DOMContentLoaded', () => {
  const chatForm    = document.getElementById('chat-form');
  const userInput   = document.getElementById('user-input');
  const chatBox     = document.getElementById('chat-box');
  const themeToggle = document.getElementById('theme-toggle');
  const chipBar     = document.getElementById('chip-bar');
  const sendBtn     = document.getElementById('send-btn');

  // ── Theme Toggle ──────────────────────────────
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
  });

  // ── Chip Suggestions ──────────────────────────
  chipBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    userInput.value = chip.dataset.text;
    userInput.focus();
    // Auto-send
    chatForm.requestSubmit();
  });

  // ── Conversation History ───────────────────────
  let conversationHistory = [];
  let isLoading = false;

  // ── Welcome Card ──────────────────────────────
  function renderWelcome() {
    const card = document.createElement('div');
    card.className = 'welcome-card';
    card.id = 'welcome-card';
    card.innerHTML = `
      <span class="welcome-emoji">🐕</span>
      <h2>Halo! Aku DogBot 🐾</h2>
      <p>Aku adalah Canine Expert yang siap membantu seputar <strong>kesehatan, pelatihan, nutrisi</strong>, dan <strong>perawatan</strong> anjing peliharaanmu.<br><br>Mulai dengan memilih topik di atas atau ketik pertanyaanmu langsung!</p>
    `;
    chatBox.appendChild(card);
  }

  // ── Append Message Row ─────────────────────────
  function appendMessage(role, text) {
    // Remove welcome card on first message
    const welcome = document.getElementById('welcome-card');
    if (welcome) welcome.remove();

    const row = document.createElement('div');
    row.classList.add('message-row', role);

    // Bot avatar (only for model)
    if (role === 'model') {
      const avatar = document.createElement('div');
      avatar.className = 'msg-avatar';
      avatar.textContent = '🐕';
      row.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.classList.add('message', role);

    if (role === 'model') {
      bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    } else {
      bubble.textContent = text;
    }

    row.appendChild(bubble);
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;

    return bubble;
  }

  // ── Update bot bubble with text ────────────────
  function updateBotBubble(bubble, text) {
    bubble.innerHTML = marked.parse(text);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // ── Form Submit ───────────────────────────────
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const text = userInput.value.trim();
    if (!text) return;

    isLoading = true;
    sendBtn.disabled = true;

    appendMessage('user', text);
    userInput.value = '';

    conversationHistory.push({ role: 'user', text });

    const botBubble = appendMessage('model', '');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: conversationHistory })
      });

      if (!response.ok) throw new Error('Server responded with an error.');

      const data = await response.json();

      if (data && data.result) {
        updateBotBubble(botBubble, data.result);
        conversationHistory.push({ role: 'model', text: data.result });
      } else {
        botBubble.textContent = 'Maaf, tidak ada respons yang diterima.';
      }
    } catch (error) {
      console.error('Error during chat API call:', error);
      botBubble.textContent = '⚠️ Gagal terhubung ke server. Coba lagi ya!';
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      userInput.focus();
    }
  });

  // ── Init ──────────────────────────────────────
  renderWelcome();
  userInput.focus();
});
