import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { format } from "date-fns";

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export function ReceiptModal({ isOpen, onClose, order }: ReceiptModalProps) {
  if (!order) return null;

  let subtotal = order.financials?.subtotal || 0;
  let totalTax = order.financials?.totalTax || 0;
  let grandTotal = order.financials?.grandTotal || 0;

  if (order.status === "OPEN") {
    subtotal = order.kots.flatMap((k: any) => k.items).reduce((sum: number, item: any) => sum + ((item.variantPrice || 0) * item.quantity), 0);
    totalTax = subtotal * 0.05;
    grandTotal = subtotal + totalTax;
  }

  const handlePrint = () => {
    window.print();
  };

  const allItems = order.kots.flatMap((k: any) => k.items);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
        <div className="bg-[#Fdfdfd] p-6 text-black mx-auto w-full max-w-[340px] shadow-2xl relative overflow-hidden" style={{ fontFamily: "monospace" }}>
          
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
              <h1 className="text-2xl font-bold tracking-widest uppercase">VINIMAY CAFE</h1>
              <p className="text-sm mt-1">123 CULINARY AVENUE</p>
              <p className="text-sm">DOWNTOWN DISTRICT</p>
              <p className="text-sm">PHONE: (555) 123-4567</p>
              <p className="text-sm">WWW.VINIMAYCAFE.COM</p>
            </div>

            <div className="border-t-2 border-black border-dashed my-3"></div>

            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span>{format(new Date(), "dd/MM/yyyy HH:mm")}</span>
              </div>
              <div className="flex justify-between">
                <span>RECEIPT: #{order._id.slice(-4).toUpperCase()}</span>
                <span>TABLE: {order.tableId?.tableNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span>SERVER: {order.waiterId?.contactName?.split(" ")[0].toUpperCase() || "STAFF"}</span>
                <span>GUESTS: 1</span>
              </div>
            </div>

            <div className="border-t-2 border-black border-dashed my-3"></div>

            <div className="text-sm space-y-1">
              {allItems.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex gap-2 w-3/4">
                    <span className="w-6">{item.quantity}X</span>
                    <span className="uppercase break-words">{item.menuItemId?.name}</span>
                  </div>
                  <span>₹{((item.variantPrice || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-black border-dashed my-3"></div>

            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span>SUBTOTAL:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>TAX (5%):</span>
                <span>₹{totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base mt-2">
                <span>TOTAL:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t-2 border-black border-dashed my-3"></div>

            {order.status === "PAID" && (
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>PAYMENT:</span>
                  <span>COMPLETED</span>
                </div>
                <div className="flex justify-between">
                  <span>STATUS:</span>
                  <span>APPROVED</span>
                </div>
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
