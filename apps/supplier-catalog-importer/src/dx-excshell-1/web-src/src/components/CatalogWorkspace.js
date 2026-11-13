/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import { useState } from "react";
import {
  AlertDialog,
  Button,
  Cell,
  Column,
  DialogTrigger,
  Flex,
  Form,
  Heading,
  Item,
  NumberField,
  Picker,
  Row,
  TableBody,
  TableHeader,
  TableView,
  TabList,
  TabPanels,
  Tabs,
  Text,
  TextField,
  View,
} from "@adobe/react-spectrum";
import { generateProduct } from "../generate-data";
import catalogConfig from "../../../shared/catalog-config.json";

const { CATALOG_PAGE_SIZE, MAX_OFFSET } = catalogConfig;

export default function CatalogWorkspace({
  products,
  product,
  setProduct,
  saved,
  setSaved,
  supplierId,
  offset,
  busy,
  perform,
}) {
  const [action, setAction] = useState("add");
  const [draft, setDraft] = useState({ sku: "", name: "", price: 0 });
  const [lookupSku, setLookupSku] = useState(product.sku);
  const actions = [
    {
      key: "add",
      label: "Add product",
      operation: "create",
      button: "Create product",
    },
    {
      key: "find",
      label: "Find product",
      operation: "get",
      button: "Find product",
    },
    {
      key: "update",
      label: "Update product",
      operation: "update",
      button: "Update attributes",
    },
    {
      key: "delete",
      label: "Delete product",
      operation: "delete-rejected",
      button: "Delete rejected product",
    },
    {
      key: "review",
      label: "Review product",
      operation: "save-review",
      button: "Save review",
    },
  ];
  return (
    <>
      <Heading level={2}>Catalog workspace</Heading>
      <Text>
        Select a row to inspect it. Generate a fresh product before creating;
        use Update product to change an existing SKU.
      </Text>
      <Flex gap="size-100" marginY="size-200" wrap>
        <Button
          variant="secondary"
          isDisabled={busy}
          onPress={() => perform("list", { offset: 0 })}
        >
          Refresh latest products
        </Button>
        {offset > 0 && (
          <Button
            variant="secondary"
            isDisabled={busy}
            onPress={() =>
              perform("list", { offset: offset - CATALOG_PAGE_SIZE })
            }
          >
            Previous page
          </Button>
        )}
        {products.length === CATALOG_PAGE_SIZE && offset < MAX_OFFSET && (
          <Button
            variant="secondary"
            isDisabled={busy}
            onPress={() =>
              perform("list", { offset: offset + CATALOG_PAGE_SIZE })
            }
          >
            Next page
          </Button>
        )}
      </Flex>
      <TableView
        aria-label="Latest staged products"
        renderEmptyState={() => (
          <Text>No products yet. Generate and create one below.</Text>
        )}
        selectionMode="single"
        selectedKeys={
          new Set(
            products.some((item) => item.sku === product.sku)
              ? [product.sku]
              : [],
          )
        }
        onSelectionChange={(keys) => {
          const key = [...keys][0];
          if (key) {
            setAction("find");
            setLookupSku(String(key));
            perform("get", { sku: String(key) });
          }
        }}
        height="size-3600"
      >
        <TableHeader>
          <Column isRowHeader>SKU</Column>
          <Column>Name</Column>
          <Column>Price</Column>
          <Column>Review status</Column>
        </TableHeader>
        <TableBody items={products}>
          {(item) => (
            <Row key={item.sku}>
              <Cell>{item.sku}</Cell>
              <Cell>{item.name}</Cell>
              <Cell>{item.price.toFixed(2)}</Cell>
              <Cell>{item.reviewStatus}</Cell>
            </Row>
          )}
        </TableBody>
      </TableView>
      <Heading level={3}>Product actions</Heading>
      <Tabs
        aria-label="Product actions"
        selectedKey={action}
        onSelectionChange={(key) => {
          setAction(key);
          setLookupSku(product.sku);
        }}
        isDisabled={busy}
      >
        <TabList>
          {actions.map((entry) => (
            <Item key={entry.key}>{entry.label}</Item>
          ))}
        </TabList>
        <TabPanels>
          {actions.map((entry) => {
            const adding = entry.key === "add";
            const finding = entry.key === "find";
            const current = adding ? draft : product;
            const setCurrent = adding ? setDraft : setProduct;
            const attributes = ["add", "update"].includes(entry.key);
            return (
              <Item key={entry.key}>
                <Heading level={4}>{entry.label}</Heading>
                <Text>
                  {adding
                    ? "Generate fresh product details or enter your own. Creating an existing SKU is rejected."
                    : entry.key === "find"
                      ? "Find a product by SKU for the selected supplier, or select a catalog row."
                      : entry.key === "delete"
                        ? "Only rejected products can be deleted. Approvals or pending reviews are protected."
                        : "Select a catalog row or use Find product to load the record before making changes. The loaded SKU is read-only."}
                </Text>
                {adding && (
                  <Button
                    variant="secondary"
                    marginTop="size-200"
                    isDisabled={busy}
                    onPress={() => {
                      setDraft(generateProduct());
                      setSaved(null);
                    }}
                  >
                    Generate product details
                  </Button>
                )}
                <Form
                  onSubmit={(event) => event.preventDefault()}
                  marginY="size-200"
                  maxWidth="size-6000"
                >
                  <TextField
                    label="SKU"
                    value={finding ? lookupSku : current.sku}
                    onChange={(sku) => {
                      if (adding) {
                        setDraft((value) => ({ ...value, sku }));
                        setSaved(null);
                      } else if (finding) {
                        setLookupSku(sku);
                      }
                    }}
                    isReadOnly={!adding && !finding}
                    maxLength={64}
                    isDisabled={busy}
                  />
                  {attributes && (
                    <>
                      <TextField
                        label="Name"
                        value={current.name}
                        onChange={(name) =>
                          setCurrent((value) => ({ ...value, name }))
                        }
                        maxLength={200}
                        isDisabled={busy}
                      />
                      <NumberField
                        label="Price"
                        value={current.price}
                        onChange={(price) =>
                          setCurrent((value) => ({ ...value, price }))
                        }
                        minValue={0}
                        maxValue={1000000}
                        formatOptions={{ maximumFractionDigits: 2 }}
                        isDisabled={busy}
                      />
                    </>
                  )}
                  {entry.key === "review" && (
                    <Picker
                      label="Review status"
                      selectedKey={current.reviewStatus || "pending"}
                      onSelectionChange={(reviewStatus) =>
                        setProduct((value) => ({ ...value, reviewStatus }))
                      }
                      isDisabled={busy}
                    >
                      <Item key="pending">Pending</Item>
                      <Item key="approved">Approved</Item>
                      <Item key="rejected">Rejected</Item>
                    </Picker>
                  )}
                  {entry.key === "delete" ? (
                    <DialogTrigger>
                      <Button variant="negative" isDisabled={busy}>
                        {entry.button}
                      </Button>
                      <AlertDialog
                        title="Delete rejected product?"
                        variant="destructive"
                        primaryActionLabel="Delete product"
                        cancelLabel="Cancel"
                        onPrimaryAction={() => perform("delete-rejected")}
                      >
                        Delete {supplierId}/{product.sku}? This cannot be
                        undone. Only a rejected record can be removed; otherwise
                        the database safely refuses.
                      </AlertDialog>
                    </DialogTrigger>
                  ) : (
                    <Button
                      variant="accent"
                      isDisabled={busy}
                      onPress={() =>
                        perform(entry.operation, {
                          sku: finding ? lookupSku : current.sku,
                          ...(attributes
                            ? {
                                product: {
                                  name: current.name,
                                  price: current.price,
                                },
                              }
                            : {}),
                          ...(entry.key === "review"
                            ? {
                                reviewStatus: current.reviewStatus || "pending",
                              }
                            : {}),
                        })
                      }
                    >
                      {entry.button}
                    </Button>
                  )}
                </Form>
              </Item>
            );
          })}
        </TabPanels>
      </Tabs>
      {saved && (
        <View>
          <Heading level={3}>Saved product</Heading>
          <Text>
            {saved.sku}: {saved.name}, price {saved.price}, review:{" "}
            {saved.reviewStatus}, discontinued: {String(saved.discontinued)}
          </Text>
        </View>
      )}
    </>
  );
}
