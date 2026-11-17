import type { Metadata } from "next";
import { SectionPage } from "@/components/section-page";
import { MOBILE_APP_URL, TESTERS_GROUP_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Download the beta | Indirimbo zo Guhimbaza Imana",
  description: "Join the BunsenPlus testers group, then get the hymnbook beta from Google Play.",
};

export default function DownloadPage() {
  return <SectionPage title="Get the mobile app" description="The app is currently in beta. Join our testers group first, then get the app from Google Play." sections={[
    { id: "join-testers", title: "Join the testers group", content: <>
      <p>Join the BunsenPlus testers group using the Google account you use for Google Play. Membership gives you access to the beta testing program.</p>
      <a href={TESTERS_GROUP_URL} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-accent-strong px-5 py-2.5 text-sm font-semibold text-white dark:text-black">Join testers group</a>
    </> },
    { id: "install", title: "Get the beta on Google Play", content: <>
      <p>After joining the group, open the Google Play testing page with the same Google account. Follow the steps there to join the beta and install the app.</p>
      <a href={MOBILE_APP_URL} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent-soft">Continue to Google Play</a>
      <p className="text-sm">If the testing page says you are not eligible, check that you have joined the group and are using the same Google account.</p>
    </> },
  ]} />;
}
