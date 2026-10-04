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
    expect(result.source).toBe('local');expect(result.fallbackReason).toBe('quota');
    expect(create).toHaveBeenCalledTimes(2);
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
