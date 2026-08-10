"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, CheckCircle2, Circle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { taskService } from "@/services/task.service";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EditTaskDialog } from "./edit-task-dialog";
import { Badge } from "@/components/ui/badge";

export function TasksTab({ restaurantId }: { restaurantId: string }) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog Add State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", status: "pending", priority: "medium", isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const res = await taskService.getTasks(restaurantId);
      if (res.success) setTasks(res.data || []);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load tasks", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) fetchTasks();
  }, [restaurantId]);

  const handleAdd = async () => {
    if (!formData.title.trim()) return;
    try {
      setIsSubmitting(true);
      await taskService.createTask(restaurantId, formData);
      toast({ title: "Success", description: "Task added" });
      setFormData({ title: "", description: "", status: "pending", priority: "medium", isActive: true });
      setIsAddOpen(false);
      fetchTasks();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to create task", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await taskService.deleteTask(restaurantId, id);
      toast({ title: "Success", description: "Task deleted" });
      fetchTasks();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to delete task", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading tasks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Tasks</h3>
        <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(task => (
          <div key={task._id} className={`group flex flex-col p-4 bg-card text-card-foreground border border-border rounded-2xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all ${!task.isActive ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {task.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : task.status === "in-progress" ? <Clock className="w-5 h-5 text-amber-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">{task.title}</h4>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => { setSelectedTask(task); setIsEditOpen(true); }} className="h-6 w-6 text-slate-400 hover:text-blue-500">
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(task._id)} className="h-6 w-6 text-slate-400 hover:text-rose-500">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{task.description}</p>
            
            <div className="flex items-center gap-2 mt-auto">
              <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"}>
                {task.priority}
              </Badge>
              <Badge variant="outline" className={task.status === 'completed' ? 'border-green-200 text-green-700' : task.status === 'in-progress' ? 'border-amber-200 text-amber-700' : ''}>
                {task.status.replace('-', ' ')}
              </Badge>
              {!task.isActive && <Badge variant="outline" className="ml-auto opacity-50">Inactive</Badge>}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-500 border border-dashed rounded-xl border-border">
            No tasks created yet.
          </div>
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="mb-2 block">Task Title <span className="text-rose-500">*</span></Label>
              <Input placeholder="What needs to be done?" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div>
              <Label className="mb-2 block">Description</Label>
              <Textarea placeholder="Add some details..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Priority</Label>
                <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 mt-2">
              <Label>Active Status</Label>
              <Switch 
                checked={formData.isActive}
                onCheckedChange={c => setFormData({...formData, isActive: c})}
              />
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={isSubmitting || !formData.title.trim()}>{isSubmitting ? "Saving..." : "Save Task"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditTaskDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        restaurantId={restaurantId} 
        task={selectedTask} 
        onSuccess={fetchTasks} 
      />
    </div>
  );
}
