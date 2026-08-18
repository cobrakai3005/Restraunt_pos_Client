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
    totalAmount: type === 'purchase' ? invoice.totalAmount : (invoice.financials?.grandTotal || 0),
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
            normalizedData.items.push({
              name: item.variantName || 'Item',
              quantity: item.quantity || 1,
              unit: 'pcs',
              unitPrice: item.variantPrice || 0,
              totalPrice: (item.variantPrice || 0) * (item.quantity || 1)
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
