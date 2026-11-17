import { matura } from "@/lib/fonts";
import type { Metadata } from "next";
import { SectionPage } from "@/components/section-page";
import { IconShield } from "@/components/icons";

export const metadata: Metadata = {
  title: "Privacy policy | Indirimbo zo Guhimbaza Imana",
  description: "How Indirimbo zo Guhimbaza Imana handles your information and how to manage your data.",
};

const sections = [
  {
    id: "collection",
    title: "Information we collect",
    paragraphs: [
      "The app saves your favorites, recently opened hymns, and reading preferences to personalize your hymnbook. These preferences may be stored locally on your device.",
      "If you choose Google sign-in where available, your email address, display name, and profile picture are used to create and manage your account. Anonymized usage statistics may be used to understand how the app is used and improve its performance.",
    ],
  },
  {
    id: "use",
    title: "How we use your information",
    paragraphs: [
      "We use information to provide the features you choose, remember your preferences, manage your account, and sync saved data where available. Usage information helps us improve reliability and the reading experience.",
    ],
  },
  {
    id: "storage",
    title: "Storage and retention",
    paragraphs: [
      "Favorites and preferences stored on your device remain there until you change or clear them. Local data is specific to the device and storage you use and is not automatically synced unless a sync feature is available and enabled.",
      "Firebase, a service provided by Google, supports cloud features where enabled. Account information and synced data are retained to provide those features until you request deletion, subject to any applicable retention requirements.",
    ],
  },
  {
    id: "sharing",
    title: "Service providers and sharing",
    paragraphs: [
      "Google sign-in, Firebase, and hosting providers process information needed to deliver their services. Their privacy policies apply to that processing. We use these services to operate and maintain the app.",
      "Playing externally hosted audio, opening a video, or following an external link connects you to another provider. That provider handles information under its own privacy policy.",
    ],
  },
  {
    id: "choices",
    title: "Your choices and rights",
    paragraphs: [
      "You can browse hymns without signing in, manage your favorites, and adjust your reading preferences. You may contact us to request access to, correction of, or deletion of information associated with your account. Your rights depend on the laws that apply to you.",
    ],
  },
  {
    id: "deletion",
    title: "Deleting your data",
    paragraphs: [
      "Remove individual favorites in the app or clear the app's stored data through your device or browser settings to remove locally saved preferences and recent hymns. Clearing local storage does not delete information associated with a cloud account.",
      "To request account deletion, email bunsenplus.org@gmail.com from the address associated with your account. We process deletion requests within 30 days. Signing out does not delete your account or its saved data.",
    ],
  },
  {
    id: "security",
    title: "Keeping your information secure",
    paragraphs: [
      "We rely on authentication and cloud services such as Google sign-in and Firebase where enabled to support secure access and storage. No system can guarantee absolute security for information stored or transmitted electronically.",
    ],
  },
  {
    id: "updates",
    title: "Changes to this policy",
    paragraphs: [
      "We may update this policy as the app and its data practices evolve. The latest version will be available on this page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <SectionPage title="Privacy policy" header={<>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
              <IconShield width={24} height={24} />
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Privacy policy</h2>
          </div>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            Your privacy matters. This policy explains how the app handles your
            information and the choices you have about your data.
          </p>
        </div>
        <p className={`${matura.className} shrink-0 text-center text-base leading-snug text-muted`}>Indirimbo Zo<br />Guhimbaza Imana</p>
      </div>
    </>} sections={[
      ...sections.map((section) => ({ id: section.id, title: section.title, content: <>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</> })),
      { id: "contact", title: "Contact us", content: <>
        <p>For privacy questions or data requests, contact BunsenPlus.</p>
        <a href="mailto:bunsenplus.org@gmail.com" className="inline-block break-all font-medium text-accent-strong hover:underline dark:text-accent">bunsenplus.org@gmail.com</a>
      </> },
    ]} />
  );
}
