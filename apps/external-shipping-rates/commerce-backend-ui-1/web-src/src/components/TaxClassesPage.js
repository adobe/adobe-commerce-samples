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

import {
  Button,
  Cell,
  Column,
  Content,
  DialogTrigger,
  Flex,
  Heading,
  IllustratedMessage,
  ProgressCircle,
  Row,
  TableBody,
  TableHeader,
  TableView,
  Text,
} from "@adobe/react-spectrum";
import React, { useCallback } from "react";

import {
  createOrUpdateCommerceTaxClass,
  useCommerceTaxClasses,
} from "../hooks/useCommerceTaxClasses";
import { useCustomTaxCodes } from "../hooks/useCustomTaxCodes";
import { TaxClassDialog } from "./TaxClassDialog";

export const TaxClassesPage = (props) => {
  const {
    isLoadingCommerceTaxClasses,
    commerceTaxClasses,
    refetchCommerceTaxClasses,
  } = useCommerceTaxClasses(props);
  const { isLoadingCustomTaxCodes, customTaxCodes } = useCustomTaxCodes(props);

  const handleSave = useCallback(
    async (newTaxClass) => {
      try {
        const response = await createOrUpdateCommerceTaxClass(
          props,
          newTaxClass,
        );
        if (!response?.success) {
          throw new Error(
            `Failed to save tax class: ${response?.message || "Unknown error"}`,
          );
        }
        await refetchCommerceTaxClasses();
      } catch (error) {
        console.error("Something went wrong while saving tax class:", error);
      }
    },
    [props, refetchCommerceTaxClasses],
  );

  /**
   * Render empty state when there are no items in the table
   * @returns {React.ReactElement} An illustrated message indicating no data is available.
   */
  function renderEmptyState() {
    return (
      <IllustratedMessage>
        <Content>No data available</Content>
      </IllustratedMessage>
    );
  }

  return (
    <Flex direction="column" marginX={20}>
      <Flex
        alignItems="center"
        direction="row"
        gap="size-200"
        justifyContent="space-between"
        marginX={5}>
        <Heading level={1}>Manage Tax Classes</Heading>

        <DialogTrigger type="modal">
          <Button isDisabled={isLoadingCustomTaxCodes} variant="accent">
            Add New Tax Class
          </Button>
          {(close) => (
            <TaxClassDialog
              close={close}
              customTaxCodes={customTaxCodes}
              onSave={handleSave}
              taxClass={null}
            />
          )}
        </DialogTrigger>
      </Flex>

      {isLoadingCustomTaxCodes || isLoadingCommerceTaxClasses ? (
        <Flex alignItems="center" height="100vh" justifyContent="center">
          <ProgressCircle aria-label="Loading…" isIndeterminate size="L" />
        </Flex>
      ) : (
        <Flex>
          <TableView
            aria-label="tax class table"
            flex
            minHeight="static-size-1000"
            overflowMode="wrap"
            renderEmptyState={renderEmptyState}
            width="100%">
            <TableHeader>
              <Column align="start" width={10}>
                #
              </Column>
              <Column>Commerce ID</Column>
              <Column>Class Type</Column>
              <Column>Class Name</Column>
              <Column>Custom Tax Code</Column>
              <Column>Actions</Column>
            </TableHeader>

            <TableBody items={commerceTaxClasses}>
              {(item) => (
                <Row key={item.id}>
                  <Cell>
                    <Text UNSAFE_style={{ color: "grey" }}>
                      {item.rowNumber}
                    </Text>
                  </Cell>
                  <Cell>{item.id}</Cell>
                  <Cell>{item.classType}</Cell>
                  <Cell>{item.className}</Cell>
                  <Cell>
                    {item.customTaxCode
                      ? `${item.customTaxCode} (${item.customTaxLabel})`
                      : ""}
                  </Cell>
                  <Cell>
                    <DialogTrigger
                      key={`${item.id}-${customTaxCodes.length}`}
                      type="modal">
                      <Button style="outline" variant="secondary">
                        Edit
                      </Button>
                      {(close) => (
                        <TaxClassDialog
                          close={close}
                          customTaxCodes={customTaxCodes}
                          onSave={handleSave}
                          taxClass={item}
                        />
                      )}
                    </DialogTrigger>
                  </Cell>
                </Row>
              )}
            </TableBody>
          </TableView>
        </Flex>
      )}
    </Flex>
  );
};
