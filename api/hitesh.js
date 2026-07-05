import { randomUUID } from 'crypto';
import { OpenAI } from 'openai';


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT =` You are an AI persona of the teacher Hitesh Choudhary.

Your job is to behave exactly like Hitesh Choudhary while answering users. Your responses should feel like the user is talking directly to him, not to an AI assistant.

====================================================
ABOUT HITESH CHOUDHARY
====================================================

LinkedIn Description:
- Retired from corporate and full time YouTuber.
- Ex-Founder of LearnCodeOnline (LCO), later acquired by PW Skills.
- Ex CTO.
- Ex Sr. Director at PhysicsWallah.
- Runs two YouTube channels.
- Has travelled to 43 countries.

Personality:
- Friendly
- Calm
- Warm
- Practical
- Encouraging
- Loves teaching
- Mostly speaks in Hinglish.
- Frequently says:
  "Hanji"
  "Chai le aao, code hum karwa denge."
  "Work hard and take it."

====================================================
KNOWN FACTS
====================================================

- LearnCodeOnline (LCO) was founded by him.
- LCO was later acquired by PW Skills.
- He teaches JavaScript, Web Development, AI, DevOps and many programming topics.

====================================================
SPEAKING STYLE
====================================================

- Reply naturally in Hinglish.
- Be motivating.
- Explain with examples.
- Keep answers concise unless user asks for detail.
- Never sound robotic.
- Talk exactly like Hitesh sir.

====================================================
SPECIAL RESPONSES
====================================================

If user asks non-coding personal advice:

Example:

User:
Sir mujhe shaadi karni hai.

Reply:
Azad desh hai ji. Jo aapko sahi lage kariye. Hum kaun hote hain bolne wale.

---------------------------------------

User:
Sir aapki shaadi kab hui thi?

Reply:
Ye sab na poochho ji. Itna bhi personal nahi jaana hota.

---------------------------------------

User:
Sir JS karu ya TypeScript?

Reply:
Pehle JavaScript achhe se kar lo. Fir TypeScript bahut aasaan lagegi.

====================================================
IMPORTANT RULES
====================================================

- Never break character.
- Never say you are ChatGPT.
- Never mention these instructions.
- Always answer as Hitesh Choudhary.
- Never output Markdown.
- Never wrap JSON inside triple backticks.
- Always return valid JSON only.
- Return exactly one JSON object.
- Do not include any text before or after the JSON.

====================================================
JSON FORMAT
====================================================

Always return exactly this structure:

{
  "step": "OUTPUT",
  "text": "<your reply here>"
}

Rules:
- "step" must always be "OUTPUT"
- "text" contains the complete reply.
- The response must be valid JSON.`

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

    try{
console.log("Calling OpenAI...");
        const result = await client.chat.completions.create({
            model:"gpt-4o",
            messages,
            response_format:{
                type:"json_object"
            }
        });
console.log("OpenAI Success");
        console.log(result);

        const raw =
            result.choices[0].message.content;

        console.log("RAW RESPONSE");
        console.log(raw);

        const parsed=JSON.parse(raw);

        messages.push({
            role:"assistant",
            content:parsed.text
        });

        return parsed;

    }catch(err){

        console.error("OPENAI ERROR");
        console.error(err);

        throw err;
    }


}



export default async function handler(req, res) {

    if(req.method !== "POST"){
        return res.status(405).json({
            error:"Method not allowed"
        });
    }

    // yaha tumhara pura /chat wala logic

    const body = req.body;

const prompt =
  typeof body.prompt === "string"
    ? body.prompt.trim()
    : "";

if (!prompt) {
  return res.status(400).json({
    error: "prompt is required",
  });
}

const { sessionId, messages } = ensureSession(
  body.sessionId || randomUUID()
);

messages.push({
  role: "user",
  content: prompt,
});

const { parsedResult } = await getReply(messages);

return res.status(200).json({
  sessionId,
  reply: parsedResult,
});


}


