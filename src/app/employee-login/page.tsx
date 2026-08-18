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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, UserCircle, KeyRound, ArrowRight, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import Link from "next/link";

import { authService, User } from "@/services/auth.service";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Suspense } from "react";
import { useAuth } from "@/context/auth-context";

const credentialSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const pinSchema = z.object({
  restaurantId: z.string().min(1, "Restaurant ID is required"),
  posPin: z.string().min(4, "PIN must be at least 4 digits"),
});

function EmployeeLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login } = useAuth();
  
  // Try to load from URL first, then fallback to saved local storage
  const urlRestaurantId = searchParams.get("restaurantId") || "";
  const savedRestaurantId = typeof window !== 'undefined' ? localStorage.getItem("vinimay_restaurant_id") || "" : "";
  const defaultRestaurantId = urlRestaurantId || savedRestaurantId;

  const credentialForm = useForm<z.infer<typeof credentialSchema>>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const pinForm = useForm<z.infer<typeof pinSchema>>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      restaurantId: defaultRestaurantId,
      posPin: "",
    },
  });

  const handleLoginSuccess = (token: string, user: User, restaurantId?: string) => {
    login(token, user);
    if (restaurantId) {
       localStorage.setItem("vinimay_restaurant_id", restaurantId);
    }
    toast({
      title: "Login Successful",
      description: "Welcome to your terminal.",
    });
    router.push("/employee");
  };

  const handleLoginError = (error: any) => {
    toast({
      variant: "destructive",
      title: "Login Failed",
      description: error.response?.data?.message || "Invalid credentials. Please try again.",
    });
  };

  async function onCredentialSubmit(values: z.infer<typeof credentialSchema>) {
    try {
      const response = await authService.employeeLogin(values.username, values.password);
      if (response?.data?.token) {
        // We get user object back which has the restaurantId
        handleLoginSuccess(response.data.token, response.data.user, response.data.user?.restaurantId);
      }
    } catch (error: any) {
      handleLoginError(error);
    }
  }

  async function onPinSubmit(values: z.infer<typeof pinSchema>) {
    try {
      const response = await authService.posLogin(values.restaurantId, values.posPin);
      if (response?.data?.token) {
        handleLoginSuccess(response.data.token, response.data.user, values.restaurantId);
      }
    } catch (error: any) {
      handleLoginError(error);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Left Branding Side */}
        <div className="hidden md:flex flex-col justify-between bg-slate-100/50 dark:bg-slate-800/50 p-10 border-r border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <Store className="w-12 h-12 text-blue-600 dark:text-blue-500 mb-4" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Vinimay POS</h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Access your assigned station, take orders, and manage tables efficiently.
            </p>
          </div>
          
          <div className="bg-white/50 dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 mt-12">
             <p className="text-sm italic text-slate-600 dark:text-slate-400 mb-4">
              "Quick, responsive, and always reliable during rush hours."
             </p>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-500">
                 <UserCircle className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">Staff Terminal</p>
                 <p className="text-xs text-slate-500">Authorized Access Only</p>
               </div>
             </div>
          </div>
        </div>

        {/* Right Login Side */}
        <div className="flex flex-col items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2 text-center md:text-left">
              <div className="md:hidden flex items-center justify-center gap-2 mb-6">
                <Store className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Vinimay POS</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Sign In</h2>
              <p className="text-slate-500 dark:text-slate-400">
                Enter your staff credentials or use a POS PIN.
              </p>
            </div>

            <Tabs defaultValue="credentials" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <TabsTrigger value="credentials" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white">
                  <UserCircle className="w-4 h-4 mr-2" /> Credentials
                </TabsTrigger>
                <TabsTrigger value="pin" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white">
                  <KeyRound className="w-4 h-4 mr-2" /> POS PIN
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="credentials" className="mt-0">
                <Form {...credentialForm}>
                  <form onSubmit={credentialForm.handleSubmit(onCredentialSubmit)} className="space-y-6">
                    <FormField
                      control={credentialForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300">Username</FormLabel>
                          <FormControl>
                            <Input className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage className="text-red-500 dark:text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={credentialForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-slate-700 dark:text-slate-300">Password</FormLabel>
                          </div>
                          <FormControl>
                            <Input className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white" type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage className="text-red-500 dark:text-red-400" />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={credentialForm.formState.isSubmitting} className="w-full text-md h-11 bg-blue-600 hover:bg-blue-700 text-white">
                      {credentialForm.formState.isSubmitting ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="pin" className="mt-0">
                <Form {...pinForm}>
                  <form onSubmit={pinForm.handleSubmit(onPinSubmit)} className="space-y-6">
                    <FormField
                      control={pinForm.control}
                      name="restaurantId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300">Restaurant ID</FormLabel>
                          <FormControl>
                            <Input className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono" placeholder="e.g. 64b8f72a..." {...field} />
                          </FormControl>
                          <p className="text-xs text-slate-500 mt-1">Usually pre-filled for this device.</p>
                          <FormMessage className="text-red-500 dark:text-red-400" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pinForm.control}
                      name="posPin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300">POS PIN</FormLabel>
                          <FormControl>
                            <Input 
                              className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-center text-xl tracking-[1em]" 
                              type="password" 
                              maxLength={4}
                              inputMode="numeric"
                              placeholder="••••" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 dark:text-red-400" />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={pinForm.formState.isSubmitting} className="w-full text-md h-11 bg-blue-600 hover:bg-blue-700 text-white">
                      {pinForm.formState.isSubmitting ? "Unlocking..." : "Unlock Terminal"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
            
            {/* Client / Admin Switch Link */}
            <div className="pt-5 mt-6 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you a Restaurant Owner or Franchise Admin?
              </p>
              <Link
                href="/client-login"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-extrabold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors"
              >
                <ShieldCheck className="w-4 h-4" /> Go to Client &amp; Admin Portal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeLogin() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>}>
      <EmployeeLoginForm />
    </Suspense>
  );
}
