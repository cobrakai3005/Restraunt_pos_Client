import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { bankService } from "@/services/bank.service";
import { vendorService, Vendor } from "@/services/vendor.service";
import { clientService } from "@/services/client.service";

interface AddBankDialogProps {
  restaurantId: string;
  onSuccess: () => void;
  bankToEdit?: any;
  trigger?: React.ReactNode;
}

export function AddBankDialog({ restaurantId, onSuccess, bankToEdit, trigger }: AddBankDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [formData, setFormData] = useState({
    companyId: bankToEdit?.companyId?._id || bankToEdit?.companyId || "",
    bankName: bankToEdit?.bankName || "",
    accountNumber: bankToEdit?.accountNumber || "",
    ifscCode: bankToEdit?.ifscCode || "",
    city: bankToEdit?.city || "",
    branchAddress: bankToEdit?.branchAddress || "",
    upiId: bankToEdit?.upiId || "",
    upiName: bankToEdit?.upiName || "",
    upiMobile: bankToEdit?.upiMobile || "",
  });

  // Update formData when bankToEdit changes
  useEffect(() => {
    if (bankToEdit) {
      setFormData({
        companyId: bankToEdit.companyId?._id || bankToEdit.companyId || "",
        bankName: bankToEdit.bankName || "",
        accountNumber: bankToEdit.accountNumber || "",
        ifscCode: bankToEdit.ifscCode || "",
        city: bankToEdit.city || "",
        branchAddress: bankToEdit.branchAddress || "",
        upiId: bankToEdit.upiId || "",
        upiName: bankToEdit.upiName || "",
        upiMobile: bankToEdit.upiMobile || "",
      });
    }
  }, [bankToEdit]);

  useEffect(() => {
    if (open && restaurantId) {
      clientService.getRestaurantById(restaurantId)
        .then((restRes: any) => {
          const rest = restRes?.data?.restaurant || restRes?.data || restRes;
          if (rest && rest._id) {
            setVendors([{ _id: rest._id, name: rest.name + " (My Restaurant)" } as Vendor]);
            if (!bankToEdit) {
              setFormData(prev => ({ ...prev, companyId: rest._id }));
            }
          } else {
            setVendors([]);
          }
        })
        .catch(console.error);
    }
  }, [open, restaurantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyId || !formData.bankName || !formData.accountNumber || !formData.ifscCode) {
      toast({ title: "Error", description: "Company, Bank Name, Account Number and IFSC are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (bankToEdit) {
        await bankService.updateBankDetail(bankToEdit._id, formData, restaurantId);
        toast({ title: "Success", description: "Bank detail updated successfully." });
      } else {
        await bankService.createBankDetail({ ...formData, restaurantId }, restaurantId);
        toast({ title: "Success", description: "Bank detail added successfully." });
      }
      setOpen(false);
      if (!bankToEdit) {
        setFormData({
          companyId: vendors.length > 0 ? vendors[0]._id : "",
          bankName: "",
          accountNumber: "",
          ifscCode: "",
          city: "",
          branchAddress: "",
          upiId: "",
          upiName: "",
          upiMobile: "",
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to add bank detail.",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Bank Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{bankToEdit ? "Edit Bank Detail" : "Create New Bank Detail"}</DialogTitle>
            <DialogDescription>
              {bankToEdit ? "Update your bank detail below." : "Fill in the form to add a new bank detail."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Company *</Label>
              <Select value={formData.companyId} onValueChange={(v) => setFormData({ ...formData, companyId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor._id} value={vendor._id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Bank Name *</Label>
              <Input
                placeholder="e.g. State Bank of India"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Input
                placeholder="e.g. New York"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Account Number *</Label>
              <Input
                placeholder="e.g. 123456789012"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>IFSC Code *</Label>
              <Input
                placeholder="e.g. SBIN0123456"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Branch Address</Label>
              <Input
                placeholder="e.g. 123 Main St"
                value={formData.branchAddress}
                onChange={(e) => setFormData({ ...formData, branchAddress: e.target.value })}
              />
            </div>
            
            <div className="col-span-2 grid grid-cols-3 gap-4 pt-2 border-t mt-2">
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input
                  placeholder="e.g. user@bank"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>UPI Name</Label>
                <Input
                  placeholder="e.g. John Doe"
                  value={formData.upiName}
                  onChange={(e) => setFormData({ ...formData, upiName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>UPI Mobile</Label>
                <Input
                  placeholder="e.g. 9876543210"
                  value={formData.upiMobile}
                  onChange={(e) => setFormData({ ...formData, upiMobile: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Saving..." : (bankToEdit ? "Update Bank Detail" : "Create Bank Detail")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
