"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Rocket, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Target,
  Loader2
} from "lucide-react";

const statusOptions = [
  "Draft",
  "Started",
  "InProgress",
  "Completed",
  "Cancelled",
  "Delivered",
] as const;

type StatusType = typeof statusOptions[number];

const statusConfig: Record<StatusType, { label: string; className: string; icon: React.ReactNode }> = {
  Draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-border dark:bg-slate-800/70 dark:text-slate-200 dark:border-slate-700/80",
    icon: <FileText className="h-3 w-3" />
  },
  Started: {
    label: "Started",
    className: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 border-blue-200 dark:border-blue-800 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-400/25",
    icon: <Rocket className="h-3 w-3" />
  },
  InProgress: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/25",
    icon: <Zap className="h-3 w-3" />
  },
  Completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/25",
    icon: <CheckCircle className="h-3 w-3" />
  },
  Cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-200 dark:border-red-400/25",
    icon: <XCircle className="h-3 w-3" />
  },
  Delivered: {
    label: "Delivered",
    className: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-400/25",
    icon: <Target className="h-3 w-3" />
  }
};

interface StatusSelectProps {
  status: StatusType;
  tripId: string;
  onStatusChange: (tripId: string, newStatus: StatusType) => Promise<void>;
  disabled?: boolean;
}

