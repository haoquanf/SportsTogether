import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
import { updatePassword } from "@/app/(app)/auth/actions";
import { requireUser } from "@/lib/auth";

export default async function ResetPasswordPage() {
  await requireUser();
  return (
    <AuthCard title="Choose a new password">
      <AuthForm action={updatePassword} submitLabel="Save password" fields={[
        { name: "password", label: "New password (8+ characters)", type: "password", autoComplete: "new-password" },
        { name: "confirm", label: "Type the new password again", type: "password", autoComplete: "new-password", matches: "password" },
      ]} />
    </AuthCard>
  );
}
