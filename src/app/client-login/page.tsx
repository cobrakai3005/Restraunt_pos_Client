"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Store } from "lucide-react";

import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function ClientLogin() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const response = await authService.clientLogin(values.username, values.password);
      if (response?.data?.token) {
        localStorage.setItem("vinimay_token", response.data.token);
        toast({
          title: "Login Successful",
          description: "Welcome to your workspace.",
        });
        router.push("/client/analytics");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.response?.data?.message || "Invalid credentials. Please try again.",
      });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-background rounded-xl overflow-hidden shadow-2xl border">
        {/* Left Branding Side */}
        <div className="hidden md:flex flex-col justify-between bg-primary/5 p-10 border-r">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <Store className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-primary tracking-tight">Vinimay</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tighter mb-4 text-foreground">
              Welcome back to your workspace.
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your business, inventory, and team activity all in one place.
            </p>
          </div>
          
          <div className="bg-background/80 backdrop-blur p-6 rounded-lg border mt-12">
             <p className="text-sm italic text-muted-foreground mb-4">
              "Vinimay has completely transformed how we handle our day-to-day restaurant operations."
             </p>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                 TS
               </div>
               <div>
                 <p className="text-sm font-semibold">Test Client</p>
                 <p className="text-xs text-muted-foreground">Rahul Kirana Store</p>
               </div>
             </div>
          </div>
        </div>

        {/* Right Login Side */}
        <div className="flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2 text-center md:text-left">
              <div className="md:hidden flex items-center justify-center gap-2 mb-6">
                <Store className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold text-primary tracking-tight">Vinimay</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Sign In</h2>
              <p className="text-muted-foreground">
                Enter your credentials to access your client account.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <a href="#" className="text-sm text-primary hover:underline font-medium">
                          Forgot password?
                        </a>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full text-md h-11 bg-primary hover:bg-primary/90 text-primary-foreground">
                  Sign In
                </Button>
              </form>
            </Form>
            
            <p className="text-center text-sm text-muted-foreground mt-6">
              Need help? Contact support or your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
