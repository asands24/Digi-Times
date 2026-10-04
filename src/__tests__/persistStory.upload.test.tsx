import { persistStory } from '../lib/persistStory';
import { supaRest } from '../lib/supaRest';
jest.mock('../lib/supaRest', () => ({ getAccessToken: () => 'test-token', supaRest: jest.fn() }));
jest.mock('../lib/supabaseClient', () => ({ supabaseClient: { storage: { from: () => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.com/${path}` } }) }) } } }));
const rest = supaRest as jest.Mock;
const originalXHR = global.XMLHttpRequest;
let request: any;
beforeEach(() => {
  rest.mockReset();
  class UploadXHR {
    upload = { onprogress: null as any };
    status = 200;
    responseText = '{}';
    onload: any;
    open = jest.fn();
    setRequestHeader = jest.fn();
    send = jest.fn(() => { this.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 }); this.onload(); });
    constructor() { request = this; }
  }
  global.XMLHttpRequest = UploadXHR as any;
});
afterEach(() => { global.XMLHttpRequest = originalXHR; });
it('uploads via authenticated XHR with progress then saves a private story over REST', async () => {
  rest.mockImplementation(async (_method, _path, options) => [{ id: 'saved-1', ...JSON.parse(options.body) }]);
  const file = new File(['image'], 'family photo.png', { type: 'image/png' });
  const progress = jest.fn();
  const result = await persistStory({ file, userId: 'user-1', templateId: 'template-1', meta: { headline: 'Family news', bodyHtml: '<p>A lovely day.</p>', prompt: 'Picnic' }, onProgress: progress });
  expect(request.open).toHaveBeenCalledWith('POST', expect.stringContaining('/storage/v1/object/photos/stories/user-1/'));
  expect(request.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  expect(request.send).toHaveBeenCalledWith(file);
  expect(progress).toHaveBeenCalledWith(50);
  expect(rest).toHaveBeenCalledWith('POST', '/rest/v1/story_archives?select=*', expect.objectContaining({ body: expect.any(String) }));
  expect(JSON.parse(rest.mock.calls[0][2].body)).toMatchObject({ is_public: false, template_id: 'template-1', created_by: 'user-1' });
  expect(result.story.imageUrl).toContain('stories/user-1/');
});
it('does not write a story record when image upload fails', async () => {
  const originalSend = global.XMLHttpRequest;
  global.XMLHttpRequest = class {
    upload = {};
    status = 500;
    responseText = 'failed';
    onload: any;
    open() {}
    setRequestHeader() {}
    send() { this.onload(); }
  } as any;
  await expect(persistStory({ file: new File(['x'], 'x.png'), userId: 'user-1', meta: { headline: 'Story', bodyHtml: '<p>Body</p>' } })).rejects.toThrow('Image upload failed');
  expect(rest).not.toHaveBeenCalled();
  global.XMLHttpRequest = originalSend;
});
