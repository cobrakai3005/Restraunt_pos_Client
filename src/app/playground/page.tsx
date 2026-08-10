"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const rows = [
  { reference: "DEMO-001", category: "Category A", amount: "₹12,500", status: "Pending" },
  { reference: "DEMO-002", category: "Category B", amount: "₹18,500", status: "Completed" },
  { reference: "DEMO-003", category: "Category C", amount: "₹9,200", status: "Draft" },
];

export default function PlaygroundPage() {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">UI Component Playground</h1>
          <p className="text-muted-foreground">
            These are the original reusable components copied from the Vinimay repository.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Open Original Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Example dialog</DialogTitle>
              <DialogDescription>This uses the copied dialog component without business logic.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="dialog-name">Name</Label>
              <Input id="dialog-name" placeholder="Enter a generic value" />
            </div>
            <DialogFooter><Button type="button">Save example</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <AlertTitle>Sanitized repository</AlertTitle>
        <AlertDescription>
          Production pages, actual navigation labels, API URLs, permissions and business state were intentionally excluded.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="components" className="space-y-4">
        <TabsList>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="states">States</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Form controls</CardTitle>
                <CardDescription>Original input, select, checkbox, switch and textarea components.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="example-name">Example name</Label>
                  <Input id="example-name" placeholder="Type here" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">Category A</SelectItem>
                      <SelectItem value="b">Category B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Generic notes" />
                </div>
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="example-switch">Example setting</Label>
                    <p className="text-sm text-muted-foreground">Demonstrates the original switch styling.</p>
                  </div>
                  <Switch id="example-switch" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="example-check" />
                  <Label htmlFor="example-check">I understand the shared component pattern</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Table structure</CardTitle>
                <CardDescription>Only invented onboarding data is used.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search demo rows" />
                </div>
                <div className="rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.reference}>
                          <TableCell className="font-medium">{row.reference}</TableCell>
                          <TableCell>{row.category}</TableCell>
                          <TableCell>{row.amount}</TableCell>
                          <TableCell>
                            <Badge variant={row.status === "Completed" ? "default" : "secondary"}>{row.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Overlay components</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Sheet>
                <SheetTrigger asChild><Button variant="outline">Open original sheet</Button></SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Example sheet</SheetTitle>
                    <SheetDescription>The component is copied directly from the source repository.</SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>
              <Button
                variant="outline"
                onClick={() => toast({ title: "Original toast component", description: "The action is local to the starter." })}
              >
                Show toast
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="states">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-base">Loading state</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-9 w-1/2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Empty state</CardTitle></CardHeader>
              <CardContent className="flex min-h-36 items-center justify-center text-center text-sm text-muted-foreground">
                No demo records available.
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Error state</CardTitle></CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertTitle>Example error</AlertTitle>
                  <AlertDescription>No real API request was made.</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
