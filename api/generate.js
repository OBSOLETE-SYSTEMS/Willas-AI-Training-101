// Vercel serverless function — generates copy-paste-ready "starter prompts" for the Willa's team,
// powered by Claude. Requires ANTHROPIC_API_KEY env var set in Vercel project settings.

const MODEL = 'claude-sonnet-4-6';
const TODAY = 'June 2026';

const WILLAS_CONTEXT = `
Willa's is the first & only WHOLE plant milk — made from the entire oat groat (like steel-cut oats),
not processed oat syrup. Most oat milks filter out the protein + fiber; Willa's keeps them.
Core facts (Original): 1g sugar (from oats, nothing added), 4g+ protein, 2g+ prebiotic fiber, 4 ingredients.
Heritage: named for the founder's grandmother Willa — "real food, passed down, reinvented forward."
Brand north star: "Nourish the spark in everyone." Voice: warm, clean, witty, confident — never clinical or preachy.
Products include Original, Barista, and a Kids line (co-created with parents).
`.trim();

function buildMessages(mode, task) {
  const safeTask = String(task || '').trim().slice(0, 1200);

  const system = `You are a sharp, friendly prompt-writer embedded with the Willa's marketing team during a live "AI 101" working session. Today is ${TODAY}.

BRAND CONTEXT (use it so the prompt feels native to Willa's, never generic):
${WILLAS_CONTEXT}

YOUR JOB: The teammate describes something they want to ${mode === 'automate' ? 'AUTOMATE (a repeated manual chore they want to turn into a reusable tool)' : 'MAKE (a thing they want to see and send — a doc, email, comp, page, etc.)'}. Write ONE excellent "starter prompt" they can copy, paste into Claude (or any AI agent), fill in the blanks, and run.

RULES FOR THE PROMPT YOU WRITE:
- Write it as a direct instruction TO the AI agent (second person: "You are…", "Build me…", "Help me…").
- Open by giving the agent a role + the goal in one or two sentences.
- Include the relevant Willa's context the agent would need (pull from the brand context above when useful).
- Leave clearly-marked fill-in blanks in [SQUARE BRACKETS] for anything specific to this teammate's situation.
- Tell the agent what "done" looks like and what format to return.
${mode === 'automate'
    ? '- Since this is an automation, design it to be REUSABLE: tell the agent to produce a tool/template that can be run again next time, and note what context to feed it each run.'
    : '- Encourage a fast, rough first version that can be reacted to and shipped, not a perfect one.'}
- Keep it tight: 120–220 words. Warm, plain language. No preamble, no markdown headers.

OUTPUT: Return ONLY the starter prompt text itself — nothing before or after it, no quotes, no explanation.`;

  const user = `Here's what I want to ${mode === 'automate' ? 'automate' : 'make'}:\n\n${safeTask}\n\nWrite my starter prompt.`;

  return { system, user };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // Graceful: the front-end shows a friendly fallback when this fires.
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured yet' });
  }

  const { mode = 'make', task = '' } = req.body || {};
  if (!String(task).trim()) {
    return res.status(400).json({ error: 'Tell me what you want to make or automate.' });
  }

  const { system, user } = buildMessages(mode, task);

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        temperature: 0.7,
        system,
        messages: [{ role: 'user', content: user }]
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(502).json({ error: 'Claude call failed', detail: errText.slice(0, 400) });
    }

    const data = await r.json();
    const text = data?.content?.[0]?.text;
    if (!text) {
      return res.status(502).json({ error: 'Claude returned an empty response' });
    }

    return res.status(200).json({ prompt: text.trim() });
  } catch (e) {
    return res.status(500).json({ error: 'Server error', detail: String(e).slice(0, 400) });
  }
}
