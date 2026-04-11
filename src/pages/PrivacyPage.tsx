import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="policy-page">
      <div className="policy-page__inner">
        <Link to="/" className="policy-page__back">← Back to DigiTimes</Link>
        <h1 className="policy-page__title">Privacy Policy</h1>
        <p className="policy-page__updated">Last updated: April 2026</p>

        <section className="policy-page__section">
          <h2>What we collect</h2>
          <p>When you sign in, we collect your email address to create and manage your account. When you create a story, we store the photo you upload, the story text generated, and the headline — all tied to your account.</p>
        </section>

        <section className="policy-page__section">
          <h2>How we use it</h2>
          <p>Your data is used solely to provide the DigiTimes service — generating stories, building your archive, and letting you share stories you choose to make public. We do not sell your data, run ads, or share your information with third parties except as required to operate the service (e.g. Supabase for storage, OpenAI for story generation).</p>
        </section>

        <section className="policy-page__section">
          <h2>Photos and stories</h2>
          <p>Photos you upload are stored securely and are private by default. Only stories you explicitly set to "Public" are accessible via a share link. You can delete any story or photo from your archive at any time.</p>
        </section>

        <section className="policy-page__section">
          <h2>Cookies and sessions</h2>
          <p>We use browser local storage to maintain your login session. No third-party tracking cookies are used.</p>
        </section>

        <section className="policy-page__section">
          <h2>Your rights</h2>
          <p>You can request deletion of your account and all associated data at any time by emailing <a href="mailto:asands44@gmail.com">asands44@gmail.com</a>. We will process deletion requests within 30 days.</p>
        </section>

        <section className="policy-page__section">
          <h2>Contact</h2>
          <p>Questions about this policy? Email <a href="mailto:asands44@gmail.com">asands44@gmail.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
