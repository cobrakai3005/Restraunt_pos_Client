import { MoreVertical, User, Phone, Calendar, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientCardProps {
  client: any;
  onEdit?: (client: any) => void;
  onViewAnalytics?: (client: any) => void;
}

export function ClientCard({ client, onEdit, onViewAnalytics }: ClientCardProps) {
  const initials = client.contactName?.substring(0, 2).toUpperCase() || "CL";
  const joinedDate = new Date(client.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col rounded-3xl border border-purple-100 dark:border-purple-900/50 bg-card text-card-foreground p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-lg font-semibold text-purple-700">
            {initials}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{client.contactName}</h3>
            <p className="flex items-center text-sm text-slate-500">
              <span className="mr-2 text-blue-500">✉</span> {client.email}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-slate-500">
            <User className="mr-3 h-4 w-4 text-purple-400" />
            <span className="font-semibold tracking-wider text-xs text-slate-500">USERNAME</span>
          </div>
          <span className="font-semibold text-foreground">{client.username}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-slate-500">
            <Phone className="mr-3 h-4 w-4 text-green-400" />
            <span className="font-semibold tracking-wider text-xs text-slate-500">PHONE</span>
          </div>
          <span className="font-semibold text-foreground">{client.phone || "N/A"}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-slate-500">
            <Calendar className="mr-3 h-4 w-4 text-orange-400" />
            <span className="font-semibold tracking-wider text-xs text-slate-500">JOINED</span>
          </div>
          <span className="font-semibold text-foreground">{joinedDate}</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          className="rounded-full border-border text-slate-600 hover:bg-slate-50 dark:bg-slate-800/50 hover:text-foreground"
          onClick={() => onViewAnalytics?.(client)}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Analytics
        </Button>
        <Button 
          variant="outline" 
          className="rounded-full border-purple-100 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-900/20 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30"
          onClick={() => onEdit?.(client)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>
    </div>
  );
}
