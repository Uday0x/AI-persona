import React, { useEffect, useState } from 'react';
import { PERSONAS, normalizeAssistantPayload, normalizeMessage, type PersonaId } from '../lib/personas';

interface ChatPageProps {
  personaId: PersonaId;
  onBack: () => void;
}

async function readApiResponse(response: Response) {
  const body = await response.text();

  if (!body.trim()) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    if (!response.ok) {
      throw new Error(body || `Request failed with status ${response.status}`);
    }

    throw new Error('Server returned an invalid response. Please check the backend terminal.');
  }
}

function getErrorMessage(data: any, response: Response) {
  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error;
  }

  if (response.status === 500) {
    return 'Backend server error. Please check OPENAI_API_KEY and the backend terminal logs.';
  }

  return `Request failed with status ${response.status}`;
}

function ChatPanel({ personaId }: { personaId: PersonaId }) {
  const persona = PERSONAS[personaId];
  const [messages, setMessages] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(persona.key) ?? '');
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let activeEffect = true;

    async function load() {
      if (!sessionId) {
        if (activeEffect) {
          setMessages([{ role: 'assistant', text: persona.greeting, meta: 'fresh session' }]);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`${persona.endpoint}/session?sessionId=${encodeURIComponent(sessionId)}`);
        if (!response.ok) throw new Error('session unavailable');

        const data = await readApiResponse(response);
        const restored = (data.messages ?? []).map(normalizeMessage);

        if (activeEffect) {
          setMessages(restored.length ? restored : [{ role: 'assistant', text: persona.greeting, meta: 'fresh session' }]);
          setLoading(false);
        }
      } catch {
        if (activeEffect) {
          setMessages([{ role: 'assistant', text: persona.greeting, meta: 'fresh session' }]);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      activeEffect = false;
    };
  }, [persona.endpoint, persona.greeting, sessionId]);

  async function sendMessage(prompt: string) {
    const userMessage = { role: 'user', text: prompt };
    setMessages((current) => [...current, userMessage, { role: 'assistant', text: 'Thinking...', meta: 'typing' }]);

    try {
      const response = await fetch(`${persona.endpoint}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, sessionId: sessionId || undefined }),
      });

      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(getErrorMessage(data, response));

      if (data.sessionId) {
        localStorage.setItem(persona.key, data.sessionId);
        setSessionId(data.sessionId);
      }

      const finalAnswer = normalizeAssistantPayload(data.reply);
      console.log(finalAnswer);
      setMessages((current) => [
        ...current.filter((message) => message.meta !== 'typing'),
        { role: 'assistant', text: finalAnswer.text, meta: 'response' },
      ]);
      console.log("DATA =", data);
      console.log("REPLY =", data.reply);  
    } catch (error) {
      setMessages((current) => [
        ...current.filter((message) => message.meta !== 'typing'),
        { role: 'assistant', text: error instanceof Error ? error.message : 'Network error', meta: 'error' },
      ]);
    }
   
  }

  async function resetSession() {
    if (sessionId) {
      await fetch(`${persona.endpoint}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => null);
    }

    localStorage.removeItem(persona.key);
    setSessionId('');
    setMessages([{ role: 'assistant', text: persona.greeting, meta: 'reset' }]);
  }

  const shellClassName = `chat-shell ${personaId === 'piyush' ? 'chat-shell-alt' : ''}`;

  return (
    <section className={shellClassName}>
      <div className="chat-header">
        <div>
          <p className="chat-kicker">{persona.label}</p>
          <h2>{persona.tagline}</h2>
          <p className="chat-subtitle">One persona, one clean thread, with your session remembered locally.</p>
        </div>
        <div className="chat-actions">
          <button type="button" className="ghost-btn" onClick={resetSession}>Reset</button>
        </div>
      </div>

      <div className="chat-body">
        {loading ? (
          <div className="message assistant bubble-assistant bubble-system">Loading conversation…</div>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.role}-${index}-${message.text.slice(0, 12)}`} className={`message ${message.role === 'user' ? 'bubble-user' : 'bubble-assistant'} ${message.meta === 'reset' ? 'bubble-system' : ''}`}>
              <div className="message-main">{message.text}</div>
            </div>
          ))
        )}
        {sending ? <div className="message assistant bubble-assistant bubble-typing"><span className="typing-dots"><span /><span /><span /></span> Thinking…</div> : null}
      </div>

      <div className="quick-prompts">
        {persona.quickPrompts.map((prompt) => (
          <button key={prompt} type="button" className="quick-prompt" onClick={() => setText(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          const value = text.trim();
          if (!value || sending) return;
          setText('');
          setSending(true);
          sendMessage(value).finally(() => setSending(false));
        }}
      >
        <textarea rows={2} placeholder={`Ask ${persona.label} something...`} value={text} onChange={(event) => setText(event.target.value)} />
        <button type="submit" disabled={sending}>{sending ? 'Sending' : 'Send'}</button>
      </form>
    </section>
  );
}

export default function ChatPage({ personaId, onBack }: ChatPageProps) {
  const [activePersona, setActivePersona] = useState<PersonaId>(personaId);

  useEffect(() => {
    setActivePersona(personaId);
  }, [personaId]);

  const persona = PERSONAS[activePersona];

  return (
    <div className="page-shell">
      <div className="bg-glow bg-glow-left" />
      <div className="bg-glow bg-glow-right" />

      <div className="app-shell chat-shell-page">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark brand-mark-logo" aria-hidden="true">
              <span className="brand-mark-core" />
              <span className="brand-mark-ring brand-mark-ring-one" />
              <span className="brand-mark-ring brand-mark-ring-two" />
            </div>
            <div>
              <p>Persona AI</p>
              <span>{persona.label} chat room</span>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="ghost-link" type="button" onClick={onBack}>Back to landing</button>
          </div>
        </header>

        <section className="chat-page-hero">
          <div>
            <div className="eyebrow eyebrow-landing">Dedicated chat screen, one persona at a time</div>
            <h1>{persona.label}</h1>
            <p>{persona.tagline}</p>
          </div>
          <div className="chat-page-summary">
            <div className={`avatar avatar-${persona.accent}`}>{persona.avatar}</div>
            <div>
              <strong>{persona.label}</strong>
              <span>{persona.tagline}</span>
            </div>
          </div>
        </section>

        <section className="chat-tabs chat-tabs-top">
          <button className={activePersona === 'hitesh' ? 'tab active tab-vertical' : 'tab tab-vertical'} type="button" onClick={() => setActivePersona('hitesh')}>
            <span className="persona-portrait persona-portrait-hitesh persona-portrait-sm" aria-hidden="true">
              <span className="avatar-letter">HC</span>
            </span>
            <span>
              <strong>Hitesh</strong>
              <small>Warm Hinglish</small>
            </span>
          </button>
          <button className={activePersona === 'piyush' ? 'tab active tab-vertical' : 'tab tab-vertical'} type="button" onClick={() => setActivePersona('piyush')}>
            <span className="persona-portrait persona-portrait-piyush persona-portrait-sm" aria-hidden="true">
              <span className="avatar-letter">PG</span>
            </span>
            <span>
              <strong>Piyush</strong>
              <small>Architecture-first</small>
            </span>
          </button>
        </section>

        <ChatPanel personaId={activePersona} />
      </div>
    </div>
  );
}