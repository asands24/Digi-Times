import { setStoryVisibility } from '../lib/storiesApi';
import { supaRest } from '../lib/supaRest';
jest.mock('../lib/supaRest', () => ({ supaRest: jest.fn() }));
const rest = supaRest as jest.Mock;

it('keeps existing recipient links stable when republishing', async () => {
  rest.mockResolvedValueOnce([{ id: 'story', public_slug: 'original-slug' }])
    .mockResolvedValueOnce([{ id: 'story', is_public: true }]);
  await setStoryVisibility('story', true);
  expect(JSON.parse(rest.mock.calls[1][2].body)).toEqual({ is_public: true });
});
it('creates a UUID slug before publishing a story for the first time', async () => {
  rest.mockResolvedValueOnce([{ id: 'story', public_slug: null }])
    .mockResolvedValueOnce([{ id: 'story', is_public: true }]);
  await setStoryVisibility('story', true);
  const patch = JSON.parse(rest.mock.calls[1][2].body);
  expect(patch.is_public).toBe(true);
  expect(patch.public_slug).toMatch(/^[a-f0-9-]{36}$/);
});
it('revokes access without removing the slug and rejects an unconfirmed write', async () => {
  rest.mockResolvedValueOnce([{ id: 'story', is_public: false }]);
  await setStoryVisibility('story', false);
  expect(JSON.parse(rest.mock.calls[0][2].body)).toEqual({ is_public: false });
  rest.mockResolvedValueOnce([]);
  await expect(setStoryVisibility('story', false)).rejects.toThrow('could not be updated');
});
