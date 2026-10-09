import { generateGroundedStory, StoryAuthenticationError } from '../utils/storyGenerator';
import { studioDestination } from '../lib/studioDestination';
jest.mock('openai', () => jest.fn());
jest.mock('../lib/supaRest', () => ({ getAccessToken: jest.fn() }));
const token = jest.requireMock('../lib/supaRest').getAccessToken;
const originalFetch = global.fetch;
const { authorizeStoryGeneration } = require('../../netlify/functions/lib/storyAuth');
beforeEach(() => { global.fetch = jest.fn(); process.env.SUPABASE_URL = 'https://auth.example'; process.env.SUPABASE_ANON_KEY = 'public-test-key'; });
afterEach(() => { global.fetch = originalFetch; delete process.env.SUPABASE_URL; delete process.env.SUPABASE_ANON_KEY; });
it('rejects absent credentials before reaching Supabase or AI', async () => {
  const { handler } = require('../../netlify/functions/generateStory');
  const result = await handler({httpMethod:'POST',body:JSON.stringify({prompt:'A moment'})});
  expect(result.statusCode).toBe(401); expect(global.fetch).not.toHaveBeenCalled();
});
it.each([401,403])('rejects invalid/expired sessions (%i)', async status => {
  (global.fetch as jest.Mock).mockResolvedValue({status,ok:false});
  expect(await authorizeStoryGeneration({headers:{Authorization:'Bearer invalid'}})).toBe(401);
});
it('verifies the bearer token against Supabase and rejects anonymous auth users', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ok:true,json:async () => ({id:'owner',is_anonymous:false})}).mockResolvedValueOnce({ok:true,json:async () => ({id:'anonymous',is_anonymous:true})});
  expect(await authorizeStoryGeneration({headers:{authorization:'Bearer verified'}})).toBe(200);
  expect(global.fetch).toHaveBeenCalledWith('https://auth.example/auth/v1/user',expect.objectContaining({headers:{apikey:'public-test-key',Authorization:'Bearer verified'}}));
  expect(await authorizeStoryGeneration({headers:{authorization:'Bearer anonymous'}})).toBe(401);
});
it('fails closed if authentication is unavailable', async () => {
  (global.fetch as jest.Mock).mockRejectedValue(new Error('Timeout'));
  expect(await authorizeStoryGeneration({headers:{authorization:'Bearer token'}})).toBe(503);
});
it('blocks the client before image processing when signed out', async () => {
  token.mockReturnValue(null);
  await expect(generateGroundedStory('Facts')).rejects.toBeInstanceOf(StoryAuthenticationError);
  expect(global.fetch).not.toHaveBeenCalled();
});
it('sends the current session and surfaces expiry without producing a fallback story', async () => {
  token.mockReturnValue('current-session');
  (global.fetch as jest.Mock).mockResolvedValue({status:401,ok:false});
  await expect(generateGroundedStory('Facts')).rejects.toBeInstanceOf(StoryAuthenticationError);
  expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/generateStory',expect.objectContaining({headers:expect.objectContaining({Authorization:'Bearer current-session'})}));
});
it('retains studio template destinations and refuses external redirects', () => {
  expect(studioDestination('/create?template=family')).toBe('/create?template=family');
  for (const destination of ['https://evil.test','//evil.test','/create\\evil.test','/library']) expect(studioDestination(destination)).toBe('/create');
});
