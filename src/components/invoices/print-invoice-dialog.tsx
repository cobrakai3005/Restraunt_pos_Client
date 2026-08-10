import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PurchaseInvoice } from '@/services/purchase.service';
import { PrintableInvoice } from './printable-invoice';
import { Printer } from 'lucide-react';

interface PrintInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any | null; // Can be PurchaseInvoice or Order
  restaurantName: string;
  templateId: string;
  type?: 'purchase' | 'sales';
}

export function PrintInvoiceDialog({ open, onOpenChange, invoice, restaurantName, templateId, type = 'purchase' }: PrintInvoiceDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    // Basic print functionality
    // In a real robust app, you might use an iframe or react-to-print to isolate CSS
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;

    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Reload to restore React bindings after body swap
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col bg-slate-100">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle>Invoice Preview</DialogTitle>
          <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Printer className="w-4 h-4 mr-2" />
            Print Invoice
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4 flex justify-center">
          {/* We wrap the printable invoice in a ref container */}
          <div ref={printRef} className="bg-white shadow-xl max-w-full overflow-hidden">
            <PrintableInvoice 
              invoice={invoice} 
              restaurantName={restaurantName} 
              templateId={templateId} 
              type={type}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
