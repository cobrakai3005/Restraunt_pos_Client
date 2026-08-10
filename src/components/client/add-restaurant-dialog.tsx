"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Store } from "lucide-react";
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
import { clientService } from "@/services/client.service";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  isActive: z.boolean().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  contact: z.object({
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    managerName: z.string().optional()
  }).optional(),
  compliance: z.object({
    gstNumber: z.string().optional(),
    fssaiNumber: z.string().optional()
  }).optional()
});

interface AddRestaurantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddRestaurantDialog({ open, onOpenChange, onSuccess }: AddRestaurantDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      isActive: true,
      address: { street: "", city: "", state: "", zipCode: "", country: "India" },
      contact: { phone: "", email: "", managerName: "" },
      compliance: { gstNumber: "", fssaiNumber: "" }
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      const createRes = await clientService.createRestaurant(values);
      
      // The backend drops additional fields during creation. 
      // Update immediately with the extra fields.
      const newRestaurantId = createRes?.data?.restaurant?._id || createRes?.data?._id || createRes?._id;
      if (newRestaurantId) {
        await clientService.updateRestaurant(newRestaurantId, values);
      }
      
      toast({
        title: "Success",
        description: "Restaurant added successfully.",
      });
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to add restaurant.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-800/50 max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <Store className="w-8 h-8 text-white" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold">Add Restaurant</DialogTitle>
            <DialogDescription className="text-blue-100 text-sm mt-1">
              Create a new restaurant branch to manage its staff and operations.
            </DialogDescription>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Restaurant Name <span className="text-rose-500">*</span></FormLabel>
                    <FormControl>
                      <Input className="bg-card text-card-foreground" placeholder="e.g. Downtown Branch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 px-4 bg-card text-card-foreground mt-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm text-slate-700">Active Status</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-card text-card-foreground/50">
              <h4 className="font-semibold text-foreground">Contact Information</h4>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="contact.managerName" render={({ field }) => (
                  <FormItem><FormLabel>Manager Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contact.phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contact.email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>

            <div className="space-y-4 border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-card text-card-foreground/50">
              <h4 className="font-semibold text-foreground">Address</h4>
              <FormField control={form.control} name="address.street" render={({ field }) => (
                <FormItem><FormLabel>Street Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="address.city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address.state" render={({ field }) => (
                  <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address.zipCode" render={({ field }) => (
                  <FormItem><FormLabel>Zip Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address.country" render={({ field }) => (
                  <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>

            <div className="space-y-4 border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-card text-card-foreground/50">
              <h4 className="font-semibold text-foreground">Compliance</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="compliance.gstNumber" render={({ field }) => (
                  <FormItem><FormLabel>GST Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="compliance.fssaiNumber" render={({ field }) => (
                  <FormItem><FormLabel>FSSAI Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>

            <div className="pt-4 flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                {isSubmitting ? "Adding..." : "Add Restaurant"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
