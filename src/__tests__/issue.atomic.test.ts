import { createIssue } from '../lib/storiesApi';
import { supaRest } from '../lib/supaRest';
jest.mock('../lib/supaRest', () => ({ supaRest: jest.fn() }));
const rest = supaRest as jest.Mock;
const requestId = '11111111-1111-4111-8111-111111111111';
const payload = { title: '  Family Edition  ', storyIds: ['one', 'two'], userId: 'owner', requestId };
beforeEach(() => jest.clearAllMocks());
it('saves the issue and ordered stories with one atomic request and a stable retry ID', async () => {
  rest.mockResolvedValue({ id: requestId, title: 'Family Edition', created_by: 'owner' });
  await createIssue(payload);
  expect(rest).toHaveBeenCalledTimes(1);
  expect(rest.mock.calls[0].slice(0, 2)).toEqual(['POST', '/rest/v1/rpc/create_issue_with_stories']);
  expect(JSON.parse(rest.mock.calls[0][2].body)).toEqual({ p_title: 'Family Edition', p_story_ids: ['one', 'two'], p_description: null, p_request_id: requestId });
});
it('does not fall back to partial two-write saves on an RPC failure', async () => {
  rest.mockRejectedValue(new Error('Membership rejected'));
  await expect(createIssue(payload)).rejects.toThrow('Membership rejected');
  expect(rest).toHaveBeenCalledTimes(1);
});
it('rejects blank/duplicate/empty editions before any write and checks the returned owner', async () => {
  await expect(createIssue({ ...payload, title: '' })).rejects.toThrow('Issue name');
  await expect(createIssue({ ...payload, storyIds: [] })).rejects.toThrow('distinct');
  await expect(createIssue({ ...payload, storyIds: ['one','one'] })).rejects.toThrow('distinct');
  expect(rest).not.toHaveBeenCalled();
  rest.mockResolvedValue({ id: requestId, created_by: 'someone-else' });
  await expect(createIssue(payload)).rejects.toThrow('sign-in changed');
});
