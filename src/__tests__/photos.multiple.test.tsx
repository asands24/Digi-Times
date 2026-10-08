import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EventBuilder from '../components/EventBuilder';
import { layoutEdition } from '../lib/newspaperLayout';
import { createEditionPDF } from '../lib/pdfExport';
import { storyPhotos } from '../lib/storyPhotos';
import { buildPreviewDocument } from '../lib/templatePreview';
import jsPDF from 'jspdf';
jest.mock('../providers/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'owner' } }) }));
jest.mock('../hooks/useStoryLibrary', () => ({ useStoryLibrary: () => ({ saveDraftToArchive: jest.fn() }) }));
jest.mock('../components/TemplatesGallery', () => ({ TemplatesGallery: () => null }));
jest.mock('../utils/storyGenerator', () => ({ ...jest.requireActual('../utils/storyGenerator'), generateGroundedStory: jest.fn() }));
const generate = jest.requireMock('../utils/storyGenerator').generateGroundedStory;
const options = { title: 'Photo edition', paper: 'letter' as const, date: '2026-10-08', showHistory: false };

it.each([1,5,10])('lays out every one of %i photos without cropping or overflowing pages', count => {
  const images = Array.from({ length: count }, (_, i) => ({ url: `https://example.com/${i}.png`, width: i % 2 ? 1200 : 600, height: i % 2 ? 600 : 1200 }));
  const stories = count === 10 ? [images.slice(0,5), images.slice(5)].map((imageUrls, i) => ({ id: String(i), title: `Story ${i}`, article: '<p>Facts.</p>', prompt: '', created_at: '2026-10-08', imageUrl: null, imageUrls })) : [{ id:'one', title:'Story', article:'<p>Facts.</p>', prompt:'', created_at:'2026-10-08', imageUrl:null, imageUrls:images }];
  const layout = layoutEdition(stories, options);
  const blocks = layout.pages.flat().filter(block => block.kind === 'image');
  expect(blocks.map(block => block.kind === 'image' ? block.url : '')).toEqual(images.map(image => image.url));
  blocks.forEach(block => { if (block.kind === 'image') expect(block.y + block.height).toBeLessThan(layout.height - 34); });
  if (count >= 5) expect(layout.pages.length).toBeGreaterThan(1);
});

it('normalizes ordered saved paths, keeps legacy photos, and includes all photos in template previews', () => {
  const saved = { image_path:'stories/owner/a.png', images:[{ path:'stories/owner/a.png' },{ path:'stories/owner/b.png' }] };
  expect(storyPhotos(saved).map(photo => photo.url)).toEqual(expect.arrayContaining([expect.stringContaining('/a.png'),expect.stringContaining('/b.png')]));
  expect(storyPhotos({ image_path:'legacy.png' })).toHaveLength(1);
  const markup = buildPreviewDocument({ ...saved, title:'Two photos', article:'<p>Facts.</p>' }, '<article><h1>{{headline}}</h1><img src="{{imageUrl}}">{{body}}</article>');
  const doc = new DOMParser().parseFromString(markup,'text/html');
  expect(doc.querySelectorAll('img[src*="stories/owner/"]')).toHaveLength(2);
});

it('groups five photos, keeps facts through regeneration, and sends every included file in order', async () => {
  generate.mockResolvedValue({ headline:'Photo story', article:'A visible scene.', observations:[{ index:0,description:'A table.' }], unknowns:['Where was this?'], source:'openai' });
  const { container } = render(<MemoryRouter><EventBuilder /></MemoryRouter>);
  const files = Array.from({ length:5 },(_,i) => new File(['photo'],`photo-${i}.jpg`,{ type:'image/jpeg' }));
  await userEvent.upload(container.querySelector('input[type=file]')!,files);
  await userEvent.click(await screen.findByRole('button',{ name:'Combine 5 photos into one story' }));
  await userEvent.type(screen.getByLabelText('Confirmed facts for this story'),'Sam took these at home.');
  await userEvent.click(screen.getByRole('button',{ name:'Generate Stories' }));
  await screen.findByLabelText('Headline');
  expect(generate).toHaveBeenCalledWith('Sam took these at home.',files);
  expect(screen.getByLabelText('Confirmed facts for this story')).toHaveValue('Sam took these at home.');
  await userEvent.click(screen.getByLabelText('Include photo 3'));
  const confirm = jest.spyOn(window,'confirm').mockReturnValue(true);
  await userEvent.click(screen.getByRole('button',{ name:'Rewrite' }));
  await waitFor(() => expect(generate).toHaveBeenLastCalledWith('Sam took these at home.',[files[0],files[1],files[3],files[4]]));
  expect(screen.getAllByRole('checkbox')).toHaveLength(5); confirm.mockRestore();
});

it('embeds every photo placement in a real PDF using the preview blocks', () => {
  const fs = require('fs');
  const sources = Array.from({ length:10 },(_,index) => {
    const portrait = Boolean(index % 2);
    return { url:`photo-${index}`, source:`data:image/${portrait ? 'png' : 'jpeg'};base64,${fs.readFileSync(portrait ? 'public/images/placeholders/photo-check-portrait.png' : 'public/images/placeholders/newspapers1.jpeg').toString('base64')}`,width:portrait ? 180 : 275,height:portrait ? 300 : 183 };
  });
  const layout = layoutEdition([{ id:'one',title:'Ten photos',article:'<p>Our photo record.</p>',prompt:null,imageUrl:null,created_at:'2026-10-08',imageUrls:sources }],options);
  const pdf = createEditionPDF(layout,sources);
  expect(pdf.getNumberOfPages()).toBe(layout.pages.length);
  expect(((pdf.internal as any).pages.slice(1).flat().join('\n').match(/\/I\d+ Do/g) || []).length).toBe(10);
});
