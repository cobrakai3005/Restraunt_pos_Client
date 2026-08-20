"use client";

import React, { useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X, Printer, Download, Mail, MessageSquare, Scissors } from "lucide-react";
import { Transaction } from "@/services/transaction.service";
import { format } from "date-fns";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  restaurantDetails: any | null;
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

  const invoiceNumber = transaction?.referenceNumber || `INV-${transaction?._id?.slice(-6).toUpperCase() || "000000"}`;
  const totalDue = transaction?.totalAmount?.toFixed(2) || '';
  const company = restaurantDetails?.name || "VINIMAY CAFE";

  const handlePrint = () => {
    const printContent = document.getElementById("client-invoice-print-area");
    if (!printContent) return;

    // Create an isolated hidden iframe for printing
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
          <title>Invoice_${invoiceNumber}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 4mm;
              font-family: -apple-system, BlinkMacSystemFont, "Courier New", Courier, monospace, sans-serif;
              font-size: 11px;
              line-height: 1.35;
              color: #000000;
              background: #ffffff;
              width: 72mm;
              box-sizing: border-box;
            }
            * { box-sizing: border-box; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .border-dashed { border-top: 1px dashed #000; margin: 6px 0; }
            .border-dotted { border-top: 1px dotted #000; margin: 4px 0; }
            .border-solid { border-top: 1px solid #000; margin: 5px 0; }
            .space-y-1 > * + * { margin-top: 3px; }
            .space-y-2 > * + * { margin-top: 6px; }
            .badge {
              display: inline-block;
              border: 1px solid #000;
              padding: 2px 6px;
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 3px;
            }
            .cut-divider {
              margin: 14px 0 10px 0;
              text-align: center;
              border-top: 2px dashed #000;
              padding-top: 4px;
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              margin-top: 16px;
              padding-bottom: 2px;
            }
            .sign-box {
              flex: 1;
              border-top: 1px dotted #000;
              text-align: center;
              padding-top: 3px;
              font-size: 9px;
            }
            .w-8 { width: 24px; flex-shrink: 0; }
            .flex-1 { flex: 1; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch (e) {}
      }, 2000);
    }, 250);
  };

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
        margin:       [4, 4, 4, 4],
        filename:     `Invoice_${invoiceNumber}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: [80, 297], orientation: 'portrait' }
      };
      html2pdf().set(opt).from(printRef.current).save();
    } catch (e) {
      console.error("Failed to generate PDF", e);
    }
  };

  // Auto trigger action on open if requested
  React.useEffect(() => {
    if (isOpen && autoAction && printRef.current) {
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
  const customerName = transaction.customerName?.trim() || transaction.companyName?.trim() || "Walk-in Guest";
  const addr = restaurantDetails?.address;
  const txDate = transaction.transactionDate ? new Date(transaction.transactionDate) : new Date();

  // ── Payment Tender & Credit Breakdown Calculations ──
  const txPayments: Array<{ method: string; amount: number }> = Array.isArray(transaction.payments) && transaction.payments.length > 0
    ? transaction.payments
    : [];

  let txCreditDue = 0;
  let txPaid = 0;

  if (txPayments.length > 0) {
    txPayments.forEach((p: any) => {
      const amt = Number(p.amount) || 0;
      const m = String(p.method || "").toUpperCase();
      if (m === "CREDIT" || m === "DUE") {
        txCreditDue += amt;
      } else {
        txPaid += amt;
      }
    });
  } else if (transaction.paidAmount !== undefined) {
    txPaid = Number(transaction.paidAmount || 0);
    txCreditDue = Math.max(0, totalAmount - txPaid);
  } else if (transaction.status === "PAID") {
    txPaid = totalAmount;
    txCreditDue = 0;
  } else {
    txPaid = 0;
    txCreditDue = totalAmount;
  }

  let txStatusDisplay = "PENDING";
  if (transaction.status === "PAID") {
    if (txCreditDue > 0 && txPaid > 0) {
      txStatusDisplay = "PARTIALLY PAID";
    } else if (txCreditDue > 0 && txPaid === 0) {
      txStatusDisplay = "CREDIT / UNPAID";
    } else {
      txStatusDisplay = "PAID IN FULL";
    }
  } else if (transaction.status === "PARTIAL") {
    txStatusDisplay = "PARTIALLY PAID";
  } else if (transaction.status === "UNPAID") {
    txStatusDisplay = "UNPAID / CREDIT";
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-slate-100 dark:bg-slate-900 p-0 flex flex-col h-full border-l-0 shadow-2xl z-[100]">
        {/* Header Options */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Invoice Preview</h2>
            <span className="bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">2-Part Paper</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </Button>
        </div>

        {/* Receipt Paper Canvas */}
        <div className="flex-1 p-4 overflow-y-auto flex justify-center bg-slate-200/70 dark:bg-slate-950/70">
          <div
            ref={printRef}
            id="client-invoice-print-area"
            className="w-full max-w-[360px] space-y-4"
          >
            {/* ══════════════════════════════════════════════════
                PART 1: CUSTOMER COPY (CARD 1)
               ══════════════════════════════════════════════════ */}
            <div className="customer-copy bg-white dark:bg-white text-black p-5 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-700 break-words font-mono text-xs leading-relaxed space-y-3">
              <div className="text-center pb-1">
                <div className="text-2xl font-black tracking-widest mb-0.5">Ψ¶</div>
                <h1 className="text-sm font-black tracking-wider uppercase text-black">{company}</h1>
                {(() => {
                  const lines: string[] = [];
                  if (addr?.street) lines.push(addr.street);
                  const cityLine = [addr?.city, addr?.state, addr?.zipCode].filter(Boolean).join(", ");
                  if (cityLine) lines.push(cityLine);
                  return lines.map((line, i) => <p key={i} className="text-[10px] text-slate-700">{line}</p>);
                })()}
                {restaurantDetails?.contact?.phone && <p className="text-[10px] text-slate-700">TEL: {restaurantDetails.contact.phone}</p>}
                {restaurantDetails?.compliance?.gstNumber && <p className="text-[10px] text-slate-700">GSTIN: {restaurantDetails.compliance.gstNumber}</p>}
                <div className="inline-block border border-black px-2 py-0.5 mt-1 font-extrabold text-[9px] tracking-wider uppercase bg-white text-black">
                  {transaction.type === "RECEIPT"
                    ? "*** PAYMENT RECEIPT VOUCHER ***"
                    : transaction.type === "PAYMENT"
                    ? "*** PAYMENT / EXPENSE VOUCHER ***"
                    : transaction.type === "PURCHASE"
                    ? "*** PURCHASE BILL ***"
                    : "*** CUSTOMER COPY (TAX INVOICE) ***"}
                </div>
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Invoice meta */}
              <div className="text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span>DATE: {format(txDate, "dd/MM/yyyy HH:mm")}</span>
                  <span className="font-bold">
                    {transaction.type === "RECEIPT" ? "RECEIPT:" : transaction.type === "PURCHASE" ? "BILL:" : "INVOICE:"} #{invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="truncate pr-1">
                    {transaction.type === "PURCHASE" || transaction.type === "PAYMENT" ? "PAID TO:" : "BILL TO:"} {customerName}
                  </span>
                </div>
                {transaction.referenceNumber && (
                  <div className="flex justify-between">
                    <span>REF: {transaction.referenceNumber}</span>
                    <span>TYPE: {transaction.type}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Items */}
              <div className="text-[11px]">
                <div className="flex justify-between font-bold pb-1 border-b border-dotted border-black mb-1">
                  <span className="w-8">QTY</span>
                  <span className="flex-1">{transaction.type === "RECEIPT" || transaction.type === "PAYMENT" ? "PARTICULARS" : "ITEM"}</span>
                  <span className="text-right">AMT</span>
                </div>
                <div className="space-y-1">
                  {items.length === 0 ? (
                    <div className="flex justify-between items-start">
                      <span className="uppercase font-medium">
                        {transaction.type === "RECEIPT"
                          ? transaction.description || "Credit / Due Settlement Payment"
                          : transaction.type === "PAYMENT"
                          ? transaction.description || "Expense / Vendor Payment"
                          : "Standard Billing Item"}
                      </span>
                      <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
                    </div> 
                  ) : (
                    items.map((item: any, idx: number) => {
                      const isComp = item.name?.includes("(COMPLIMENTARY)") || item.pricePerUnit === 0;
                      const itemAmt = isComp ? 0 : ((item.pricePerUnit || 0) * (item.quantity || 1));
                      return (
                        <div key={idx} className="flex justify-between items-start gap-1">
                          <span className="w-8 font-bold shrink-0">{item.quantity || 1}X</span>
                          <div className="flex-1 min-w-0">
                            <span className="uppercase break-words font-medium">{item.name}</span>
                            {isComp && (
                              <span className="text-[9px] font-black text-purple-700 block uppercase">
                                *** COMPLIMENTARY (FOC) ***
                              </span>
                            )}
                          </div>
                          <span className="text-right shrink-0 font-medium">
                            {isComp ? "₹0.00" : `₹${itemAmt.toFixed(2)}`}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Totals */}
              <div className="text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TAX / GST (5%):</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>DISCOUNT:</span>
                    <span>- ₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t-2 border-solid border-black my-1" />
                <div className="flex justify-between font-black text-xs pt-0.5">
                  <span>GRAND TOTAL:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* ── PAYMENT SUMMARY SECTION ── */}
              <div className="border-t border-dashed border-black my-2" />
              <div className="text-center font-bold text-[10px] uppercase tracking-wider py-0.5 bg-slate-50 border-y border-dotted border-black">
                PAYMENT SUMMARY
              </div>
              <div className="text-[11px] space-y-1 pt-1.5">
                <div className="flex justify-between font-bold">
                  <span>Grand Total:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>

                {txPayments.length > 0 ? (
                  <div className="pt-0.5 pb-0.5 space-y-0.5 border-t border-dotted border-black/40 my-1">
                    {txPayments.map((p, pIdx) => {
                      const pMethod = String(p.method || "").toUpperCase();
                      const pAmt = Number(p.amount) || 0;
                      const isCredit = pMethod === "CREDIT" || pMethod === "DUE";
                      const label = isCredit
                        ? "Credit / Due:"
                        : `${pMethod === "CASH" ? "Cash" : pMethod === "UPI" ? "UPI" : pMethod === "CARD" ? "Card" : pMethod} Paid:`;
                      return (
                        <div key={pIdx} className="flex justify-between pl-1">
                          <span className={isCredit ? "font-bold text-amber-900" : ""}>{label}</span>
                          <span className={isCredit ? "font-bold" : ""}>₹{pAmt.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="pt-0.5 pb-0.5 space-y-0.5 border-t border-dotted border-black/40 my-1">
                    {txPaid > 0 && (
                      <div className="flex justify-between pl-1">
                        <span>{transaction.paymentMethod || "Cash"} Paid:</span>
                        <span>₹{txPaid.toFixed(2)}</span>
                      </div>
                    )}
                    {txCreditDue > 0 && (
                      <div className="flex justify-between pl-1 font-bold text-amber-900">
                        <span>Credit / Due:</span>
                        <span>₹{txCreditDue.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-dotted border-black/60 my-1" />

                <div className="flex justify-between font-bold">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-800">₹{txPaid.toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-bold">
                  <span>Balance Due:</span>
                  <span className={txCreditDue > 0 ? "font-black text-rose-700" : ""}>
                    ₹{txCreditDue.toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-dashed border-black/60 my-1" />

                <div className="flex justify-between font-black text-[10px] pt-0.5">
                  <span>Payment Status:</span>
                  <span className={`uppercase ${
                    txCreditDue === 0 && txPaid > 0
                      ? "text-emerald-800"
                      : txCreditDue > 0 && txPaid > 0
                      ? "text-amber-800"
                      : "text-slate-800"
                  }`}>
                    {txStatusDisplay}
                  </span>
                </div>
              </div>

              <div className="text-center pt-2 pb-1 space-y-0.5 text-[10px] text-slate-700">
                <p className="font-bold">TIP IS NOT INCLUDED</p>
                <p>THANK YOU! PLEASE VISIT AGAIN</p>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════
                PERFORATION / TEAR-OFF CUT LINE (DIVIDER)
               ══════════════════════════════════════════════════ */}
            <div className="my-2 py-1 flex items-center justify-center gap-2 select-none text-slate-500 font-bold text-[10px] uppercase tracking-wider">
              <div className="flex-1 border-t-2 border-dashed border-slate-400" />
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-300/60 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 text-[9px] font-extrabold">
                <Scissors className="w-3 h-3" /> Tear Along Perforation <Scissors className="w-3 h-3 scale-x-[-1]" />
              </span>
              <div className="flex-1 border-t-2 border-dashed border-slate-400" />
            </div>

            {/* ══════════════════════════════════════════════════
                PART 2: STORE / MERCHANT / KITCHEN COPY (CARD 2)
               ══════════════════════════════════════════════════ */}
            <div className="store-copy bg-white dark:bg-white text-black p-5 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-700 break-words font-mono text-xs leading-relaxed space-y-3">
              <div className="text-center pb-0.5">
                <h2 className="text-xs font-black uppercase tracking-wider text-black">{company}</h2>
                <div className="inline-block border border-black px-2 py-0.5 mt-1 font-extrabold text-[9px] tracking-wider uppercase bg-slate-100 text-black">
                  *** STORE / MERCHANT COPY ***
                </div>
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Compact Audit Metadata */}
              <div className="text-[11px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>INVOICE: #{invoiceNumber}</span>
                  <span>{transaction.type || "SALES"}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE: {format(txDate, "dd/MM/yyyy HH:mm")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="truncate pr-1">PARTY: {customerName}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* Items Summary */}
              <div className="text-[11px] space-y-0.5">
                <div className="font-bold text-[9px] uppercase text-slate-700 mb-0.5">Ordered Items Summary:</div>
                {items.length === 0 ? (
                  <div className="flex justify-between">
                    <span>1x Standard Billing Item</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  items.map((item: any, idx: number) => {
                    const isComp = item.name?.includes("(COMPLIMENTARY)") || item.pricePerUnit === 0;
                    const itemAmt = isComp ? 0 : ((item.pricePerUnit || 0) * (item.quantity || 1));
                    return (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate pr-2">{item.quantity || 1}x {item.name}</span>
                        <span className="shrink-0 font-mono">{isComp ? "₹0.00" : `₹${itemAmt.toFixed(2)}`}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-dashed border-black my-2" />

              {/* ── STORE SETTLEMENT SUMMARY ── */}
              <div className="text-center font-bold text-[10px] uppercase tracking-wider py-0.5 bg-slate-50 border-y border-dotted border-black">
                PAYMENT SUMMARY
              </div>
              <div className="text-[11px] space-y-1 pt-1.5">
                <div className="flex justify-between font-black text-xs">
                  <span>GRAND TOTAL:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>

                {txPayments.length > 0 ? (
                  <div className="pt-0.5 pb-0.5 space-y-0.5 border-t border-dotted border-black/40 my-1">
                    {txPayments.map((p, pIdx) => {
                      const pMethod = String(p.method || "").toUpperCase();
                      const pAmt = Number(p.amount) || 0;
                      const isCredit = pMethod === "CREDIT" || pMethod === "DUE";
                      const label = isCredit
                        ? "Credit / Due:"
                        : `${pMethod === "CASH" ? "Cash" : pMethod === "UPI" ? "UPI" : pMethod === "CARD" ? "Card" : pMethod} Paid:`;
                      return (
                        <div key={pIdx} className="flex justify-between pl-1">
                          <span className={isCredit ? "font-bold text-amber-900" : ""}>{label}</span>
                          <span className={isCredit ? "font-bold" : ""}>₹{pAmt.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex justify-between text-[10px]">
                    <span>PAYMENT METHOD:</span>
                    <span className="font-bold">{transaction.paymentMethod?.toUpperCase() || "CASH"}</span>
                  </div>
                )}

                <div className="border-t border-dotted border-black/60 my-1" />

                <div className="flex justify-between font-bold">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-800">₹{txPaid.toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-bold">
                  <span>Balance Due:</span>
                  <span className={txCreditDue > 0 ? "font-black text-rose-700" : ""}>
                    ₹{txCreditDue.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between font-black text-[10px] pt-0.5">
                  <span>Payment Status:</span>
                  <span className="uppercase">{txStatusDisplay}</span>
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
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button variant="outline" onClick={onClose} className="px-5 rounded-xl font-bold text-xs">
            Close
          </Button>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="default" onClick={handleWhatsApp} className="bg-[#25D366] hover:bg-[#20b558] text-white flex items-center gap-1.5 rounded-xl font-bold text-xs h-9 px-3.5 shadow-sm">
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </Button>
            <Button variant="default" onClick={handleEmail} className="bg-[#f26522] hover:bg-[#db5b1f] text-white flex items-center gap-1.5 rounded-xl font-bold text-xs h-9 px-3.5 shadow-sm">
              <Mail className="w-3.5 h-3.5" /> Email
            </Button>
            <Button variant="outline" onClick={handleDownload} className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-1.5 rounded-xl font-bold text-xs h-9 px-3.5">
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
            <Button variant="default" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 rounded-xl font-bold text-xs h-9 px-4 shadow-sm">
              <Printer className="w-3.5 h-3.5" /> Print 2-Part
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
