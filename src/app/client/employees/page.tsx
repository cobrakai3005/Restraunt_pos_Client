"use client";

import { useEffect, useState } from "react";
import { Plus, UserSquare2, Mail, Phone, Pencil, Trash2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientService } from "@/services/client.service";
import { useToast } from "@/components/ui/use-toast";
import { AddEmployeeDialog } from "@/components/client/add-employee-dialog";
import { EditEmployeeDialog } from "@/components/client/edit-employee-dialog";

export default function EmployeesPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8678";

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`${appUrl}/employee-login`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Employee login URL copied to clipboard.",
    });
  };

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const res = await clientService.getEmployees();
      if (res.success) {
        setEmployees(res.data.employees || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load employees.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      await clientService.deleteEmployee(id);
      toast({ title: "Success", description: "Employee deleted." });
      fetchEmployees();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to delete employee" });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "MANAGER": return "bg-rose-100 text-rose-700 border-rose-200";
      case "CHEF": return "bg-orange-100 text-orange-700 border-orange-200";
      case "CASHIER": return "bg-green-100 text-green-700 border-green-200";
      case "WAITER": return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 border-blue-200 dark:border-blue-800";
      default: return "bg-slate-100 text-slate-700 border-border";
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Employees</h1>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            {employees.length} staff
          </span>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="rounded-full bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card text-card-foreground p-4 shadow-sm">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Employee Login URL</span>
          <span className="text-sm text-slate-500">{appUrl}/employee-login</span>
        </div>
        <Button 
          variant="outline" 
          className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:bg-blue-900/20"
          onClick={handleCopyUrl}
        >
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copied" : "Copy URL"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <span className="text-sm text-slate-500">Loading employees...</span>
        </div>
      ) : employees.length > 0 ? (
        <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card text-card-foreground p-2 shadow-sm">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold tracking-wider text-slate-500">
                <th className="py-4 pl-6 pr-4">EMPLOYEE</th>
                <th className="py-4 px-4">ROLE</th>
                <th className="py-4 px-4">EMAIL</th>
                <th className="py-4 px-4">PHONE</th>
                <th className="py-4 px-4">BRANCH</th>
                <th className="py-4 pr-6 pl-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.map((emp) => {
                const initials = emp.contactName?.substring(0, 2).toUpperCase() || "EM";
                return (
                  <tr key={emp._id} className={`group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!emp.isActive ? "opacity-60" : ""}`}>
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{emp.contactName} {emp.isActive === false && "(Inactive)"}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <UserSquare2 className="h-3 w-3" /> {emp.username}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleColor(emp.role)}`}>
                        {emp.role} {emp.station && `- ${emp.station}`}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-slate-600">
                        <Mail className="mr-2 h-4 w-4 text-slate-400" />
                        {emp.email}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-slate-600">
                        <Phone className="mr-2 h-4 w-4 text-slate-400" />
                        {emp.phone || "N/A"}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium text-slate-700">
                        {emp.restaurantId ? `Branch ${emp.restaurantId.substring(emp.restaurantId.length - 4)}` : "Unassigned"}
                      </span>
                    </td>
                    <td className="py-4 pr-6 pl-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedEmployee(emp); setIsEditOpen(true); }} className="h-8 w-8 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(emp._id)} className="h-8 w-8 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card text-card-foreground gap-2">
          <span className="text-sm text-slate-500">You haven't added any employees yet.</span>
          <Button variant="link" onClick={() => setIsAddOpen(true)}>Add your first employee</Button>
        </div>
      )}

      <AddEmployeeDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        onSuccess={fetchEmployees}
      />

      <EditEmployeeDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        employee={selectedEmployee}
        onSuccess={fetchEmployees}
      />
    </div>
  );
}
