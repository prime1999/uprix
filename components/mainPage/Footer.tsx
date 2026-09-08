import Link from "next/link";

const Footer = () => {
  return (
    <footer className="mt-12 mb-6">
      <h1 className="font-embrace text-secondary-blue text-[75px] md:text-[120px] lg:text-[170px] tracking-widest font-bold text-center">
        UPRIX
      </h1>
      <div className="w-11/12 md:w-8/12 lg:w-1/2 mx-auto flex items-center justify-between">
        <h6>Products:</h6>
        <div className="flex gap-2 items-center z-50">
          {" "}
          <Link
            href="#x-growth"
            className="text-sm text-gray-500 cursor-pointer duration-500 transition hover:text-gray-700"
          >
            X-Growth
          </Link>
          <Link
            href="#uprixtunity"
            className="text-sm text-gray-500 cursor-pointer duration-500 transition hover:text-gray-700"
          >
            Upritunity
          </Link>
          <Link
            href="#result-room"
            className="text-sm text-gray-500 cursor-pointer duration-500 transition hover:text-gray-700"
          >
            Result-room
          </Link>
        </div>
      </div>
      <p className="text-center text-gray-500 mt-2 text-sm">
        &copy; UPRIX. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
