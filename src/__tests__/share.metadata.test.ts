const shareMeta = require('../../netlify/edge-functions/share-meta').default;

it('escapes public story text and replaces duplicate crawler metadata', async () => {
  (globalThis as any).Deno = { env: { get: (key: string) => key.includes('URL') ? 'https://example.supabase.co' : 'anon' } };
  const html = '<html><head><title>Default</title><meta property="og:title" content="Default"><meta name="description" content="Default"><meta name="twitter:card" content="Default"></head></html>';
  const response = (body: string) => ({ ok: true, text: async()=>body, headers: new Map() });
  const originalFetch = globalThis.fetch;
  const fetchMock = jest.fn().mockResolvedValueOnce({ok:true,json:async()=>[{title:'A <b>family</b> & "friends"',prompt:'"><img src=x>',image_path:'photo.jpg'}]} as any)
    .mockResolvedValueOnce(response(html) as any);
  globalThis.fetch = fetchMock;
  const originalResponse = globalThis.Response;
  (globalThis as any).Response = class { body: string; constructor(body: string){this.body=body} async text(){return this.body} };
  try {
    const result = await shareMeta({url:'https://digitimes.example/s/slug'} as any, {next:jest.fn()} as any);
    const rendered = await result.text();
    expect(rendered).toContain('A &lt;b&gt;family&lt;/b&gt; &amp; &quot;friends&quot;');
    expect(rendered).toContain('&quot;&gt;&lt;img src=x&gt;');
    expect(rendered.match(/property="og:title"/g)).toHaveLength(1);
    expect(rendered.match(/name="description"/g)).toHaveLength(1);
    expect(rendered.match(/name="twitter:card"/g)).toHaveLength(1);
    expect(rendered).not.toContain('<img src=x>');
  } finally {globalThis.fetch=originalFetch; (globalThis as any).Response=originalResponse;delete (globalThis as any).Deno;}
});
