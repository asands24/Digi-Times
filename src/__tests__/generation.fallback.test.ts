jest.mock('../../netlify/functions/lib/storyAuth', () => ({ authorizeStoryGeneration: async () => 200 }));
jest.mock('openai', () => jest.fn());
it('identifies the local fallback and preserves the supplied memory without invented reporting', async () => {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  let handler: any;
  jest.isolateModules(() => { handler = require('../../netlify/functions/generateStory').handler; });
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const result = await handler({httpMethod:'POST',body:JSON.stringify({prompt:'Ana and Leo shared sandwiches in their garden.'})});
    const story = JSON.parse(result.body);
    expect(result.statusCode).toBe(200);
    expect(story.source).toBe('local');
    expect(story.fallbackReason).toBe('not_configured');
    expect(story.article).toContain('Ana and Leo shared sandwiches in their garden.');
    expect(story.article).not.toMatch(/witnesses|young reporters gathered/i);
  } finally {
    log.mockRestore();
    if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous;
  }
});

it('does not retry exhausted quota and reports a usable local draft', async () => {
  const previous=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='unit-test-key';
  const create=jest.fn().mockRejectedValue({status:429,code:'insufficient_quota'});
  let handler:any;
  jest.isolateModules(()=>{
    require('openai').mockImplementation(()=>({chat:{completions:{create}}}));
    handler=require('../../netlify/functions/generateStory').handler;
  });
  const log=jest.spyOn(console,'error').mockImplementation(()=>{});
  try {
    const result=JSON.parse((await handler({httpMethod:'POST',body:JSON.stringify({prompt:'A happy picnic.'})})).body);
    expect(result.source).toBe('local');expect(result.fallbackReason).toBe('rate_limit_or_quota');
    expect(create).toHaveBeenCalledTimes(1);
  } finally {log.mockRestore();if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous;}
});

it('identifies a successful AI response separately from the fallback', async () => {
  const previous=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='unit-test-key';
  const create=jest.fn().mockResolvedValue({choices:[{message:{content:JSON.stringify({headline:'Picnic Memories',article:'A family shared a sunny picnic.'})}}]});
  let handler:any;
  jest.isolateModules(()=>{
    require('openai').mockImplementation(()=>({chat:{completions:{create}}}));
    handler=require('../../netlify/functions/generateStory').handler;
  });
  try {
    const result=JSON.parse((await handler({httpMethod:'POST',body:JSON.stringify({prompt:'A happy picnic.'})})).body);
    expect(result.source).toBe('openai');expect(result.fallbackReason).toBeUndefined();
    expect(result.headline).toBe('Picnic Memories');expect(create).toHaveBeenCalledTimes(1);
  } finally {if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous;}
});

it('sends actual image content to vision before writing from separate observations and user facts', async () => {
  const previous = process.env.OPENAI_API_KEY; process.env.OPENAI_API_KEY = 'unit-test-key';
  const create = jest.fn().mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ photos: [{ index: 0, description: 'A cake on a table.' }, { index: 1, description: 'Two people standing near a table.' }] }) } }] })
    .mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ headline: 'Cake on the table', article: 'A cake stands on the table.', unknowns: ['What occasion was this?'] }) } }] });
  let handler: any;
  jest.isolateModules(() => { require('openai').mockImplementation(() => ({ chat: { completions: { create } } })); handler = require('../../netlify/functions/generateStory').handler; });
  try {
    const image = 'data:image/jpeg;base64,' + Buffer.from([255,216,255,224,0,0,0,0,0,0,0,0]).toString('base64');
    const result = JSON.parse((await handler({ httpMethod: 'POST', body: JSON.stringify({ prompt: 'Sam took these photos.', images: [image, image] }) })).body);
    expect(create.mock.calls[0][0].model).toBe('gpt-4o-mini');
    expect(create.mock.calls[0][0].messages[1].content.filter((part: any) => part.type === 'image_url')).toHaveLength(2);
    expect(create.mock.calls[0][0].messages[1].content[1].image_url.url).toBe(image);
    const input = JSON.parse(create.mock.calls[1][0].messages[1].content);
    expect(input.USER_FACTS).toBe('Sam took these photos.');
    expect(input.VISIBLE_OBSERVATIONS).toHaveLength(2);
    expect(create.mock.calls[1][0].messages[0].content).toContain('never invent');
    expect(create.mock.calls[1][0].messages[0].content).toContain('epic, cinematic third-person narrator');
    expect(create.mock.calls[1][0].messages[0].content).toContain('Do not infer destinations');
    expect(create.mock.calls[0][0].messages[0].content).toContain('do not guess a destination');
    expect(result.observations[1].index).toBe(1);
    expect(result.unknowns).toEqual(['What occasion was this?']);
  } finally { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous; }
});

it('rejects arbitrary URLs and invalid photo bytes without calling the provider', async () => {
  const { handler } = require('../../netlify/functions/generateStory');
  for (const images of [['http://localhost/private'], ['data:image/jpeg;base64,YmFk']]) {
    expect((await handler({ httpMethod: 'POST', body: JSON.stringify({ images }) })).statusCode).toBe(400);
  }
});
