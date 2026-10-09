import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EventBuilder from '../components/EventBuilder';
jest.mock('../providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('../hooks/useStoryLibrary', () => ({ useStoryLibrary: jest.fn() }));
jest.mock('../components/TemplatesGallery', () => ({ TemplatesGallery: () => null }));
jest.mock('../utils/storyGenerator', () => ({ ...jest.requireActual('../utils/storyGenerator'), generateGroundedStory: jest.fn() }));
const auth = jest.requireMock('../providers/AuthProvider').useAuth;
const save = jest.fn();
const generate = jest.requireMock('../utils/storyGenerator').generateGroundedStory;
beforeEach(() => {
  auth.mockReturnValue({user:{id:'owner'}});
  jest.requireMock('../hooks/useStoryLibrary').useStoryLibrary.mockReturnValue({saveDraftToArchive:save});
  generate.mockImplementation(async (_facts: string, files: File[]) => ({headline:files[0].name,article:'The real moment.',source:'openai',observations:[],unknowns:[]}));
});
async function prepare() {
  const view = render(<MemoryRouter><EventBuilder /></MemoryRouter>);
  const files = ['one','two','three'].map(name => new File(['photo'],name+'.png',{type:'image/png'}));
  await act(async () => { await userEvent.upload(view.container.querySelector('input[type=file]')!,files); });
  await userEvent.click(screen.getByRole('button',{name:'Generate Stories'}));
  await screen.findByRole('button',{name:'Save all 3 stories'});
  return view;
}
it('saves every ready story once and builds an issue with all saved IDs in order', async () => {
  let release!: (value:any) => void;
  save.mockImplementationOnce(() => new Promise(resolve => {release=resolve;}));
  save.mockResolvedValueOnce({story:{id:'saved-two'},error:null}).mockResolvedValueOnce({story:{id:'saved-three'},error:null});
  await prepare();
  const button=screen.getByRole('button',{name:'Save all 3 stories'});
  fireEvent.click(button); fireEvent.click(button);
  expect(save).toHaveBeenCalledTimes(1);
  expect(button).toBeDisabled();
  expect(screen.getAllByLabelText('Headline').every(input => (input as HTMLTextAreaElement).disabled)).toBe(true);
  expect(screen.getByText(/Saving story 1 of 3/)).toBeInTheDocument();
  await act(async () => release({story:{id:'saved-one'},error:null}));
  expect(await screen.findByRole('link',{name:'Add to Newspaper →'})).toHaveAttribute('href','/newspaper?ids=saved-one,saved-two,saved-three');
  expect(save).toHaveBeenCalledTimes(3);
  expect(save.mock.calls.map(call => call[0].headline)).toEqual(['one.png','two.png','three.png']);
  expect(screen.queryByLabelText('Headline')).not.toBeInTheDocument();
});
it('keeps failed drafts editable and retries only the unsaved story', async () => {
  save.mockResolvedValueOnce({story:{id:'first'},error:null}).mockResolvedValueOnce({story:null,error:new Error('Connection lost')}).mockResolvedValueOnce({story:{id:'third'},error:null});
  await prepare();
  await userEvent.click(screen.getByRole('button',{name:'Save all 3 stories'}));
  expect(await screen.findByText(/2 of 3 stories saved/)).toBeInTheDocument();
  expect(screen.getByLabelText('Headline')).toHaveValue('two.png');
  expect(screen.getByLabelText('The story')).toHaveValue('The real moment.');
  expect(screen.getByLabelText('Headline')).toBeEnabled();
  save.mockResolvedValueOnce({story:{id:'second'},error:null});
  await userEvent.click(screen.getByRole('button',{name:'Retry save'}));
  await waitFor(() => expect(screen.queryByLabelText('Headline')).not.toBeInTheDocument());
  expect(save).toHaveBeenCalledTimes(4);
  expect(save.mock.calls[3][0].headline).toBe('two.png');
});
it('stops a pending batch on account change and clears private results', async () => {
  let release!: (value:any) => void;
  save.mockImplementationOnce(() => new Promise(resolve => {release=resolve;}));
  const view=await prepare();
  await userEvent.click(screen.getByRole('button',{name:'Save all 3 stories'}));
  auth.mockReturnValue({user:{id:'other'}});
  view.rerender(<MemoryRouter><EventBuilder /></MemoryRouter>);
  await act(async () => release({story:{id:'old-account-story'},error:null}));
  expect(save).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText('Headline')).not.toBeInTheDocument();
  expect(screen.queryByRole('link',{name:'Add to Newspaper →'})).not.toBeInTheDocument();
});
