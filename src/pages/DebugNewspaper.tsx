import { useMemo, useState } from 'react';
import { EditionPaper } from '../components/EditionPaper';
import { layoutEdition, PaperSize } from '../lib/newspaperLayout';
import { exportNewspaperToPDF } from '../lib/pdfExport';
import '../styles/newspaper-print.css';
import { newspaperSample } from '../data/newspaperSample';

// Development-only fixtures. No saved stories or user photos are accessed.
export default function DebugNewspaper() {
  const [paper, setPaper] = useState<PaperSize>('a4');
  const [count, setCount] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const layout = useMemo(() => {
    const photos = Array.from({ length: count }, (_, index) => index % 2 ? { url: `/images/placeholders/photo-check-portrait.png?sample=${index}`, width:180,height:300 } : { url:`/images/placeholders/newspapers1.jpeg?sample=${index}`,width:275,height:183 });
    const stories = newspaperSample.map((story,index) => ({ ...story, imageUrls: index === 0 ? photos.slice(0, count === 10 ? 5 : count) : index === 2 && count === 10 ? photos.slice(5) : [] }));
    return layoutEdition(stories, { title:'The Family Gazette',paper,showHistory:true,date:'2026-10-08' });
  },[paper,count]);
  return <div className="newspaper-page"><div className="no-print issue-intro">
    <h1>Newspaper layout check</h1><p>Fictional sample · {count} photos · {layout.pages.length} pages</p>
    <label htmlFor="sample-paper">Paper</label><select id="sample-paper" value={paper} onChange={event => setPaper(event.target.value as PaperSize)}><option value="a4">A4</option><option value="letter">US Letter</option></select>
    <label htmlFor="sample-photos">Photo scenario</label><select id="sample-photos" value={count} onChange={event => setCount(Number(event.target.value))}><option value={1}>One photo</option><option value={5}>Five photos, one story</option><option value={10}>Ten photos, multiple stories</option></select>
    <button disabled={busy} onClick={async () => { setBusy(true);setError('');try { await exportNewspaperToPDF(layout); } catch(error) { setError(error instanceof Error ? error.message : 'Export failed'); } finally {setBusy(false);} }}>Download sample PDF</button>
    {error && <p role="alert">{error}</p>}
  </div><EditionPaper layout={layout} /></div>;
}
