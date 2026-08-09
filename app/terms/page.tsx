import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" summary="The basic rules for using STEM Forge during its public beta.">
      <LegalSection title="Using STEM Forge">
        <p>STEM Forge provides original learning explanations, practice and progress tools for educational use. It is not an examination board and is not affiliated with or endorsed by Qualifications Scotland. The service cannot guarantee grades, examination outcomes or uninterrupted availability.</p>
        <p>STEM Forge is designed for school learners. If you are not permitted to use an online service or create an account on your own, involve a parent, guardian, school or other responsible adult. By creating an account, you confirm that you are permitted to use the service.</p>
      </LegalSection>
      <LegalSection title="Accounts and acceptable use">
        <p>Keep your sign-in details secure and provide accurate account information. Do not attempt to access another person&apos;s data, disrupt the service, bypass its safeguards, automate abusive traffic, upload harmful material or use the service unlawfully.</p>
        <p>You may use guest learning without an account. Signing in does not import guest progress; adding browser progress and turning on cross-device sync remain separate, explicit choices.</p>
      </LegalSection>
      <LegalSection title="Learning content and intellectual property">
        <p>STEM Forge learning materials, software and branding are protected by applicable intellectual-property rights. You may use the service for personal learning and ordinary teaching support, but must not republish, sell, scrape or falsely present its materials as official examination-board content.</p>
      </LegalSection>
      <LegalSection title="Public-beta service">
        <p>The service is still being validated with real learners. Features may change, and access may occasionally be limited for maintenance, safety or misuse. We may suspend access that creates risk to learners, other users or the service.</p>
      </LegalSection>
      <LegalSection title="Data and ending use">
        <p>You can stop using the service at any time and use the available browser and account learning-data controls. Authentication-identity deletion currently requires assistance through the in-product Send feedback route. STEM Forge may need to retain limited records where required for security, legal compliance or resolving disputes.</p>
      </LegalSection>
      <LegalSection title="Changes and contact">
        <p>These terms may change as the beta develops. Material changes should be dated and presented clearly. Until formally reviewed operator and contact details are published, use the in-product Send feedback control for service questions and do not include passwords or other secrets.</p>
      </LegalSection>
    </LegalPage>
  );
}
