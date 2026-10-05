import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex flex-col min-h-screen items-center justify-center overflow-hidden px-4 ">
      <div
        aria-hidden="true"
        className="flex items-center justify-center gap-4  "
      >
        <span className="text-[100px] font-bold leading-none text-white bg-secondary-blue font-heading rounded-2xl p-7 ">
          4
        </span>
        <span className="text-[100px] font-bold leading-none text-white bg-secondary-blue rounded-2xl p-7 font-heading">
          0
        </span>
        <span className="text-[100px] font-bold leading-none text-white bg-secondary-blue  rounded-2xl p-7 font-heading">
          4
        </span>
      </div>
      <div className="relative z-10 flex max-w-xl flex-col items-center px-4 text-center">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold text-primary-blue m-4 sm:text-4xl md:text-5xl">
            Page not found
          </h2>
          <p className="mt-2 text-sm text-primary-blue sm:text-base">
            The page you are looking for does not exist or may be under
            construction 👷‍♂️.
          </p>
        </div>

        <Link
          href="/"
          className="rounded-lg py-2 px-4 mt-2 bg-gradient-to-t from-secondary-blue to-primary-blue font-semibold text-white transition duration-500 hover:from-primary-blue hover:to-secondary-blue"
        >
          Go to home
        </Link>
      </div>
    </main>
  );
}
