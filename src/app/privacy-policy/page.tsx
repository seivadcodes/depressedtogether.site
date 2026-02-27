// src/app/privacy-policy/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

// 1. Metadata export (Only works in Server Components)
export const metadata: Metadata = {
  title: 'Privacy Policy | Depressed Together',
  description: 'How we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'February 27, 2026';

  // Styles object (unchanged logic, just removed hover-state dependencies)
  const styles = {
    pageContainer: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '48px 16px',
    },
    contentCard: {
      maxWidth: '896px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      padding: '24px',
    },
    header: {
      marginBottom: '40px',
      borderBottom: '1px solid #e5e7eb',
      paddingBottom: '24px',
    },
    backLink: {
      display: 'inline-flex',
      alignItems: 'center',
      color: '#4f46e5', // Base indigo-600
      fontWeight: 500,
      marginBottom: '16px',
      textDecoration: 'none',
      transition: 'color 0.2s',
      cursor: 'pointer',
    },
    title: {
      fontSize: '30px',
      fontWeight: 700,
      color: '#111827',
      margin: 0,
    },
    lastUpdated: {
      color: '#4b5563',
      marginTop: '8px',
      fontSize: '16px',
    },
    crisisBox: {
      backgroundColor: '#fff1f2',
      borderLeft: '4px solid #fb7185',
      padding: '16px',
      marginBottom: '32px',
      borderRadius: '0 8px 8px 0',
    },
    crisisText: {
      fontSize: '14px',
      color: '#9f1239',
      margin: 0,
      lineHeight: 1.5,
    },
    article: {
      color: '#374151',
      lineHeight: 1.625,
      fontSize: '16px',
    },
    section: {
      scrollMarginTop: '80px',
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: 600,
      color: '#111827',
      marginBottom: '12px',
      marginTop: 0,
    },
    subSection: {
      marginTop: '16px',
    },
    subSectionTitle: {
      fontSize: '18px',
      fontWeight: 500,
      color: '#1f2937',
      marginBottom: '8px',
      marginTop: 0,
    },
    list: {
      listStyleType: 'disc',
      paddingLeft: '20px',
      margin: '8px 0',
      lineHeight: 1.5,
    },
    listItem: {
      marginBottom: '4px',
    },
    link: {
      color: '#4f46e5',
      textDecoration: 'none',
      transition: 'color 0.2s',
    },
    italicNote: {
      marginTop: '8px',
      fontSize: '14px',
      fontStyle: 'italic',
      color: '#4b5563',
    },
    footer: {
      marginTop: '48px',
      paddingTop: '24px',
      borderTop: '1px solid #e5e7eb',
      textAlign: 'center' as const,
    },
    footerText: {
      color: '#4b5563',
      marginBottom: '16px',
    },
    buttonContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      justifyContent: 'center',
    },
    button: {
      paddingHorizontal: '20px',
      paddingVertical: '10px',
      borderRadius: '8px',
      fontWeight: 500,
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      textDecoration: 'none',
      display: 'inline-block',
      textAlign: 'center' as const,
    },
    buttonSecondary: {
      border: '1px solid #d1d5db',
      color: '#374151',
      backgroundColor: 'transparent',
    },
    buttonPrimary: {
      backgroundColor: '#4f46e5',
      color: '#ffffff',
      border: 'none',
    },
    contactList: {
      listStyle: 'none',
      paddingLeft: 0,
      marginTop: '8px',
      lineHeight: 1.5,
    },
    smallText: {
      fontSize: '14px',
      color: '#6b7280',
      marginTop: '16px',
    },
  };

  // CSS for hover states (replaces useState logic)
  const hoverStyles = `
    .hover-link:hover { color: #4338ca; text-decoration: underline; }
    .hover-btn-secondary:hover { background-color: #f9fafb; }
    .hover-btn-primary:hover { background-color: #4338ca; }
    @media (min-width: 640px) {
      .content-card { padding: 40px; }
      .page-container { padding-left: 24px; padding-right: 24px; }
    }
    @media (min-width: 1024px) {
      .page-container { padding-left: 32px; padding-right: 32px; }
    }
    .prose-content p { margin: 1em 0; }
    .prose-content strong { font-weight: 600; color: #111827; }
    .prose-content em { font-style: italic; }
    .prose-content ul { margin: 1em 0; padding-left: 20px; }
    .prose-content li { margin: 4px 0; }
    .prose-content a { color: #4f46e5; text-decoration: none; }
    .prose-content a:hover { color: #4338ca; text-decoration: underline; }
  `;

  return (
    <>
      <style>{hoverStyles}</style>
      <main style={styles.pageContainer} className="page-container">
        <div style={styles.contentCard} className="content-card">
          {/* Header */}
          <header style={styles.header}>
            <Link 
              href="/" 
              style={styles.backLink}
              className="hover-link"
            >
              ← Back to Home
            </Link>
            <h1 style={styles.title}>Privacy Policy</h1>
            <p style={styles.lastUpdated}>Last updated: {lastUpdated}</p>
          </header>

          {/* Crisis Notice */}
          <div style={styles.crisisBox}>
            <p style={styles.crisisText}>
              <strong>Important:</strong> Depressed Together is a peer support community, <em>not</em> a crisis service. 
              If you are in immediate danger or experiencing a mental health emergency, please contact emergency services or call/text <strong>988</strong> (US) or visit <a 
                href="https://befrienders.org" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={styles.link}
                className="hover-link"
              >befrienders.org</a> for global resources.
            </p>
          </div>

          {/* Policy Content */}
          <article style={styles.article} className="prose-content">
            <Section title="1. Introduction" styles={styles}>
              <p>
                Welcome to Depressed Together (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and community platform at <a 
                  href="https://www.depressedtogether.com" 
                  style={styles.link}
                  className="hover-link"
                >www.depressedtogether.com</a>.
              </p>
              <p>
                <strong>Please read this policy carefully.</strong> By accessing or using our platform, you consent to the practices described herein.
              </p>
            </Section>

            <Section title="2. Information We Collect" styles={styles}>
              <SubSection title="A. Information You Provide" styles={styles}>
                <ul style={styles.list}>
                  <li style={styles.listItem}><strong>Account Data:</strong> Email address, display name, optional profile details (e.g., age range, location)</li>
                  <li style={styles.listItem}><strong>Community Content:</strong> Messages, posts, reactions, or other content you share in peer support spaces</li>
                  <li style={styles.listItem}><strong>Communications:</strong> Records when you contact us for support or feedback</li>
                  <li style={styles.listItem}><strong>Voluntary Disclosures:</strong> Any personal or health-related information you choose to share in community discussions</li>
                </ul>
                <p style={styles.italicNote}>
                  ⚠️ We strongly advise against sharing highly sensitive personal identifiers (e.g., full name, address, phone number, medical records) in public community spaces.
                </p>
              </SubSection>

              <SubSection title="B. Information Collected Automatically" styles={styles}>
                <ul style={styles.list}>
                  <li style={styles.listItem}><strong>Usage Data:</strong> Pages visited, time spent, features used, browser</li>
                  <li style={styles.listItem}><strong>Log Data:</strong> IP address, timestamps, referring URLs, crash reports</li>
                  <li style={styles.listItem}><strong>Cookies &amp; Similar Technologies:</strong> We use cookies and similar tracking technologies to enhance your experience and analyze platform usage. You can manage your cookie preferences in your browser settings.</li>
                </ul>
              </SubSection>

              <SubSection title="C. Information from Third Parties" styles={styles}>
                <p>
                  If you sign in via a third-party service (e.g., Google), we may receive basic profile information per your permissions with that provider.
                </p>
              </SubSection>
            </Section>

            <Section title="3. How We Use Your Information" styles={styles}>
              <ul style={styles.list}>
                <li style={styles.listItem}>Provide, maintain, and improve our peer support platform</li>
                <li style={styles.listItem}>Facilitate community connections and moderation</li>
                <li style={styles.listItem}>Send important account or service notifications (non-marketing)</li>
                <li style={styles.listItem}>Respond to your inquiries and provide user support</li>
                <li style={styles.listItem}>Monitor and prevent abuse, fraud, or safety risks</li>
                <li style={styles.listItem}>Comply with legal obligations and enforce our terms</li>
                <li style={styles.listItem}>Generate anonymized, aggregated insights to improve community well-being resources</li>
              </ul>
              <p style={{ marginTop: '8px' }}>
                <strong>We do not sell your personal information.</strong> We do not use your community content for advertising targeting.
              </p>
            </Section>

            <Section title="4. Legal Basis for Processing (GDPR)" styles={styles}>
              <p>
                If you are in the European Economic Area (EEA), we process your data based on:
              </p>
              <ul style={{ ...styles.list, marginTop: '8px' }}>
                <li style={styles.listItem}>Your consent (e.g., for optional profile details)</li>
                <li style={styles.listItem}>Performance of our Terms of Service</li>
                <li style={styles.listItem}>Legitimate interests (e.g., platform security, community safety)</li>
                <li style={styles.listItem}>Compliance with legal obligations</li>
              </ul>
            </Section>

            <Section title="5. Data Sharing &amp; Disclosure" styles={styles}>
              <p>We may share your information only in these limited circumstances:</p>
              <ul style={{ ...styles.list, marginTop: '8px' }}>
                <li style={styles.listItem}><strong>With your consent:</strong> When you explicitly authorize sharing</li>
                <li style={styles.listItem}><strong>Community visibility:</strong> Content you post in public or group spaces is visible to other community members per your privacy settings</li>
                <li style={styles.listItem}><strong>Legal requirements:</strong> If required by law, subpoena, or to protect rights, safety, or property of Depressed Together, users, or the public</li>
                <li style={styles.listItem}><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets (users will be notified of any change in data practices)</li>
              </ul>
            </Section>

            <Section title="6. Data Security" styles={styles}>
              <p>
                We implement technical and organizational measures designed to protect your information (e.g., encryption in transit, access controls, regular security assessments). However, no internet transmission is 100% secure. You are responsible for safeguarding your login credentials and being mindful about what you share publicly.
              </p>
            </Section>

            <Section title="7. Your Rights &amp; Choices" styles={styles}>
              <SubSection title="Account &amp; Content Controls" styles={styles}>
                <ul style={styles.list}>
                  <li style={styles.listItem}>Update or delete your profile information via Settings</li>
                  <li style={styles.listItem}>Delete your account and associated personal data (subject to legal retention requirements)</li>
                  <li style={styles.listItem}>Adjust notification preferences</li>
                  <li style={styles.listItem}>Control visibility of your profile/posts via community privacy settings</li>
                </ul>
              </SubSection>

              <SubSection title="Regional Rights" styles={styles}>
                <ul style={{ ...styles.list, marginTop: '8px' }}>
                  <li style={styles.listItem}><strong>California (CCPA/CPRA):</strong> Right to know, delete, correct, and opt-out of &quot;sales&quot; (we don&apos;t sell data). Submit requests via <a href="mailto:privacy@depressedtogether.com" style={styles.link} className="hover-link">privacy@depressedtogether.com</a>.</li>
                  <li style={styles.listItem}><strong>EEA/UK (GDPR):</strong> Right to access, rectify, erase, restrict processing, data portability, and withdraw consent. Contact us to exercise these rights.</li>
                  <li style={styles.listItem}><strong>Other regions:</strong> We honor reasonable requests per applicable local laws.</li>
                </ul>
              </SubSection>
            </Section>

            <Section title="8. Data Retention" styles={styles}>
              <p>
                We retain personal information only as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. Account data is typically deleted within 30 days of account deletion request, except where needed for legal compliance, security, or fraud prevention.
              </p>
            </Section>

            <Section title="9. Children's Privacy" styles={styles}>
              <p>
                Depressed Together is not intended for individuals under 16. We do not knowingly collect personal information from children. If you believe a minor has provided us with data, please contact us immediately so we can investigate and remove such information.
              </p>
            </Section>

            <Section title="10. International Transfers" styles={styles}>
              <p>
                Your information may be transferred to and processed in countries other than your own (including the United States). We ensure appropriate safeguards are in place per applicable data protection laws for such transfers.
              </p>
            </Section>

            <Section title="11. Changes to This Policy" styles={styles}>
              <p>
                We may update this Privacy Policy periodically. We will notify users of material changes via email or prominent notice on the platform. Your continued use after changes constitutes acceptance of the updated policy.
              </p>
            </Section>

            <Section title="12. Contact Us" styles={styles}>
              <p>
                Questions about this Privacy Policy or your data? Reach out:
              </p>
              <ul style={styles.contactList}>
                <li>📧 Email: <a href="mailto:privacy@depressedtogether.com" style={styles.link} className="hover-link">privacy@depressedtogether.com</a></li>
                <li>📬 Mail: Depressed Together, Privacy Team<br />[Your Business Address]<br />Texas, USA</li>
              </ul>
              <p style={styles.smallText}>
                For urgent safety concerns about a community member, use the in-app reporting tool or contact local emergency services.
              </p>
            </Section>
          </article>

          {/* Footer CTA */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              Thank you for trusting Depressed Together. Your privacy and safety matter.
            </p>
            <div style={styles.buttonContainer}>
              <Link 
                href="/terms" 
                style={{ ...styles.button, ...styles.buttonSecondary }}
                className="hover-btn-secondary"
              >
                Terms of Service
              </Link>
              <Link 
                href="/contact" 
                style={{ ...styles.button, ...styles.buttonPrimary }}
                className="hover-btn-primary"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// Reusable subsection components
function Section({ 
  title, 
  children, 
  styles 
}: { 
  title: string; 
  children: React.ReactNode; 
  styles: Record<string, React.CSSProperties>;
}) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function SubSection({ 
  title, 
  children, 
  styles 
}: { 
  title: string; 
  children: React.ReactNode; 
  styles: Record<string, React.CSSProperties>;
}) {
  return (
    <div style={styles.subSection}>
      <h3 style={styles.subSectionTitle}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}