// ✅ Memoize the StatusBadge component to prevent unnecessary re-renders
const StatusBadge = React.memo(({ status, isUpdating }: { status: StatusType; isUpdating: boolean }) => {
  const config = statusConfig[status] || statusConfig.Draft;
  
  if (isUpdating) {
    return (
      <Badge 
        variant="outline" 
        className="flex h-7 min-w-[98px] items-center justify-center gap-1.5 rounded-full border border-border bg-slate-100 px-2.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-200"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Updating...
      </Badge>
    );
  }
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.className} flex h-7 min-w-[98px] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[11px] font-semibold leading-none shadow-none transition-colors hover:brightness-105 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

// ✅ Memoize the StatusSelect component
export const StatusSelect = React.memo(function StatusSelect({ 
  status, 
  tripId, 
  onStatusChange, 
  disabled = false 
}: StatusSelectProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<StatusType>(status);
  const [isOpen, setIsOpen] = React.useState(false);

  // ✅ Update currentStatus when prop changes
  React.useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const handleStatusChange = React.useCallback(async (newStatus: StatusType) => {
    if (newStatus === currentStatus || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onStatusChange(tripId, newStatus);
      setCurrentStatus(newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  }, [tripId, currentStatus, isUpdating, onStatusChange]);

  // ✅ Memoize the select trigger content
  const triggerContent = React.useMemo(() => (
    <StatusBadge status={currentStatus} isUpdating={isUpdating} />
  ), [currentStatus, isUpdating]);

  // ✅ Memoize the select items
  const selectItems = React.useMemo(() => (
    <>
      {statusOptions.map((opt) => {
        const optConfig = statusConfig[opt];
        return (
          <SelectItem key={opt} value={opt} className="cursor-pointer">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground dark:text-slate-400">{optConfig.icon}</span>
              <span>{optConfig.label}</span>
            </div>
          </SelectItem>
        );
      })}
    </>
  ), []);

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={disabled || isUpdating}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger 
        className="h-8 w-auto min-w-[112px] rounded-full border-0 bg-transparent p-0 shadow-none hover:bg-transparent focus:ring-0 focus:ring-offset-0 dark:bg-transparent [&>svg]:ml-1 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-slate-400"
        onClick={(e) => e.stopPropagation()}
      >
        {triggerContent}
      </SelectTrigger>
      <SelectContent 
        onClick={(e) => e.stopPropagation()}
        className="min-w-[150px] rounded-lg border-border bg-card text-card-foreground p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        {selectItems}
      </SelectContent>
    </Select>
  );
});

// ✅ Add display name for better debugging
StatusSelect.displayName = 'StatusSelect';










// "use client";

// import React from "react";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { 
//   FileText, 
//   Rocket, 
//   Zap, 
//   CheckCircle, 
//   XCircle, 
//   Target,
//   Loader2
// } from "lucide-react";

// const statusOptions = [
//   "Draft",
//   "Started",
//   "InProgress",
//   "Completed",
//   "Cancelled",
//   "Delivered",
// ] as const;

// type StatusType = typeof statusOptions[number];

// const statusConfig: Record<StatusType, { label: string; className: string; icon: React.ReactNode }> = {
//   Draft: {
//     label: "Draft",
//     className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
//     icon: <FileText className="h-3 w-3" />
//   },
//   Started: {
//     label: "Started",
//     className: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 border-blue-200 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
//     icon: <Rocket className="h-3 w-3" />
//   },
//   InProgress: {
//     label: "In Progress",
//     className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800",
//     icon: <Zap className="h-3 w-3" />
//   },
//   Completed: {
//     label: "Completed",
//     className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
//     icon: <CheckCircle className="h-3 w-3" />
//   },
//   Cancelled: {
//     label: "Cancelled",
//     className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
//     icon: <XCircle className="h-3 w-3" />
//   },
//   Delivered: {
//     label: "Delivered",
//     className: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800",
//     icon: <Target className="h-3 w-3" />
//   }
// };

// interface StatusSelectProps {
//   status: StatusType;
//   tripId: string;
//   onStatusChange: (tripId: string, newStatus: StatusType) => Promise<void>;
//   disabled?: boolean;
// }

// export function StatusSelect({ status, tripId, onStatusChange, disabled = false }: StatusSelectProps) {
//   const [isUpdating, setIsUpdating] = React.useState(false);
//   const [currentStatus, setCurrentStatus] = React.useState<StatusType>(status);
//   const [isOpen, setIsOpen] = React.useState(false);

//   const config = statusConfig[currentStatus] || statusConfig.Draft;

//   const handleStatusChange = async (newStatus: StatusType) => {
//     if (newStatus === currentStatus) return;
    
//     setIsUpdating(true);
//     try {
//       await onStatusChange(tripId, newStatus);
//       setCurrentStatus(newStatus);
//       // Show success toast or feedback
//     } catch (error) {
//       console.error("Failed to update status:", error);
//       // Show error toast
//     } finally {
//       setIsUpdating(false);
//       setIsOpen(false);
//     }
//   };

//   return (
//     <Select
//       value={currentStatus}
//       onValueChange={(value) => handleStatusChange(value as StatusType)}
//       disabled={disabled || isUpdating}
//       open={isOpen}
//       onOpenChange={setIsOpen}
//     >
//       <SelectTrigger 
//         className="w-auto min-w-[110px] border-0 p-0 focus:ring-0 focus:ring-offset-0"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="flex items-center gap-1">
//           {isUpdating ? (
//             <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
//           ) : (
//             <Badge 
//               variant="outline" 
//               className={`${config.className} flex w-fit items-center gap-1 border px-3 py-1 font-medium cursor-pointer hover:opacity-80 transition-opacity`}
//             >
//               {config.icon}
//               {config.label}
//             </Badge>
//           )}
//         </div>
//       </SelectTrigger>
//       <SelectContent 
//         onClick={(e) => e.stopPropagation()}
//         className="min-w-[140px]"
//       >
//         {statusOptions.map((opt) => {
//           const optConfig = statusConfig[opt];
//           return (
//             <SelectItem key={opt} value={opt} className="cursor-pointer">
//               <div className="flex items-center gap-2">
//                 <span className="text-muted-foreground">{optConfig.icon}</span>
//                 <span>{optConfig.label}</span>
//               </div>
//             </SelectItem>
//           );
//         })}
//       </SelectContent>
//     </Select>
//   );
// }
