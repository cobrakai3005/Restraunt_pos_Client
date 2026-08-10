import React from 'react';
import { PurchaseInvoice } from '@/services/purchase.service';
import { format } from 'date-fns';

interface TemplateProps {
  data: any;
  restaurantName: string;
}

export function Template1A4({ data, restaurantName }: TemplateProps) {
  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white p-8 sm:p-12 text-slate-800 font-sans shadow-lg print:shadow-none print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-300 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">{restaurantName}</h1>
          <p className="text-sm text-slate-500">
            GSTIN: 22AAAAA0000A1Z5<br />
            123 Business Road, City, 456789
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-slate-300 uppercase tracking-wider mb-2">{data.title}</h2>
          <div className="text-sm">
            <p><span className="font-semibold text-slate-600">Invoice No:</span> {data.invoiceNumber}</p>
            <p><span className="font-semibold text-slate-600">Date:</span> {format(new Date(data.invoiceDate), 'dd MMM yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-slate-700 uppercase mb-2 border-b border-slate-200 inline-block pb-1">{data.partyTitle}</h3>
        <p className="text-base font-semibold text-slate-900">{data.partyName}</p>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 text-sm">
        <thead>
          <tr className="bg-slate-100 text-slate-700">
            <th className="text-left py-3 px-4 font-semibold border-y border-slate-300">Item Description</th>
            <th className="text-center py-3 px-4 font-semibold border-y border-slate-300">Qty</th>
            <th className="text-right py-3 px-4 font-semibold border-y border-slate-300">Rate</th>
            <th className="text-right py-3 px-4 font-semibold border-y border-slate-300">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item: any, index: number) => (
            <tr key={index} className="border-b border-slate-200">
              <td className="py-3 px-4">{item.name || item.inventoryItemId}</td>
              <td className="py-3 px-4 text-center">{item.quantity} {item.unit}</td>
              <td className="py-3 px-4 text-right">₹{item.unitPrice?.toFixed(2)}</td>
              <td className="py-3 px-4 text-right">₹{item.totalPrice?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-64">
          <div className="flex justify-between py-2 text-sm text-slate-600 border-b border-slate-200">
            <span>Subtotal</span>
            <span>₹{data.totalAmount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-3 text-lg font-bold text-slate-900 border-b-2 border-slate-900">
            <span>Total</span>
            <span>₹{data.totalAmount?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-slate-500 border-t border-slate-200 pt-4 mt-8">
        <p className="mb-1"><span className="font-semibold text-slate-700">Terms & Conditions:</span> Payment is due within 30 days. Please include invoice number on your check.</p>
        <p className="text-center mt-6">Thank you for your business!</p>
      </div>
    </div>
  );
}
