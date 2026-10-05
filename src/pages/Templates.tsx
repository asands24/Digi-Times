import { useNavigate } from 'react-router-dom';
import TemplatesGallery from '../components/TemplatesGallery';

export function TemplatesPage() {
  const navigate = useNavigate();
  return <main className="workspace-main template-catalog" id="templates-content" tabIndex={-1}>
    <header className="workspace-heading"><span className="dt-eyebrow">THE DESIGN DESK</span><h1>A front page for every chapter.</h1><p>Preview a layout, make it yours, and turn your next memory into a story worth keeping.</p></header>
    <TemplatesGallery selectedTemplateId={null} onSelect={template => navigate(`/create?template=${encodeURIComponent(template.id)}`)} autoSelectFirst={false} browse />
  </main>;
}
export default TemplatesPage;
