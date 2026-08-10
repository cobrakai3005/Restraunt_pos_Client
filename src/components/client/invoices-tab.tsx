"use client";

import { useState, useEffect } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Eye } from "lucide-react";
import { clientService } from "@/services/client.service";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";

const templates = [
  { id: "template-1", name: "Template 1", size: "A4" },
  { id: "template-2", name: "Template 2", size: "A4" },
  { id: "template-3", name: "Template 3", size: "A4" },
  { id: "template-4", name: "Template 4", size: "A4" },
  { id: "template-5", name: "Template 5", size: "A4" },
  { id: "template-6", name: "Template 6", size: "A4" },
  { id: "template-7", name: "Template 7", size: "A4" },
  { id: "template-8", name: "Template 8", size: "A4" },
  { id: "template-9", name: "Template 9", size: "A4" },
  { id: "template-10", name: "Template 10", size: "A5" },
  { id: "template-11", name: "Template 11", size: "A5" },
];

export function InvoicesTab() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("customer");
  const [customerTemplate, setCustomerTemplate] = useState("template-1");
  const [vendorTemplate, setVendorTemplate] = useState("template-1");
  const [isSaving, setIsSaving] = useState(false);
  
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurantSettings = async () => {
      try {
        const res = await clientService.getRestaurants();
        if (res.data.restaurants && res.data.restaurants.length > 0) {
          const restaurant = res.data.restaurants[0];
          setRestaurantId(restaurant._id);
          
          if (restaurant.settings) {
            if (restaurant.settings.customerInvoiceTemplate) {
              setCustomerTemplate(restaurant.settings.customerInvoiceTemplate);
            }
            if (restaurant.settings.vendorInvoiceTemplate) {
              setVendorTemplate(restaurant.settings.vendorInvoiceTemplate);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch restaurant settings:", error);
      }
    };

    fetchRestaurantSettings();
  }, []);

  const handleSave = async () => {
    if (!restaurantId) return;
    
    setIsSaving(true);
    try {
      await clientService.updateRestaurant(restaurantId, {
        settings: {
          customerInvoiceTemplate: customerTemplate,
          vendorInvoiceTemplate: vendorTemplate
        }
      });
      toast({
        title: "Templates updated successfully",
        description: "Your invoice layout settings have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update templates",
        description: error.response?.data?.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTemplateId = activeTab === "customer" ? customerTemplate : vendorTemplate;
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const handleSelectTemplate = (id: string) => {
    if (activeTab === "customer") {
      setCustomerTemplate(id);
    } else {
      setVendorTemplate(id);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-6">
      {/* LEFT SIDE - TEMPLATE SELECTOR */}
      <div className="flex-1 flex flex-col gap-6">
        <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">Default Template</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Choose the invoice layout your team will use by default.</p>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border-none rounded-xl font-medium"
            >
              {isSaving ? "Updating..." : "Update Template"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl h-12">
              <TabsTrigger value="customer" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white font-medium text-slate-600">
                Customer Invoice
              </TabsTrigger>
              <TabsTrigger value="vendor" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white font-medium text-slate-600">
                Purchase Invoice
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Current Template:</span>
              <span className="text-slate-900 dark:text-white font-semibold">{selectedTemplate.name}</span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Select {activeTab === "customer" ? "Customer" : "Purchase"} Layout</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 pb-4">
              {templates.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                return (
                  <div 
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.id)}
                    className={`
                      cursor-pointer rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden group
                      ${isSelected 
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 ring-1 ring-indigo-500' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'}
                    `}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${template.size === 'A4' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{template.size}</span>
                      </div>
                      {isSelected && (
                        <div className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Selected
                        </div>
                      )}
                    </div>
                    
                    {/* Thumbnail mock */}
                    <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 p-4 flex items-center justify-center min-h-[160px]">
                      <div className="w-24 h-32 bg-white border border-slate-300 shadow-sm rounded-sm flex flex-col p-2 gap-1 relative overflow-hidden group-hover:shadow-md transition-shadow">
                        <div className="h-2 bg-indigo-100 w-1/3 mb-1"></div>
                        <div className="h-1 bg-slate-200 w-full"></div>
                        <div className="h-1 bg-slate-200 w-full"></div>
                        <div className="h-1 bg-slate-200 w-3/4"></div>
                        <div className="mt-2 grid grid-cols-4 gap-1">
                          <div className="h-1 bg-slate-300 col-span-1"></div>
                          <div className="h-1 bg-slate-300 col-span-1"></div>
                          <div className="h-1 bg-slate-300 col-span-1"></div>
                          <div className="h-1 bg-slate-300 col-span-1"></div>
                        </div>
                        <div className="mt-1 h-8 bg-blue-50/50 border border-blue-100 rounded-sm"></div>
                        
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{template.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Invoice layout preview</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* RIGHT SIDE - PREVIEW PANE */}
      <div className="flex-[0.8] lg:flex-1">
        <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-1">
              <Eye className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Current Template Preview</h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm pl-8">This is how your invoices will appear to clients</p>
            
            <div className="mt-6 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">INV</div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white leading-tight">{selectedTemplate.name}</p>
                  <p className="text-xs text-slate-500">{selectedTemplate.size}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#2C2C2C] p-4 sm:p-8 flex items-start justify-center min-h-[500px]">
            {/* Mock PDF Viewer UI */}
            <div className="w-full max-w-lg bg-white shadow-2xl rounded-sm aspect-[1/1.414] p-8 flex flex-col relative">
              {/* Fake PDF Toolbar */}
              <div className="absolute top-0 left-0 right-0 h-10 bg-[#323639] flex items-center justify-between px-4 rounded-t-sm shadow-md">
                 <div className="flex items-center gap-4 text-white/70 text-xs">
                   <span>1 / 1</span>
                   <div className="flex gap-2">
                     <span className="cursor-pointer hover:text-white">-</span>
                     <span className="cursor-pointer hover:text-white">+</span>
                   </div>
                 </div>
                 <div className="flex items-center gap-3 text-white/70">
                    <span className="cursor-pointer hover:text-white">download</span>
                    <span className="cursor-pointer hover:text-white">print</span>
                 </div>
              </div>

              {/* Mock Invoice Content */}
              <div className="mt-12 flex-1 border border-slate-200 p-6 flex flex-col">
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-indigo-900 mb-1">Your Company Inc.</h1>
                    <p className="text-[8px] text-slate-500">123 Business St<br/>City, State 12345</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-bold text-slate-300 uppercase tracking-wider">{activeTab === "customer" ? "TAX INVOICE" : "PURCHASE ORDER"}</h2>
                    <p className="text-[10px] text-slate-600 mt-1">INV-2023-001</p>
                  </div>
                </div>

                <div className="flex justify-between mt-6 text-[10px]">
                  <div>
                    <p className="font-bold text-slate-700 mb-1">Billed To:</p>
                    <p className="text-slate-600">Client Name<br/>456 Client Rd</p>
                  </div>
                  <div className="text-right">
                    <p><span className="font-bold text-slate-700">Date:</span> Oct 25, 2023</p>
                    <p><span className="font-bold text-slate-700">Due:</span> Nov 25, 2023</p>
                  </div>
                </div>

                <div className="mt-8">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-indigo-50 text-indigo-900">
                        <th className="text-left p-2">Item</th>
                        <th className="text-center p-2">Qty</th>
                        <th className="text-right p-2">Rate</th>
                        <th className="text-right p-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600">
                      <tr className="border-b">
                        <td className="p-2">Service A</td>
                        <td className="text-center p-2">1</td>
                        <td className="text-right p-2">$100.00</td>
                        <td className="text-right p-2">$100.00</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Product B</td>
                        <td className="text-center p-2">2</td>
                        <td className="text-right p-2">$50.00</td>
                        <td className="text-right p-2">$100.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-auto flex justify-end">
                  <div className="w-48 text-[10px]">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-medium">$200.00</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-slate-600">Tax (10%)</span>
                      <span className="font-medium">$20.00</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm">
                      <span className="font-bold text-slate-800">Total</span>
                      <span className="font-bold text-indigo-600">$220.00</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
