import { SignupForm } from "@/components/signup/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  );
}
