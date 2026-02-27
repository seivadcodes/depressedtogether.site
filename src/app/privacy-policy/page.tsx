// app/privacy-policy/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Depressed Together',
  description: 'How we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'February 27, 2026';

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-6 sm:p-10">
        {/* Header */}
        <header className="mb-10 border-b pb-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium mb-4 transition-colors"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last updated: {lastUpdated}</p>
        </header>

        {/* Crisis Notice - Prominent */}
        <div className="bg-rose-50 border-l-4 border-rose-400 p-4 mb-8 rounded-r-lg">
          <p className="text-sm text-rose-800">
            <strong>Important:</strong> Depressed Together is a peer support community, <em>not</em> a crisis service. 
            If you are in immediate danger or experiencing a mental health emergency, please contact emergency services or call/text <strong>988</strong> (US) or visit <a href="https://befrienders.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-rose-900">befrienders.org</a> for global resources.
          </p>
        </div>

        {/* Policy Content */}
        <article className="prose prose-indigo max-w-none space-y-6 text-gray-700">
          <Section title="1. Introduction">
            <p>
              Welcome to Depressed Together (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and community platform at <a href="https://www.depressedtogether.com" className="text-indigo-600">www.depressedtogether.com</a>.
            </p>
            <p>
              <strong>Please read this policy carefully.</strong> By accessing or using our platform, you consent to the practices described herein.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <SubSection title="A. Information You Provide">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Account Data:</strong> Email address, display name, optional profile details (e.g., age range, location)</li>
                <li><strong>Community Content:</strong> Messages, posts, reactions, or other content you share in peer support spaces</li>
                <li><strong>Communications:</strong> Records when you contact us for support or feedback</li>
                <li><strong>Voluntary Disclosures:</strong> Any personal or health-related information you choose to share in community discussions</li>
              </ul>
              <p className="mt-2 text-sm italic text-gray-600">
                ⚠️ We strongly advise against sharing highly sensitive personal identifiers (e.g., full name, address, phone number, medical records) in public community spaces.
              </p>
            </SubSection>

            <SubSection title="B. Information Collected Automatically">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Usage Data:</strong> Pages visited, time spent, features used, browser</li>
                <li><strong>Log Data:</strong> IP address, timestamps, referring URLs, crash reports</li>
                <li><strong>Cookies &amp; Similar Technologies:</strong> We use cookies and similar tracking technologies to enhance your experience and analyze platform usage. You can manage your cookie preferences in your browser settings.</li>
              </ul>
            </SubSection>

            <SubSection title="C. Information from Third Parties">
              <p>
                If you sign in via a third-party service (e.g., Google), we may receive basic profile information per your permissions with that provider.
              </p>
            </SubSection>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide, maintain, and improve our peer support platform</li>
              <li>Facilitate community connections and moderation</li>
              <li>Send important account or service notifications (non-marketing)</li>
              <li>Respond to your inquiries and provide user support</li>
              <li>Monitor and prevent abuse, fraud, or safety risks</li>
              <li>Comply with legal obligations and enforce our terms</li>
              <li>Generate anonymized, aggregated insights to improve community well-being resources</li>
            </ul>
            <p className="mt-2">
              <strong>We do not sell your personal information.</strong> We do not use your community content for advertising targeting.
            </p>
          </Section>

          <Section title="4. Legal Basis for Processing (GDPR)">
            <p>
              If you are in the European Economic Area (EEA), we process your data based on:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Your consent (e.g., for optional profile details)</li>
              <li>Performance of our Terms of Service</li>
              <li>Legitimate interests (e.g., platform security, community safety)</li>
              <li>Compliance with legal obligations</li>
            </ul>
          </Section>

          <Section title="5. Data Sharing &amp; Disclosure">
            <p>We may share your information only in these limited circumstances:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>With your consent:</strong> When you explicitly authorize sharing</li>
              <li><strong>Community visibility:</strong> Content you post in public or group spaces is visible to other community members per your privacy settings</li>
              <li><strong>Legal requirements:</strong> If required by law, subpoena, or to protect rights, safety, or property of Depressed Together, users, or the public</li>
              <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets (users will be notified of any change in data practices)</li>
            </ul>
          </Section>

          <Section title="6. Data Security">
            <p>
              We implement technical and organizational measures designed to protect your information (e.g., encryption in transit, access controls, regular security assessments). However, no internet transmission is 100% secure. You are responsible for safeguarding your login credentials and being mindful about what you share publicly.
            </p>
          </Section>

          <Section title="7. Your Rights &amp; Choices">
            <SubSection title="Account &amp; Content Controls">
              <ul className="list-disc pl-5 space-y-1">
                <li>Update or delete your profile information via Settings</li>
                <li>Delete your account and associated personal data (subject to legal retention requirements)</li>
                <li>Adjust notification preferences</li>
                <li>Control visibility of your profile/posts via community privacy settings</li>
              </ul>
            </SubSection>

            <SubSection title="Regional Rights">
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>California (CCPA/CPRA):</strong> Right to know, delete, correct, and opt-out of &quot;sales&quot; (we don&apos;t sell data). Submit requests via <a href="mailto:privacy@depressedtogether.com" className="text-indigo-600">privacy@depressedtogether.com</a>.</li>
                <li><strong>EEA/UK (GDPR):</strong> Right to access, rectify, erase, restrict processing, data portability, and withdraw consent. Contact us to exercise these rights.</li>
                <li><strong>Other regions:</strong> We honor reasonable requests per applicable local laws.</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="8. Data Retention">
            <p>
              We retain personal information only as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. Account data is typically deleted within 30 days of account deletion request, except where needed for legal compliance, security, or fraud prevention.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              Depressed Together is not intended for individuals under 16. We do not knowingly collect personal information from children. If you believe a minor has provided us with data, please contact us immediately so we can investigate and remove such information.
            </p>
          </Section>

          <Section title="10. International Transfers">
            <p>
              Your information may be transferred to and processed in countries other than your own (including the United States). We ensure appropriate safeguards are in place per applicable data protection laws for such transfers.
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              We may update this Privacy Policy periodically. We will notify users of material changes via email or prominent notice on the platform. Your continued use after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              Questions about this Privacy Policy or your data? Reach out:
            </p>
            <ul className="list-none pl-0 mt-2 space-y-1">
              <li>📧 Email: <a href="mailto:privacy@depressedtogether.com" className="text-indigo-600 hover:underline">privacy@depressedtogether.com</a></li>
              <li>📬 Mail: Depressed Together, Privacy Team<br />[Your Business Address]<br />Texas, USA</li>
            </ul>
            <p className="mt-4 text-sm text-gray-500">
              For urgent safety concerns about a community member, use the in-app reporting tool or contact local emergency services.
            </p>
          </Section>
        </article>

        {/* Footer CTA */}
        <div className="mt-12 pt-6 border-t text-center">
          <p className="text-gray-600 mb-4">
            Thank you for trusting Depressed Together. Your privacy and safety matter.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              href="/terms" 
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Terms of Service
            </Link>
            <Link 
              href="/contact" 
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

// Reusable subsection components for modularity
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="scroll-mt-20">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
      <div>{children}</div>
    </div>
  );
}