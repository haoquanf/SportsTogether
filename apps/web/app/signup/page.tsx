import Link from "next/link";
import { AuthCard, Divider } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
import { GoogleButton } from "@/components/google-button";
import { signUp } from "@/app/auth/actions";

export default function SignUpPage() {
  return (
    <AuthCard title="Create your account" subtitle="Free forever for groups, events and 3 AI analyses a month.">
      <GoogleButton />
      <Divider />
      <AuthForm
        action={signUp}
        submitLabel="Sign up"
        fields={[
          { name: "name", label: "Your name", autoComplete: "name" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password (8+ characters)", type: "password", autoComplete: "new-password" },
        ]}
      />
      <p className="text-center text-sm text-slate-600">
        Already a member? <Link href="/login" className="font-medium text-brand-700">Log in</Link>
      </p>
    </AuthCard>
  );
}
