import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { bankService, BankDetail } from "@/services/bank.service";
import { AddBankDialog } from "./add-bank-dialog";
import { toast } from "@/components/ui/use-toast";

export function BanksTab({ restaurantId }: { restaurantId: string }) {
  const [banks, setBanks] = useState<BankDetail[]>([]);

  const fetchBanks = async () => {
    try {
      const res = await bankService.getBankDetails({}, restaurantId);
      const list = Array.isArray(res) ? res : res.data || (res as any).banks || [];
      setBanks(list);
    } catch (error) {
      console.error("Failed to fetch banks", error);
    }
  };

  useEffect(() => {
    if (restaurantId) fetchBanks();
  }, [restaurantId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bank detail?")) return;
    try {
      await bankService.deleteBankDetail(id, restaurantId);
      toast({ title: "Deleted", description: "Bank detail deleted successfully." });
      fetchBanks();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to delete.", variant: "destructive" });
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            Manage Bank Details
            <span className="text-sm font-normal px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{banks.length} bank accounts</span>
          </CardTitle>
        </div>
        <AddBankDialog restaurantId={restaurantId} onSuccess={fetchBanks} />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead>Bank Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Account Number</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-32 text-slate-500">
                  No bank details found.
                </TableCell>
              </TableRow>
            ) : (
              banks.map((bank) => (
                <TableRow key={bank._id}>
                  <TableCell className="font-medium">{bank.bankName}</TableCell>
                  <TableCell>{bank.companyId && typeof bank.companyId === 'object' ? (bank.companyId as any).name : 'Unknown'}</TableCell>
                  <TableCell>{bank.accountNumber}</TableCell>
                  <TableCell>{bank.branchAddress || bank.city || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <AddBankDialog 
                        restaurantId={restaurantId} 
                        onSuccess={fetchBanks} 
                        bankToEdit={bank}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(bank._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
