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

import { callAction } from "../utils";

export const useCommerceTaxClasses = (props) => {
  const [isLoadingCommerceTaxClasses, setIsLoadingCommerceTaxClasses] =
    useState(true);
  const [commerceTaxClasses, setCommerceTaxClasses] = useState([]);

  const fetchCommerceTaxClasses = useCallback(async () => {
    setIsLoadingCommerceTaxClasses(true);

    try {
      const queryParams = new URLSearchParams({
        "searchCriteria[currentPage]": 1,
        "searchCriteria[pageSize]": 100,
      }).toString();

      const response = await callAction(
        props,
        "CustomMenu/commerce-rest-api",
        `taxClasses/search?${queryParams}`,
      );

      if (!response.success) {
        throw new Error(
          "Error fetching commerce tax classes:",
          response.message,
        );
      }

      const taxClasses = response.message?.items.map((item, index) => ({
        rowNumber: index + 1,
        id: item.class_id,
        classType: item.class_type,
        className: item.class_name,
        customTaxCode:
          item.custom_attributes?.find(
            (attr) => attr.attribute_code === "tax_code",
          )?.value || "",
        customTaxLabel:
          item.custom_attributes?.find(
            (attr) => attr.attribute_code === "tax_label",
          )?.value || "",
      }));

      setCommerceTaxClasses(taxClasses);
    } catch (error) {
      console.error("Error fetching commerce tax classes:", error);
      setCommerceTaxClasses([]);
    } finally {
      setIsLoadingCommerceTaxClasses(false);
    }
  }, [props]);

  useEffect(() => {
    fetchCommerceTaxClasses();
  }, [fetchCommerceTaxClasses]);

  return {
    isLoadingCommerceTaxClasses,
    commerceTaxClasses,
    refetchCommerceTaxClasses: fetchCommerceTaxClasses,
  };
};

export const createOrUpdateCommerceTaxClass = async (props, newTaxClass) => {
  const payload = {
    taxClass: {
      class_id: newTaxClass?.id,
      class_name: newTaxClass.className,
      class_type: newTaxClass.classType, // only create request uses class_type
      custom_attributes: [
        {
          attribute_code: "tax_code",
          value: newTaxClass.customTaxCode,
        },
        {
          attribute_code: "tax_label",
          value: newTaxClass.customTaxLabel,
        },
      ],
    },
  };

  return await callAction(
    props,
    "CustomMenu/commerce-rest-api",
    "taxClasses",
    "POST",
    payload,
  );
};
