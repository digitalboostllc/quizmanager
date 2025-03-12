import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - FB Quiz Manager",
  description: "Privacy policy for FB Quiz Manager application",
}

export default function PrivacyPolicy() {
  return (
    <div className="container py-8 space-y-8 max-w-3xl mx-auto">
      <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>

      <div className="space-y-6 text-lg">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
          <p>When you use FB Quiz Manager, we collect:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Facebook Page access tokens for posting quizzes</li>
            <li>Quiz content and scheduling preferences</li>
            <li>Usage data and interaction with our application</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Post quizzes to your Facebook Page</li>
            <li>Manage and schedule your quiz content</li>
            <li>Improve our services and user experience</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Data Security</h2>
          <p>We implement security measures to protect your information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption of sensitive data</li>
            <li>Secure storage of access tokens</li>
            <li>Regular security audits and updates</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Facebook API for quiz posting</li>
            <li>Database hosting services</li>
            <li>Analytics tools for application improvement</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Email: support@fbquizmanager.com</li>
          </ul>
        </section>
      </div>
    </div>
  )
} 