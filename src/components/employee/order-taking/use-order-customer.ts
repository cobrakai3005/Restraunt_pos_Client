"use client";

import { useEffect, useState } from "react";
import { customerService, Customer } from "@/services/customer.service";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { cashierKeys } from "@/hooks/queries/cashier-keys";

export function useOrderCustomer() {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const phone = useDebounce(customerPhone.trim(), 350);
  const customerQuery = useQuery({
    queryKey: [...cashierKeys.root(), "customer-search", phone],
    queryFn: () => customerService.searchCustomerByPhone(phone),
    enabled: phone.length >= 4,
  });

  useEffect(() => {
    if (phone.length < 4) {
      setMatchedCustomer(null);
      return;
    }
    const customer = (customerQuery.data as any)?.data as Customer | undefined;
    if (!customer) return;
    setMatchedCustomer(customer);
    if (!customerName.trim()) setCustomerName(customer.name);
  }, [customerName, customerQuery.data, phone]);

  const resetCustomer = () => {
    setCustomerName("");
    setCustomerPhone("");
    setMatchedCustomer(null);
  };

  return { customerName, setCustomerName, customerPhone, setCustomerPhone, matchedCustomer, setMatchedCustomer, resetCustomer };
}
