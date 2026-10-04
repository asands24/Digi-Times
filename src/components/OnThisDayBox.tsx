import { getHistorySelection } from '../data/historicalEvents';
import '../styles/onThisDay.css';

export function OnThisDayBox({ date, className = '', template = 'family' }: { date: Date; className?: string; template?: string }) {
  const { exact, nearby } = getHistorySelection(date, template);
  if (!exact.length && !nearby.length) return null;
  const format = (month: number, day: number) => new Date(2000, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return <aside className={`on-this-day-box on-this-day-box--visible ${className}`}>
    <div className="on-this-day-box__header">{exact.length ? 'On This Day in History' : 'This Month in History'}</div>
    <div className="on-this-day-box__date">Little wonders to share around the table</div>
    {exact.length > 0 && <ul className="on-this-day-box__events">{exact.map(event => <li key={`${event.year}-${event.description}`} className="on-this-day-box__event"><strong>{event.year}</strong> — {event.description}</li>)}</ul>}
    {nearby.length > 0 && <>
      {exact.length > 0 && <p className="on-this-day-box__date">Elsewhere this month</p>}
      <ul className="on-this-day-box__events">{nearby.map(event => <li key={`${event.year}-${event.description}`} className="on-this-day-box__event"><strong>{format(event.month, event.day)}, {event.year}</strong> — {event.description}</li>)}</ul>
    </>}
  </aside>;
}
