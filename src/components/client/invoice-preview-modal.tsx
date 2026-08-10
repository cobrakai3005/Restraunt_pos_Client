"use client";

import React, { useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X, Printer, Download, Mail, MessageSquare } from "lucide-react";
import { Transaction } from "@/services/transaction.service";

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

  const invoiceNumber = transaction ? `INV-${new Date(transaction.transactionDate).getTime().toString().slice(-6)}` : '';
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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Right aligned slide-over sheet */}
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto bg-gray-50 p-0 flex flex-col h-full border-l-0 shadow-2xl z-[100]">
        
        {/* Header Options */}
        <div className="flex items-center justify-between p-4 bg-white border-b print:hidden sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Invoice Preview</h2>
            <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">template1</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        </div>

        {/* Invoice Paper Canvas */}
        <div className="flex-1 p-6 overflow-y-auto flex justify-center bg-gray-200">
          <div 
            ref={printRef}
            className="bg-white shadow-lg print:shadow-none print:m-0 print:p-0 print:border-none border border-gray-300 w-full"
            style={{ minHeight: "297mm", maxWidth: "210mm", padding: "40px" }}
          >
            {/* INVOICE CONTENT START */}
            <div className="flex flex-col h-full text-gray-900">
              
              {/* Top Header */}
              <div className="flex justify-between items-start mb-12">
                <h1 className="text-5xl font-extrabold tracking-tight">INVOICE</h1>
                <div className="text-right text-sm">
                  <div className="flex justify-between w-48 mb-1">
                    <span className="text-gray-400">Invoice #:</span> 
                    <span className="font-bold">INV-{new Date(transaction.transactionDate).getTime().toString().slice(-6)}</span>
                  </div>
                  <div className="flex justify-between w-48 mb-1">
                    <span className="text-gray-400">Issue Date:</span> 
                    <span className="font-bold">{new Date(transaction.transactionDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between w-48 mb-1">
                    <span className="text-gray-400">Due Date:</span> 
                    <span className="font-bold">{transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : "-"}</span>
                  </div>
                </div>
              </div>

              {/* Bill From / Bill To */}
              <div className="flex justify-between mb-12 text-sm">
                <div>
                  <p className="text-gray-400 text-[10px] font-bold tracking-wider mb-2">BILL FROM:</p>
                  <p className="font-bold text-base mb-1">{restaurantDetails?.name || "Your Company Name"}</p>
                  {restaurantDetails?.address ? (
                    <>
                      <p className="text-gray-400">{restaurantDetails.address.street || "Street Address"}</p>
                      <p className="text-gray-400">
                        {`${restaurantDetails.address.city || ''}, ${restaurantDetails.address.state || ''} ${restaurantDetails.address.zipCode || ''}`.replace(/^[,\s]+|[,\s]+$/g, '') || "City, State, Zip Code"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-400">Street Address</p>
                      <p className="text-gray-400">City, State, Zip Code</p>
                    </>
                  )}
                  <p className="text-gray-400">{restaurantDetails?.phone || "Phone Number"}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-[10px] font-bold tracking-wider mb-2">BILL TO:</p>
                  <p className="font-bold text-base mb-1">{transaction.companyName || transaction.customerName || "Customer Name"}</p>
                  <p className="text-gray-400">Street Address</p>
                  <p className="text-gray-400">City, State, Zip Code</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="w-full text-sm mb-4">
                {/* Table Header */}
                <div className="flex bg-[#F8F9F8] font-bold">
                  <div className="flex-1 p-3">Description</div>
                  <div className="w-24 text-right p-3">Price</div>
                  <div className="w-24 text-center p-3">QTY</div>
                  <div className="w-32 text-right bg-[#A6B8A2] text-gray-900 p-3">Total</div>
                </div>
                
                {/* Table Rows */}
                {transaction.items && transaction.items.map((item: any, idx: number) => {
                  const rate = item.pricePerUnit || 0;
                  const qty = item.quantity || 1;
                  const amount = rate * qty;
                  
                  return (
                    <div key={idx} className="flex items-stretch odd:bg-white even:bg-[#F8F9F8]">
                      <div className="flex-1 font-bold p-3 flex items-center">{item.name}</div>
                      <div className="w-24 text-right p-3 flex items-center justify-end">Rs. {rate.toFixed(2)}</div>
                      <div className="w-24 text-center p-3 flex items-center justify-center">{qty}</div>
                      <div className="w-32 text-right bg-[#A6B8A2] text-gray-900 p-3 flex items-center justify-end font-bold">
                        Rs. {amount.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end mt-8 mb-16">
                <div className="w-64">
                  <div className="flex justify-between p-2 text-sm font-bold">
                    <span>Subtotal</span>
                    <span>Rs. {transaction.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 text-sm font-bold">
                    <span>Tax</span>
                    <span>Rs. {transaction.taxAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-3 mt-2 text-sm font-bold bg-[#A6B8A2] text-gray-900">
                    <span>Total Due</span>
                    <span>Rs. {transaction.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Notes */}
              <div className="mt-auto pt-6 border-t border-gray-200 flex justify-between text-sm">
                <div className="w-1/2 pr-4">
                  <p className="font-bold mb-1">Payment Terms:</p>
                  <p className="text-gray-400">
                    {restaurantDetails?.bankDetails?.[0] ? 
                      `Bank: ${restaurantDetails.bankDetails[0].bankName} | A/C: ${restaurantDetails.bankDetails[0].accountNumber} | IFSC: ${restaurantDetails.bankDetails[0].ifscCode}` 
                      : "Add your payment terms here"}
                  </p>
                </div>
                <div className="w-1/2 pl-4">
                  <p className="font-bold mb-1">Notes:</p>
                  <p className="text-gray-400 whitespace-pre-wrap">{transaction.description || "Add any additional notes here"}</p>
                </div>
              </div>

            </div>
            {/* INVOICE CONTENT END */}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-white border-t flex items-center justify-between print:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button variant="outline" onClick={onClose} className="px-6 rounded-full font-medium">
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="default" onClick={handleWhatsApp} className="bg-[#25D366] hover:bg-[#20b558] text-white flex items-center gap-2 rounded-full font-medium">
              <MessageSquare className="w-4 h-4" /> WhatsApp Invoice
            </Button>
            <Button variant="default" onClick={handleEmail} className="bg-[#f26522] hover:bg-[#db5b1f] text-white flex items-center gap-2 rounded-full font-medium">
              <Mail className="w-4 h-4" /> Email Invoice
            </Button>
            <Button variant="outline" onClick={handleDownload} className="border-amber-500 text-amber-600 hover:bg-amber-50 flex items-center gap-2 rounded-full font-medium">
              <Download className="w-4 h-4" /> Download PDF
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
