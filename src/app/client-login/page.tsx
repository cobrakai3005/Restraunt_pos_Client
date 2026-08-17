"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Store, ShieldCheck, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

const loginSchema = z.object({
  username: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function UnifiedClientAdminLogin() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsSubmitting(true);
    try {
      // Calls unified auth endpoint that authenticates both Client and Admin roles
      const response = await authService.login(values.username, values.password);
      if (response?.data?.token) {
        const user = response.data.user;
        login(response.data.token, user);

        const role = user?.role;
        if (role === "MASTER_ADMIN" || role === "MASTER_USER") {
          toast({
            title: "Admin Login Successful 🎉",
            description: "Welcome back, Master Administrator.",
          });
          router.push("/admin/clients");
        } else if (role === "CLIENT") {
          toast({
            title: "Client Login Successful 🎉",
            description: "Welcome to your restaurant management workspace.",
          });
          router.push("/client/analytics");
        } else {
          toast({
            title: "Login Successful",
            description: "Redirecting to your terminal...",
          });
          router.push("/employees");
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.response?.data?.message || "Invalid credentials. Please verify your email/username and password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100/70 dark:bg-slate-950 p-4 sm:p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800">
        
        {/* Left Branding Side */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-10 lg:p-12 relative overflow-hidden">
          {/* Subtle glow background */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <Store className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white block">Vinimay</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300">Management Cloud</span>
              </div>
            </div>

            <div className="space-y-4 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Client &amp; Admin Unified Portal
              </div>
              <h1 className="text-3xl lg:text-4xl font-black leading-tight tracking-tight text-white">
                Restaurant ERP &amp; Multi-Tenant Control.
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed">
                Single sign-on access for franchise owners, restaurant managers, and system administrators.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-4 mt-8">
            <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> Role-Based Automatic Routing
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Log in with your administrator or client credentials. You will be routed automatically to your designated control center.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
              <span>© {new Date().getFullYear()} Vinimay POS</span>
              <span>Enterprise Grade Security</span>
            </div>
          </div>
        </div>

        {/* Right Login Form Side */}
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14 bg-white dark:bg-slate-900">
          <div className="w-full max-w-md mx-auto space-y-8">
            <div className="space-y-2">
              <div className="md:hidden flex items-center gap-2 mb-6">
                <Store className="w-7 h-7 text-purple-600" />
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Vinimay</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Sign In
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Enter your Client or Admin credentials to access your portal.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Email or Username
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="client@restaurant.com or admin"
                          className="h-12 px-4 rounded-xl font-medium text-sm bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:ring-purple-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Password
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="h-12 px-4 rounded-xl font-medium text-sm bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus-visible:ring-purple-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In to Workspace <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Employee Switch Link */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you a restaurant waiter, cashier, or kitchen chef?
              </p>
              <Link
                href="/employee-login"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Go to Restaurant Terminal / Employee Login <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
