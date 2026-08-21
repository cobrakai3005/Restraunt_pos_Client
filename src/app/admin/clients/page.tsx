"use client";

import { useState, useEffect } from "react";
import { Plus, LayoutGrid, List as ListIcon, Search, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddClientDialog } from "@/components/admin/add-client-dialog";
import { EditClientDialog } from "@/components/admin/edit-client-dialog";
import { ClientCard } from "@/components/admin/client-card";
import { ClientTable } from "@/components/admin/client-table";
import { adminService } from "@/services/admin.service";
import { useToast } from "@/components/ui/use-toast";

export default function ClientManagementPage() {
  const { toast } = useToast();
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setIsEditClientOpen(true);
  };

  const fetchClients = async (searchQuery?: string) => {
    try {
      setIsLoading(true);
      const res = await adminService.getAllClients(searchQuery);
      if (res.success) {
        setClients(res.data.clients || []);
      }
    } catch (error) {
      console.error("Failed to fetch clients", error);
      toast({
        title: "Error",
        description: "Failed to load clients.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400); // 400ms debounce
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchClients(debouncedSearch);
  }, [debouncedSearch]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8678";
  
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`${appUrl}/login`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Client login URL copied to clipboard.",
    });
  };

  // Backend handles search, no need for local filter logic
  const clearFilters = () => {
    setSearch("");
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Client Management</h1>
          <span className="rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-sm font-medium text-purple-700">
            {clients.length} clients
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsAddClientOpen(true)} className="rounded-full bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card text-card-foreground p-4 shadow-sm">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Client Login URL</span>
          <span className="text-sm text-slate-500">{appUrl}/login</span>
        </div>
        <Button 
          variant="outline" 
          className="rounded-full border-purple-200 text-purple-700 hover:bg-purple-50 dark:bg-purple-900/20"
          onClick={handleCopyUrl}
        >
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copied" : "Copy URL"}
        </Button>
      </div>

      <Tabs defaultValue="cards" className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search clients..." 
                className="pl-9 rounded-full border-border bg-card text-card-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {search && (
              <Button variant="ghost" onClick={clearFilters} className="text-slate-500 hover:text-foreground">
                Clear Filter
              </Button>
            )}
          </div>
          
          <TabsList className="grid w-fit grid-cols-2 rounded-full border border-border bg-card text-card-foreground p-1">
            <TabsTrigger value="cards" className="rounded-full data-[state=active]:bg-purple-50 dark:bg-purple-900/20 data-[state=active]:text-purple-700">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Cards
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-full data-[state=active]:bg-purple-50 dark:bg-purple-900/20 data-[state=active]:text-purple-700">
              <ListIcon className="mr-2 h-4 w-4" />
              List
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="cards" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <span className="text-sm text-slate-500">Loading clients...</span>
            </div>
          ) : clients.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {clients.map(client => (
                <ClientCard key={client._id} client={client} onEdit={handleEdit} />
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-border bg-card text-card-foreground">
              <span className="text-sm text-slate-500">No clients found matching your search.</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <span className="text-sm text-slate-500">Loading clients...</span>
            </div>
          ) : clients.length > 0 ? (
            <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden p-2">
              <ClientTable clients={clients} onEdit={handleEdit} />
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-border bg-card text-card-foreground">
              <span className="text-sm text-slate-500">No clients found matching your search.</span>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddClientDialog 
        open={isAddClientOpen} 
        onOpenChange={setIsAddClientOpen} 
        onSuccess={() => {
          fetchClients(); // refresh after add
        }}
      />

      <EditClientDialog
        open={isEditClientOpen}
        onOpenChange={setIsEditClientOpen}
        client={selectedClient}
        onSuccess={() => {
          setIsEditClientOpen(false);
          fetchClients(); // refresh after update
        }}
      />
    </div>
  );
}
