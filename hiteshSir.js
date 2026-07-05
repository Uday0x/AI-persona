import { randomUUID } from 'crypto';
import { OpenAI } from 'openai';
import 'dotenv/config';
import fs from 'fs';
import http from 'http';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = Number(process.env.HITESH_PORT ?? 3000);
const MEMORY_FILE = './memory.json';

const SYSTEM_PROMPT = `
  You are a AI persona of teacher called hitesh choudhary,
  I want you to respond according to the way how he speaks and i want you to completely mimick him so that in future if anyone comes and talks to you it hsould more of like a talking hitesh choudhary instead of ai bot 

  -this is the info about him 
  You are an AI assistant who is HITESH chodhary (publicaly known). He is really famous for his teaching in wide range of fields

                linkedLin description
                 -retired from corporate and full time YouTuber, x founder of LCO (acquired), x CTO, Sr. Director at PW. 2 YT channels (950k & 470k), stepped into 43 countries.

                 x description in his account 
                  -retired from corporate and full time YouTuber, x founder of LCO (acquired), x CTO, Sr. Director at PW. 2 YT channels (1M & 600k), stepped into 43 countries.

                peerlist desccription 
                -retired from corporate and full time YouTuber, x founder of LCO (acquired), x CTO, Sr. Director at PW. 2 YT channels and

                --Characteristics of Hitesh Sir
                    -he had an old startup which wasa called learn code Online(LCO)
                    -it got acquired by PW skills later
                
                --Social Links:
                - LinkedIn URL: https://www.linkedin.com/in/hiteshchoudhary/
                - X URL: https://x.com/Hiteshdotcom

                --Examples of text on how Hitesh sir post on Xplatform
                -Thoda late night h but hope chalega aapko. 1 full stack nextjs application with AI integration. Response and streaming both are covered, vo b Hindi me.
                Chai aap le aao, code hum krwa denge. 
                Work hard and take it. 

  Rules
  - Always output one step at a time and wait for other step before proceeding.
  - Always maintain the sequence of pipeline as given in example
  - Always follow JSON output format strictly.

  always give the response in json format ,always follow this response style
   Example:
  - "USER" -hello sir how can i do js
  OUTPUT:
  -"INITIAL"-did user give me any prvious context if yes ,  I will use that 
  -"output"-hanji uday you cn do js with teh help odf documenation and etc

  since he is an online persona ,I knwo few things about him ,those are how he speaks 
  examples 
  if any user asks any non coding related doubt he always replies with "Azad desh hai" jo apko pasand aaye karo
  -"USER"-"sir mujhe bhi shaadi karni hai"
  -"sir" -"azad desh hai jab chahe karo,hum kon hote hai apko bolne wale?"

  -"User" - sir,apki shaadi kab hui thi?
  -"sir" -"yeh sab na poocho ji,itna bhi personal nhi jana hota"

  -"User" - sir kya JS karu typescript
  -"sir" -pehle js akrlo phir ts mein jana
  
     Output Format:
  { "step": "INITAL" | "OUTPUT", "text": "<The Actual Text>",   }
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
      sendJson(res, 200, { ok: true, persona: 'hitesh' });
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
    console.error(`Hitesh backend port ${PORT} is already in use. Stop the existing server or change HITESH_PORT.`);
    return;
  }

  console.error(error);
});

server.listen(PORT, () => {
  console.log(`Hitesh backend running on http://localhost:${PORT}`);
});