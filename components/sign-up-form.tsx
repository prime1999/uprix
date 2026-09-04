"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import logo from "@/app/assets/images/mobileLogo.png";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    toast({
      title: "Creating your account",
      description: "Please wait while we set up your Uprizer account.",
      variant: "info",
    });

    if (password !== repeatPassword) {
      toast({
        title: "Unable to sign up",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });
      if (error) throw error;
      toast({
        title: "Account created",
        description: "Welcome to Uprix. Your profile is ready to complete.",
        variant: "success",
      });
      router.push("/profile");
    } catch (error: unknown) {
      toast({
        title: "Sign-up failed",
        description:
          error instanceof Error ? error.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border border-white/30 bg-white/20 shadow-xl backdrop-blur-xl">
        <CardHeader className="relative -mt-4 flex flex-col items-center justify-center">
          <Image src={logo} alt="Logo" width={80} height={80} />
          <CardTitle className="text-2xl mt-2 font-heading text-secondary-blue">
            Become a Bonafied Uprizer
          </CardTitle>
          <CardDescription className="-mt-4">
            Join a community of growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-4 mt-2">
              <div className="grid gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="Your email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Input
                  id="repeat-password"
                  type="password"
                  placeholder="Repeat your password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-full bg-gradient-to-r from-secondary-blue to-primary-blue text-white cursor-pointer duration-700 transition hover:from-primary-blue hover:to-secondary-blue"
                disabled={isLoading}
              >
                {isLoading ? "Creating an account..." : "Continue  →"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already an uprizer?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
