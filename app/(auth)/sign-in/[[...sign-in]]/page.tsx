import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] px-4">
      <div className="flex items-center gap-0.5 mb-8">
        <span className="text-3xl font-extrabold tracking-tight text-gray-900">Sunday</span>
        <span className="text-3xl font-extrabold tracking-tight text-green-500">.ai</span>
      </div>
      <SignIn />
    </div>
  );
}
