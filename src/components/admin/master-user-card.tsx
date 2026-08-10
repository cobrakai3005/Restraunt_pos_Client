import { User, Phone, Mail, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MasterUserCardProps {
  user: any;
  onEdit?: (user: any) => void;
  onDelete?: (user: any) => void;
}

export function MasterUserCard({ user, onEdit, onDelete }: MasterUserCardProps) {
  const initials = user.contactName?.substring(0, 2).toUpperCase() || "MU";

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 font-bold text-blue-700">
              {initials}
            </div>
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">{user.contactName}</h3>
              <p className="flex items-center gap-1 text-sm text-slate-500">
                <User className="h-3.5 w-3.5 text-blue-400" />
                {user.username}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center text-sm text-slate-600">
            <Mail className="mr-3 h-4 w-4 text-orange-400" />
            <span className="line-clamp-1">{user.email}</span>
          </div>
          <div className="flex items-center text-sm text-slate-600">
            <Phone className="mr-3 h-4 w-4 text-green-500" />
            <span>{user.phone || "N/A"}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 rounded-full text-blue-600 hover:bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-300"
          onClick={() => onEdit?.(user)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full text-rose-400 hover:bg-rose-50 hover:text-rose-600 h-9 w-9"
          onClick={() => onDelete?.(user)}
          title="Delete Master User"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
