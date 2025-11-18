const OpenAI = require('openai');

const OPENAI_MODELS = ['o3-mini', 'gpt-4o-mini'];
const TIMEOUT_MS = 20000;
const RATE_LIMIT_RETRIES = 2;

const SYSTEM_PROMPT = [
  'You are a cheerful newspaper reporter writing for kids ages 7-12.',
  'Every response MUST be kid-safe with no scary, violent, or adult topics.',
  'Always use a classic newspaper structure:',
  '- Catchy headline at the top.',
  '- First paragraph includes who, what, where, and why.',
  '- Follow with 2 to 4 short paragraphs.',
  '- Keep the tone positive, clear, and reassuring.',
  'Write in simple language and avoid slang.',
  'Respond ONLY with minified JSON: {"headline":"...","article":"..."}',
  'In the article string, separate paragraphs with blank lines.',
].join(' ');

const openai =
  process.env.OPENAI_API_KEY &&
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event) => {
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'METHOD_NOT_ALLOWED' });
  }

  if (!event.body) {
    return jsonResponse(400, { error: 'MISSING_BODY' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return jsonResponse(400, { error: 'INVALID_JSON' });
  }

  const prompt =
    typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
  const context =
    typeof payload.context === 'string' ? payload.context.trim() : '';

  if (!prompt) {
    return jsonResponse(400, { error: 'PROMPT_REQUIRED' });
  }

  try {
    const story = await generateStory(prompt, context);
    return jsonResponse(200, story);
  } catch (err) {
    console.error('[generateStory] Falling back to local generator', err);
    const fallback = buildLocalStory(prompt, context);
    return jsonResponse(200, fallback);
  }
};

async function generateStory(prompt, context) {
  if (!openai) {
    throw new Error('OPENAI_NOT_CONFIGURED');
  }

  const userPrompt = [
    `PROMPT: ${prompt}`,
    context ? `CONTEXT: ${context}` : '',
    'Remember to keep the tone upbeat and family friendly.',
  ]
    .filter(Boolean)
    .join('\n\n');

  let lastError;
  for (const model of OPENAI_MODELS) {
    try {
      const completion = await callWithRetry(() =>
        callWithTimeout(() =>
          openai.chat.completions.create({
            model,
            temperature: 0.6,
            max_tokens: 600,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
          })
        )
      );

      const raw = completion.choices?.[0]?.message?.content?.trim();
      const parsed = parseStoryPayload(raw);
      if (parsed) {
        return parsed;
      }
    } catch (err) {
      lastError = err;
      const isUnavailable =
        err?.error?.code === 'model_not_found' ||
        err?.status === 404 ||
        err?.message?.includes('does not exist');
      if (!isUnavailable) {
        // For other errors we still try the next model, but log first.
        console.error(`[generateStory] model ${model} failed`, err);
      }
    }
  }

  throw lastError || new Error('OPENAI_NO_RESPONSE');
}

function parseStoryPayload(rawContent) {
  if (!rawContent) {
    throw new Error('OPENAI_EMPTY_RESPONSE');
  }

  const sanitized = rawContent.replace(/```json|```/gi, '').trim();
  let data;
  try {
    data = JSON.parse(sanitized);
  } catch (err) {
    console.error('[generateStory] Failed to parse JSON payload', sanitized);
    throw err;
  }

  if (!data?.headline || !data?.article) {
    throw new Error('OPENAI_INVALID_PAYLOAD');
  }

  return {
    headline: String(data.headline).trim(),
    article: String(data.article).trim(),
  };
}

function buildLocalStory(prompt, context) {
  const focus = prompt || 'a cheerful neighborhood moment';
  const place = context || 'the local community';
  const headline = `Bright News: ${capitalize(focus).slice(0, 80)}`;
  const paragraphs = [
    `Young reporters gathered in ${place} to cover ${focus}, eager to share who was involved, what made it special, and why it matters to friends and family.`,
    `Witnesses explained that the day stayed calm and friendly, with everyone pitching in to make sure the event felt welcoming and safe.`,
    `Kids wrapped up their notes with smiles, promising to keep telling positive stories that celebrate curiosity, kindness, and teamwork.`,
  ];

  return {
    headline,
    article: paragraphs.join('\n\n'),
  };
}

function capitalize(value) {
  if (!value) {
    return '';
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

async function callWithTimeout(operation) {
  return await Promise.race([
    operation(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('OPENAI_TIMEOUT')), TIMEOUT_MS)
    ),
  ]);
}

async function callWithRetry(operation, retries = RATE_LIMIT_RETRIES) {
  try {
    return await operation();
  } catch (err) {
    if (shouldRetry(err) && retries > 0) {
      const delay = 800 * (RATE_LIMIT_RETRIES - retries + 1);
      await wait(delay);
      return callWithRetry(operation, retries - 1);
    }
    throw err;
  }
}

function shouldRetry(err) {
  const status = err?.status || err?.error?.status || err?.response?.status;
  const message = err?.message?.toLowerCase?.() ?? '';
  return status === 429 || message.includes('rate limit') || message.includes('timeout');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}
