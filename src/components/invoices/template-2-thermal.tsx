import React from 'react';
import { PurchaseInvoice } from '@/services/purchase.service';
import { format } from 'date-fns';

interface TemplateProps {
  data: any;
  restaurantName: string;
}

export function Template2Thermal({ data, restaurantName }: TemplateProps) {
  return (
    <div className="w-[80mm] mx-auto bg-white p-4 text-slate-900 font-mono text-sm leading-tight shadow-sm print:shadow-none print:p-0">
      <div className="text-center mb-4 border-b border-dashed border-slate-400 pb-4">
        <h1 className="text-xl font-bold mb-1">{restaurantName}</h1>
        <p className="text-xs">123 Business Road, City</p>
        <p className="text-xs">GSTIN: 22AAAAA0000A1Z5</p>
      </div>
      
      <div className="mb-4 text-xs">
        <p className="text-center font-bold mb-2 uppercase">{data.title}</p>
        <p><strong>Receipt:</strong> {data.invoiceNumber}</p>
        <p><strong>Date:</strong> {format(new Date(data.invoiceDate), 'dd/MM/yyyy HH:mm')}</p>
        <p><strong>{data.partyTitle}:</strong> {data.partyName}</p>
      </div>

      <div className="border-b border-dashed border-slate-400 mb-2"></div>
      
      <table className="w-full text-xs mb-2">
        <thead>
          <tr>
            <th className="text-left font-normal pb-1">Item</th>
            <th className="text-right font-normal pb-1">Qty</th>
            <th className="text-right font-normal pb-1">Amt</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item: any, index: number) => (
            <tr key={index}>
              <td className="py-1 align-top pr-1">{item.name || item.inventoryItemId}</td>
              <td className="py-1 align-top text-right whitespace-nowrap">{item.quantity}</td>
              <td className="py-1 align-top text-right">₹{item.totalPrice?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-slate-400 mt-2 pt-2 text-xs">
        <div className="flex justify-between mb-1">
          <span>Subtotal:</span>
          <span>₹{data.totalAmount?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm mt-2">
          <span>TOTAL:</span>
          <span>₹{data.totalAmount?.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center text-xs mt-6 pt-4 border-t border-dashed border-slate-400">
        <p>Thank you!</p>
        <p className="mt-1">Please visit again</p>
      </div>
    </div>
  );
}
