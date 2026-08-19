import React from 'react';
import { PurchaseInvoice } from '@/services/purchase.service';
import { Template1A4 } from './template-1-a4';
import { Template2Thermal } from './template-2-thermal';

interface PrintableInvoiceProps {
  invoice: any;
  restaurantName: string;
  templateId: string;
  type?: 'purchase' | 'sales';
}

export function PrintableInvoice({ invoice, restaurantName, templateId, type = 'purchase' }: PrintableInvoiceProps) {
  
  // Normalize the invoice data so templates don't have to know if it's sales or purchase
  const normalizedData = {
    invoiceNumber: type === 'purchase' ? invoice.invoiceNumber : invoice._id?.slice(-6).toUpperCase() || 'N/A',
    invoiceDate: type === 'purchase' ? invoice.invoiceDate : invoice.createdAt,
    partyName: type === 'purchase' ? invoice.vendorName : (invoice.customerDetails?.name || invoice.customerName || invoice.companyName || 'Walk-in Guest'),
    subtotal: type === 'purchase' ? invoice.subtotal : (invoice.financials?.subtotal || 0),
    totalTax: type === 'purchase' ? invoice.taxAmount : (invoice.financials?.totalTax || 0),
    totalAmount: type === 'purchase' ? invoice.totalAmount : (invoice.financials?.grandTotal || 0),
    payments: type === 'purchase' ? [] : (invoice.financials?.payments || invoice.payments || []),
    paidAmount: type === 'purchase' ? invoice.totalAmount : (invoice.financials?.paidAmount !== undefined ? invoice.financials.paidAmount : invoice.paidAmount),
    dueAmount: type === 'purchase' ? 0 : (invoice.financials?.dueAmount !== undefined ? invoice.financials.dueAmount : invoice.dueAmount),
    paymentStatus: type === 'purchase' ? 'PAID' : (invoice.financials?.dueStatus || invoice.status || 'PAID'),
    title: type === 'purchase' ? 'Purchase Invoice' : 'Sales Invoice',
    partyTitle: type === 'purchase' ? 'Vendor Details' : 'Bill To',
    items: [] as any[]
  };

  if (type === 'purchase') {
    normalizedData.items = invoice.items || [];
  } else {
    // For sales, we flatten all KOT items into one array
    if (invoice.kots) {
      invoice.kots.forEach((kot: any) => {
        if (kot.items) {
          kot.items.forEach((item: any) => {
            const modPrice = (item.selectedModifiers || []).reduce((sum: number, m: any) => sum + (Number(m.price) || 0), 0);
            const unitPrice = (Number(item.variantPrice || 0)) + modPrice;
            const baseName = item.menuItemId?.name || item.name || 'Item';
            const variant = item.variantName && item.variantName !== 'Standard' ? ` (${item.variantName})` : '';
            const modStr = (item.selectedModifiers || []).map((m: any) => m.name).join(', ');
            const fullName = `${baseName}${variant}${modStr ? ` [${modStr}]` : ''}`;
            normalizedData.items.push({
              name: fullName,
              quantity: item.quantity || 1,
              unit: 'pcs',
              unitPrice,
              totalPrice: unitPrice * (item.quantity || 1)
            });
          });
        }
      });
    }
  }

  // Here you can map the template IDs (from settings) to the actual React components
  switch (templateId) {
    case 'template-1':
    case 'template-2':
    case 'template-3':
      // Let's pretend template 1, 2, 3 map to our A4 design
      return <Template1A4 data={normalizedData} restaurantName={restaurantName} />;
    
    case 'template-10':
    case 'template-11':
      // Let's pretend 10 and 11 are A5/Thermal designs
      return <Template2Thermal data={normalizedData} restaurantName={restaurantName} />;
      
    default:
      // Fallback
      return <Template1A4 data={normalizedData} restaurantName={restaurantName} />;
  }
}
