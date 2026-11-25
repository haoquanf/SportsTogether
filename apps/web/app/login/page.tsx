import Link from "next/link";
import { AuthCard, Divider } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
import { GoogleButton, googleAuthEnabled } from "@/components/google-button";
import { logIn } from "@/app/auth/actions";

const ERRORS: Record<string, string> = {
  google: "Google sign-in didn't work. Please try again.",
  link: "That link has expired or was already used. Try logging in, or sign up again for a new link.",
  "not-configured": "Sign-in isn't switched on yet in this preview.",
};

const NOTICES: Record<string, string> = {
  confirmed: "Your email is confirmed. Log in to finish setting up your profile.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { error, notice } = await searchParams;
  return (
    <AuthCard title="Welcome back">
      {notice && NOTICES[notice] && <p role="status" className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">{NOTICES[notice]}</p>}
      {error && ERRORS[error] && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{ERRORS[error]}</p>}
      {googleAuthEnabled && (
        <>
          <GoogleButton />
          <Divider />
        </>
      )}
      <AuthForm
        action={logIn}
        submitLabel="Log in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
      />
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-slate-600 hover:text-brand-700">Forgot password?</Link>
        <Link href="/signup" className="font-medium text-brand-700">Create an account</Link>
      </div>
    </AuthCard>
  );
}
