const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = [
  'You are a warm, creative newspaper reporter for kids ages 7–12.',
  'Write short, clear, engaging news-style articles.',
  'Follow newspaper structure: catchy headline; then 2–4 short paragraphs with who/what/where/why.',
  'Use friendly, simple language children can understand.',
  'Avoid scary, violent, or adult topics.',
  'Keep it positive, curious, and empowering.',
].join(' ');

exports.handler = async (event) => {
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }),
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('[generateStory] Missing OPENAI_API_KEY');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'OPENAI_API_KEY_NOT_CONFIGURED' }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'MISSING_BODY' }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (parseError) {
    console.error('[generateStory] Invalid JSON body', parseError);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'INVALID_JSON' }),
    };
  }

  const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
  if (!prompt) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'PROMPT_REQUIRED' }),
    };
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 600,
    });

    const text = completion.choices?.[0]?.message?.content?.trim() || '';
    if (!text) {
      console.error('[generateStory] Empty completion payload', completion);
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'OPENAI_EMPTY_RESPONSE' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article: text }),
    };
  } catch (error) {
    console.error('[generateStory] OpenAI request failed', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'OPENAI_REQUEST_FAILED' }),
    };
  }
};
