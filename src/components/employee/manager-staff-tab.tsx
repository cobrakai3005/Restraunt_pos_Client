"use client";
import React, { useEffect, useState } from "react";
import { 
  Users, 
  ChefHat, 
  CreditCard, 
  UserCheck, 
  Search, 
  RefreshCw,
  BadgeAlert
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { employeeService } from "@/services/employee.service";

function StaffSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header bar skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-2">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Role filter pills */}
          <div className="flex gap-1 p-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-10 w-44 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>

      {/* Staff cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ManagerStaffTab() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const extractArray = (res: any, key?: string) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (key && Array.isArray(res.data?.[key])) return res.data[key];
    if (key && Array.isArray(res[key])) return res[key];
    return [];
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await employeeService.getEmployees();
      setEmployees(extractArray(res, "employees"));
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const safeStaffList = Array.isArray(employees) ? employees : [];
  const filteredStaff = safeStaffList.filter(emp => {
    if (roleFilter !== "ALL" && emp.role !== roleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = emp.contactName?.toLowerCase().includes(q) || emp.username?.toLowerCase().includes(q);
      const matchEmail = emp.email?.toLowerCase().includes(q);
      return matchName || matchEmail;
    }
    return true;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "CHEF": return <ChefHat className="h-4 w-4 text-orange-500" />;
      case "CASHIER": return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case "WAITER": return <Users className="h-4 w-4 text-blue-500" />;
      default: return <UserCheck className="h-4 w-4 text-purple-500" />;
    }
  };

  if (loading) return <StaffSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-500" /> Staff    </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
            Active team roster
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filters */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-sm">
            {["ALL", "WAITER", "CASHIER", "CHEF", "MANAGER"].map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  roleFilter === role
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {role === "ALL" ? `All (${employees.length})` : role}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search staff name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-44 sm:w-56 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-xs rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchStaff}
            disabled={loading}
            className="rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Users className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 opacity-60" />
          <p className="font-bold text-slate-700 dark:text-slate-200">No staff members match the filter criteria.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredStaff.map(emp => (
            <Card
              key={emp._id}
              className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-sm flex items-center justify-center border border-indigo-500/20">
                      {emp.contactName?.slice(0, 2).toUpperCase() || "ST"}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">{emp.contactName}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">@{emp.username}</p>
                    </div>
                  </div>

                  <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-[10px] font-bold flex items-center gap-1">
                    {getRoleIcon(emp.role)} {emp.role}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Station / Section:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                    {emp.station || emp.section || "General"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
