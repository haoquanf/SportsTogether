import { Contact, LegalPage } from "@/components/legal";

export const metadata = { title: "Privacy policy · ZeniSports" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        ZeniSports helps you improve at your sport with lessons and an AI coach, and find local groups to play or dance with.
        This policy explains what information we collect, why, and the choices you have. We wrote it in plain language.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address and password. Passwords are stored encrypted by our sign-in provider; we never see them.</li>
        <li><strong>If you sign in with Google:</strong> your name, email address and profile photo from Google. We don&apos;t get access to your Gmail, contacts, files or anything else.</li>
        <li><strong>Profile:</strong> what you choose to add, such as your sports, skill level, birth year, city or neighborhood, handedness, availability, a short bio and a profile photo.</li>
        <li><strong>Activity in groups:</strong> groups you join or create, sessions you RSVP to, and comments you post.</li>
        <li><strong>Videos (AI coach):</strong> clips you upload for analysis, and the results. We only process videos after you give consent.</li>
        <li><strong>Payments:</strong> if you buy Premium, our payment processor Stripe handles your card. We receive only your plan, its status and renewal date, never your card number.</li>
        <li><strong>Usage:</strong> anonymous page views, and the name of buttons and links that are clicked with the page they were on. These counts are not linked to your name or account.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account and show your profile to other members according to your privacy setting.</li>
        <li>To match you with groups and sessions near you and at your level.</li>
        <li>To analyze your clips and give you technique feedback.</li>
        <li>To process Premium payments and send you account emails, such as confirmations and password resets.</li>
        <li>To understand which features people use, so we can improve ZeniSports.</li>
      </ul>
      <p>We do not sell your personal information, and we don&apos;t use it for advertising.</p>

      <h2>Who can see your information</h2>
      <ul>
        <li><strong>Other members</strong> see your profile if your setting allows it (all members, or only people in your groups). Comments and RSVPs are visible to members of that group.</li>
        <li><strong>Your videos</strong> are private to you unless you choose to share them.</li>
        <li>
          <strong>Service providers</strong> that run parts of ZeniSports for us, only for that purpose:
          Supabase (database, sign-in and file storage), Vercel (website hosting and anonymous analytics),
          Stripe (payments) and Google (sign-in with Google).
        </li>
        <li>We may share information if the law requires it, or to protect the safety of our members.</li>
      </ul>

      <h2>Cookies</h2>
      <p>We use cookies only to keep you signed in. Our analytics don&apos;t use cookies and don&apos;t track you across other websites.</p>

      <h2>How long we keep it</h2>
      <p>We keep your information while your account is open. When an account is deleted, we remove its profile, group activity and videos within 30 days, except records we must keep by law, such as payment records.</p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>Edit your profile and its visibility at any time from your profile page.</li>
        <li>Delete your videos at any time.</li>
        <li>Ask us for a copy of your data, to correct it, or to delete your account by contacting us at <Contact />.</li>
        <li>Cancel Premium at any time from Manage billing on the membership page.</li>
      </ul>

      <h2>Children</h2>
      <p>ZeniSports is for people aged 13 and over. We don&apos;t knowingly collect information from children under 13. If you believe a child has created an account, contact us and we&apos;ll delete it.</p>

      <h2>Security</h2>
      <p>Data is sent over encrypted connections, access is limited by strict database rules so members can only change their own information, and payments are handled by Stripe. No system is perfectly secure, so please use a strong password that you don&apos;t use elsewhere.</p>

      <h2>Changes</h2>
      <p>If we make important changes to this policy, we&apos;ll update the date above and let members know in the app or by email.</p>

      <h2>Contact</h2>
      <p>Questions or requests: <Contact />.</p>
    </LegalPage>
  );
}
