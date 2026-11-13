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
  Button,
  Cell,
  Column,
  Content,
  Dialog,
  DialogTrigger,
  Divider,
  Flex,
  Form,
  Grid,
  Heading,
  Item,
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
import CodeBlock from "./CodeBlock";
import catalogConfig from "../../../shared/catalog-config.json";

const COLLECTIONS = Object.entries(catalogConfig.EXPLORER_COLLECTIONS).map(
  ([id, definition]) => ({ id, ...definition }),
);

export default function DatabaseExplorer({
  page,
  schema,
  tab,
  setTab,
  suppliers,
  busy,
  perform,
}) {
  const collection = page?.collection || "catalog";
  const definition = COLLECTIONS.find((entry) => entry.id === collection);
  return (
    <View>
      <Heading level={2}>Database explorer</Heading>
      <Text>
        Read-only access to this app's two collections. Documents show
        application fields; internal IDs are omitted. Use the product-action
        tabs to make changes.
      </Text>
      <Grid
        columns={{
          base: ["minmax(0, 1fr)"],
          L: ["size-2400", "minmax(0, 1fr)"],
        }}
        gap="size-250"
        marginTop="size-250"
      >
        <View
          backgroundColor="gray-100"
          padding="size-200"
          borderRadius="medium"
        >
          <Heading level={3}>You have two collections</Heading>
          <Flex direction="column" gap="size-150">
            {COLLECTIONS.map((entry) => (
              <Button
                key={entry.id}
                variant={entry.id === collection ? "accent" : "secondary"}
                isDisabled={busy}
                onPress={() => perform("browse", { collection: entry.id })}
              >
                {entry.label}
              </Button>
            ))}
          </Flex>
        </View>
        <View minWidth={0}>
          <Heading level={3}>{definition.name}</Heading>
          <Tabs
            aria-label="Database explorer views"
            isDisabled={busy}
            selectedKey={tab}
            onSelectionChange={(key) => {
              setTab(key);
              if (key === "schema") perform("schema");
              else if (!page) perform("browse", { collection });
            }}
          >
            <TabList>
              <Item key="documents">Documents</Item>
              <Item key="schema">Schema &amp; indexes</Item>
            </TabList>
            <TabPanels>
              <Item key="documents">
                <DocumentBrowser
                  key={JSON.stringify([collection, page?.filter, page?.sort])}
                  page={page}
                  definition={definition}
                  suppliers={suppliers}
                  busy={busy}
                  perform={perform}
                />
              </Item>
              <Item key="schema">
                <Button
                  variant="secondary"
                  isDisabled={busy}
                  onPress={() => perform("schema")}
                >
                  Refresh schema &amp; indexes
                </Button>
                {schema ? (
                  <View>
                    <Text>{schema.note}</Text>
                    {schema.collections
                      .filter((entry) => entry.name === definition.name)
                      .map((entry) => (
                        <View key={entry.name}>
                          <Text>{entry.purpose}</Text>
                          <Heading level={4}>Document model</Heading>
                          <CodeBlock
                            code={JSON.stringify(entry.fields, null, 2)}
                            label="Document model"
                          />
                          <Heading level={4}>Database indexes</Heading>
                          <CodeBlock
                            code={JSON.stringify(entry.indexes, null, 2)}
                            label="Database indexes"
                          />
                        </View>
                      ))}
                    <Text>{schema.relationship}</Text>
                  </View>
                ) : (
                  <Text>
                    Load schema and indexes to inspect this collection.
                  </Text>
                )}
              </Item>
            </TabPanels>
          </Tabs>
        </View>
      </Grid>
    </View>
  );
}

