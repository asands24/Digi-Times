import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, Trash2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { fetchIssues, deleteIssue, type IssueRow } from '../lib/storiesApi';
import { useAuth } from '../providers/AuthProvider';
import toast from 'react-hot-toast';
import { savedEditionSettings } from '../lib/newspaperLayout';

export function IssuesList() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [issues, setIssues] = useState<IssueRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadIssues = useCallback(async () => {
        if (!user) { setLoading(false); setIssues([]); return; }
        try {
            setLoading(true); setError(false);
            const data = await fetchIssues(user.id);
            setIssues(data);
        } catch (error) {
            console.error('Failed to load issues', error);
            setError(true);
            toast.error('Could not load your newspaper issues.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadIssues();
    }, [loadIssues]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this issue?')) return;
        try {
            await deleteIssue(id);
            setIssues(prev => prev.filter(i => i.id !== id));
            toast.success('Issue deleted.');
        } catch (error) {
            console.error('Failed to delete issue', error);
            toast.error('Could not delete issue.');
        }
    };

    const handleView = async (id: string) => {
        navigate(`/newspaper?issueId=${id}`);
    };

    if (!user) return <div className="story-archive__empty"><h2>Your family editions live here.</h2><p>Sign in to revisit your saved newspapers.</p><Button onClick={() => navigate('/login')}>Sign in</Button></div>;
    if (error) return <div className="story-archive__empty" role="alert"><p>We couldn’t open your editions.</p><Button onClick={loadIssues}>Try again</Button></div>;
    if (loading) {
        return <div className="p-8 text-center text-ink-muted">Loading issues...</div>;
    }

    if (issues.length === 0) {
        return (
            <div className="text-center p-8 border-2 border-dashed border-ink-muted/20 rounded-lg bg-paper-light">
                <Newspaper className="mx-auto h-12 w-12 text-ink-muted mb-4" />
                <h3 className="text-lg font-serif font-bold text-ink mb-2">No Saved Issues</h3>
                <p className="text-ink-muted mb-4">
                    Create a newspaper layout from your stories to save it here.
                </p>
                <Button onClick={() => navigate('/#story-library')}>Choose memories for an issue →</Button>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map((issue) => (
                <div key={issue.id} className="group relative bg-white border border-ink/10 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="bg-paper-darker p-2 rounded-md">
                            <Newspaper className="h-6 w-6 text-ink" />
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleView(issue.id)} title="View Issue">
                                <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(issue.id)} className="text-red-500 hover:text-red-600" title="Delete Issue">
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>
                    <h3 className="font-serif font-bold text-lg text-ink mb-1 line-clamp-1">{issue.title}</h3>
                    <p className="text-sm text-ink-muted mb-3 line-clamp-2">{savedEditionSettings(issue.description) ? `${savedEditionSettings(issue.description)?.paper === 'letter' ? 'US Letter' : 'A4'} · A keepsake from the family newsroom` : issue.description || 'A keepsake from the family newsroom'}</p>
                    <div className="text-xs text-ink-muted uppercase tracking-wider">
                        {new Date(issue.created_at).toLocaleDateString()}
                    </div>
                </div>
            ))}
        </div>
    );
}
