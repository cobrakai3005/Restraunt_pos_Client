"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, differenceInDays } from "date-fns";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { adminService } from "@/services/admin.service";
import { Calendar as CalendarIcon, Eye } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// List of all capabilities shown in UI
const ALL_CAPABILITIES = [
  { id: "sendInvoiceViaEmail", label: "Send Invoice via Email" },
  { id: "sendInvoiceViaWhatsApp", label: "Send Invoice via WhatsApp" },
  { id: "createUsers", label: "Create Users" },
  { id: "createCustomers", label: "Create Customers" },
  { id: "createProducts", label: "Create Products" },
  { id: "createCompanies", label: "Create Companies" },
  { id: "createDeliveryChallan", label: "Create Delivery Challan" },
  { id: "updateCompanies", label: "Update Companies" },
  { id: "manualInvoiceGeneration", label: "Manual Invoice Generation" },
];

const generalSchema = z.object({
  contactName: z.string().min(2, "Name must be at least 2 characters").max(120),
  username: z.string().min(4, "Username must be at least 4 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
});

interface EditClientDialogProps {
  client: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditClientDialog({ client, open, onOpenChange, onSuccess }: EditClientDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");

  // Permissions state
  const [maxCompanies, setMaxCompanies] = useState(client?.maxCompanies || 20);
  const [maxUsers, setMaxUsers] = useState(client?.maxUsers || 10);
  const [maxInventories, setMaxInventories] = useState(20); // Dummy default if not in schema
  
  const [capabilities, setCapabilities] = useState<Record<string, boolean>>({});

  // Validity state
  const [isActive, setIsActive] = useState(client?.isActive ?? true);
  const [validUntil, setValidUntil] = useState<Date | undefined>(
    client?.validUntil ? new Date(client.validUntil) : undefined
  );

  const form = useForm<z.infer<typeof generalSchema>>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      contactName: client?.contactName || "",
      username: client?.username || "",
      email: client?.email || "",
      phone: client?.phone || "",
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        contactName: client.contactName || "",
        username: client.username || "",
        email: client.email || "",
        phone: client.phone || "",
      });
      setMaxCompanies(client.maxCompanies || 0);
      setMaxUsers(client.maxUsers || 0);
      setIsActive(client.isActive ?? true);
      setValidUntil(client.validUntil ? new Date(client.validUntil) : undefined);

      // Map capabilities from backend
      const caps: Record<string, boolean> = {};
      ALL_CAPABILITIES.forEach(c => {
        if (c.id === "sendInvoiceViaEmail") caps[c.id] = client.permissions?.sendInvoiceViaEmail || false;
        else if (c.id === "sendInvoiceViaWhatsApp") caps[c.id] = client.permissions?.sendInvoiceViaWhatsApp || false;
        else caps[c.id] = client.extraCapabilities?.includes(c.id) || false;
      });
      setCapabilities(caps);
    }
  }, [client, form, open]);

  const handleToggleCapability = (id: string, checked: boolean) => {
    setCapabilities(prev => ({ ...prev, [id]: checked }));
  };

  const handleSaveGeneral = async (values: z.infer<typeof generalSchema>) => {
    await saveChanges(values);
  };

  const saveChanges = async (additionalData = {}) => {
    try {
      setIsSubmitting(true);

      // Pack capabilities for backend
      const extraCapabilities = ALL_CAPABILITIES
        .filter(c => c.id !== "sendInvoiceViaEmail" && c.id !== "sendInvoiceViaWhatsApp")
        .filter(c => capabilities[c.id])
        .map(c => c.id);

      const updateData = {
        ...additionalData,
        maxCompanies,
        maxUsers,
        permissions: {
          sendInvoiceViaEmail: capabilities["sendInvoiceViaEmail"] || false,
          sendInvoiceViaWhatsApp: capabilities["sendInvoiceViaWhatsApp"] || false,
        },
        extraCapabilities,
        isActive,
        validUntil: validUntil ? validUntil.toISOString() : undefined,
      };

      await adminService.updateClient(client._id, updateData);
      
      toast({
        title: "Success",
        description: "Client updated successfully.",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update client.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a new password." });
      return;
    }
    toast({
      title: "Action required",
      description: "Backend password reset API is not yet implemented.",
    });
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-slate-50 dark:bg-slate-800/50">
        <DialogHeader className="p-6 pb-4 bg-card text-card-foreground border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-2xl font-bold">Edit Client</DialogTitle>
          <DialogDescription className="text-base">
            Update the details for {client.username}.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 py-2 bg-card text-card-foreground border-b border-slate-100 dark:border-slate-800">
            <TabsList className="bg-slate-100 rounded-xl p-1 h-12">
              <TabsTrigger value="general" className="rounded-lg px-6 data-[state=active]:bg-card text-card-foreground data-[state=active]:shadow-sm">General</TabsTrigger>
              <TabsTrigger value="permissions" className="rounded-lg px-6 data-[state=active]:bg-card text-card-foreground data-[state=active]:shadow-sm">Permissions</TabsTrigger>
              <TabsTrigger value="validity" className="rounded-lg px-6 data-[state=active]:bg-card text-card-foreground data-[state=active]:shadow-sm">Validity</TabsTrigger>
              <TabsTrigger value="password" className="rounded-lg px-6 data-[state=active]:bg-card text-card-foreground data-[state=active]:shadow-sm">Password</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6 h-[400px] overflow-y-auto">
            {/* GENERAL TAB */}
            <TabsContent value="general" className="m-0 focus-visible:outline-none">
              <Form {...form}>
                <form id="general-form" onSubmit={form.handleSubmit(handleSaveGeneral)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Contact Name <span className="text-rose-500">*</span></FormLabel>
                          <FormControl>
                            <Input className="bg-card text-card-foreground" placeholder="test_client" {...field} />
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
                          <FormLabel className="text-slate-700">Username <span className="text-rose-500">*</span></FormLabel>
                          <FormControl>
                            <Input className="bg-card text-card-foreground" placeholder="test_client" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Email <span className="text-rose-500">*</span></FormLabel>
                          <FormControl>
                            <Input className="bg-card text-card-foreground" placeholder="testclient@gmail.com" {...field} />
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
                              <Input className="bg-card text-card-foreground rounded-l-none" placeholder="96859 68596" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* PERMISSIONS TAB */}
            <TabsContent value="permissions" className="m-0 space-y-6 focus-visible:outline-none">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Manage Permissions</h3>
                <p className="text-sm text-slate-500">Modify usage limits and feature access for this client.</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 tracking-wider">USAGE LIMITS</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center text-slate-700">
                      <span className="mr-2">🏢</span> Max Companies
                    </label>
                    <Input 
                      type="number" 
                      className="bg-card text-card-foreground" 
                      value={maxCompanies} 
                      onChange={(e) => setMaxCompanies(Number(e.target.value))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center text-slate-700">
                      <span className="mr-2">👥</span> Max Users
                    </label>
                    <Input 
                      type="number" 
                      className="bg-card text-card-foreground" 
                      value={maxUsers} 
                      onChange={(e) => setMaxUsers(Number(e.target.value))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center text-slate-700">
                      <span className="mr-2">📦</span> Max Inventories
                    </label>
                    <Input 
                      type="number" 
                      className="bg-card text-card-foreground" 
                      value={maxInventories} 
                      onChange={(e) => setMaxInventories(Number(e.target.value))} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="text-xs font-bold text-slate-500 tracking-wider">FEATURE ACCESS</h4>
                <div className="space-y-3">
                  {ALL_CAPABILITIES.map(cap => (
                    <div key={cap.id} className="flex items-center justify-between bg-card text-card-foreground border border-border rounded-xl p-4 shadow-sm">
                      <div className="flex items-center text-sm font-medium text-slate-700">
                        <span className="mr-3 text-slate-400">📄</span>
                        {cap.label}
                      </div>
                      <Switch 
                        checked={capabilities[cap.id] || false}
                        onCheckedChange={(c) => handleToggleCapability(cap.id, c)}
                        className="data-[state=checked]:bg-[#8b77ff]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* VALIDITY TAB */}
            <TabsContent value="validity" className="m-0 space-y-6 focus-visible:outline-none">
              <div className="bg-[#f8f9fe] border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">✨</span>
                    <h3 className="text-lg font-semibold text-foreground">Account Validity</h3>
                  </div>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center">
                    <span className="mr-1">✓</span> Active
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-card text-card-foreground rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="text-slate-400 text-sm flex items-center mb-2">
                      <CalendarIcon className="w-4 h-4 mr-2" /> Expires On
                    </div>
                    <div className="font-semibold text-foreground">
                      {validUntil ? format(validUntil, "d MMM yyyy, HH:mm") : "Never"}
                    </div>
                  </div>
                  <div className="bg-card text-card-foreground rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="text-slate-400 text-sm flex items-center mb-2">
                      ⏱ Days Left
                    </div>
                    <div className="font-semibold text-foreground">
                      {validUntil ? Math.max(0, differenceInDays(validUntil, new Date())) : "∞"}
                    </div>
                  </div>
                  <div className="bg-card text-card-foreground rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                    <div className="text-slate-400 text-sm flex items-center justify-between mb-2">
                      Account Status
                      <Switch 
                        checked={isActive} 
                        onCheckedChange={setIsActive}
                        className="data-[state=checked]:bg-[#8b77ff]"
                      />
                    </div>
                    <div className="font-semibold text-foreground flex items-center text-sm">
                      {isActive ? (
                        <><span className="text-emerald-500 mr-1">✓</span> Enabled</>
                      ) : (
                        <><span className="text-rose-500 mr-1">✕</span> Disabled</>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4">Set Exact Expiry</h4>
                  <div className="space-y-2 max-w-xs">
                    <label className="text-sm font-medium text-slate-700">Expiry date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-between text-left font-normal bg-card text-card-foreground",
                            !validUntil && "text-muted-foreground"
                          )}
                        >
                          {validUntil ? format(validUntil, "dd-MM-yyyy") : <span>dd-mm-yyyy</span>}
                          <CalendarIcon className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={validUntil}
                          onSelect={setValidUntil}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* PASSWORD TAB */}
            <TabsContent value="password" className="m-0 space-y-6 focus-visible:outline-none">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Reset Password</h3>
                <p className="text-sm text-slate-500">Set a new password for {client.username}. They will be notified of this change.</p>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-sm font-medium text-foreground">New Password</label>
                <div className="relative">
                  <Input 
                    type="password"
                    placeholder="Enter new password" 
                    className="bg-card text-card-foreground pr-10" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <Eye className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 cursor-pointer" />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleResetPassword}
                  className="w-full bg-[#bfa8ff] hover:bg-[#a68cff] text-white rounded-xl py-6"
                >
                  Reset Password
                </Button>
              </div>
            </TabsContent>
          </div>

          <div className="px-6 py-4 bg-card text-card-foreground border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 rounded-b-lg">
            {activeTab !== "password" && (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-border">
                  Cancel
                </Button>
                {activeTab === "general" ? (
                  <Button type="submit" form="general-form" disabled={isSubmitting} className="rounded-xl bg-[#8b77ff] hover:bg-[#725df2]">
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                ) : (
                  <Button onClick={() => saveChanges()} disabled={isSubmitting} className="rounded-xl bg-[#8b77ff] hover:bg-[#725df2]">
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
