import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
      >
        <span className="text-7xl font-bold leading-none">404</span>
      </div>

      <div className="relative z-10 flex max-w-xl flex-col items-center px-4 text-center">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold text-secondary-blue sm:text-4xl md:text-5xl">
            Page not found
          </h1>

          <p className="mt-4 text-sm text-slate-600 sm:text-base">
            The page you are looking for does not exist or may have moved.
          </p>
        </div>

        <Link href="/">Go to home</Link>
      </div>
    </main>
  );
}
