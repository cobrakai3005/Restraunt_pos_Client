import React, { useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Scissors, X, Loader2 } from "lucide-react";
import { format } from "date-fns";

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  tables?: any[];
  restaurant?: {
    name?: string;
    address?: { street?: string; city?: string; state?: string; zipCode?: string; country?: string };
    contact?: { phone?: string; email?: string; managerName?: string };
    compliance?: { gstNumber?: string; fssaiNumber?: string };
  } | null;
}

export function ReceiptModal({ isOpen, onClose, order, tables, restaurant }: ReceiptModalProps) {
  if (!isOpen) return null;

  if (!order) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[420px] bg-slate-900 border-slate-800 p-6 flex flex-col items-center justify-center space-y-3 text-white z-[100]">
          <DialogTitle className="sr-only">Loading Receipt</DialogTitle>
          <DialogDescription className="sr-only">Please wait while the receipt is being generated</DialogDescription>
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold text-slate-300">Generating receipt...</p>
        </DialogContent>
      </Dialog>
    );
  }

  const discount = Number(order?.financials?.discount || 0);
  let subtotal = Number(order?.financials?.subtotal || 0);
  let totalTax = Number(order?.financials?.totalTax || 0);
  let grandTotal = Number(order?.financials?.grandTotal || 0);

  if (order?.status === "OPEN" || subtotal === 0) {
    subtotal = (order?.kots || []).flatMap((k: any) => k?.items || []).reduce((sum: number, item: any) => {
      return sum + (item?.isComplimentary ? 0 : (Number(item?.variantPrice || item?.price || 0) * Number(item?.quantity || 1)));
    }, 0);
    totalTax = subtotal * 0.05;
    grandTotal = Math.max(0, subtotal + totalTax - discount);
  }

  const allItems = (order?.kots || []).flatMap((k: any) => k?.items || []);
  const restaurantName = restaurant?.name || (order as any)?.restaurant?.name || (typeof order?.restaurantId === 'object' ? (order?.restaurantId as any)?.name : null) || "VINIMAY CAFE";
  
  let formattedDate = "";
  try {
    const rawDate = order?.createdAt ? new Date(order.createdAt) : new Date();
    formattedDate = !isNaN(rawDate.getTime()) ? format(rawDate, "dd/MM/yyyy HH:mm") : format(new Date(), "dd/MM/yyyy HH:mm");
  } catch {
    formattedDate = new Date().toLocaleString();
  }

  const receiptNumber = order?._id ? String(order._id).slice(-4).toUpperCase() : (order?.orderNumber ? String(order.orderNumber) : "N/A");

  // Helper to extract clean human-readable table numbers and eliminate raw 24-hex Mongo ObjectIds
  const isMongoId = (val: any) => typeof val === "string" && /^[a-fA-F0-9]{24}$/.test(val.trim());

  const getTableDisplay = (t: any): string => {
    if (!t) return "";
    if (typeof t === "object") {
      return String(t.tableNumber || t.name || "").trim();
    }
    const str = String(t).trim();
    if (isMongoId(str)) {
      const matched = tables?.find((tbl: any) => String(tbl._id || tbl.id) === str);
      if (matched) return String(matched.tableNumber || matched.name || "").trim();
      return ""; // Never display raw 24-character hexadecimal ObjectId
    }
    return str;
  };

  const primaryTableNum = getTableDisplay(order?.tableId) || (order?.tableNumber ? String(order.tableNumber) : "");
  const otherTableNums = Array.isArray(order?.tableIds)
    ? order.tableIds
        .map((t: any) => getTableDisplay(t))
        .filter((num: string) => num && num !== primaryTableNum)
    : [];

  const tableLabel = order?.orderType === "DINE_IN"
    ? primaryTableNum
      ? `Table ${primaryTableNum}${otherTableNums.length > 0 ? ` (+${otherTableNums.join(", ")})` : ""}`
      : "Dine-In"
    : (order?.orderType || "Takeaway");
  const serverName = order?.waiterId?.contactName?.split(" ")[0]?.toUpperCase() || (typeof order?.waiterId === 'string' ? "STAFF" : "CASHIER");
  const customerName = order?.customerDetails?.name?.toUpperCase() || "WALK-IN GUEST";
  const customerPhone = order?.customerDetails?.phone || "";

  // ── Payment Tender & Credit Breakdown Calculations ──
  const paymentsList: Array<{ method: string; amount: number }> = Array.isArray(order?.financials?.payments) && order.financials.payments.length > 0
    ? order.financials.payments
    : [];

  let creditDueAmount = 0;
  let paidAmount = 0;

  if (paymentsList.length > 0) {
    paymentsList.forEach((p: any) => {
      const amt = Number(p.amount) || 0;
      const m = String(p.method || "").toUpperCase();
      if (m === "CREDIT" || m === "DUE") {
        creditDueAmount += amt;
      } else {
        paidAmount += amt;
      }
    });
  } else if (order?.financials?.dueAmount !== undefined || order?.financials?.paidAmount !== undefined) {
    creditDueAmount = Number(order?.financials?.dueAmount || 0);
    paidAmount = Number(order?.financials?.paidAmount || Math.max(0, grandTotal - creditDueAmount));
  } else if (order?.status === "PAID") {
    paidAmount = grandTotal;
    creditDueAmount = 0;
  } else {
    paidAmount = 0;
    creditDueAmount = grandTotal;
  }

  if (Array.isArray(order?.financials?.duePayments) && order.financials.duePayments.length > 0) {
    const extraCollected = order.financials.duePayments.reduce((sum: number, dp: any) => sum + (Number(dp.amount) || 0), 0);
    paidAmount += extraCollected;
    creditDueAmount = Math.max(0, creditDueAmount - extraCollected);
  }

  let paymentStatusDisplay = "PENDING";
  if (order?.status === "PAID") {
    if (creditDueAmount > 0 && paidAmount > 0) {
      paymentStatusDisplay = "PARTIALLY PAID";
    } else if (creditDueAmount > 0 && paidAmount === 0) {
      paymentStatusDisplay = "CREDIT / UNPAID";
    } else {
      paymentStatusDisplay = "PAID IN FULL";
    }
  } else if (order?.status === "BILLED") {
    paymentStatusDisplay = "BILL GENERATED (UNPAID)";
  } else if (order?.status === "OPEN") {
    paymentStatusDisplay = "OPEN / RUNNING TAB";
  }

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
            body { margin: 0; padding: 4mm; font-family: monospace; font-size: 11px; width: 72mm; color: #000; background: #fff; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .border-t { border-top: 1px dashed #000; }
            .border-t-2 { border-top: 2px solid #000; }
            .border-b { border-bottom: 1px dotted #000; }
            .border-dotted { border-top: 1px dotted #000; }
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
      <DialogContent hideCloseButton className="max-w-md p-3 bg-slate-950/95 border border-slate-800 shadow-2xl z-[100] rounded-2xl">
        <DialogTitle className="sr-only">Order Receipt #{receiptNumber}</DialogTitle>
        <DialogDescription className="sr-only">Printable invoice receipt for Order #{receiptNumber}</DialogDescription>
        <div className="bg-slate-200/95 dark:bg-slate-900/95 text-black mx-auto w-full shadow-2xl relative break-words p-4 rounded-xl border border-slate-300 dark:border-slate-700 font-mono text-xs leading-relaxed max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-300 dark:border-slate-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">Receipt • #{receiptNumber}</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white"><X className="h-4 w-4" /></Button>
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
                <div className="flex justify-between"><span>DATE: {formattedDate}</span><span className="font-bold">RCPT: #{receiptNumber}</span></div>
                <div className="flex justify-between"><span>AREA: {tableLabel}</span><span>STAFF: {serverName}</span></div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-bold uppercase">
                    {order.customerDetails?.name?.trim() ? (
                      <>
                        {order.customerDetails.name}
                        {order.customerDetails?.customerId?.tags ? ` (${order.customerDetails.customerId.tags})` : ""}
                      </>
                    ) : (
                      "WALK-IN GUEST"
                    )}
                  </span>
                </div>
                {order.customerDetails?.phone && (
                  <div className="flex justify-between">
                    <span>PHONE:</span>
                    <span className="font-medium">{order.customerDetails.phone}</span>
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
                    const modPrice = (item.selectedModifiers || []).reduce((sum: number, m: any) => sum + (Number(m.price) || 0), 0);
                    const unitPrice = Number(item.variantPrice || item.price || 0) + modPrice;
                    const itemTotal = isComp ? 0 : (unitPrice * (item.quantity || 1));
                    const modifiers = item.selectedModifiers || [];
                    return (
                      <div key={idx} className="flex justify-between items-start gap-1">
                        <span className="w-8 font-bold shrink-0">{item.quantity}X</span>
                        <div className="flex-1 min-w-0">
                          <span className="uppercase break-words font-medium">{itemName}</span>
                          {isComp ? (
                            <span className="text-[9px] font-black text-purple-700 block uppercase">*** COMPLIMENTARY (FOC) ***</span>
                          ) : (
                            variant && variant !== "Standard" && <span className="text-[10px] text-slate-600 block">({variant})</span>
                          )}
                          {modifiers.length > 0 && (
                            <div className="text-[9px] text-slate-600 italic block pl-0.5">
                              {modifiers.map((m: any, mI: number) => (
                                <span key={mI}>+{m.name}{m.price > 0 ? ` (₹${m.price})` : ''}{mI < modifiers.length - 1 ? ', ' : ''}</span>
                              ))}
                            </div>
                          )}
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

              {/* ── PAYMENT SUMMARY SECTION ── */}
              <div className="border-t border-dashed border-black my-2" />
              <div className="text-center font-bold text-[10px] uppercase tracking-wider py-0.5 bg-slate-50 border-y border-dotted border-black">
                PAYMENT SUMMARY
              </div>
              <div className="text-[11px] space-y-1 pt-1.5">
                <div className="flex justify-between font-bold">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
                {paymentsList.length > 0 ? (
                  <div className="pt-0.5 pb-0.5 space-y-0.5 border-t border-dotted border-black/40 my-1">
                    {paymentsList.map((p, pIdx) => {
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
                  order?.status === "PAID" && (
                    <div className="pt-0.5 pb-0.5 space-y-0.5 border-t border-dotted border-black/40 my-1">
                      {paidAmount > 0 && (
                        <div className="flex justify-between pl-1">
                          <span>{order?.paymentMethod || "Cash"} Paid:</span>
                          <span>₹{paidAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {creditDueAmount > 0 && (
                        <div className="flex justify-between pl-1 font-bold text-amber-900">
                          <span>Credit / Due:</span>
                          <span>₹{creditDueAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )
                )}
                <div className="border-t border-dotted border-black/60 my-1" />
                <div className="flex justify-between font-bold">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-800">₹{paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Balance Due:</span>
                  <span className={creditDueAmount > 0 ? "font-black text-rose-700" : ""}>
                    ₹{creditDueAmount.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-dashed border-black/60 my-1" />
                <div className="flex justify-between font-black text-[10px] pt-0.5">
                  <span>Payment Status:</span>
                  <span className={`uppercase ${
                    creditDueAmount === 0 && paidAmount > 0
                      ? "text-emerald-800"
                      : creditDueAmount > 0 && paidAmount > 0
                      ? "text-amber-800"
                      : "text-slate-800"
                  }`}>
                    {paymentStatusDisplay}
                  </span>
                </div>
              </div>
            </div>

            <div className="tear-divider"><span className="tear-text"><Scissors className="w-3 h-3 inline" /> Tear Along Perforation</span></div>

            <div className="store-copy bg-white p-5 rounded-2xl shadow-xl border border-slate-300 break-words font-mono text-xs leading-relaxed space-y-3">
              <div className="text-center pb-0.5"><h2 className="text-xs font-black uppercase tracking-wider text-black">{restaurantName}</h2><div className="inline-block border border-black px-2 py-0.5 mt-1 font-extrabold text-[9px] uppercase bg-slate-100 text-black">*** STORE / MERCHANT COPY ***</div></div>
              <div className="border-t border-dashed border-black my-2" />
              <div className="text-[11px] space-y-0.5">
                <div className="flex justify-between"><span>DATE: {formattedDate}</span><span className="font-bold">RCPT: #{receiptNumber}</span></div>
                <div className="flex justify-between"><span>AREA: {tableLabel}</span><span>STAFF: {serverName}</span></div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-bold uppercase">
                    {order.customerDetails?.name?.trim() ? order.customerDetails.name : "WALK-IN GUEST"}
                  </span>
                </div>
              </div>
              <div className="border-t border-dashed border-black my-2" />
              <div className="text-[11px] space-y-0.5">
                <div className="font-bold text-[9px] uppercase text-slate-700 mb-0.5">Ordered Items Summary:</div>
                {allItems.map((item: any, idx: number) => {
                  const isComp = Boolean(item.isComplimentary);
                  const modPrice = (item.selectedModifiers || []).reduce((sum: number, m: any) => sum + (Number(m.price) || 0), 0);
                  const unitPrice = Number(item.variantPrice || item.price || 0) + modPrice;
                  const itemTotal = isComp ? 0 : (unitPrice * (item.quantity || 1));
                  const modStr = (item.selectedModifiers || []).map((m: any) => m.name).join(", ");
                  return (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate pr-2">
                        {item.quantity}x {item.menuItemId?.name || item.name}
                        {modStr && ` (${modStr})`}
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

              <div className="text-center font-bold text-[10px] uppercase tracking-wider py-0.5 bg-slate-50 border-y border-dotted border-black">
                PAYMENT SUMMARY
              </div>
              <div className="text-[11px] space-y-1 pt-1.5">
                <div className="flex justify-between font-black text-xs">
                  <span>GRAND TOTAL:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>

                {paymentsList.length > 0 ? (
                  <div className="pt-0.5 pb-0.5 space-y-0.5 border-t border-dotted border-black/40 my-1">
                    {paymentsList.map((p, pIdx) => {
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
                    <span className="font-bold">
                      {order.financials?.payments && order.financials.payments.length > 0
                        ? order.financials.payments.map((p: any) => p.method).join(" + ")
                        : order.paymentMethod || "CASH"}
                    </span>
                  </div>
                )}

                <div className="border-t border-dotted border-black/60 my-1" />

                <div className="flex justify-between font-bold">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-800">₹{paidAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-bold">
                  <span>Balance Due:</span>
                  <span className={creditDueAmount > 0 ? "font-black text-rose-700" : ""}>
                    ₹{creditDueAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between font-black text-[10px] pt-0.5">
                  <span>Payment Status:</span>
                  <span className="uppercase">{paymentStatusDisplay}</span>
                </div>
              </div>

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
