import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function UserSection() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;
  if (!user) {
    return (
      <Link
        href="/auth/sign-up"
        className="rounded-full bg-primary-blue px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary-blue transition duration-500"
      >
        Become an Uprizer
      </Link>
    );
  }

  return (
    <div className="w-full flex flex-col md:flex-row gap-2 items-center justify-center">
      <p className="font-semibold text-sm">Hey, Uprizer 👋</p>
      <Link
        href="/protected"
        className="rounded-full max-sm:w-10/12 text-center  bg-primary-blue px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary-blue transition duration-500 hover:bg-secondary-blue hover:shadow-secondary-blue lg:block"
      >
        View Profile
      </Link>
    </div>
  );
}
