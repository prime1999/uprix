"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import logo from "@/app/assets/images/mobileLogo.png";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="border border-white/30 bg-white/20 shadow-xl backdrop-blur-xl">
            <CardHeader className="relative -mt-4 flex flex-col items-center justify-center">
              <Image src={logo} alt="Logo" width={80} height={80} />
              <CardTitle className="text-xl text-secondary-blue">
                Wow you just took the first step!👍
              </CardTitle>
              <CardDescription>Now check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-center text-muted-foreground">
                You&apos;ve successfully registered. Please check your email to
                confirm your account before signing in.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
