/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import { useCallback, useEffect, useState } from "react";

export const useCustomTaxCodes = (props) => {
  const [customTaxCodes, setCustomTaxCodes] = useState([]);
  const [isLoadingCustomTaxCodes, setIsLoadingCustomTaxCodes] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: just for demo purpose
  const fetchCustomTaxCodes = useCallback(() => {
    setIsLoadingCustomTaxCodes(true);

    try {
      // fetch here your custom tax codes
      // const response = await callAction(props, 'action-name', 'fetch');
      // const codes = response.data.map(({ product_tax_code, name }) => ({
      //   taxCode: product_tax_code,
      //   name,
      // }));

      // Mock tax codes for example
      const codes = [
        { taxCode: "001", name: "Books" },
        { taxCode: "002", name: "Food" },
        { taxCode: "003", name: "Clothing" },
      ];

      setCustomTaxCodes(codes);
    } catch (error) {
      console.error("Error fetching custom tax codes:", error);
      setCustomTaxCodes([]);
    } finally {
      setIsLoadingCustomTaxCodes(false);
    }
  }, [props]);

  useEffect(() => {
    fetchCustomTaxCodes();
  }, [fetchCustomTaxCodes]);

  return { customTaxCodes, isLoadingCustomTaxCodes };
};
