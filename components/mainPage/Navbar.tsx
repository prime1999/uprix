import Image from "next/image";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/app/assets/images/logo.png";
import mobileLogo from "@/app/assets/images/mobileLogo.png";
import { Menu } from "lucide-react";

const Navbar = () => {
  return (
    <header className="fixed top-0 z-50 w-full pt-2">
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
          <Link
            href="/resultRoom"
            className="cursor-pointer text-sm font-semibold transition duration-500 hover:text-primary-blue"
          >
            Result Room
          </Link>
          <Link
            href="/x-growth"
            className="cursor-pointer text-sm font-semibold transition duration-500 hover:text-primary-blue"
          >
            X-Growth
          </Link>
          <Link
            href="/upritunity"
            className="cursor-pointer text-sm font-semibold transition duration-500 hover:text-primary-blue"
          >
            Upritunity
          </Link>
          <Link
            href="#testimonials"
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

        <Link
          href="/signUp"
          className="hidden rounded-full bg-primary-blue px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary-blue transition duration-500 hover:bg-secondary-blue hover:shadow-secondary-blue lg:block"
        >
          Become an Uprizer
        </Link>

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
              <Link
                href="/resultRoom"
                className="cursor-pointer text-lg font-semibold uppercase transition duration-500 hover:text-primary-blue"
              >
                Result Room
              </Link>
              <Link
                href="/x-growth"
                className="cursor-pointer text-lg font-semibold uppercase transition duration-500 hover:text-primary-blue"
              >
                X-Growth
              </Link>
              <Link
                href="/upritunity"
                className="cursor-pointer text-lg font-semibold uppercase transition duration-500 hover:text-primary-blue"
              >
                Upritunity
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
              <Link
                href="/signUp"
                className="absolute bottom-5 rounded-lg w-11/12 mx-auto text-center bg-primary-blue px-4 py-2 text-xs font-bold text-white transition shadow-md shadow-primary-blue duration-500 hover:bg-secondary-blue lg:block"
              >
                Become an Uprizer
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
};

export default Navbar;
