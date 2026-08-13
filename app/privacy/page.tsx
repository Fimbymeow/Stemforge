import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Privacy Notice" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Notice" summary="How Orthic handles account information, learning progress and data stored in your browser during the public beta.">
      <LegalSection title="Who this is for">
        <p>Orthic is a learning service designed for school learners. If you are not permitted to create or use an online account on your own, involve a parent, guardian, school or other responsible adult. Orthic does not set or infer one universal consent age; the requirements depend on your circumstances.</p>
      </LegalSection>
      <LegalSection title="Information the service uses">
        <p>You can use the learning experience without an account. Guest progress, including attempts, stage progress, Review activity, support use and achievements, is stored in your browser. If you optionally provide a first name or dismiss the personalisation prompt, that learner preference is also stored in your browser.</p>
        <p>If you create an account, the account provider processes your email address and secure sign-in information. If you choose Google sign-in, Google and the account provider process the identity information needed to sign you in. Orthic uses the resulting account identity and may display your email address; it does not receive your Google password.</p>
        <p>Only after you explicitly choose to add browser progress or preferences, or turn on cross-device sync, can recognised learning evidence or learner preferences be associated with your account. Signing in alone never imports guest data automatically.</p>
      </LegalSection>
      <LegalSection title="Why it is used">
        <p>Information is used to provide sign-in, save and restore learning progress, calculate current learning and Review states, protect account data, investigate faults and respond to feedback. Orthic does not currently use advertising cookies, behavioural advertising or passive product analytics.</p>
      </LegalSection>
      <LegalSection title="Storage and service providers">
        <p>Necessary browser storage and session cookies keep progress and authenticated sessions working. Supabase provides authentication and hosted database services, Vercel hosts the application, and Google participates only when you choose Google sign-in. These providers process limited data under their own terms and privacy arrangements.</p>
      </LegalSection>
      <LegalSection title="Your choices and controls">
        <p>You can continue as a guest, export data held in the current browser, export learning progress and preferences associated with a signed-in account, pause cross-device sync, or erase the account&apos;s remote learning progress and preferences using the account controls. Erasing this data does not itself delete the authentication identity.</p>
        <p>A self-service deletion control for the authentication identity is not currently offered. Until a reviewed contact route is published, use the in-product Send feedback control for privacy or account-deletion assistance and do not include passwords or other secrets.</p>
      </LegalSection>
      <LegalSection title="Security, retention and changes">
        <p>Orthic uses HTTPS in production, server-side access controls and bounded account identifiers. No online service can promise absolute security. Browser data remains until you clear it or use the available controls; account learning data remains until erased or a reviewed retention policy requires otherwise.</p>
        <p>This notice may change as the public beta develops. Material changes should be dated and communicated clearly.</p>
      </LegalSection>
    </LegalPage>
  );
}
