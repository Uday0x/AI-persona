import { HITESH_PROMPT } from "./prompts/hitesh.js";
import { PIYUSH_PROMPT } from "./prompts/piyush.js";


const PERSONAS = {
    hitesh: HITESH_PROMPT,
    piyush: PIYUSH_PROMPT
};




const sessions = {
    hitesh: new Map(),
    piyush: new Map()
};


ensureSession(persona, sessionId)


const map = sessions[persona];

const result = await client.chat.completions.create({
    messages
});