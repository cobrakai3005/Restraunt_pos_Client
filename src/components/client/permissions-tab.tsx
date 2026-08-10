"use client";

import { useEffect, useState } from "react";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authService, User } from "@/services/auth.service";

// Extending the User interface to include the limits and permissions from the backend
interface ExtendedUser extends User {
  maxCompanies?: number;
  maxUsers?: number;
  permissions?: {
    sendInvoiceViaEmail: boolean;
    sendInvoiceViaWhatsApp: boolean;
  };
}

export function PermissionsTab() {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authService.getMe();
      setUser(data);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Loading permissions...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500 flex-col">
        <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
        <p>Could not load permissions profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-500">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-slate-900 dark:text-white">Plan & Permissions</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Your current feature access, team allowances, and plan limits.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800/50">
              Active Plan
            </span>
            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/50">
              Support Active
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-8">
          {/* Usage Limits */}
          <section>
            <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Usage Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {user.maxCompanies || 0}
                  </div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Max Companies</div>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {user.maxUsers || 0}
                  </div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Max Users</div>
                </div>
              </div>

              {/* Note: maxInventories is not currently in the backend schema, we mock this based on the UI screenshot */}
              <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    Unlimited
                  </div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Max Inventories</div>
                </div>
              </div>
            </div>
          </section>

          {/* Feature Access */}
          <section>
            <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Feature Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M16 11h6"/></svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Create Users</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Available in your current plan.</p>
                  </div>
                </div>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4 mr-1" /> Enabled
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Create Customers</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Available in your current plan.</p>
                  </div>
                </div>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4 mr-1" /> Enabled
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Create Vendors</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Available in your current plan.</p>
                  </div>
                </div>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4 mr-1" /> Enabled
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Create Products</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Available in your current plan.</p>
                  </div>
                </div>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4 mr-1" /> Enabled
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Send Invoices via Email</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Toggle this in your permissions.</p>
                  </div>
                </div>
                {user.permissions?.sendInvoiceViaEmail ? (
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                    <ShieldCheck className="w-4 h-4 mr-1" /> Enabled
                  </div>
                ) : (
                  <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    <ShieldAlert className="w-4 h-4 mr-1" /> Disabled
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Send Invoices via WhatsApp</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Toggle this in your permissions.</p>
                  </div>
                </div>
                {user.permissions?.sendInvoiceViaWhatsApp ? (
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                    <ShieldCheck className="w-4 h-4 mr-1" /> Enabled
                  </div>
                ) : (
                  <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    <ShieldAlert className="w-4 h-4 mr-1" /> Disabled
                  </div>
                )}
              </div>

            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
