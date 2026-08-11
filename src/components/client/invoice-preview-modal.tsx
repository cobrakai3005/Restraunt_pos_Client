"use client";

import React, { useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X, Printer, Download, Mail, MessageSquare } from "lucide-react";
import { Transaction } from "@/services/transaction.service";
import { format } from "date-fns";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  restaurantDetails: any | null; // Pass active restaurant details
  autoAction?: 'print' | 'download' | 'whatsapp' | 'email' | null;
}

export function InvoicePreviewModal({
  isOpen,
  onClose,
  transaction,
  restaurantDetails,
  autoAction = null,
}: InvoicePreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = transaction?.referenceNumber || `INV-${transaction?._id?.slice(-6).toUpperCase() || "000000"}`;
  const totalDue = transaction?.totalAmount?.toFixed(2) || '';
  const company = restaurantDetails?.name || "Our Restaurant";

  const handleWhatsApp = () => {
    const text = `Hello from ${company}!%0A%0AHere are your invoice details:%0AInvoice #: ${invoiceNumber}%0ATotal Due: Rs. ${totalDue}%0A%0AThank you for your business!`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const subject = `Invoice ${invoiceNumber} from ${company}`;
    const body = `Hello,%0D%0A%0D%0APlease find the details for Invoice ${invoiceNumber}.%0D%0A%0D%0ATotal Due: Rs. ${totalDue}%0D%0A%0D%0AThank you,%0D%0A${company}`;
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleDownload = async () => {
    if (!printRef.current) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin:       0,
        filename:     `Invoice_${invoiceNumber}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(printRef.current).save();
    } catch (e) {
      console.error("Failed to generate PDF", e);
    }
  };

  // Auto trigger action on open if requested
  React.useEffect(() => {
    if (isOpen && autoAction && printRef.current) {
      // Slight delay to ensure rendering is complete
      const timer = setTimeout(() => {
        if (autoAction === 'print') handlePrint();
        else if (autoAction === 'download') handleDownload();
        else if (autoAction === 'whatsapp') handleWhatsApp();
        else if (autoAction === 'email') handleEmail();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoAction]);

  if (!transaction) return null;

  const items = Array.isArray(transaction.items) ? transaction.items : [];
  const subtotal = transaction.subtotal || 0;
  const taxAmount = transaction.taxAmount || 0;
  const discountAmount = transaction.discountAmount || 0;
  const totalAmount = transaction.totalAmount || 0;
  const customerName = transaction.customerName || transaction.companyName || "Walk-in Customer";
  const addr = restaurantDetails?.address;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-gray-200 p-0 flex flex-col h-full border-l-0 shadow-2xl z-[100]">
        {/* Header Options */}
        <div className="flex items-center justify-between p-4 bg-white border-b print:hidden sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Invoice Preview</h2>
            <span className="bg-black text-white text-xs px-3 py-1 rounded-full font-medium">receipt</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        </div>

        {/* Receipt Paper Canvas */}
        <div className="flex-1 p-6   overflow-y-auto flex justify-center">
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

          <div
            ref={printRef}
            className="bg-[#Fdfdfd] h-fit  text-black mx-auto w-full max-w-[340px] p-6 shadow-2xl receipt-print-area break-words"
            style={{ fontFamily: "monospace" }}
          >
            {/* Logo / Restaurant header */}
            <div className="text-center mb-4">
              <div className="text-4xl font-light tracking-widest mb-2">Ψ¶</div>
              <h1 className="text-xl font-bold tracking-widest uppercase break-words">{restaurantDetails?.name || "VINIMAY CAFE"}</h1>
              {(() => {
                const lines: string[] = [];
                if (addr?.street) lines.push(addr.street);
                const cityLine = [addr?.city, addr?.state, addr?.zipCode].filter(Boolean).join(", ");
                if (cityLine) lines.push(cityLine);
                if (addr?.country && addr?.country !== "India") lines.push(addr.country);
                return lines.map((line, i) => <p key={i} className="text-sm break-words">{line}</p>);
              })()}
              {restaurantDetails?.contact?.phone && <p className="text-sm break-words">PHONE: {restaurantDetails.contact.phone}</p>}
              {restaurantDetails?.contact?.email && <p className="text-sm break-words">{restaurantDetails.contact.email}</p>}
              {restaurantDetails?.compliance?.gstNumber && <p className="text-sm break-words">GSTIN: {restaurantDetails.compliance.gstNumber}</p>}
            </div>

            <div className="border-t-2 border-black border-dashed my-3"></div>

            {/* Invoice meta */}
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="min-w-0 break-words">{format(new Date(transaction.transactionDate || new Date()), "dd/MM/yyyy HH:mm")}</span>
              </div>
              <div className="flex justify-between">
                <span className="min-w-0 break-words">INVOICE: #{invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="min-w-0 break-words">BILL TO: {customerName}</span>
              </div>
              {transaction.referenceNumber && (
                <div className="flex justify-between">
                  <span className="min-w-0 break-words">REF: {transaction.referenceNumber}</span>
                </div>
              )}
            </div>

            <div className="border-t-2 border-black border-dashed my-3"></div>

            {/* Items */}
            <div className="text-sm space-y-1">
              {items.length === 0 ? (
                <div className="flex justify-between items-start">
                  <span className="uppercase min-w-0 break-words">No items</span>
                </div>
              ) : (
                items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start gap-2">
                    <div className="flex gap-2 flex-1 min-w-0">
                      <span className="w-6 shrink-0">{item.quantity || 1}X</span>
                      <span className="uppercase break-words min-w-0">{item.name}</span>
                    </div>
                    <span className="shrink-0 whitespace-nowrap">₹{((item.pricePerUnit || 0) * (item.quantity || 1)).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="border-t-2 border-black border-dashed my-3"></div>

            {/* Totals */}
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="min-w-0 break-words pr-2">SUBTOTAL:</span>
                <span className="shrink-0 whitespace-nowrap">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="min-w-0 break-words pr-2">TAX:</span>
                <span className="shrink-0 whitespace-nowrap">₹{taxAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between mb-1">
                  <span className="min-w-0 break-words pr-2">DISCOUNT:</span>
                  <span className="shrink-0 whitespace-nowrap">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base mt-2">
                <span className="min-w-0 break-words pr-2">TOTAL:</span>
                <span className="shrink-0 whitespace-nowrap">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t-2 border-black border-dashed my-3"></div>

            {transaction.paymentMethod && (
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="min-w-0 break-words pr-2">PAYMENT:</span>
                  <span className="shrink-0 whitespace-nowrap">{transaction.paymentMethod.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="min-w-0 break-words pr-2">STATUS:</span>
                  <span className="shrink-0 whitespace-nowrap">{transaction.status === "PAID" ? "APPROVED" : transaction.status}</span>
                </div>
              </div>
            )}

            <div className="text-center mt-6 mb-2">
              <p className="text-sm font-bold">TIP IS NOT INCLUDED.</p>
              <p className="text-sm font-bold">PLEASE COME AGAIN!</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-white border-t flex items-center justify-between print:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button variant="outline" onClick={onClose} className="px-6 rounded-full font-medium">
            Close
          </Button>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="default" onClick={handleWhatsApp} className="bg-[#25D366] hover:bg-[#20b558] text-white flex items-center gap-2 rounded-full font-medium">
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </Button>
            <Button variant="default" onClick={handleEmail} className="bg-[#f26522] hover:bg-[#db5b1f] text-white flex items-center gap-2 rounded-full font-medium">
              <Mail className="w-4 h-4" /> Email
            </Button>
            <Button variant="outline" onClick={handleDownload} className="border-amber-500 text-amber-600 hover:bg-amber-50 flex items-center gap-2 rounded-full font-medium">
              <Download className="w-4 h-4" /> PDF
            </Button>
            <Button variant="default" onClick={handlePrint} className="bg-[#00a651] hover:bg-[#009247] text-white flex items-center gap-2 rounded-full font-medium">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
