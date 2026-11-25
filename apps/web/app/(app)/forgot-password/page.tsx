import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
import { requestPasswordReset } from "@/app/(app)/auth/actions";

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a link to choose a new one.">
      <AuthForm action={requestPasswordReset} submitLabel="Send reset link" fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]} />
    </AuthCard>
  );
}
