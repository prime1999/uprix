export default function NotFound() {
  return (
    <main className="min-h-screen px-4 overflow-hidden bg-white">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-180px font-bold text-secondary-blue sm:text-250px md:text-350px lg:text-450px">
          404
        </span>
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 text-center">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold text-secondary-blue sm:text-4xl md:text-5xl">
            Page under maintenance
          </h1>

          <p className="mt-4 text-sm text-blue-200 sm:text-base">
            The page you are looking for is currently under maintenance
          </p>
        </div>

        <button className="mt-8 rounded-full px-6 py-3 text-sm font-medium text-white sm:px-8 sm:py-4">
          Go to Home
        </button>
      </div>
    </main>
  );
}
