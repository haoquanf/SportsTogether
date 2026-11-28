import Link from "next/link";
import { Contact, LegalPage } from "@/components/legal";

export const metadata = { title: "Terms of service · ZeniSports" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service">
      <p>
        These terms are the agreement between you and ZeniSports when you use our website and app. By creating an account or using ZeniSports, you agree to them.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be at least 13 years old. If you&apos;re under 18, a parent or guardian should agree to these terms with you.</li>
        <li>Give accurate information and keep your password safe. You&apos;re responsible for what happens on your account.</li>
        <li>One person per account.</li>
      </ul>

      <h2>Playing safely</h2>
      <ul>
        <li>Sports and dance carry a risk of injury. Warm up, know your limits, and check with a doctor if you have any health concerns.</li>
        <li>Lessons and AI coach feedback are general guidance, not medical or professional advice. Use your own judgment.</li>
        <li>Groups and sessions are organized by members, not by ZeniSports. We don&apos;t run, supervise or check venues or organizers, so take normal care when meeting people.</li>
      </ul>

      <h2>Being a good member</h2>
      <p>Please don&apos;t:</p>
      <ul>
        <li>Harass, threaten or discriminate against anyone, or post hateful, sexual or violent content.</li>
        <li>Post spam, scams or misleading groups and sessions.</li>
        <li>Upload videos of other people without their permission, or content you don&apos;t have the right to share.</li>
        <li>Try to break, overload or get around the security of ZeniSports, or collect other members&apos; information.</li>
      </ul>
      <p>You can report content to us. We may remove content or suspend accounts that break these rules.</p>

      <h2>Your content</h2>
      <p>
        You own the videos, photos and text you upload. You give ZeniSports permission to store, process and show them only as needed to run the service, for example to analyze your clip or show your comment to your group.
        Your videos stay private unless you choose to share them.
      </p>

      <h2>Premium and payments</h2>
      <ul>
        <li>Premium costs $9.99 a month or $79 a year (USD), plus any taxes, and renews automatically until you cancel.</li>
        <li>Payments are processed by Stripe. You can cancel any time from Manage billing on the <Link href="/profile/membership" className="text-brand-700 hover:underline">membership page</Link>. You keep Premium until the end of the period you paid for.</li>
        <li>Payments are non-refundable except where the law requires, or if we couldn&apos;t provide Premium because of a problem on our side. Contact us and we&apos;ll put it right.</li>
        <li>If we change the price, we&apos;ll tell you at least 30 days before your next renewal.</li>
      </ul>

      <h2>The service</h2>
      <p>
        We&apos;re a young product and keep improving it. Features may change, and the service may sometimes be unavailable.
        ZeniSports is provided &quot;as is&quot;. To the extent the law allows, we aren&apos;t liable for indirect losses, or for injuries, disputes or losses arising from sessions or meetings between members.
      </p>

      <h2>Ending your account</h2>
      <p>You can stop using ZeniSports at any time and ask us to delete your account at <Contact />. We may suspend or close accounts that break these terms.</p>

      <h2>Changes and law</h2>
      <p>
        If we make important changes to these terms, we&apos;ll update the date above and let members know. These terms are governed by the laws of the Commonwealth of Massachusetts, USA.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms: <Contact />.</p>
    </LegalPage>
  );
}
