import React, { useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Scissors, X } from "lucide-react";
import { format } from "date-fns";

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  restaurant?: {
    name?: string;
    address?: { street?: string; city?: string; state?: string; zipCode?: string; country?: string };
    contact?: { phone?: string; email?: string; managerName?: string };
    compliance?: { gstNumber?: string; fssaiNumber?: string };
  } | null;
}

export function ReceiptModal({ isOpen, onClose, order, restaurant }: ReceiptModalProps) {
  if (!order) return null;

  const discount = Number(order.financials?.discount || 0);
  let subtotal = Number(order.financials?.subtotal || 0);
  let totalTax = Number(order.financials?.totalTax || 0);
  let grandTotal = Number(order.financials?.grandTotal || 0);

  if (order.status === "OPEN" || subtotal === 0) {
    subtotal = order.kots?.flatMap((k: any) => k.items).reduce((sum: number, item: any) => {
      return sum + (item.isComplimentary ? 0 : ((item.variantPrice || 0) * (item.quantity || 1)));
    }, 0) || 0;
    totalTax = subtotal * 0.05;
    grandTotal = Math.max(0, subtotal + totalTax - discount);
  }

  const allItems = order.kots?.flatMap((k: any) => k.items) || [];
  const restaurantName = restaurant?.name || (order as any)?.restaurant?.name || (typeof order.restaurantId === 'object' ? (order.restaurantId as any)?.name : null) || "VINIMAY CAFE";
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const receiptNumber = order._id ? order._id.slice(-4).toUpperCase() : (order.orderNumber ? String(order.orderNumber) : "N/A");
  const tableLabel = order.orderType === "DINE_IN" ? `Table ${typeof order.tableId === 'object' ? order.tableId?.tableNumber : order.tableId || "N/A"}` : (order.orderType || "Takeaway");
  const serverName = order.waiterId?.contactName?.split(" ")[0]?.toUpperCase() || (typeof order.waiterId === 'string' ? "STAFF" : "CASHIER");
  const customerName = order.customerDetails?.name?.toUpperCase() || "WALK-IN GUEST";
  const customerPhone = order.customerDetails?.phone || "";

  const handlePrint = () => {
    const printContent = document.getElementById("receipt-print-area-content");
    if (!printContent) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; padding: 4mm; font-family: monospace; font-size: 11px; width: 72mm; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .border-t { border-top: 1px dashed #000; }
            .border-t-2 { border-top: 2px solid #000; }
            .border-b { border-bottom: 1px dotted #000; }
            .my-1 { margin-top: 4px; margin-bottom: 4px; }
            .my-2 { margin-top: 7px; margin-bottom: 7px; }
            .mb-1 { margin-bottom: 4px; }
            .space-y-05 > div { margin-bottom: 2px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-start { align-items: flex-start; }
            .tear-divider { border-top: 2px dashed #666; text-align: center; margin: 18px 0; position: relative; }
            .tear-text { display: inline-block; background: #fff; padding: 0 8px; position: relative; top: -8px; font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 250);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
        <div className="bg-slate-200/80 dark:bg-slate-900/90 text-black mx-auto w-full max-w-[390px] shadow-2xl relative break-words p-4 my-3 rounded-2xl border border-slate-300 dark:border-slate-700 font-mono text-xs leading-relaxed max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-300 dark:border-slate-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">Receipt • #{receiptNumber}</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 rounded-full text-slate-500"><X className="h-4 w-4" /></Button>
          </div>

          <div id="receipt-print-area-content" className="space-y-4">
            <div className="customer-copy bg-white p-5 rounded-2xl shadow-xl border border-slate-300 break-words font-mono text-xs leading-relaxed space-y-3">
              <div className="text-center space-y-0.5 pb-1">
                <h1 className="text-sm font-black uppercase tracking-wider text-black">{restaurantName}</h1>
                {restaurant?.address && <p className="text-[10px] text-slate-700">{[restaurant.address.street, restaurant.address.city, restaurant.address.state].filter(Boolean).join(", ")}</p>}
                {restaurant?.contact?.phone && <p className="text-[10px] text-slate-700">TEL: {restaurant.contact.phone}</p>}
                {restaurant?.compliance?.gstNumber && <p className="text-[10px] text-slate-700">GSTIN: {restaurant.compliance.gstNumber}</p>}
                <div className="inline-block border border-black px-2 py-0.5 mt-1 font-extrabold text-[9px] uppercase bg-white text-black">*** CUSTOMER COPY (TAX INVOICE) ***</div>
              </div>
              <div className="border-t border-dashed border-black my-2" />
              <div className="text-[11px] space-y-0.5">
                <div className="flex justify-between"><span>DATE: {format(orderDate, "dd/MM/yyyy HH:mm")}</span><span className="font-bold">RCPT: #{receiptNumber}</span></div>
                <div className="flex justify-between"><span>AREA: {tableLabel}</span><span>STAFF: {serverName}</span></div>
                {order.customerDetails?.name && (
                  <div className="flex justify-between">
                    <span>CUSTOMER:</span>
                    <span className="font-bold uppercase">
                      {order.customerDetails.name}
                      {order.customerDetails?.customerId?.tags ? ` (${order.customerDetails.customerId.tags})` : ""}
                    </span>
                  </div>
                )}
              </div>
              <div className="border-t border-dashed border-black my-2" />
              <div className="text-[11px]">
                <div className="flex justify-between font-bold pb-1 border-b border-dotted border-black mb-1"><span className="w-8">QTY</span><span className="flex-1">ITEM</span><span className="text-right">AMT</span></div>
                <div className="space-y-1">
                  {allItems.map((item: any, idx: number) => {
                    const itemName = item.menuItemId?.name || item.name || "Item";
                    const variant = item.variantName || item.selectedVariant?.name;
                    const isComp = Boolean(item.isComplimentary);
                    const itemTotal = isComp ? 0 : ((item.variantPrice || item.price || 0) * (item.quantity || 1));
                    return (
                      <div key={idx} className="flex justify-between items-start gap-1">
                        <span className="w-8 font-bold shrink-0">{item.quantity}X</span>
                        <div className="flex-1 min-w-0">
                          <span className="uppercase break-words font-medium">{itemName}</span>
                          {isComp ? <span className="text-[9px] font-black text-purple-700 block uppercase">*** COMPLIMENTARY (FOC) ***</span> : (variant && variant !== "Standard" && <span className="text-[10px] text-slate-600 block">({variant})</span>)}
                        </div>
                        <span className="text-right shrink-0 font-medium">{isComp ? "₹0.00" : `₹${itemTotal.toFixed(2)}`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-dashed border-black my-2" />
              <div className="text-[11px] space-y-0.5">
                <div className="flex justify-between"><span>SUBTOTAL:</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>GST / TAX (5%):</span><span>₹{totalTax.toFixed(2)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>DISCOUNT{order.financials?.discountReason ? ` (${order.financials.discountReason})` : ""}:</span>
                    <span>- ₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t-2 border-solid border-black my-1" /><div className="flex justify-between font-black text-xs"><span>GRAND TOTAL:</span><span>₹{grandTotal.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="tear-divider"><span className="tear-text"><Scissors className="w-3 h-3 inline" /> Tear Along Perforation</span></div>

            <div className="store-copy bg-white p-5 rounded-2xl shadow-xl border border-slate-300 break-words font-mono text-xs leading-relaxed space-y-3">
              <div className="text-center pb-0.5"><h2 className="text-xs font-black uppercase tracking-wider text-black">{restaurantName}</h2><div className="inline-block border border-black px-2 py-0.5 mt-1 font-extrabold text-[9px] uppercase bg-slate-100 text-black">*** STORE / MERCHANT COPY ***</div></div>
              <div className="border-t border-dashed border-black my-2" />
              <div className="text-[11px] space-y-0.5">
                <div className="font-bold text-[9px] uppercase text-slate-700 mb-0.5">Ordered Items Summary:</div>
                {allItems.map((item: any, idx: number) => {
                  const isComp = Boolean(item.isComplimentary);
                  const itemTotal = isComp ? 0 : ((item.variantPrice || item.price || 0) * (item.quantity || 1));
                  return (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate pr-2">
                        {item.quantity}x {item.menuItemId?.name || item.name}
                        {isComp && " (COMPLIMENTARY)"}
                      </span>
                      <span className="shrink-0 font-mono">
                        {isComp ? "₹0.00" : `₹${itemTotal.toFixed(2)}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Settlement Summary */}
              <div className="text-[11px] space-y-0.5">
                <div className="flex justify-between font-black text-xs">
                  <span>AMOUNT SETTLED:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>PAYMENT METHOD:</span>
                  <span className="font-bold">
                    {order.financials?.payments && order.financials.payments.length > 0
                      ? order.financials.payments.map((p: any) => p.method).join(" + ")
                      : "CASH"}
                  </span>
                </div>
              </div>

              {/* Cashier / Customer Signatures */}
              <div className="pt-3 pb-1 text-[10px] space-y-2">
                <div className="flex justify-between items-end gap-4">
                  <div className="flex-1 border-t border-dotted border-black pt-1 text-center font-bold">
                    Cashier Signature
                  </div>
                  <div className="flex-1 border-t border-dotted border-black pt-1 text-center font-bold">
                    Customer Signature
                  </div>
                </div>
                <p className="text-[8px] text-center text-slate-500 font-bold uppercase mt-1">
                  * Store Accounting &amp; Audit Slip *
                </p>
              </div>
            </div>

          </div>
          
          {/* Action Buttons (Excluded from print) */}
          <div className="mt-5 pt-3 border-t border-slate-300 dark:border-slate-700 flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-400 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-800 h-9 px-4 text-xs font-bold rounded-xl"
            >
              Close
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white h-9 px-5 text-xs font-extrabold rounded-xl shadow-md gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Print 2-Part Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
