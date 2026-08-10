import { User, Phone, Mail, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MasterUserTableProps {
  users: any[];
  onDelete?: (user: any) => void;
  onEdit?: (user: any) => void;
}

export function MasterUserTable({ users, onDelete, onEdit }: MasterUserTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[800px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-semibold tracking-wider text-slate-500">
            <th className="py-4 pl-6 pr-4">CONTACT</th>
            <th className="py-4 px-4">USERNAME</th>
            <th className="py-4 px-4">EMAIL</th>
            <th className="py-4 px-4">PHONE</th>
            <th className="py-4 pr-6 pl-4 text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => {
            const initials = user.contactName?.substring(0, 2).toUpperCase() || "MU";
            return (
              <tr key={user._id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-4 pl-6 pr-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-sm font-semibold text-blue-700">
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{user.contactName}</span>
                      <span className="text-xs text-slate-500">Master User</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center text-slate-600">
                    <User className="mr-2 h-4 w-4 text-blue-400" />
                    {user.username}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center text-slate-600">
                    <Mail className="mr-2 h-4 w-4 text-orange-400" />
                    {user.email}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center text-slate-600">
                    <span className="flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      <Phone className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                      {user.phone || "N/A"}
                    </span>
                  </div>
                </td>
                <td className="py-4 pr-6 pl-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50 dark:bg-blue-900/20"
                      onClick={() => onEdit?.(user)}
                      title="Edit User"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => onDelete?.(user)}
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-slate-500">
                No master users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
