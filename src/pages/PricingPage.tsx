import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';

const plans = [
  { name: 'Free', eyebrow: 'Start collecting the good stuff', description: 'A little space for everyday magic.', features: ['A monthly story allowance (planned)', 'Classic newspaper templates', 'Your personal memory library'] },
  { name: 'Family Plan', eyebrow: 'A home for every headline', description: 'For the families with a story every day.', features: ['Unlimited stories (planned)', 'Saved family issues', 'Premium templates, print & export', 'Share links for loved ones'] },
  { name: 'Lifetime Early Access', eyebrow: 'Be part of the first edition', description: 'A one-time purchase for our earliest readers.', features: ['Family features (planned)', 'One payment, years of memories', 'Help shape the next chapter'] },
];
export default function PricingPage() {
  return <div className="app-shell"><Header /><main className="plans-page">
    <p className="editorial-kicker">The next chapter · Plans preview</p><h1>More memories. More front pages.</h1>
    <p>We’re dreaming up ways to keep your family’s stories for years to come. Pricing and allowances are still being decided; there’s no checkout yet and no new limits in this update.</p>
    <div className="plans-grid">{plans.map(plan => <article className="plan-card" key={plan.name}><p className="editorial-kicker">{plan.eyebrow}</p><h2>{plan.name}</h2><p>{plan.description}</p><ul>{plan.features.map(feature => <li key={feature}>{feature}</li>)}</ul><span className="plan-card__status">In planning · Price to come</span></article>)}</div>
    <div className="premium-pack"><h2>Coming off the drawing board</h2><p>The Grandparents’ Gazette · Baby’s First Edition · Passport Pages · The Paw Print · Holiday Annual</p><Link to="/"><Button>Make a memory today →</Button></Link></div>
  </main></div>;
}
