import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Maximize, RotateCcw, ScanLine, Copy, Trash2, CalendarIcon, PackageOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { transactionService, Transaction } from "@/services/transaction.service";
import { purchaseService } from "@/services/purchase.service";
import { vendorService, Vendor } from "@/services/vendor.service";
import { bankService, BankDetail } from "@/services/bank.service";
import { clientService } from "@/services/client.service";
import { customerService, Customer } from "@/services/customer.service";
import { inventoryService, InventoryItem } from "@/services/inventory.service";
import { menuService, MenuItem } from "@/services/menu.service";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Combobox } from "@/components/ui/combobox";
import { InvoicePreviewModal } from "./invoice-preview-modal";
import QuillEditor from "@/components/ui/quill-editor";
import { AddCustomerDialog } from "./add-customer-dialog";

interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId?: string;
  onSuccess: () => void;
  defaultTab?: "SALES" | "PURCHASE" | "RECEIPT" | "PAYMENT" | "JOURNAL" | "PROFORMA";
  initialData?: Transaction | null;
  allowedTypes?: Array<"SALES" | "PURCHASE" | "RECEIPT" | "PAYMENT" | "JOURNAL" | "PROFORMA">;
}

const defaultSalesDescription = "1. This invoice is valid for payment within 7 days from the date of issue.\n\n2. Thank you for your business! We appreciate your trust.\n\nHave a good day!";

const getDefaultDescription = (transactionType: string) =>
  transactionType === "SALES" ? defaultSalesDescription : "";

