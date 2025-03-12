import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - FB Quiz Manager",
  description: "Terms of service for FB Quiz Manager application",
}

export default function TermsPage() {
  return (
    <div className="container py-8 space-y-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="prose prose-sm max-w-none">
        <h2>1. Introduction</h2>
        <p>
          Welcome to our quiz generation service. By using our service, you agree to these terms. Please read them carefully.
        </p>

        <h2>2. Service Description</h2>
        <p>
          Our service provides tools for creating and managing educational quizzes. We aim to make learning engaging and fun.
        </p>

        <h2>3. User Responsibilities</h2>
        <p>
          You are responsible for:
        </p>
        <ul>
          <li>Maintaining the security of your account</li>
          <li>All content you create using our service</li>
          <li>Complying with all applicable laws and regulations</li>
        </ul>

        <h2>4. Content Guidelines</h2>
        <p>
          Content must be:
        </p>
        <ul>
          <li>Original or properly licensed</li>
          <li>Appropriate for the intended audience</li>
          <li>Free from harmful or malicious elements</li>
        </ul>

        <h2>5. Privacy</h2>
        <p>
          We respect your privacy and handle your data in accordance with our Privacy Policy.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          You retain rights to your content. By using our service, you grant us a license to use your content to provide and improve our services.
        </p>

        <h2>7. Disclaimers</h2>
        <p>
          Our service is provided &quot;as is&quot; without warranties of any kind, either express or implied.
        </p>

        <h2>8. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.
        </p>

        <h2>9. Contact</h2>
        <p>
          For questions about these terms, please contact us at support@example.com.
        </p>
      </div>
    </div>
  )
} 