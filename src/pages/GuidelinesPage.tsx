import { Link } from 'react-router-dom';

export default function GuidelinesPage() {
  return (
    <div className="policy-page">
      <div className="policy-page__inner">
        <Link to="/" className="policy-page__back">← Back to DigiTimes</Link>
        <h1 className="policy-page__title">Community Guidelines</h1>
        <p className="policy-page__updated">Last updated: April 2026</p>

        <p className="policy-page__intro">DigiTimes is a place for positive, family-friendly storytelling. These guidelines keep it that way for everyone.</p>

        <section className="policy-page__section">
          <h2>Keep it family-friendly</h2>
          <p>All stories are written in a kid-safe style suitable for ages 7 and up. Do not use DigiTimes to generate content that is violent, sexual, hateful, or otherwise inappropriate for a general family audience.</p>
        </section>

        <section className="policy-page__section">
          <h2>Respect privacy</h2>
          <p>Only upload photos and write stories about people who have consented to appear. Do not share stories that reveal private information about individuals without their permission.</p>
        </section>

        <section className="policy-page__section">
          <h2>Be truthful</h2>
          <p>DigiTimes stories are meant to be creative and celebratory, not misleading. Do not use the platform to create or spread misinformation.</p>
        </section>

        <section className="policy-page__section">
          <h2>No harmful content</h2>
          <p>Do not attempt to generate stories that promote harm, discrimination, or illegal activity. Our AI is configured to refuse such requests, and accounts that attempt to circumvent these protections will be suspended.</p>
        </section>

        <section className="policy-page__section">
          <h2>Reporting</h2>
          <p>If you see a public story that violates these guidelines, please email <a href="mailto:asands44@gmail.com">asands44@gmail.com</a> with the story link and a brief description. We review all reports within 48 hours.</p>
        </section>
      </div>
    </div>
  );
}