export function CreateTransactionModal({ isOpen, onClose, restaurantId, onSuccess, defaultTab = "SALES", initialData, allowedTypes }: CreateTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(defaultTab);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<any[]>([]);
  const [selectedPurchaseRestaurantId, setSelectedPurchaseRestaurantId] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [banks, setBanks] = useState<BankDetail[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [createdTransaction, setCreatedTransaction] = useState<Transaction | null>(null);
  const [restaurantDetails, setRestaurantDetails] = useState<any>(null);

  const [formData, setFormData] = useState({
    companyId: "",
    companyModel: "Vendor",
    transactionDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(new Date(), "yyyy-MM-dd"),
    customerName: "",
    paymentMethod: "",
    bank: "",
    shippingSameAsBilling: true,
    subtotal: 0,
    debitAccount: "",
    creditAccount: "",
    amount: 0,
    isExpense: false,
    taxAmount: 0,
    discountAmount: 0,
    paidAmount: 0,
    referenceNumber: "",
    description: getDefaultDescription(defaultTab),
  });

  const fetchCustomers = async () => {
    if (!restaurantId) return;
    try {
      const custRes = await customerService.getCustomers(restaurantId);
      const cList = (custRes as any)?.data?.customers || (custRes as any)?.data || custRes || [];
      setCustomers(Array.isArray(cList) ? cList : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen && restaurantId) {
      // Always reset inventory/menu on open — they will be loaded based on type
      setInventoryItems([]);
      setMenuItems([]);

      // On open: load restaurants list and customers
      Promise.all([
        clientService.getRestaurants(),
      ]).then(([restsRes]: any) => {
        let rList: any[] = [];
        if (Array.isArray(restsRes)) rList = restsRes;
        else if (restsRes?.data && Array.isArray(restsRes.data)) rList = restsRes.data;
        else if (restsRes?.data?.restaurants) rList = restsRes.data.restaurants;
        else if (restsRes?.restaurants) rList = restsRes.restaurants;
        setAllRestaurants(rList);

        const currentRest = rList.find((r: any) => r._id === restaurantId);
        if (currentRest) setRestaurantDetails(currentRest);

      }).catch(console.error);

      if (initialData) {
        setType(initialData.type as any);
        // For purchase types restore the restaurant selection
        if (["PURCHASE", "PAYMENT"].includes(initialData.type)) {
          const savedRestId = typeof initialData.restaurantId === 'string'
            ? initialData.restaurantId
            : (initialData.restaurantId as any)?._id || "";
          setSelectedPurchaseRestaurantId(savedRestId || restaurantId);
        }
        setFormData({
          companyId: typeof initialData.companyId === 'string' ? initialData.companyId : (initialData.companyId?._id || ""),
          companyModel: "Vendor",
          transactionDate: format(new Date(initialData.transactionDate), "yyyy-MM-dd"),
          dueDate: initialData.dueDate ? format(new Date(initialData.dueDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
          customerName: initialData.customerName || initialData.companyName || "",
          paymentMethod: initialData.paymentMethod || "",
          bank: typeof initialData.bank === 'string' ? initialData.bank : ((initialData.bank as any)?._id || ""),
          shippingSameAsBilling: true,
          subtotal: initialData.subtotal || 0,
          debitAccount: (initialData as any).debitAccount || "",
          creditAccount: (initialData as any).creditAccount || "",
          amount: initialData.totalAmount || 0,
          isExpense: initialData.isExpense || false,
          taxAmount: initialData.taxAmount || 0,
          discountAmount: initialData.discountAmount || 0,
          paidAmount: initialData.paidAmount || 0,
          referenceNumber: initialData.referenceNumber || "",
          description: initialData.description || getDefaultDescription(initialData.type),
        });
        if (initialData.items && initialData.items.length > 0) {
          setItems(initialData.items);
        } else {
          setItems([{ productId: "", name: "", quantity: 1, unit: "Piece", pricePerUnit: 0, amount: 0, hsnCode: "" }]);
        }
      } else {
        setType(defaultTab);
        setSelectedPurchaseRestaurantId("");
        setVendors([]);
        setBanks([]);
        setItems([{ productId: "", name: "", quantity: 1, unit: "Piece", pricePerUnit: 0, amount: 0, hsnCode: "" }]);
        setFormData({
          companyId: "",
          companyModel: "Vendor",
          transactionDate: format(new Date(), "yyyy-MM-dd"),
          dueDate: format(new Date(), "yyyy-MM-dd"),
          customerName: "",
          paymentMethod: "",
          bank: "",
          shippingSameAsBilling: true,
          subtotal: 0,
          debitAccount: "",
          creditAccount: "",
          amount: 0,
          isExpense: false,
          taxAmount: 0,
          discountAmount: 0,
          paidAmount: 0,
          referenceNumber: "",
          description: getDefaultDescription(defaultTab),
        });
      }
    } else {
      setItems([{ productId: "", name: "", quantity: 1, unit: "Piece", pricePerUnit: 0, amount: 0, hsnCode: "" }]);
    }
  }, [isOpen, restaurantId, initialData, defaultTab]);

  // For Sales/Receipt: fetch bank of selected B2B branch
  useEffect(() => {
    const isSalesType = ["SALES", "RECEIPT", "PROFORMA", "JOURNAL"].includes(type);
    if (!isSalesType) return;

    if (formData.companyId) {
      bankService.getBankDetails({ companyId: formData.companyId }, formData.companyId).then((res: any) => {
        const list = Array.isArray(res) ? res : res.data || res.banks || [];
        setBanks(list);
        if (list.length > 0) {
          setFormData(prev => ({ ...prev, bank: prev.bank || list[0]._id }));
        } else {
          setFormData(prev => ({ ...prev, bank: "" }));
        }
      }).catch(console.error);
    } else if (restaurantId) {
      bankService.getBankDetails({ companyId: restaurantId }, restaurantId).then((res: any) => {
        const list = Array.isArray(res) ? res : res.data || res.banks || [];
        setBanks(list);
        if (list.length > 0) {
          setFormData(prev => ({ ...prev, bank: prev.bank || list[0]._id }));
        } else {
          setFormData(prev => ({ ...prev, bank: "" }));
        }
      }).catch(console.error);
    }
  }, [restaurantId, formData.companyId, type]);

  useEffect(() => {
    const usesCustomerCompany = ["SALES", "RECEIPT", "PROFORMA"].includes(type);
    const customerRestaurantId = formData.companyId || restaurantId;
    if (!usesCustomerCompany || !customerRestaurantId) return;

    setCustomers([]);
    customerService.getCustomers(customerRestaurantId).then((res: any) => {
      const list = res?.data?.customers || res?.data || res || [];
      setCustomers(Array.isArray(list) ? list : []);
    }).catch(console.error);
  }, [formData.companyId, restaurantId, type]);

  useEffect(() => {
    const usesRestaurantCompany = ["SALES", "RECEIPT", "PROFORMA", "JOURNAL"].includes(type);
    if (!usesRestaurantCompany || allRestaurants.length === 0) return;

    const selectedRestaurant = allRestaurants.find((restaurant: any) =>
      restaurant._id === (formData.companyId || restaurantId)
    );
    if (selectedRestaurant) setRestaurantDetails(selectedRestaurant);
  }, [allRestaurants, formData.companyId, restaurantId, type]);
  // For Sales/Receipt: fetch products, vendors and banks using the page's restaurantId
  useEffect(() => {
    const isSalesType = ["SALES", "RECEIPT", "PROFORMA", "JOURNAL"].includes(type);
    const salesRestaurantId = formData.companyId || restaurantId;
    if (!isSalesType || !salesRestaurantId) return;

    // Clear old data before fetching new ones so you never see stale data!
    setInventoryItems([]);
    setMenuItems([]);
    setVendors([]);
    setBanks([]);

    Promise.all([
      inventoryService.getInventoryItems(salesRestaurantId),
      menuService.getMenuItems(salesRestaurantId),
      vendorService.getVendors(salesRestaurantId),
      bankService.getBankDetails({ companyId: salesRestaurantId }, salesRestaurantId),
    ]).then(([invRes, menuRes, vendorRes, bankRes]: any) => {
      const iList = invRes?.data?.inventoryItems || invRes?.data || invRes || [];
      setInventoryItems(Array.isArray(iList) ? iList : []);

      const mList = menuRes?.data?.menuItems || menuRes?.data || menuRes || [];
      setMenuItems(Array.isArray(mList) ? mList : []);

      const vList = vendorRes?.data?.vendors || vendorRes?.data || vendorRes || [];
      setVendors(Array.isArray(vList) ? vList : []);

      const bList = Array.isArray(bankRes) ? bankRes : bankRes?.data || bankRes?.banks || [];
      setBanks(bList);
      
      if (!initialData && Array.isArray(bList) && bList.length > 0) {
        setFormData(prev => ({ ...prev, bank: bList[0]._id }));
      }
    }).catch(console.error);
  }, [type, restaurantId, formData.companyId, isOpen]);

  // For Purchase/Payment: when restaurant is selected, fetch its vendors, banks, inventory and menu
  useEffect(() => {
    const isPurchaseMode = ["PURCHASE", "PAYMENT"].includes(type);
    if (!isPurchaseMode) return;

    if (!selectedPurchaseRestaurantId) {
      // Clear everything immediately so stale data is never shown
      setInventoryItems([]);
      setMenuItems([]);
      setVendors([]);
      setBanks([]);
      return;
    }

    // Clear immediately while fetching — prevents stale data from another restaurant showing
    setInventoryItems([]);
    setMenuItems([]);
    setVendors([]);
    setBanks([]);
    setItems([{ productId: "", name: "", quantity: 1, unit: "Piece", pricePerUnit: 0, amount: 0, hsnCode: "" }]);

    // Fetch everything scoped to the selected purchase restaurant
    Promise.all([
      vendorService.getVendors(selectedPurchaseRestaurantId),
      bankService.getBankDetails({ companyId: selectedPurchaseRestaurantId }, selectedPurchaseRestaurantId),
      inventoryService.getInventoryItems(selectedPurchaseRestaurantId),
      menuService.getMenuItems(selectedPurchaseRestaurantId),
    ]).then(([vendorRes, bankRes, invRes, menuRes]: any) => {

      const vList = vendorRes?.data?.vendors || vendorRes?.data || vendorRes || [];
      setVendors(Array.isArray(vList) ? vList : []);

      const bankList = Array.isArray(bankRes) ? bankRes : bankRes?.data || bankRes?.banks || [];
      setBanks(bankList);
      if (bankList.length > 0) {
        setFormData(prev => ({ ...prev, bank: prev.bank || bankList[0]._id }));
      } else {
        setFormData(prev => ({ ...prev, bank: "" }));
      }

      const iList = invRes?.data?.inventoryItems || invRes?.data || invRes || [];
      setInventoryItems(Array.isArray(iList) ? iList : []);

      const mList = menuRes?.data?.menuItems || menuRes?.data || menuRes || [];
      setMenuItems(Array.isArray(mList) ? mList : []);
    }).catch(console.error);
  }, [selectedPurchaseRestaurantId, type]);

  const handleSubmit = async () => {
    const isPurchase = ["PURCHASE", "PAYMENT"].includes(type);
    const isReceipt = type === "RECEIPT";
    const isJournal = type === "JOURNAL";
    const isSimpleTransaction = isReceipt || isJournal || type === "PAYMENT";
    
    if (isPurchase && !formData.companyId) {
      toast({ title: "Error", description: "Vendor is required for purchases.", variant: "destructive" });
      return;
    }

    if (type === "PURCHASE" && !formData.referenceNumber.trim()) {
      toast({ title: "Error", description: "Purchase invoice number is required.", variant: "destructive" });
      return;
    }

    if (type === "PURCHASE" && !selectedPurchaseRestaurantId) {
      toast({ title: "Error", description: "Select a restaurant for this purchase.", variant: "destructive" });
      return;
    }
    
    if (isReceipt && !formData.customerName) {
       toast({ title: "Error", description: "Received From is required for receipts.", variant: "destructive" });
       return;
    }

    if ((isReceipt || isJournal) && !formData.companyId) {
      toast({ title: "Error", description: "Company is required.", variant: "destructive" });
      return;
    }

    if (type === "PAYMENT" && !formData.companyId) {
      toast({ title: "Error", description: "Vendor is required for payments.", variant: "destructive" });
      return;
    }

    if (!isPurchase && !isReceipt && !formData.customerName && !formData.companyId && !isJournal) {
       toast({ title: "Error", description: "Customer name is required for sales.", variant: "destructive" });
       return;
    }

    if (!isJournal && !formData.paymentMethod) {
      toast({ title: "Error", description: "Payment method is required.", variant: "destructive" });
      return;
    }

    if (isJournal && (!formData.debitAccount || !formData.creditAccount)) {
      toast({ title: "Error", description: "Debit and credit accounts are required.", variant: "destructive" });
      return;
    }

    if (isSimpleTransaction && formData.amount <= 0) {
      toast({ title: "Error", description: "Amount must be greater than 0.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const calculatedSubtotal = isSimpleTransaction
        ? formData.amount
        : items.length > 0 && items[0].productId !== ""
        ? items.reduce((sum, item) => sum + (item.amount || 0), 0) 
        : formData.subtotal;
        
      const totalAmount = calculatedSubtotal + formData.taxAmount - formData.discountAmount;
      
      // Normalize type — guard against "PURCHASES" / "RECEIPTS" / "PAYMENTS" / "JOURNALS"
      const typeMap: Record<string, string> = {
        PURCHASES: "PURCHASE",
        RECEIPTS: "RECEIPT",
        PAYMENTS: "PAYMENT",
        JOURNALS: "JOURNAL",
        SALES: "SALES",
        PURCHASE: "PURCHASE",
        RECEIPT: "RECEIPT",
        PAYMENT: "PAYMENT",
        JOURNAL: "JOURNAL",
        PROFORMA: "PROFORMA",
      };
      const normalizedType = typeMap[type.toUpperCase()] || type;
      const selectedVendor = vendors.find(vendor => vendor._id === formData.companyId);
      const transactionPartyName = selectedVendor?.name || formData.customerName || undefined;
      const transactionRestaurantId = ["SALES", "RECEIPT", "JOURNAL", "PROFORMA"].includes(normalizedType)
        ? formData.companyId || restaurantId
        : (type === "PURCHASE" ? selectedPurchaseRestaurantId : restaurantId);

      const payload = {
        ...formData,
        // Strip empty strings for enum/ObjectId fields — Mongoose rejects "" for these
        paymentMethod: (isJournal || !formData.paymentMethod) ? undefined : formData.paymentMethod,
        companyId: formData.companyId || undefined,
        companyModel: formData.companyId ? formData.companyModel : undefined,
        bank: formData.bank || undefined,
        companyName: transactionPartyName,
        customerName: transactionPartyName,
        referenceNumber: formData.referenceNumber || undefined,
        restaurantId: transactionRestaurantId,
        type: normalizedType,
        subtotal: calculatedSubtotal,
        totalAmount,
        paidAmount: isSimpleTransaction ? formData.amount : formData.paidAmount,
        status: (isSimpleTransaction || formData.paidAmount >= totalAmount ? "PAID" : (formData.paidAmount > 0 ? "PARTIAL" : "UNPAID")) as "PAID" | "PARTIAL" | "UNPAID",
        isExpense: isJournal ? formData.isExpense : ["PURCHASE", "PAYMENT"].includes(normalizedType),
        transactionDate: formData.transactionDate,
        items: items.filter(i => i.productId !== ""),
      } as Partial<Transaction>;

      /* Purchase uses the generic /transactions route so it records an entry without changing stock.
      if (type === "PURCHASE" && !initialData) {
        const selectedVendor = vendors.find(vendor => vendor._id === formData.companyId);
        await purchaseService.createPurchase({
          restaurantId: selectedPurchaseRestaurantId,
          vendorName: selectedVendor?.name || formData.companyId,
          invoiceNumber: formData.referenceNumber.trim(),
          items: items.filter(item => item.productId).map(item => ({
            inventoryItemId: item.productId,
            quantity: Number(item.quantity),
            ratePerUnit: Number(item.pricePerUnit),
            totalAmount: Number(item.amount),
          })),
          subtotal: calculatedSubtotal,
          taxAmount: Number(formData.taxAmount) || 0,
          totalAmount,
          paidAmount: Number(formData.paidAmount) || 0,
          paymentMethod: formData.paymentMethod as "Cash" | "Credit" | "UPI" | "Bank Transfer" | "Cheque" | "Others",
          invoiceDate: formData.transactionDate,
        }, selectedPurchaseRestaurantId);
        toast({ title: "Purchase created", description: "Purchase invoice created and inventory stock increased." });
        onClose();
        onSuccess();
        return;
      }
      */

      if (initialData) {
        await transactionService.updateTransaction(initialData._id, payload, transactionRestaurantId || "");
        toast({ title: "Success", description: "Transaction updated successfully." });
        onClose();
        onSuccess();
      } else {
        const created = await transactionService.createTransaction(payload, transactionRestaurantId || "");
        toast({ title: "Success", description: "Transaction created successfully." });
        
        if (type === "SALES" || type === "PROFORMA") {
          setCreatedTransaction(created.data || created);
        } else {
          onClose();
          onSuccess();
        }
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to create transaction.",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatedSubtotal = items.length > 0 && items[0].productId !== ""
        ? items.reduce((sum, item) => sum + (item.amount || 0), 0) 
        : formData.subtotal;
  const totalAmount = calculatedSubtotal + formData.taxAmount - formData.discountAmount;

  const isSalesType = type === "SALES" || type === "PROFORMA" || type === "RECEIPT" || type === "JOURNAL";
  const isSpecialTransaction = ["RECEIPT", "PAYMENT", "JOURNAL"].includes(type);
  
  const productOptions = isSalesType
    ? menuItems.map(m => ({ value: m._id, label: m.name, searchableText: m.name }))
    : inventoryItems.map(i => ({ value: i._id, label: i.name, searchableText: i.name }));

  const getProductPrice = (productId: string) => {
    if (isSalesType) {
      const p = menuItems.find(m => m._id === productId);
      return p?.variants?.[0]?.price || 0;
    } else {
      const p = inventoryItems.find(i => i._id === productId);
      return p?.costPerUnit || 0;
    }
  };

  const getProductName = (productId: string) => {
    if (isSalesType) {
      const p = menuItems.find(m => m._id === productId);
      return p?.name || "";
    } else {
      const p = inventoryItems.find(i => i._id === productId);
      return p?.name || "";
    }
  };

  const customerOptions = customers.map(c => ({ value: c.name, label: c.name, searchableText: c.name }));

  const handleTypeChange = (nextType: string) => {
    if (nextType === type) return;
    setType(nextType as typeof type);
    setFormData(prev => ({
      ...prev,
      description: getDefaultDescription(nextType),
    }));
  };

  return (
    <>
    <Dialog open={isOpen && !createdTransaction} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[1000px] p-0 gap-0 overflow-hidden bg-[#f9fafb]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{initialData ? "Edit Transaction" : "Create Transaction"}</h2>
            <p className="text-sm text-gray-500">Fill in the details below to record a {initialData ? "modification to this" : "new"} financial event.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Maximize className="w-4 h-4 text-gray-500" />
          </Button>
        </div>

        <div className="h-[80vh] overflow-y-auto p-6 space-y-6">
          {/* Draft Banner */}
          {type !== "PROFORMA" && <div className="bg-[#f0f4ff] border border-[#dbe4ff] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">You have a saved draft from {format(new Date(), "MM/dd/yyyy, HH:mm:ss")}</p>
                <p className="text-xs text-blue-600">Restore to continue where you left off</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="text-gray-500 hover:text-gray-700 bg-white border border-gray-200">Clear</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Restore Draft</Button>
            </div>
          </div>}

          {/* Tabs & Scan */}
          {type !== "PROFORMA" && <div className="flex items-center justify-between">
            <div className="flex items-center gap-8 border-b border-gray-200 w-full max-w-2xl">
              {["Sales", "Purchases", "Receipt", "Payment", "Journal"].filter((tab) => {
                if (!allowedTypes) return true;
                const tabType = tab === "Purchases" ? "PURCHASE" : tab.toUpperCase();
                return allowedTypes.includes(tabType as any);
              }).map(t => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t === "Purchases" ? "PURCHASE" : t.toUpperCase())}
                  className={`pb-3 px-1 text-sm font-medium relative ${type === "PURCHASE" && t === "Purchases" || type.toLowerCase() === t.toLowerCase() ? "text-purple-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {t}
                  {(type.toLowerCase() === t.toLowerCase() || (type === "PURCHASE" && t === "Purchases")) && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                  )}
                </button>
              ))}
            </div>
            <Button variant="outline" className="text-purple-600 border-purple-200 border-dashed hover:bg-purple-50">
              <ScanLine className="w-4 h-4 mr-2" />
              Scan Invoice
            </Button>
          </div>}

          {type !== "PROFORMA" && <div className="flex justify-end items-center gap-2">
            <span className="text-sm text-gray-500">Show Advance Features</span>
            <Switch />
          </div>}

          {/* Primary Info Form */}
          {isSpecialTransaction ? (
            <div className="space-y-6">
              {type === "JOURNAL" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Company <span className="text-red-500">*</span></Label>
                      <Select value={formData.companyId} onValueChange={(v) => setFormData({ ...formData, companyId: v, customerName: "", companyModel: "Restaurant" })}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select Company" /></SelectTrigger>
                        <SelectContent>{allRestaurants.map((restaurant: any) => <SelectItem key={restaurant._id} value={restaurant._id}>{restaurant.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Transaction Date <span className="text-red-500">*</span></Label>
                      <Input type="date" value={formData.transactionDate} onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })} className="bg-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 pb-3 border-b">Journal Entry</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                      <div className="space-y-2"><Label>Debit Account <span className="text-red-500">*</span></Label><Input placeholder="e.g., Rent Expense" value={formData.debitAccount} onChange={(e) => setFormData({ ...formData, debitAccount: e.target.value })} className="bg-white" /></div>
                      <div className="space-y-2"><Label>Credit Account <span className="text-red-500">*</span></Label><Input placeholder="e.g., Cash" value={formData.creditAccount} onChange={(e) => setFormData({ ...formData, creditAccount: e.target.value })} className="bg-white" /></div>
                      <div className="space-y-2"><Label>Amount <span className="text-red-500">*</span></Label><Input type="number" min="0" placeholder="e.g. 1000" value={formData.amount || ""} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) || 0 })} className="bg-white" /></div>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Narration</Label><textarea placeholder="Describe the transaction..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full min-h-[100px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300" /></div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Company <span className="text-red-500">*</span></Label>
                    {type === "PAYMENT" ? (
                      <Select value={selectedPurchaseRestaurantId} onValueChange={(v) => setSelectedPurchaseRestaurantId(v)}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select Company" /></SelectTrigger>
                        <SelectContent>{allRestaurants.map((restaurant: any) => <SelectItem key={restaurant._id} value={restaurant._id}>{restaurant.name}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Select value={formData.companyId} onValueChange={(v) => setFormData({ ...formData, companyId: v, companyModel: "Restaurant" })}>
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select Company" /></SelectTrigger>
                        <SelectContent>{allRestaurants.map((restaurant: any) => <SelectItem key={restaurant._id} value={restaurant._id}>{restaurant.name}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2"><Label>Transaction Date <span className="text-red-500">*</span></Label><Input type="date" value={formData.transactionDate} onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })} className="bg-white" /></div>
                  {type === "PAYMENT" && <div className="flex items-center gap-3 md:col-span-2"><Checkbox checked={formData.isExpense} onCheckedChange={(checked) => setFormData({ ...formData, isExpense: checked === true })} /><div><Label>Expense</Label><p className="text-xs text-gray-500">Check this if this is an expense</p></div></div>}
                  {type === "PAYMENT" ? (
                    <div className="space-y-2">
                      <Label>Vendor <span className="text-red-500">*</span></Label>
                      <Combobox options={vendors.map(v => ({ label: v.name, value: v._id }))} value={formData.companyId} onChange={(v) => setFormData({ ...formData, companyId: v, companyModel: "Vendor" })} placeholder="Search vendors..." searchPlaceholder="Search vendors..." />
                      {(() => {
                        if (!formData.companyId) return null;
                        const selectedVendor = vendors.find(vendor => vendor._id === formData.companyId);
                        const vendorBalance = (selectedVendor as any)?.closingBalance || 0;
                        return vendorBalance > 0 ? (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm font-medium">You need to pay vendor: ₹ {vendorBalance}</p>
                          </div>
                        ) : (
                          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-gray-600 text-sm font-medium">No outstanding balance</p>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Received From <span className="text-red-500">*</span></Label>
                      <Combobox options={customerOptions} value={formData.customerName} onChange={(v) => setFormData({ ...formData, customerName: v })} placeholder="Enter Name" searchPlaceholder="Search customers..." creatable onCreate={async (v) => { setFormData({ ...formData, customerName: v }); return v; }} />
                      {(() => {
                        if (!formData.customerName) return null;
                        const selectedCustomer = customers.find(customer => customer.name === formData.customerName);
                        const customerBalance = selectedCustomer?.closingBalance || 0;
                        return customerBalance > 0 ? (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-600 text-sm font-medium">Customer needs to pay: ₹ {customerBalance}</p>
                          </div>
                        ) : (
                          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-gray-600 text-sm font-medium">No outstanding balance</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  <div className="space-y-2"><Label>Payment Method <span className="text-red-500">*</span></Label><Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}><SelectTrigger className="bg-white"><SelectValue placeholder="Select Payment Method" /></SelectTrigger><SelectContent>{["Cash", "UPI", "Bank Transfer", "Cheque", "Others"].map((method) => <SelectItem key={method} value={method}>{method}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Amount <span className="text-red-500">*</span></Label><Input type="number" min="0" placeholder="Enter amount" value={formData.amount || ""} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) || 0 })} className="bg-white" /></div>
                  <div className="space-y-2"><Label>Reference Number</Label><Input placeholder="Receipt/Invoice number" value={formData.referenceNumber} onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })} className="bg-white" /></div>
                  <div className="space-y-2 md:col-span-2"><Label>Description</Label><textarea placeholder="Enter description (max 50 words)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full min-h-[100px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300" /></div>
                </div>
              )}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {!isSalesType ? (
              <>
                {/* Restaurant selector FIRST */}
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Restaurant <span className="text-red-500">*</span></Label>
                  <Select
                    value={selectedPurchaseRestaurantId}
                    onValueChange={(v) => {
                      // Clear ALL dependent data synchronously in one batch
                      // so the product Combobox remounts with empty options (not stale data)
                      setInventoryItems([]);
                      setMenuItems([]);
                      setVendors([]);
                      setBanks([]);
                      setItems([{ productId: "", name: "", quantity: 1, unit: "Piece", pricePerUnit: 0, amount: 0, hsnCode: "" }]);
                      setFormData(prev => ({ ...prev, companyId: "", bank: "" }));
                      setSelectedPurchaseRestaurantId(v);
                    }}
                  >
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select Restaurant" /></SelectTrigger>
                    <SelectContent>
                      {allRestaurants.map((r: any) => (
                        <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vendor selector SECOND — only active after restaurant is chosen */}
                <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
                  <Label className="text-gray-700 font-medium">Vendor <span className="text-red-500">*</span></Label>
                  <Combobox
                    options={vendors.map(v => ({
                      label: `${v.name}${v.phone ? ` (+91${v.phone})` : ''}`,
                      value: v._id
                    }))}
                    value={formData.companyId}
                    onChange={(val) => setFormData({ ...formData, companyId: val })}
                    placeholder={selectedPurchaseRestaurantId ? "Select Vendor" : "Select a restaurant first"}
                    searchPlaceholder="Type to search..."
                    disabled={!selectedPurchaseRestaurantId}
                  />
                  {formData.companyId && (() => {
                    const selectedVendor = vendors.find(v => v._id === formData.companyId);
                    const vendorBalance = (selectedVendor as any)?.closingBalance || 0;
                    if (vendorBalance > 0) {
                      return (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-600 text-sm font-medium">You need to pay vendor: ₹ {vendorBalance}</p>
                        </div>
                      );
                    }
                    return (
                      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-700 text-sm font-medium">Vendor balance: ₹ {vendorBalance}</p>
                      </div>
                    );
                  })()}
                </div>
                {type === "PURCHASE" && (
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Invoice Number <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Vendor invoice number"
                      value={formData.referenceNumber}
                      onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                      className="bg-white"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium text-sm">Select Restaurant</Label>
                  <Select value={formData.companyId} onValueChange={(v) => setFormData({ ...formData, companyId: v, customerName: "", companyModel: "Restaurant" })}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select Restaurant" /></SelectTrigger>
                    <SelectContent>
                      {allRestaurants.length > 0 ? allRestaurants.map((r: any) => (
                        <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
                      )) : (
                        <SelectItem value="none" disabled>No restaurants available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium text-sm">Customer <span className="text-red-500">*</span></Label>
                  <Combobox 
                    options={customerOptions}
                    value={formData.customerName}
                    onChange={(val) => setFormData({ ...formData, customerName: val })}
                    placeholder="Search Customer..."
                    searchPlaceholder="Type customer name..."
                    creatable={true}
                    onCreate={async (val) => {
                      setNewCustomerName(val);
                      setShowCreateCustomer(true);
                      return val;
                    }}
                  />
                  <AddCustomerDialog
                    restaurantId={formData.companyId || restaurantId || ""}
                    open={showCreateCustomer}
                    onOpenChange={setShowCreateCustomer}
                    defaultName={newCustomerName}
                    trigger={null}
                    onSuccess={() => {
                      setFormData({ ...formData, customerName: newCustomerName });
                      const customerRestaurantId = formData.companyId || restaurantId;
                      if (customerRestaurantId) {
                        customerService.getCustomers(customerRestaurantId).then((res: any) => {
                          const list = res?.data?.customers || res?.data || res || [];
                          setCustomers(Array.isArray(list) ? list : []);
                        }).catch(console.error);
                      }
                    }}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Transaction Date <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input type="date" value={formData.transactionDate} onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })} className="bg-purple-50/50 pr-10" />
                <CalendarIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Due Date</Label>
              <div className="relative">
                <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="bg-white pr-10" />
                <CalendarIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            
            <div className="space-y-2 md:col-span-1">
              <Label className="text-gray-700 font-medium">Payment Method <span className="text-red-500">*</span></Label>
              <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Select Payment Method" /></SelectTrigger>
                <SelectContent>
                    {["Cash", "Credit", "UPI", "Bank Transfer", "Cheque", "Others"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label className="text-gray-700 font-medium">Bank <span className="text-red-500">*</span></Label>
              <Select value={formData.bank} onValueChange={(v) => setFormData({ ...formData, bank: v })}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select Bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map(bank => (
                    <SelectItem key={bank._id} value={bank._id}>{bank.bankName} - {bank.accountNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!initialData && <p className="text-xs text-blue-500">First bank auto-selected - you can change it</p>}
            </div>


          </div>
          )}

          {!isSpecialTransaction && (
          <>
          {/* Product Selection */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600"><Copy className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                <PackageOpen className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Product Selection<span className="text-red-500">*</span></h3>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="space-y-4 border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                  <Combobox 
                    key={`product-${index}-${selectedPurchaseRestaurantId || restaurantId}`}
                    options={productOptions}
                    value={item.productId}
                    onChange={(val) => {
                      const newItems = [...items];
                      const price = getProductPrice(val);
                      newItems[index] = { 
                        ...item, 
                        productId: val, 
                        name: getProductName(val),
                        pricePerUnit: price,
                        amount: item.quantity * price
                      };
                      setItems(newItems);
                    }}
                    placeholder="Search products..."
                    searchPlaceholder="Type to search..."
                  />
                  
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-500 mb-1 block">Qty</Label>
                      <Input 
                        type="number" 
                        value={item.quantity}
                        onChange={(e) => {
                          const q = parseFloat(e.target.value) || 0;
                          const newItems = [...items];
                          newItems[index] = { ...item, quantity: q, amount: q * item.pricePerUnit };
                          setItems(newItems);
                        }}
                        className="bg-white"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs text-gray-500 mb-1 block">Unit</Label>
                      <Select value={item.unit} onValueChange={(v) => {
                        const newItems = [...items];
                        newItems[index] = { ...item, unit: v };
                        setItems(newItems);
                      }}>
                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Piece">Piece</SelectItem>
                          <SelectItem value="Kg">Kg</SelectItem>
                          <SelectItem value="Ltr">Ltr</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-500 mb-1 block">Price/Unit</Label>
                      <Input 
                        type="number" 
                        value={item.pricePerUnit}
                        onChange={(e) => {
                          const p = parseFloat(e.target.value) || 0;
                          const newItems = [...items];
                          newItems[index] = { ...item, pricePerUnit: p, amount: item.quantity * p };
                          setItems(newItems);
                        }}
                        className="bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-500 mb-1 block">Amount</Label>
                      <Input 
                        type="number" 
                        value={item.amount}
                        readOnly
                        className={`bg-white ${item.amount === 0 ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                      {item.amount === 0 && <p className="text-[10px] text-red-500 mt-1">Amount must be greater than 0</p>}
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs text-gray-500 mb-1 block">HSN Code</Label>
                      <Input 
                        placeholder="Search HSN..." 
                        value={item.hsnCode}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index] = { ...item, hsnCode: e.target.value };
                          setItems(newItems);
                        }}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button 
                variant="outline" 
                className="w-full text-gray-700 bg-white border-gray-200 hover:bg-gray-50"
                onClick={() => setItems([...items, { productId: "", name: "", quantity: 1, unit: "Piece", pricePerUnit: 0, amount: 0, hsnCode: "" }])}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
              <Button variant="outline" className="w-full text-gray-700 bg-white border-gray-200 hover:bg-gray-50">
                <Plus className="w-4 h-4 mr-2" /> Add Service
              </Button>
            </div>
          </div>

          {/* Footer Notes & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-2">
              <h3 className="font-medium text-gray-900">Notes</h3>
              <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                <QuillEditor 
                  value={formData.description}
                  onChange={(val) => setFormData({ ...formData, description: val })}
                  className="min-h-[200px]"
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Subtotal</span>
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 w-32 text-right text-gray-900 font-medium">
                    {calculatedSubtotal.toFixed(2)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">Invoice Total</span>
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 w-32 text-right text-gray-900 font-bold flex justify-end gap-1">
                    <span className="text-gray-500">Rs</span> {totalAmount.toFixed(2)}
                  </div>
                </div>
                {type === "PURCHASE" && (
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium text-gray-700">Paid Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      max={totalAmount}
                      value={formData.paidAmount || ""}
                      onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) || 0 })}
                      className="w-32 bg-white text-right"
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          </>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t bg-white flex justify-end gap-3 sticky bottom-0 z-10">
          <Button type="button" variant="ghost" className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#8b77ff] hover:bg-[#7965ec] text-white px-8">
            {loading ? (initialData ? "Updating..." : "Creating...") : (initialData ? "Update" : "Create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <InvoicePreviewModal 
      isOpen={!!createdTransaction}
      onClose={() => {
        setCreatedTransaction(null);
        onClose();
        onSuccess();
      }}
      transaction={createdTransaction}
      restaurantDetails={restaurantDetails}
    />
    </>
  );
}


