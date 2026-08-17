import React from 'react';
import { format } from 'date-fns';
import { Scissors } from 'lucide-react';

interface TemplateProps {
  data: any;
  restaurantName: string;
}

export function Template2Thermal({ data, restaurantName }: TemplateProps) {
  const invoiceDate = data.invoiceDate ? new Date(data.invoiceDate) : new Date();
  const subtotal = Number(data.subtotal || data.totalAmount || 0);
  const tax = Number(data.totalTax || (subtotal * 0.05));
  const total = Number(data.totalAmount || (subtotal + tax));

  return (
    <div className="w-[80mm] mx-auto bg-[#fcfbf9] p-4 text-black font-mono text-xs leading-tight shadow-sm print:shadow-none print:p-0 space-y-4">
      
      {/* ══════════════════════════════════════════════════
          PART 1: CUSTOMER COPY
         ══════════════════════════════════════════════════ */}
      <div className="customer-copy space-y-2">
        <div className="text-center pb-1">
          <div className="text-xl font-black tracking-widest mb-1">Ψ¶</div>
          <h1 className="text-sm font-black tracking-wider uppercase">{restaurantName}</h1>
          <p className="text-[10px] text-slate-700">123 Business Road, City</p>
          <p className="text-[10px] text-slate-700">GSTIN: 22AAAAA0000A1Z5</p>
          <div className="inline-block mt-1 px-2 py-0.5 rounded border border-black font-extrabold text-[9px] tracking-widest uppercase">
            *** CUSTOMER COPY (TAX INVOICE) ***
          </div>
        </div>
        
        <div className="border-b border-dashed border-black my-1" />

        <div className="text-[11px] space-y-0.5">
          <div className="flex justify-between">
            <span><strong>RCPT:</strong> #{data.invoiceNumber}</span>
            <span>{format(invoiceDate, 'dd/MM/yyyy HH:mm')}</span>
          </div>
          <div className="flex justify-between">
            <span className="truncate pr-1"><strong>{data.partyTitle}:</strong> {data.partyName}</span>
          </div>
        </div>

        <div className="border-b border-dashed border-black my-1" />
        
        <table className="w-full text-[11px] mb-1">
          <thead>
            <tr className="border-b border-dotted border-black/40">
              <th className="text-left font-bold pb-1 w-8">Qty</th>
              <th className="text-left font-bold pb-1">Item</th>
              <th className="text-right font-bold pb-1">Amt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-black/20">
            {data.items?.map((item: any, index: number) => (
              <tr key={index}>
                <td className="py-1 align-top font-bold">{item.quantity}X</td>
                <td className="py-1 align-top pr-1 uppercase">{item.name || item.inventoryItemId}</td>
                <td className="py-1 align-top text-right whitespace-nowrap">₹{item.totalPrice?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-black mt-2 pt-1 text-[11px] space-y-0.5">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>TAX / GST (5%):</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-black my-1" />
          <div className="flex justify-between font-black text-xs pt-0.5">
            <span>TOTAL:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center text-[10px] pt-2 pb-1 border-t border-dashed border-black mt-2">
          <p className="font-bold">TIP IS NOT INCLUDED</p>
          <p>THANK YOU! PLEASE VISIT AGAIN</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          PERFORATION / TEAR-OFF CUT LINE (TWO-PART DIVIDER)
         ══════════════════════════════════════════════════ */}
      <div className="relative my-3 text-center select-none py-1">
        <div className="border-t-2 border-slate-500 border-dashed w-full" />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#fcfbf9] px-2 text-[8px] font-extrabold text-slate-600 flex items-center gap-1 uppercase tracking-wider">
          <Scissors className="w-2.5 h-2.5" /> Cut / Tear Here
        </span>
      </div>

      {/* ══════════════════════════════════════════════════
          PART 2: STORE / MERCHANT COPY
         ══════════════════════════════════════════════════ */}
      <div className="store-copy space-y-1.5 pt-0.5">
        <div className="text-center pb-1">
          <h2 className="text-xs font-black uppercase tracking-wider">{restaurantName}</h2>
          <div className="inline-block mt-0.5 px-2 py-0.5 rounded border border-black font-extrabold text-[9px] tracking-widest uppercase bg-slate-100 text-black">
            *** STORE / MERCHANT COPY ***
          </div>
        </div>

        <div className="border-t border-black border-dashed my-1" />

        <div className="text-[10px] space-y-0.5">
          <div className="flex justify-between font-bold">
            <span>RECEIPT: #{data.invoiceNumber}</span>
            <span>{format(invoiceDate, 'dd/MM/yyyy HH:mm')}</span>
          </div>
          <div className="flex justify-between">
            <span className="truncate pr-1">PARTY: {data.partyName}</span>
          </div>
        </div>

        <div className="border-t border-black border-dashed my-1" />

        <div className="text-[10px] space-y-0.5">
          <div className="font-bold text-[9px] uppercase text-slate-700 mb-0.5">Summary:</div>
          {data.items?.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between">
              <span className="truncate pr-2">{item.quantity}x {item.name || item.inventoryItemId}</span>
              <span className="shrink-0 font-mono">₹{item.totalPrice?.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-black border-dashed my-1" />

        <div className="text-[11px] space-y-0.5">
          <div className="flex justify-between font-black text-xs">
            <span>SETTLED:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Cashier / Customer Signatures */}
        <div className="pt-3 pb-1 text-[9px] space-y-2">
          <div className="flex justify-between items-end gap-3">
            <div className="flex-1 border-t border-black border-dotted pt-1 text-center">
              <span>Cashier</span>
            </div>
            <div className="flex-1 border-t border-black border-dotted pt-1 text-center">
              <span>Customer</span>
            </div>
          </div>
          <p className="text-[8px] text-center text-slate-500 font-bold uppercase">
            * Store Audit Slip *
          </p>
        </div>
      </div>

    </div>
  );
}
