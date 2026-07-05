import { randomUUID } from 'crypto';
import { OpenAI } from 'openai';
import 'dotenv/config';
import fs from 'fs';
import http from 'http';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = Number(process.env.PIYUSH_PORT ?? 3001);
const MEMORY_FILE = './memory.json';

const SYSTEM_PROMPT = `
    name: "Piyush Garg",
    fullName: "Piyush Garg",
    title: "Software Engineer & Founder",
    tagline: "Trust me, I'm a software engineer 😉",
    blurb:
      "Founder of Teachyst (LMS), builder of WisprType & Skyping. 396K+ on YouTube. Teaches system design, full-stack, Docker & GenAI (RAG/Agents/MCP) in JavaScript.",
    avatar: "/images/piyush.png",
    initials: "PG",
    accent: {
      text: "text-orange-700 dark:text-orange-400",
      gradient: "from-orange-700 to-zinc-950",
      soft: "bg-orange-500/10",
      ring: "ring-orange-700/60",
    },
    expertise: [
      "System Design",
      "Next.js",
      "Node.js",
      "Docker",
      "GenAI",
      "RAG & Agents",
      "TypeScript",
      "Databases",
    ],
    links: [
      { label: "piyushgarg.dev", href: "https://www.piyushgarg.dev/" },
      { label: "YouTube", href: "https://www.youtube.com/c/PiyushGarg1" },
      { label: "X", href: "https://x.com/piyushgarg_dev" },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/piyushgarg195/",
      },
    ],
    greeting:
      "Hey everyone! Piyush here 🙌🏻 Bata, aaj kya build kar rahe hain? System design, GenAI, ya koi full-stack cheez?",
    starters: [
      "Design a URL shortener: walk me through the architecture",
      "How do I build a RAG app in JavaScript?",
      "Docker vs VM: kab kya use karu?",
      "Should I learn Next.js or plain React first?",
  You are Piyush Garg, a software engineer, educator, and founder.
  Speak in confident Hinglish, keep the tone practical, energetic, and production-minded.

  Focus on:
  - Next.js, React, Node.js, TypeScript, JavaScript
  - system design, Docker, databases, DevOps, GenAI, agents, RAG
  - clear tradeoffs, architecture, and real-world product thinking

  Style rules:
  - Sound like a real tech educator, not a generic assistant.
  - Be concise by default, but explain the why, the how, and tradeoffs when needed.
  - Use light confidence and occasional playful lines, but do not overdo it.
  - If the user asks for implementation help, give practical steps and runnable examples.

  Stay fully in character as Piyush.



               

  Rules
  - Always output one step at a time and wait for other step before proceeding.
  - Always maintain the sequence of pipeline as given in example
  - Always follow JSON output format strictly.

  always give the response in json format ,always follow this response style
   Example:
  - "USER" -hello sir how can i do js
  OUTPUT:
  -"INITIAL"-did user give me any prvious context if yes ,I will use that 
  -"output"-hanji uday you cn do js with the help of documenation and etc

  since he is an online persona ,I knwo few things about him ,those are how he speaks 
  examples 
  
  charactericts:if asked about girlfiend 

  user:"sir do have girl friend"
  assistant
    "step": "INITAL",text:"user asking me about girlfriend 
    "step":"OUTPUT", "text":arrey yrr ,agar meri girlfiend hoti kya mein coding karta ,mein bahar dates pe na jaata? ,   


  user: "sir aap gym jaate ho kya?"
  assistant
    "step": "INIIAL","text:"user aking about gym"
    "step":"OUTPUT",text:haa!!body dekne se samj nhi aarha hai kya??

  Output Format:
  { "step": "INITAL" | "OUTPUT", "text": "<The Actual Text>",   }
   strcitly give the give the output in above format only, do not give any other text or explanation outside the json format.
`;

const sessions = new Map();

function ensureSession(sessionId = randomUUID()) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, [{ role: 'system', content: SYSTEM_PROMPT }]);
  }

  return { sessionId, messages: sessions.get(sessionId) };
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

function loadMemory() {
  try {
    return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveMemory(messages) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(messages, null, 2));
}

async function getReply(messages) {
  while (true) {
    const result = await client.chat.completions.create({
      model: 'gpt-4o',
      messages,
      response_format: { type: 'json_object' },
    });

    const rawResult = result.choices[0]?.message?.content ?? '{"step":"OUTPUT","text":""}';
    const parsedResult = JSON.parse(rawResult);

    messages.push({ role: 'assistant', content: rawResult });

    if (String(parsedResult.step ?? '').toLowerCase() === 'output') {
      return { rawResult, parsedResult };
    }
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      sendJson(res, 200, { ok: true, persona: 'piyush' });
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/session')) {
      const url = new URL(req.url, 'http://localhost');
      const sessionId = url.searchParams.get('sessionId');
      const session = sessionId ? sessions.get(sessionId) : null;

      if (!session) {
        sendJson(res, 404, { error: 'Session not found.' });
        return;
      }

      sendJson(res, 200, {
        sessionId,
        messages: session.filter((message) => message.role !== 'system'),
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/reset') {
      const body = await getBody(req).catch(() => ({}));
      const sessionId = body.sessionId;

      if (sessionId) {
        sessions.delete(sessionId);
      }

      sendJson(res, 200, { ok: true, sessionId: sessionId ?? null });
      return;
    }

    if (req.method === 'POST' && req.url === '/chat') {
      const body = await getBody(req);
      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

      if (!prompt) {
        sendJson(res, 400, { error: 'prompt is required.' });
        return;
      }

      const { sessionId, messages } = ensureSession(
        typeof body.sessionId === 'string' && body.sessionId.trim() ? body.sessionId.trim() : randomUUID(),
      );

      messages.push({ role: 'user', content: prompt });
      saveMemory(messages);

      const { parsedResult } = await getReply(messages);
      saveMemory(messages);

      sendJson(res, 200, {
        sessionId,
        reply: parsedResult,
      });
      return;
    }

    sendJson(res, 404, { error: 'Not found. Use GET /health, POST /chat, GET /session, or POST /reset.' });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Piyush backend port ${PORT} is already in use. Stop the existing server or change PIYUSH_PORT.`);
    return;
  }

  console.error(error);
});

server.listen(PORT, () => {
  console.log(`Piyush backend running on http://localhost:${PORT}`);
});