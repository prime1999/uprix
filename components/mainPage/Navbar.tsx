import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/app/assets/images/logo.png";
import mobileLogo from "@/app/assets/images/mobileLogo.png";
import { Menu } from "lucide-react";
import UserSection from "./UserSection";

const Navbar = () => {
  return (
    <header className="fixed top-0 z-[500] w-full pt-2">
      <nav className="mx-auto flex h-12 w-[calc(100%-1rem)] items-center justify-between rounded-2xl border border-white/10 bg-white/40 p-2 backdrop-blur-xl md:w-11/12">
        <Image
          src={logo}
          alt="Logo"
          width={130}
          height={130}
          className="hidden object-cover lg:block"
        />
        <Image
          src={mobileLogo}
          alt="Mobile Logo"
          width={40}
          height={40}
          className="object-cover lg:hidden"
        />

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="/"
            className="cursor-pointer text-sm font-semibold transition duration-500 hover:text-primary-blue"
          >
            X-deep
          </Link>
          {/* Assigned Product Links */}
          <Link
            href="#result-room"
            className="cursor-pointer text-sm font-semibold transition duration-500 hover:text-primary-blue"
          >
            Result Room
          </Link>
          <Link
            href="#x-growth"
            className="cursor-pointer text-sm font-semibold transition duration-500 hover:text-primary-blue"
          >
            X-Growth
          </Link>
          <Link
            href="#uprixtunity"
            className="cursor-pointer text-sm font-semibold transition duration-500 hover:text-primary-blue"
          >
            Uprixtunity
          </Link>
          <Link
            href="/#testimonials"
            className="cursor-pointer text-sm font-semibold transition duration-500 hover:text-primary-blue"
          >
            Testimonials
          </Link>
          <Link
            href="#faqs"
            className="cursor-pointer text-sm font-semibold transition duration-500 hover:text-primary-blue"
          >
            FAQs
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="hidden md:flex gap-2 items-center">
              Getting status...
            </div>
          }
        >
          <div className="hidden md:block">
            <UserSection />
          </div>
        </Suspense>

        <Sheet>
          <SheetTrigger className="p-3 lg:hidden" aria-label="Open menu">
            <Menu />
          </SheetTrigger>
          <SheetContent side="right" showCloseButton={false}>
            <div className="relative h-full flex flex-col gap-8 p-4">
              <Link
                href="/"
                className="cursor-pointer text-lg font-semibold uppercase transition duration-500 hover:text-primary-blue"
              >
                X-deep
              </Link>
              {/* Assigned Product Mobile Links */}
              <Link
                href="#result-room"
                className="cursor-pointer text-lg font-semibold uppercase transition duration-500 hover:text-primary-blue"
              >
                Result Room
              </Link>
              <Link
                href="#x-growth"
                className="cursor-pointer text-lg font-semibold uppercase transition duration-500 hover:text-primary-blue"
              >
                X-Growth
              </Link>
              <Link
                href="#uprixtunity"
                className="cursor-pointer text-lg font-semibold uppercase transition duration-500 hover:text-primary-blue"
              >
                Uprixtunity
              </Link>
              <Link
                href="#testimonials"
                className="cursor-pointer text-lg font-semibold uppercase transition duration-500 hover:text-primary-blue"
              >
                Testimonials
              </Link>
              <Link
                href="#faqs"
                className="cursor-pointer text-lg font-semibold uppercase transition duration-500 hover:text-primary-blue"
              >
                FAQs
              </Link>
              <Suspense
                fallback={<div className="md:hidden">Getting status...</div>}
              >
                <div className="md:hidden absolute bottom-5 w-full">
                  <UserSection />
                </div>
              </Suspense>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
};

export default Navbar;
