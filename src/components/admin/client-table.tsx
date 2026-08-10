import { MoreVertical, User, Phone, Mail, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientTableProps {
  clients: any[];
  onEdit?: (client: any) => void;
}

export function ClientTable({ clients, onEdit }: ClientTableProps) {
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
          {clients.map((client) => {
            const initials = client.contactName?.substring(0, 2).toUpperCase() || "CL";
            return (
              <tr key={client._id} className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-4 pl-6 pr-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-sm font-semibold text-purple-700">
                      {initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{client.contactName}</span>
                      <span className="text-xs text-slate-500">Client portal ready</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center text-slate-600">
                    <User className="mr-2 h-4 w-4 text-purple-400" />
                    {client.username}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center text-slate-600">
                    <Mail className="mr-2 h-4 w-4 text-blue-400" />
                    {client.email}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center text-slate-600">
                    <span className="flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      <Phone className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                      {client.phone || "N/A"}
                    </span>
                  </div>
                </td>
                <td className="py-4 pr-6 pl-4 text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100"
                    onClick={() => onEdit?.(client)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
