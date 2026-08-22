"use client";

import { useState } from "react";
import { Plus, Users, Search, LayoutGrid, List, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddMasterUserDialog } from "@/components/admin/add-master-user-dialog";
import { EditMasterUserDialog } from "@/components/admin/edit-master-user-dialog";
import { MasterUserTable } from "@/components/admin/master-user-table";
import { MasterUserCard } from "@/components/admin/master-user-card";
import { adminService } from "@/services/admin.service";
import { useToast } from "@/components/ui/use-toast";
import { useAdminMasterUsers } from "@/hooks/queries/use-portal-queries";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAdminUsersView } from "@/store/portal-ui-slice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MasterUsersPage() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  
  // View State
  const viewMode = useAppSelector((state) => state.portalUi.adminUsersView);
  const usersQuery = useAdminMasterUsers();
  const users = usersQuery.data?.data?.users || [];
  const isLoading = usersQuery.isLoading || usersQuery.isFetching;

  // Data State
  const [search, setSearch] = useState("");
  
  // Dialog States
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  console.log(process.env.NEXT_PUBLIC_APP_URL);
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8678";

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`${appUrl}/admin-login`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Admin login URL copied to clipboard.",
    });
  };

  // Actions
  const handleEditClick = (user: any) => {
    setUserToEdit(user);
    setIsEditUserOpen(true);
  };

  const handleDeleteClick = (user: any) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await adminService.deleteMasterUser(userToDelete._id);
      toast({
        title: "Success",
        description: "Master User deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      usersQuery.refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Local filtering
  const filteredUsers = users.filter((u: any) =>
    u.contactName?.toLowerCase().includes(search.toLowerCase()) || 
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Management</h1>
          <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-sm font-medium text-blue-700">
            {users.length} master users
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsAddUserOpen(true)} className="rounded-full bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Master User
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card text-card-foreground p-4 shadow-sm">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Admin Portal Access</span>
          <span className="text-sm text-slate-500">Master Users can manage clients but cannot create other Master Users.</span>
        </div>
        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card text-card-foreground p-4 shadow-sm">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Admin Login URL</span>
          <span className="text-sm text-slate-500">{appUrl}/admin-login</span>
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

      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search team members..." 
                className="pl-9 rounded-full border-border bg-card text-card-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {search && (
              <Button variant="ghost" onClick={() => setSearch("")} className="text-slate-500 hover:text-foreground">
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center rounded-lg border border-border bg-card text-card-foreground p-1 shadow-sm">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => dispatch(setAdminUsersView("grid"))}
              className={`px-3 py-1.5 transition-all ${
                viewMode === "grid" ? "bg-slate-100 text-foreground shadow-sm" : "text-slate-500 hover:text-foreground"
              }`}
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => dispatch(setAdminUsersView("table"))}
              className={`px-3 py-1.5 transition-all ${
                viewMode === "table" ? "bg-slate-100 text-foreground shadow-sm" : "text-slate-500 hover:text-foreground"
              }`}
            >
              <List className="mr-2 h-4 w-4" />
              Table
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-card text-card-foreground">
            <span className="text-sm text-slate-500">Loading master users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card text-card-foreground gap-2 text-slate-500">
            <Users className="h-8 w-8 text-slate-300 mb-2" />
            <span className="text-sm">No master users found.</span>
            {search && <Button variant="link" onClick={() => setSearch("")}>Clear filters</Button>}
          </div>
        ) : viewMode === "table" ? (
          <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden p-2">
            {/* Added onEdit prop here (need to update table component too if missing) */}
            <MasterUserTable 
              users={filteredUsers} 
              onDelete={handleDeleteClick} 
              onEdit={handleEditClick} 
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUsers.map((user: any) => (
              <MasterUserCard 
                key={user._id} 
                user={user} 
                onDelete={handleDeleteClick} 
                onEdit={handleEditClick} 
              />
            ))}
          </div>
        )}
      </div>

      <AddMasterUserDialog 
        open={isAddUserOpen} 
        onOpenChange={setIsAddUserOpen} 
        onSuccess={() => usersQuery.refetch()}
      />

      <EditMasterUserDialog
        open={isEditUserOpen}
        onOpenChange={setIsEditUserOpen}
        user={userToEdit}
        onSuccess={() => usersQuery.refetch()}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the master user <strong>{userToDelete?.username}</strong>. 
              They will immediately lose access to the admin portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
