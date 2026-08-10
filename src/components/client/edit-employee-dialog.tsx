"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { clientService } from "@/services/client.service";

const formSchema = z.object({
  contactName: z.string().min(2, "Name must be at least 2 characters").max(120),
  username: z.string().min(4, "Username must be at least 4 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().optional(),
  role: z.enum(["CASHIER", "CHEF", "WAITER", "MANAGER", "INVENTORY_MANAGER"]),
  restaurantId: z.string().optional(),
  posPin: z.string().optional(),
  station: z.enum(["BAR", "TANDOOR", "GRILL", "MAIN_KITCHEN", "BAKERY", "COLD_KITCHEN"]).optional(),
  isActive: z.boolean().optional(),
});

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: any;
  onSuccess: () => void;
}

export function EditEmployeeDialog({ open, onOpenChange, employee, onSuccess }: EditEmployeeDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      clientService.getRestaurants().then(res => {
        if (res.success) {
          setRestaurants(res.data.restaurants || []);
        }
      });
    }
  }, [open]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      role: "CASHIER",
      restaurantId: "",
      posPin: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (employee && open) {
      form.reset({
        contactName: employee.contactName || "",
        username: employee.username || "",
        email: employee.email || "",
        phone: employee.phone || "",
        password: "", // blank so we don't send unless changing
        role: employee.role || "CASHIER",
        restaurantId: employee.restaurantId || "",
        posPin: employee.posPin || "",
        station: employee.station || undefined,
        isActive: employee.isActive ?? true,
      });
    }
  }, [employee, open, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!employee) return;
    try {
      setIsSubmitting(true);
      // Clean up values
      const submitData: any = { ...values };
      if (!submitData.password) {
        delete submitData.password;
      }
      
      await clientService.updateEmployee(employee._id, submitData);
      toast({
        title: "Success",
        description: "Employee updated successfully.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update employee.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Modify this employee's details, role, or branch assignment.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Change Password (Optional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CASHIER">Cashier</SelectItem>
                        <SelectItem value="CHEF">Chef</SelectItem>
                        <SelectItem value="WAITER">Waiter</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="INVENTORY_MANAGER">Inventory Manager</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="restaurantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign to branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No branch assigned</SelectItem>
                        {restaurants.map(r => (
                          <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {form.watch("role") === "CHEF" && (
              <FormField
                control={form.control}
                name="station"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Station (For Chefs)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select station" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BAR">Bar</SelectItem>
                        <SelectItem value="TANDOOR">Tandoor</SelectItem>
                        <SelectItem value="GRILL">Grill</SelectItem>
                        <SelectItem value="MAIN_KITCHEN">Main Kitchen</SelectItem>
                        <SelectItem value="BAKERY">Bakery</SelectItem>
                        <SelectItem value="COLD_KITCHEN">Cold Kitchen</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="posPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>POS PIN (4-digit)</FormLabel>
                    <FormControl>
                      <Input type="password" maxLength={4} placeholder="1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-8 h-10">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Active</FormLabel>
                    </div>
                    <FormControl>
                      <input type="checkbox" className="h-4 w-4" checked={field.value} onChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
