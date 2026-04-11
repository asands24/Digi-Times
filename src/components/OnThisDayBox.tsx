import { useEffect, useState } from 'react';
import { getEventsForDate, type HistoricalEvent } from '../data/historicalEvents';
import '../styles/onThisDay.css';

interface OnThisDayBoxProps {
    date: Date;
    className?: string;
}

export function OnThisDayBox({ date, className = '' }: OnThisDayBoxProps) {
    const [events, setEvents] = useState<HistoricalEvent[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const month = date.getMonth() + 1; // JavaScript months are 0-indexed
        const day = date.getDate();
        const matchingEvents = getEventsForDate(month, day, 3);
        setEvents(matchingEvents);

        // Trigger fade-in animation after component mounts
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, [date]);

    if (events.length === 0) {
        return null;
    }

    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
    const dayNum = date.getDate();

    return (
        <aside className={`on-this-day-box ${isVisible ? 'on-this-day-box--visible' : ''} ${className}`}>
            <div className="on-this-day-box__border-top" />
            <div className="on-this-day-box__header">
                On This Day in History
            </div>
            <div className="on-this-day-box__date">
                {monthName} {dayNum}
            </div>
            <ul className="on-this-day-box__events">
                {events.map((event, index) => (
                    <li key={index} className="on-this-day-box__event">
                        <span className="on-this-day-box__year">{event.year}</span>
                        <span className="on-this-day-box__separator"> — </span>
                        <span className="on-this-day-box__description">{event.description}</span>
                    </li>
                ))}
            </ul>
            <div className="on-this-day-box__border-bottom" />
        </aside>
    );
}
