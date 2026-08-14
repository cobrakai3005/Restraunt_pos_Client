import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
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
    subtotal = order.kots.flatMap((k: any) => k.items).reduce((sum: number, item: any) => sum + ((item.variantPrice || 0) * item.quantity), 0);
    totalTax = subtotal * 0.05;
    grandTotal = Math.max(0, subtotal + totalTax - discount);
  }

  const handlePrint = () => {
    window.print();
  };

  const allItems = order.kots.flatMap((k: any) => k.items);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
        <div className="bg-[#Fdfdfd] p-6 text-black mx-auto w-full max-w-[340px]  shadow-2xl relative break-words" style={{ fontFamily: "monospace" }}>
          
          {/* A style block to hide everything else when printing */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden;
              }
              .receipt-print-area, .receipt-print-area * {
                visibility: visible;
              }
              .receipt-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                box-shadow: none;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          <div className="receipt-print-area">
            {/* Logo area */}
            <div className="text-center mb-4">
              <div className="text-4xl font-light tracking-widest mb-2">Ψ¶</div>
              <h1 className="text-xl font-bold tracking-widest uppercase break-words">{restaurant?.name || "VINIMAY CAFE"}</h1>
              {(() => {
                const addr = restaurant?.address;
                const lines: string[] = [];
                if (addr?.street) lines.push(addr.street);
                const cityLine = [addr?.city, addr?.state, addr?.zipCode].filter(Boolean).join(", ");
                if (cityLine) lines.push(cityLine);
                if (addr?.country && addr?.country !== "India") lines.push(addr.country);
                return lines.map((line, i) => <p key={i} className="text-sm break-words">{line}</p>);
              })()}
              {restaurant?.contact?.phone && <p className="text-sm break-words">PHONE: {restaurant.contact.phone}</p>}
              {restaurant?.contact?.email && <p className="text-sm break-words">{restaurant.contact.email}</p>}
              {restaurant?.compliance?.gstNumber && <p className="text-sm break-words">GSTIN: {restaurant.compliance.gstNumber}</p>}
            </div>

            <div className="border-t-2 border-black border-dashed my-3"></div>

            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="min-w-0 break-words">{format(new Date(), "dd/MM/yyyy HH:mm")}</span>
              </div>
              <div className="flex justify-between">
                <span className="min-w-0 break-words pr-2">RECEIPT: #{order._id.slice(-4).toUpperCase()}</span>
                <span className="shrink-0 whitespace-nowrap">TABLE: {order.tableId?.tableNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="min-w-0 break-words pr-2">SERVER: {order.waiterId?.contactName?.split(" ")[0].toUpperCase() || "STAFF"}</span>
                <span className="shrink-0 whitespace-nowrap">GUESTS: 1</span>
              </div>
              {(order.customerDetails?.name || order.customerDetails?.phone) && (
                <div className="flex justify-between mt-1">
                  <span className="min-w-0 break-words pr-2">CUSTOMER: {order.customerDetails.name?.toUpperCase() || "WALK-IN"}</span>
                  {order.customerDetails?.phone && <span className="shrink-0 whitespace-nowrap">{order.customerDetails.phone}</span>}
                </div>
              )}
            </div>

            <div className="border-t-2 border-black border-dashed my-3"></div>

            <div className="text-sm space-y-1">
              {allItems.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start gap-2">
                  <div className="flex gap-2 flex-1 min-w-0">
                    <span className="w-6 shrink-0">{item.quantity}X</span>
                    <span className="uppercase break-words min-w-0">{item.menuItemId?.name}</span>
                  </div>
                  <span className="shrink-0 whitespace-nowrap">₹{((item.variantPrice || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-black border-dashed my-3"></div>

            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="min-w-0 break-words pr-2">SUBTOTAL:</span>
                <span className="shrink-0 whitespace-nowrap">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="min-w-0 break-words pr-2">TAX (5%):</span>
                <span className="shrink-0 whitespace-nowrap">₹{totalTax.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between mb-1">
                  <span className="min-w-0 break-words pr-2">DISCOUNT:</span>
                  <span className="shrink-0 whitespace-nowrap">- ₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-black border-dashed my-1" />
              <div className="flex justify-between font-bold text-base mt-1">
                <span className="min-w-0 break-words pr-2">TOTAL:</span>
                <span className="shrink-0 whitespace-nowrap">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t-2 border-black border-dashed my-3"></div>

            {order.status === "PAID" && (
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="min-w-0 break-words pr-2">PAYMENT:</span>
                  <span className="shrink-0 whitespace-nowrap">COMPLETED</span>
                </div>
                {order.financials?.payments && order.financials.payments.length > 0 ? (
                  order.financials.payments.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs font-mono">
                      <span className="min-w-0 break-words pr-2">↳ {p.method}:</span>
                      <span className="shrink-0 whitespace-nowrap">₹{p.amount.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between">
                    <span className="min-w-0 break-words pr-2">STATUS:</span>
                    <span className="shrink-0 whitespace-nowrap">APPROVED</span>
                  </div>
                )}
              </div>
            )}

            <div className="text-center mt-6 mb-2">
              <p className="text-sm font-bold">TIP IS NOT INCLUDED.</p>
              <p className="text-sm font-bold">PLEASE COME AGAIN!</p>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center gap-4 no-print">
            <Button variant="outline" onClick={onClose} className="border-black text-black hover:bg-slate-200">Close</Button>
            <Button onClick={handlePrint} className="bg-black text-white hover:bg-slate-800">
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
