import { storyPhotos } from '../lib/storyPhotos';
import { layoutEdition } from '../lib/newspaperLayout';
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
  await expect(persistStory({ file: new File(['x'], 'x.png', { type: 'image/png' }), userId: 'user-1', meta: { headline: 'Story', bodyHtml: '<p>Body</p>' } })).rejects.toThrow('Image upload failed');
  expect(rest).not.toHaveBeenCalled();
  global.XMLHttpRequest = originalSend;
});

it('saves five ordered original paths and keeps successful uploads for a retry', async () => {
  const files = Array.from({ length: 5 }, (_, i) => new File(['image'], `photo-${i}.png`, { type: 'image/png' }));
  let uploadCount = 0;
  let failAt = 2;
  global.XMLHttpRequest = class {
    upload = {}; status = 200; responseText = '{}'; onload: any;
    open() {} setRequestHeader() {}
    send() { this.status = uploadCount++ === failAt ? 500 : 200; this.onload(); }
  } as any;
  const params = { file: files[0], files, userId: 'owner', meta: { headline: 'Five photos', bodyHtml: '<p>Facts</p>' } };
  await expect(persistStory(params)).rejects.toThrow('retry Save Story');
  expect(rest).not.toHaveBeenCalled();
  failAt = -1;
  rest.mockImplementation(async (_method, _path, options) => [{ id: 'saved', ...JSON.parse(options.body) }]);
  const result = await persistStory(params);
  expect(uploadCount).toBe(6); // two successes reused; only failed/unattempted files uploaded.
  expect(result.story.images?.map(photo => photo.path.split('-photo-')[1])).toEqual(['0.png', '1.png', '2.png', '3.png', '4.png']);
  expect(result.story.image_path).toBe(result.story.images?.[0].path);
  expect(new Set(result.story.images?.map(photo => photo.path)).size).toBe(5);
  // Simulate the saved JSON returned on a fresh archive read, without blob URLs.
  const reopened = JSON.parse(JSON.stringify(result.story));
  const photos = storyPhotos(reopened);
  const layout = layoutEdition([{ ...reopened, id: 'saved', title: 'Five photos', created_at: '2026-10-08', imageUrl: null }], { title: 'Saved edition', paper: 'letter', date: '2026-10-08', showHistory: false });
  expect(layout.pages.flat().filter(block => block.kind === 'image').map(block => block.kind === 'image' ? block.url : '')).toEqual(photos.map(photo => photo.url));
  expect(photos).toHaveLength(5);
});

it('retains uploaded paths if the database write fails and retries without uploading again', async () => {
  const files = [new File(['photo'], 'once.png', { type: 'image/png' })];
  rest.mockRejectedValueOnce(new Error('Database unavailable'));
  const params = { file: files[0], files, userId: 'owner', meta: { headline: 'Photo', bodyHtml: '<p>Facts</p>' } };
  await expect(persistStory(params)).rejects.toThrow('preserved for retry');
  const firstPath = JSON.parse(rest.mock.calls[0][2].body).image_path;
  rest.mockImplementation(async (_method, _path, options) => [{ id: 'saved', ...JSON.parse(options.body) }]);
  await persistStory(params);
  expect(request.send).toHaveBeenCalledTimes(1);
  expect(JSON.parse(rest.mock.calls[1][2].body).image_path).toBe(firstPath);
});

it('reports slow uploads without dropping the original file or writing incomplete photo lists', async () => {
  global.XMLHttpRequest = class {
    upload = {}; ontimeout: any; open() {} setRequestHeader() {} send() { this.ontimeout(); }
  } as any;
  const file = new File(['image'],'slow.png',{type:'image/png'});
  await expect(persistStory({file,files:[file],userId:'owner',meta:{headline:'Slow photo',bodyHtml:'<p>Facts</p>'}})).rejects.toThrow('timed out');
  expect(rest).not.toHaveBeenCalled();
  expect(file.name).toBe('slow.png');
});

it('reuses original saved photo paths without uploading duplicates', async () => {
  const files = [new File(['photo'], 'saved.png', { type: 'image/png' }), new File(['photo'], 'new.png', { type: 'image/png' })];
  rest.mockImplementation(async (_method, _path, options) => [{ id: 'new-story', ...JSON.parse(options.body) }]);
  const result = await persistStory({ file: files[0], files, sourcePaths: ['stories/owner/original.png', undefined], userId: 'owner', meta: { headline: 'Fresh story', bodyHtml: '<p>Facts</p>' } });
  expect(request.send).toHaveBeenCalledTimes(1);
  expect(request.send).toHaveBeenCalledWith(files[1]);
  expect(result.story.images?.[0].path).toBe('stories/owner/original.png');
  expect(result.story.images?.[1].path).toContain('-new.png');
});

it('rejects saved references from another account before uploads or writes', async () => {
  const file = new File(['photo'], 'saved.png', { type: 'image/png' });
  await expect(persistStory({ file, files: [file], sourcePaths: ['stories/other/private.png'], userId: 'owner', meta: { headline: 'Story', bodyHtml: '<p>Facts</p>' } })).rejects.toThrow('current account');
  expect(rest).not.toHaveBeenCalled();
});

it('saves a single photo on a legacy database only after a confirmed missing-images rejection', async () => {
  rest.mockRejectedValueOnce(new Error('Supabase REST error 400: {"code":"PGRST204","message":"images column missing"}'));
  rest.mockImplementationOnce(async (_method, _path, options) => [{id:'legacy-save', ...JSON.parse(options.body)}]);
  const file = new File(['photo'],'one.png',{type:'image/png'});
  const result = await persistStory({file,files:[file],userId:'owner',meta:{headline:'Scene',bodyHtml:'<p>Facts</p>'}});
  expect(rest).toHaveBeenCalledTimes(2);
  const first = JSON.parse(rest.mock.calls[0][2].body), second = JSON.parse(rest.mock.calls[1][2].body);
  expect(second.images).toBeUndefined();
  expect(second.image_path).toBe(first.images[0].path);
  expect(request.send).toHaveBeenCalledTimes(1);
  expect(result.story.id).toBe('legacy-save');
});

it('never drops photos or retries an ambiguous database failure automatically', async () => {
  const files = [new File(['photo'],'a.png',{type:'image/png'}),new File(['photo'],'b.png',{type:'image/png'})];
  rest.mockRejectedValueOnce(new Error('Supabase REST error 400: {"code":"42703","message":"images column missing"}'));
  await expect(persistStory({file:files[0],files,userId:'owner',meta:{headline:'Scene',bodyHtml:'<p>Facts</p>'}})).rejects.toThrow('storage update');
  expect(rest).toHaveBeenCalledTimes(1);
  rest.mockReset(); rest.mockRejectedValue(new Error('Network timeout'));
  await expect(persistStory({file:files[0],files:[files[0]],userId:'owner',meta:{headline:'Scene',bodyHtml:'<p>Facts</p>'}})).rejects.toThrow('preserved for retry');
  expect(rest).toHaveBeenCalledTimes(1);
});

it('identifies an expired session instead of suggesting a storage migration', async () => {
  rest.mockRejectedValue(new Error('Please log in again to continue.'));
  const file = new File(['photo'],'one.png',{type:'image/png'});
  await expect(persistStory({file,userId:'owner',meta:{headline:'Scene',bodyHtml:'<p>Facts</p>'}})).rejects.toThrow('session expired');
});
