"use client";

const Footer = () => {
  return (
    <footer className="rr-footer max-h-48 bg-primary-yellow border-t border-[#e6e3da] px-0 py-12">
      <div className="font-semibold mx-auto flex w-[calc(100%-44px)] max-w-[1120px] justify-center gap-2.5">
        <h1 className="text-2xl md:text-4xl lg:text-6xl">
          {" "}
          The Result Room 2.0
        </h1>
      </div>
      <div className="w-full flex flex-col items-center justify-center text-xs">
        <span>One goal. 90 days. No hiding.</span>
        <h6 className="font-semibold mt-4">© 2026 UPRIX · Dev-team.</h6>
      </div>
    </footer>
  );
};

export default Footer;
