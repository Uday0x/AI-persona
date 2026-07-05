export const PERSONAS = {
  hitesh: {
    key: 'persona-ai-hitesh-session',
    label: 'Hitesh Sir',
    tagline: 'Warm Hinglish, project-first guidance.',
    endpoint: "https://persona-hitesh.onrender.com",
    greeting: 'Hanji! Kaise ho aap sabhi? Chai le aao, code hum karwa denge ☕',
    avatar: 'HC',
    accent: 'hitesh',
    image: '',
    quickPrompts: ['React roadmap batao', 'JavaScript samjhao simple example se', 'Node backend kaise start karu?'],
  },
  piyush: {
    key: 'persona-ai-piyush-session',
    label: 'Piyush Sir',
    tagline: 'Architecture-first, production-minded answers.',
    endpoint: "https://persona-piyush.onrender.com",
    greeting: 'Hey everyone! Let us build something production-minded.',
    avatar: 'PG',
    accent: 'piyush',
    image: '',
    quickPrompts: ['System design basics batao', 'Docker use kab karna chahiye?', 'GenAI project ka flow samjhao'],
  },
} as const;

export type PersonaId = keyof typeof PERSONAS;

export function normalizeAssistantPayload(value: unknown) {
  if (value == null) {
    return { text: '', meta: '' };
  }

  if (typeof value === 'object') {
    const record = value as { text?: unknown; step?: unknown };
    return {
      text: typeof record.text === 'string' ? record.text : JSON.stringify(value),
      meta: typeof record.step === 'string' ? record.step.toLowerCase() : '',
    };
  }

  if (typeof value !== 'string') {
    return { text: String(value), meta: '' };
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith('{')) {
    return { text: value, meta: '' };
  }

  try {
    const parsed = JSON.parse(trimmed) as { text?: unknown; step?: unknown };
    return {
      text: typeof parsed.text === 'string' ? parsed.text : value,
      meta: typeof parsed.step === 'string' ? parsed.step.toLowerCase() : '',
    };
  } catch {
    return { text: value, meta: '' };
  }
}

export function normalizeMessage(message: any) {
  if (message.role === 'user') {
    return {
      role: 'user' as const,
      text: message.parts?.[0]?.text ?? message.content ?? '',
    };
  }

  const payload = normalizeAssistantPayload(message.parts?.[0]?.text ?? message.content ?? '');
  return {
    role: 'assistant' as const,
    text: payload.text,
    meta: payload.meta || 'assistant',
  };
}