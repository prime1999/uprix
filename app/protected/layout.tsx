import { LogoutButton } from "@/components/logout-button";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="absolute top-3 right-10">
        <LogoutButton />
      </div>
      {children}
    </main>
  );
}
