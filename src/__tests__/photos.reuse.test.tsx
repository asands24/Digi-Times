import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EventBuilder from '../components/EventBuilder';
import { reusablePhotos } from '../components/builder/SavedPhotoPicker';

jest.mock('../providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('../hooks/useStoryLibrary', () => ({ fetchStoryRows: jest.fn(), useStoryLibrary: jest.fn() }));
jest.mock('../components/TemplatesGallery', () => ({ TemplatesGallery: () => null }));
jest.mock('../utils/storyGenerator', () => ({ ...jest.requireActual('../utils/storyGenerator'), generateGroundedStory: jest.fn() }));
const library = jest.requireMock('../hooks/useStoryLibrary');
const auth = jest.requireMock('../providers/AuthProvider').useAuth;
const generate = jest.requireMock('../utils/storyGenerator').generateGroundedStory;
const save = jest.fn();
const rows = [{ id:'saved',created_by:'owner',title:'Garden day',prompt:'We planted mint.',image_path:'stories/owner/a.png',images:[{path:'stories/owner/a.png'},{path:'stories/owner/b.png'}] }];
beforeEach(() => {
  auth.mockReturnValue({user:{id:'owner'}});
  library.useStoryLibrary.mockReturnValue({saveDraftToArchive:save});
  library.fetchStoryRows.mockResolvedValue({rows,error:null});
  global.fetch = jest.fn().mockResolvedValue({ok:true,blob:async () => new Blob(['photo'],{type:'image/png'})});
  generate.mockResolvedValue({headline:'Garden',article:'Mint was planted.',source:'openai',observations:[],unknowns:[]});
  save.mockResolvedValue({story:{id:'new'},error:null});
});
it('offers only owned, distinct saved photo references including legacy photos', () => {
  const photos = reusablePhotos([...rows, {...rows[0],id:'duplicate'}, {...rows[0],id:'foreign',created_by:'other'}, {...rows[0],id:'legacy',images:[],image_path:'stories/owner/legacy.png'}] as any, 'owner');
  expect(photos.map(photo => photo.path)).toEqual(['stories/owner/a.png','stories/owner/b.png','stories/owner/legacy.png']);
});
it('reuses photos in selection order, retains facts and current drafts, and saves the original references', async () => {
  const {container} = render(<MemoryRouter><EventBuilder /></MemoryRouter>);
  await act(async () => { await userEvent.upload(container.querySelector('input[type=file]')!, new File(['new'],'new.png',{type:'image/png'})); });
  await userEvent.click(screen.getByRole('button',{name:'Choose saved photos'}));
  const choices = await screen.findAllByRole('checkbox');
  await userEvent.click(choices[1]); await userEvent.click(choices[0]);
  await userEvent.click(screen.getByRole('button',{name:'Use 2 photos'}));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getAllByLabelText('Confirmed facts for this story')).toHaveLength(3);
  expect((global.fetch as jest.Mock).mock.calls.map(call => call[0].split('/').pop())).toEqual(['b.png', 'a.png']);
  expect(screen.getAllByLabelText('Confirmed facts for this story')[1]).toHaveValue('We planted mint.');
  await userEvent.click(screen.getByRole('button',{name:'Combine 3 photos into one story'}));
  expect(screen.getByLabelText('Confirmed facts for this story')).toHaveValue('We planted mint.');
  await userEvent.click(screen.getByRole('button',{name:'Generate article'}));
  await screen.findByLabelText('Headline');
  await userEvent.click(screen.getByRole('button',{name:'Save Story'}));
  await waitFor(() => expect(save).toHaveBeenCalled());
  expect(save.mock.calls[0][0].entry.sourcePaths).toEqual([undefined,'stories/owner/b.png','stories/owner/a.png']);
  expect(save.mock.calls[0][0].prompt).toBe('We planted mint.');
});
it('keeps selections and drafts when opening a photo fails, then allows retry', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({ok:false});
  render(<MemoryRouter><EventBuilder /></MemoryRouter>);
  await userEvent.click(screen.getByRole('button',{name:'Choose saved photos'}));
  await userEvent.click((await screen.findAllByRole('checkbox'))[0]);
  await userEvent.click(screen.getByRole('button',{name:'Use 1 photo'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('selection and studio drafts are kept');
  expect(screen.getByRole('checkbox',{name:'Select photo 1 from Garden day'})).toBeChecked();
  await userEvent.click(screen.getByRole('button',{name:'Retry'}));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByLabelText('Confirmed facts for this story')).toHaveValue('We planted mint.');
});
it('closes and clears the chooser on account changes', async () => {
  const {rerender} = render(<MemoryRouter><EventBuilder /></MemoryRouter>);
  await userEvent.click(screen.getByRole('button',{name:'Choose saved photos'}));
  await screen.findAllByRole('checkbox');
  auth.mockReturnValue({user:{id:'other'}});
  rerender(<MemoryRouter><EventBuilder /></MemoryRouter>);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.queryByLabelText('Confirmed facts for this story')).not.toBeInTheDocument();
});

it('supports Escape and restores focus to the saved-photo trigger', async () => {
  render(<MemoryRouter><EventBuilder /></MemoryRouter>);
  const trigger = screen.getByRole('button', {name:'Choose saved photos'});
  await userEvent.click(trigger);
  await screen.findAllByRole('checkbox');
  fireEvent.keyDown(document.activeElement!, {key:'Escape', code:'Escape'});
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(trigger).toHaveFocus());
});
it('does not import a late photo response after the chooser is cancelled', async () => {
  let resolve!: (value: unknown) => void;
  (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(done => {resolve = done;}));
  render(<MemoryRouter><EventBuilder /></MemoryRouter>);
  await userEvent.click(screen.getByRole('button',{name:'Choose saved photos'}));
  await userEvent.click((await screen.findAllByRole('checkbox'))[0]);
  await userEvent.click(screen.getByRole('button',{name:'Use 1 photo'}));
  await userEvent.click(screen.getByRole('button',{name:'Cancel'}));
  await act(async () => resolve({ok:true,blob:async () => new Blob(['photo'],{type:'image/png'})}));
  expect(screen.queryByLabelText('Confirmed facts for this story')).not.toBeInTheDocument();
});
