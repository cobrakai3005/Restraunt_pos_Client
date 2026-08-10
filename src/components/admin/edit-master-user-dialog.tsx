"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { adminService } from "@/services/admin.service";

const formSchema = z.object({
  contactName: z.string().min(2, "Name must be at least 2 characters").max(120),
  username: z.string().min(4, "Username must be at least 4 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().optional(), // Optional for edit
});

interface EditMasterUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onSuccess: () => void;
}

export function EditMasterUserDialog({ open, onOpenChange, user, onSuccess }: EditMasterUserDialogProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        contactName: user.contactName || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "", // Never populate the password
      });
    }
  }, [user, open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      
      const payload: any = {
        contactName: values.contactName,
        username: values.username,
        email: values.email,
        phone: values.phone,
      };
      
      if (values.password) {
        payload.password = values.password;
      }

      await adminService.updateMasterUser(user._id, payload);
      toast({
        title: "Success",
        description: "Master User updated successfully.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update master user",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-slate-50 dark:bg-slate-800/50">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold">Edit Master User</DialogTitle>
            <DialogDescription className="text-blue-100 text-sm mt-1">
              Update information for {user.username}
            </DialogDescription>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Contact Name <span className="text-rose-500">*</span></FormLabel>
                  <FormControl>
                    <Input className="bg-card text-card-foreground" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Username <span className="text-rose-500">*</span></FormLabel>
                    <FormControl>
                      <Input className="bg-card text-card-foreground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Phone <span className="text-rose-500">*</span></FormLabel>
                    <FormControl>
                      <div className="flex">
                        <div className="flex items-center justify-center bg-card text-card-foreground border border-r-0 border-border rounded-l-md px-3 text-slate-500 text-sm">
                          +91
                        </div>
                        <Input className="bg-card text-card-foreground rounded-l-none" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Email <span className="text-rose-500">*</span></FormLabel>
                  <FormControl>
                    <Input className="bg-card text-card-foreground" type="email" {...field} />
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
                  <FormLabel className="text-slate-700">New Password <span className="text-slate-400 text-xs font-normal">(Leave blank to keep unchanged)</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        className="bg-card text-card-foreground pr-10" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        {...field} 
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
