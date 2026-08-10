"use client";

import { useState, useEffect } from "react";
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
import { adminService } from "@/services/admin.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  clientId: z.string().min(1, "Please select a client"),
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

interface AddAdminRestaurantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddAdminRestaurantDialog({ open, onOpenChange, onSuccess }: AddAdminRestaurantDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      adminService.getAllClients().then(res => {
        if (res.success) {
          setClients(res.data.clients || []);
        }
      }).catch(err => console.error("Failed to fetch clients", err));
    }
  }, [open]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      clientId: "",
      address: { street: "", city: "", state: "", zipCode: "", country: "India" },
      contact: { phone: "", email: "", managerName: "" },
      compliance: { gstNumber: "", fssaiNumber: "" }
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      const createRes = await adminService.createRestaurant(values);
      
      // Since backend createRestaurant drops extra fields, immediately update it
      const newRestaurantId = createRes?.data?.restaurant?._id;
      if (newRestaurantId) {
        await adminService.updateRestaurant(newRestaurantId, values);
      }
      
      toast({ title: "Success", description: "Restaurant created successfully." });
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to create restaurant" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-800/50 max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <Store className="w-8 h-8 text-white" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold">New Restaurant</DialogTitle>
            <DialogDescription className="text-blue-100 text-sm mt-1">
              Create a new restaurant branch for a client.
            </DialogDescription>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">Assign to Client <span className="text-rose-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-card text-card-foreground">
                          <SelectValue placeholder="Select a client..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client._id} value={client._id}>
                            {client.contactName} ({client.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">Restaurant Name <span className="text-rose-500">*</span></FormLabel>
                    <FormControl>
                      <Input className="bg-card text-card-foreground" placeholder="e.g. Downtown Branch" {...field} />
                    </FormControl>
                    <FormMessage />
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
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