function DocumentBrowser({ page, definition, suppliers, busy, perform }) {
  const [supplierId, setSupplierId] = useState(page?.filter.supplierId || "");
  const [sku, setSku] = useState(page?.filter.sku || "");
  const [reviewStatus, setReviewStatus] = useState(
    page?.filter.reviewStatus || "",
  );
  const [sortBy, setSortBy] = useState(
    Object.keys(page?.sort || {})[0] || definition.defaultSort,
  );
  const [sortDirection, setSortDirection] = useState(
    page
      ? page.sort[sortBy] === 1
        ? "asc"
        : "desc"
      : definition.defaultDirection,
  );
  const catalog = definition.id === "catalog";
  function apply() {
    perform("browse", {
      collection: definition.id,
      supplierId,
      ...(catalog ? { sku, reviewStatus } : {}),
      sortBy,
      sortDirection,
      offset: 0,
    });
  }
  function paginate(offset) {
    perform("browse", {
      collection: definition.id,
      ...page.filter,
      sortBy: Object.keys(page.sort)[0],
      sortDirection: Object.values(page.sort)[0] === 1 ? "asc" : "desc",
      offset,
    });
  }
  return (
    <>
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          apply();
        }}
        marginY="size-200"
      >
        <Flex gap="size-150" wrap alignItems="end">
          <Picker
            label="Filter by supplier"
            selectedKey={supplierId}
            onSelectionChange={setSupplierId}
            isDisabled={busy}
          >
            <Item key="">All suppliers</Item>
            {suppliers.map((supplier) => (
              <Item key={supplier.supplierId}>{supplier.name}</Item>
            ))}
          </Picker>
          {catalog && (
            <>
              <TextField
                label="Exact SKU"
                value={sku}
                onChange={setSku}
                maxLength={64}
                isDisabled={busy}
              />
              <Picker
                label="Filter by review status"
                selectedKey={reviewStatus}
                onSelectionChange={setReviewStatus}
                isDisabled={busy}
              >
                <Item key="">All statuses</Item>
                <Item key="pending">Pending</Item>
                <Item key="approved">Approved</Item>
                <Item key="rejected">Rejected</Item>
              </Picker>
            </>
          )}
          <Picker
            label="Sort documents by"
            selectedKey={sortBy}
            onSelectionChange={setSortBy}
            isDisabled={busy}
          >
            {definition.sortFields.map((field) => (
              <Item key={field}>{field}</Item>
            ))}
          </Picker>
          <Picker
            label="Sort direction"
            selectedKey={sortDirection}
            onSelectionChange={setSortDirection}
            isDisabled={busy}
          >
            <Item key="asc">Ascending</Item>
            <Item key="desc">Descending</Item>
          </Picker>
          <Button type="submit" variant="accent" isDisabled={busy}>
            Apply filters
          </Button>
        </Flex>
      </Form>
      {page && (
        <>
          <Text>
            {page.documents.length
              ? `Showing documents ${page.offset + 1}-${page.offset + page.documents.length}`
              : "No matching documents"}
            . Up to {catalogConfig.EXPLORER_PAGE_SIZE} per page; this is not a
            collection total. Change filters, then select Apply filters.
          </Text>
          <TableView
            aria-label="Database documents"
            renderEmptyState={() => (
              <Text>No matching documents. Adjust your filters.</Text>
            )}
            height="size-3600"
            marginY="size-200"
          >
            <TableHeader>
              <Column isRowHeader>Supplier ID</Column>
              <Column>{catalog ? "SKU" : "Country"}</Column>
              <Column>Name</Column>
              <Column>{catalog ? "Price" : "Created"}</Column>
              <Column>
                {catalog ? "Review status" : "Initialized version"}
              </Column>
              <Column>Document</Column>
            </TableHeader>
            <TableBody items={page.documents}>
              {(document) => (
                <Row key={`${document.supplierId}/${document.sku || ""}`}>
                  <Cell>{document.supplierId}</Cell>
                  <Cell>{catalog ? document.sku : document.country}</Cell>
                  <Cell>{document.name}</Cell>
                  <Cell>
                    {catalog ? document.price.toFixed(2) : document.createdAt}
                  </Cell>
                  <Cell>
                    {catalog
                      ? document.reviewStatus
                      : String(document.initializedVersion)}
                  </Cell>
                  <Cell>
                    <DialogTrigger isDismissable>
                      <Button
                        variant="secondary"
                        aria-label={`View JSON ${document.supplierId}/${document.sku || ""}`}
                      >
                        View JSON
                      </Button>
                      <Dialog size="L" isDismissable>
                        <Heading>{document.sku || document.name}</Heading>
                        <Divider />
                        <Content>
                          <Text>
                            This read-only document shows application fields
                            from {definition.name}; the internal database ID is
                            omitted. Use the product-action tabs to make
                            changes.
                          </Text>
                          <CodeBlock
                            code={JSON.stringify(document, null, 2)}
                            label="Document JSON"
                          />
                        </Content>
                      </Dialog>
                    </DialogTrigger>
                  </Cell>
                </Row>
              )}
            </TableBody>
          </TableView>
          <Flex gap="size-150">
            {page.offset > 0 && (
              <Button
                variant="secondary"
                isDisabled={busy}
                onPress={() => paginate(page.offset - page.pageSize)}
              >
                Previous documents
              </Button>
            )}
            {page.hasNext && (
              <Button
                variant="secondary"
                isDisabled={busy}
                onPress={() => paginate(page.offset + page.pageSize)}
              >
                Next documents
              </Button>
            )}
          </Flex>
          {page.pageLimitReached && (
            <Text>
              Browse limit reached. Narrow the supplier, SKU or review-status
              filters.
            </Text>
          )}
        </>
      )}
    </>
  );
}
