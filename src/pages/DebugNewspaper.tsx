import { useMemo, useState } from 'react';
import { EditionPaper } from '../components/EditionPaper';
import { layoutEdition, PaperSize } from '../lib/newspaperLayout';
import { exportNewspaperToPDF } from '../lib/pdfExport';
import '../styles/newspaper-print.css';
import { newspaperSample } from '../data/newspaperSample';

// Development-only regression fixture. It never loads or changes anyone's saved stories.
export default function DebugNewspaper() {
  const [paper, setPaper] = useState<PaperSize>('a4');
  const layout = useMemo(() => layoutEdition(newspaperSample, { title: 'The Family Gazette', paper, showHistory: true, date: '2026-09-30' }), [paper]);
  return <div className="newspaper-page"><div className="no-print issue-intro"><h1>Newspaper layout check</h1><p>Fictional sample · {layout.pages.length} pages</p><label htmlFor="sample-paper">Paper</label><select id="sample-paper" value={paper} onChange={event => setPaper(event.target.value as PaperSize)}><option value="a4">A4</option><option value="letter">US Letter</option></select><button onClick={() => exportNewspaperToPDF(layout)}>Download sample PDF</button></div><EditionPaper layout={layout} /></div>;
}
