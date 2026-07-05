const PERSONAS = {
  hitesh: {
    endpoint: '/api/hitesh',
    sessionKey: 'persona-ai-hitesh-session',
    greeting: 'Hanji! Kaise ho aap sabhi? Chai le aao, code hum karwa denge ☕',
  },
  piyush: {
    endpoint: '/api/piyush',
    sessionKey: 'persona-ai-piyush-session',
    greeting: 'Hey everyone! Let us build something production-minded.',
  },
};

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function addMessage(container, role, text, meta = '') {
  const message = document.createElement('div');
  message.className = `message ${role}`;
  message.innerHTML = `${escapeHtml(text)}${meta ? `<span class="message-meta">${escapeHtml(meta)}</span>` : ''}`;
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
}

function addTyping(container) {
  const node = document.createElement('div');
  node.className = 'message assistant';
  node.dataset.typing = 'true';
  node.innerHTML = '<span class="typing"><span></span><span></span><span></span>Thinking...</span>';
  container.appendChild(node);
  container.scrollTop = container.scrollHeight;
  return node;
}

async function loadSession(personaName, ui) {
  const persona = PERSONAS[personaName];
  const sessionId = localStorage.getItem(persona.sessionKey);
  if (!sessionId) {
    addMessage(ui.messages, 'assistant', persona.greeting, 'new session');
    return null;
  }

  try {
    const response = await fetch(`${persona.endpoint}/session?sessionId=${encodeURIComponent(sessionId)}`);
    if (!response.ok) {
      addMessage(ui.messages, 'assistant', persona.greeting, 'new session');
      return null;
    }

    const data = await response.json();
    ui.messages.innerHTML = '';
    for (const message of data.messages ?? []) {
      addMessage(ui.messages, message.role === 'user' ? 'user' : 'assistant', message.parts?.[0]?.text ?? message.content ?? '');
    }

    if ((data.messages ?? []).length === 0) {
      addMessage(ui.messages, 'assistant', persona.greeting, 'fresh session');
    }

    return sessionId;
  } catch {
    addMessage(ui.messages, 'assistant', persona.greeting, 'fresh session');
    return null;
  }
}

async function sendMessage(personaName, ui, text) {
  const persona = PERSONAS[personaName];
  const sessionId = localStorage.getItem(persona.sessionKey) ?? undefined;

  addMessage(ui.messages, 'user', text);
  const typing = addTyping(ui.messages);
  ui.send.disabled = true;
  ui.input.disabled = true;

  try {
    const response = await fetch(`${persona.endpoint}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text, sessionId }),
    });

    const data = await response.json();
    typing.remove();

    if (!response.ok) {
      addMessage(ui.messages, 'assistant', data.error ?? 'Something went wrong.');
      return;
    }

    if (data.sessionId) {
      localStorage.setItem(persona.sessionKey, data.sessionId);
    }

    const replyText = data.reply?.text ?? JSON.stringify(data.reply ?? {});
    addMessage(ui.messages, 'assistant', replyText, data.reply?.step ? `step: ${data.reply.step}` : 'response');
  } catch (error) {
    typing.remove();
    addMessage(ui.messages, 'assistant', error instanceof Error ? error.message : 'Network error');
  } finally {
    ui.send.disabled = false;
    ui.input.disabled = false;
    ui.input.focus();
  }
}

async function resetSession(personaName, ui) {
  const persona = PERSONAS[personaName];
  const sessionId = localStorage.getItem(persona.sessionKey);
  if (sessionId) {
    await fetch(`${persona.endpoint}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    }).catch(() => null);
  }

  localStorage.removeItem(persona.sessionKey);
  ui.messages.innerHTML = '';
  addMessage(ui.messages, 'assistant', persona.greeting, 'reset');
}

function setupChatShell(shell) {
  const personaName = shell.dataset.persona;
  const ui = {
    messages: shell.querySelector('[data-messages]'),
    form: shell.querySelector('[data-form]'),
    input: shell.querySelector('[data-input]'),
    send: shell.querySelector('button[type="submit"]'),
    reset: shell.querySelector('[data-action="reset"]'),
  };

  ui.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = ui.input.value.trim();
    if (!text) {
      return;
    }

    ui.input.value = '';
    await sendMessage(personaName, ui, text);
  });

  ui.reset.addEventListener('click', async () => {
    await resetSession(personaName, ui);
  });

  loadSession(personaName, ui);
}

document.querySelectorAll('.chat-shell').forEach(setupChatShell);