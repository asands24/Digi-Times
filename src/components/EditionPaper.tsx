import type { EditionLayout } from '../lib/newspaperLayout';

export function EditionPaper({ layout }: { layout: EditionLayout }) {
  return <div id="newspaper-content" className="edition-pages">
    {layout.pages.map((blocks, index) => <section key={index} className="edition-sheet" aria-label={`Newspaper page ${index + 1}`} style={{ width: `${layout.width}pt`, height: `${layout.height}pt` }}>
      <div className="edition-rule" style={{ top: index === 0 ? '116pt' : '90pt' }} />
      {blocks.map((block, i) => block.kind === 'image'
        ? <img key={i} className="edition-photo" src={block.url} alt={block.alt} crossOrigin="anonymous" style={{ left: `${block.x}pt`, top: `${block.y}pt`, width: `${block.width}pt`, height: `${block.height}pt` }} />
        : <div key={i} className="edition-type" style={{ left: `${block.x}pt`, top: `${block.y}pt`, width: `${block.width}pt`, fontSize: `${block.size}pt`, lineHeight: `${block.lineHeight}pt`, fontWeight: block.bold ? 700 : 400 }}>{block.text}</div>)}
    </section>)}
  </div>;
}
