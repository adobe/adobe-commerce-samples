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
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Content,
  defaultTheme,
  Dialog,
  DialogContainer,
  Divider,
  Flex,
  Grid,
  Heading,
  InlineAlert,
  Item,
  Picker,
  ProgressCircle,
  Provider,
  StatusLight,
  Switch,
  TabList,
  TabPanels,
  Tabs,
  Text,
  View,
} from "@adobe/react-spectrum";
import { callCatalog } from "../api";
import CatalogWorkspace from "./CatalogWorkspace";
import CodeBlock, { CodeThemeContext } from "./CodeBlock";
import DatabaseExplorer from "./DatabaseExplorer";
import ImportStudio from "./ImportStudio";
import InitializationGuide from "./InitializationGuide";
import OperationDetails from "./OperationDetails";
import catalogConfig from "../../../shared/catalog-config.json";
import seed from "../../../../../examples/seed-data.json";

const MUTATIONS = [
  "create",
  "update",
  "save-review",
  "delete-rejected",
  "initial-import",
  "sync-feed",
];
const EMPTY_PRODUCT = { sku: "", name: "", price: 0, reviewStatus: "pending" };

function describeActivity(request, result, supplierName, switchedSupplier) {
  const product = request.sku;
  const descriptions = {
    initialize: "Initialized the demo workspace",
    schema: "Viewed collection structure and indexes",
    browse: `Browsed ${request.collection === "catalog" ? "catalog" : "supplier"} documents`,
    create: `Added product ${product}`,
    get: `Found product ${product}`,
    list: switchedSupplier
      ? `Switched to ${supplierName}`
      : `Viewed catalog page ${Math.floor(request.offset / catalogConfig.CATALOG_PAGE_SIZE) + 1}`,
    update: `Updated product ${product}`,
    "save-review": `Saved ${result.reviewStatus} review for ${product}`,
    "delete-rejected": `Deleted rejected product ${product}`,
    "initial-import": `Imported ${result.rowsCompleted} products`,
    "sync-feed": `Applied a supplier feed (${result.rowsCompleted} entries)`,
    "scan-pending": "Checked products awaiting review",
  };
  const label = descriptions[request.operation];
  return request.supplierId && !switchedSupplier
    ? `${label} (${supplierName})`
    : label;
}

function Workbench({ ims, invoke }) {
  const [initialized, setInitialized] = useState(null);
  const [checkingWorkspace, setCheckingWorkspace] = useState(true);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState("acme");
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(EMPTY_PRODUCT);
  const [saved, setSaved] = useState(null);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [scan, setScan] = useState(null);
  const [workspace, setWorkspace] = useState("catalog");
  const [explorerPage, setExplorerPage] = useState(null);
  const [explorerSchema, setExplorerSchema] = useState(null);
  const [explorerTab, setExplorerTab] = useState("documents");
  const active = useRef(null);
  const ready = Boolean(ims.token || ims.local);
  const currentIms = useRef(ims);
  currentIms.current = ims;
  const bootstrapSession = useMemo(
    () => ({
      ready,
      org: ims.org,
      local: ims.local,
      attempt: bootstrapAttempt,
    }),
    [ready, ims.org, ims.local, bootstrapAttempt],
  );

  useEffect(() => {
    if (!bootstrapSession.ready) {
      return;
    }
    const ims = currentIms.current;
    const controller = new AbortController();
    active.current = controller;
    setCheckingWorkspace(true);
    setError("");
    setBusy(true);
    (async () => {
      try {
        const state = await invoke(
          ims,
          { operation: "status" },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setInitialized(state.result.initialized);
        setSuppliers(state.result.suppliers);
        if (state.result.initialized) {
          const firstSupplier = state.result.suppliers[0].supplierId;
          const list = await invoke(
            ims,
            { operation: "list", supplierId: firstSupplier, offset: 0 },
            controller.signal,
          );
          if (controller.signal.aborted) return;
          setSupplierId(firstSupplier);
          setProducts(list.result);
          setProduct(list.result[0] || EMPTY_PRODUCT);
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      } finally {
        if (!controller.signal.aborted) {
          setCheckingWorkspace(false);
          setBusy(false);
          active.current = null;
        }
      }
    })();
    return () => {
      controller.abort();
      active.current?.abort();
      active.current = null;
    };
  }, [bootstrapSession, invoke]);

  async function perform(operation, extra = {}) {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setError("");
    setNotice("");
    const selectedSupplier = extra.supplierId || supplierId;
    const id = crypto.randomUUID();
    const followUps = [];
    let response;
    try {
      const request = ["initialize", "schema"].includes(operation)
        ? { operation }
        : operation === "browse"
          ? { operation, ...extra }
          : {
              operation,
              supplierId: selectedSupplier,
              sku: product.sku,
              ...extra,
            };
      // Even failed batches can leave committed writes.
      if (MUTATIONS.includes(operation)) {
        setExplorerPage(null);
        setScan(null);
        setSaved(null);
      }
      response = await invoke(ims, request, controller.signal);
      if (controller.signal.aborted) return;
      const supplierName =
        suppliers.find((supplier) => supplier.supplierId === request.supplierId)
          ?.name || request.supplierId;
      const activity = describeActivity(
        request,
        response.result,
        supplierName,
        operation === "list" &&
          extra.supplierId &&
          extra.supplierId !== supplierId,
      );
      setHistory((previous) =>
        [{ ...response, activity, followUps: [], id }, ...previous].slice(0, 8),
      );
      if (["create", "save-review"].includes(operation)) {
        setSaved(response.result);
        setProduct(response.result);
      }
      if (operation === "delete-rejected") {
        setProduct(EMPTY_PRODUCT);
        setProducts((previous) =>
          previous.filter((item) => item.sku !== request.sku),
        );
      }
      if (operation === "initialize") {
        setInitialized(response.result.initialized);
        setSuppliers(response.result.suppliers);
        const firstSupplier = response.result.suppliers[0].supplierId;
        const list = await invoke(
          ims,
          { operation: "list", supplierId: firstSupplier, offset: 0 },
          controller.signal,
        );
        followUps.push(list);
        if (controller.signal.aborted) return;
        setSupplierId(firstSupplier);
        setProducts(list.result);
        setProduct(list.result[0] || EMPTY_PRODUCT);
        setNotice(
          response.result.alreadyInitialized
            ? "Workspace already initialized. Your edits were preserved."
            : `${response.result.suppliers.length} suppliers and ${response.result.seededProducts} products are ready. Select any action to start learning.`,
        );
      } else if (operation === "browse") {
        setExplorerPage(response.result);
      } else if (operation === "schema") {
        setExplorerSchema(response.result);
      } else if (operation === "list") {
        setProducts(response.result);
        setOffset(extra.offset || 0);
        if (extra.supplierId) {
          setSupplierId(selectedSupplier);
          setSaved(null);
          setProduct(response.result[0] || EMPTY_PRODUCT);
          setScan(null);
        }
      } else if (operation === "get") {
        setSaved(response.result);
        setProduct(response.result);
      } else if (operation === "scan-pending") {
        setScan(response.result);
      }
      if (MUTATIONS.includes(operation)) {
        // Record follow-up reads separately, so the tutorial shows every SDK operation.
        const list = await invoke(
          ims,
          { operation: "list", supplierId: selectedSupplier, offset: 0 },
          controller.signal,
        );
        followUps.push(list);
        if (controller.signal.aborted) return;
        setProducts(list.result);
        setOffset(0);
        if (operation === "update") {
          const detail = await invoke(
            ims,
            {
              operation: "get",
              supplierId: selectedSupplier,
              sku: request.sku,
            },
            controller.signal,
          );
          followUps.push(detail);
          if (controller.signal.aborted) return;
          setSaved(detail.result);
          setProduct(detail.result);
        } else if (operation === "delete-rejected") {
          setProduct(list.result[0] || EMPTY_PRODUCT);
        }
        setNotice(
          "Changes saved to the database. The catalog has been refreshed.",
        );
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(
          response
            ? `${operation} succeeded, but the follow-up refresh failed. Inspect the saved result before retrying. ${failure.message}`
            : failure.message || "Request failed. Try again.",
        );
        if (failure.progress)
          setDialog({
            title: "Partial write progress",
            description:
              "The feed failed after some writes may have been committed. Inspect the completed batches and current records before retrying; completed writes are not rolled back.",
            data: failure.progress,
          });
      }
    } finally {
      if (!controller.signal.aborted) {
        if (response)
          setHistory((previous) =>
            previous.map((entry) =>
              entry.id === id ? { ...entry, followUps } : entry,
            ),
          );
        setBusy(false);
        active.current = null;
      }
    }
  }

  const alerts = (
    <>
      {busy && (
        <ProgressCircle
          aria-label="Running database operation"
          isIndeterminate
        />
      )}
      {error && (
        <InlineAlert variant="negative">
          <Heading>Operation needs attention</Heading>
          <Content>{error}</Content>
        </InlineAlert>
      )}
      {notice && (
        <InlineAlert variant="positive">
          <Heading>Workspace updated</Heading>
          <Content>{notice}</Content>
        </InlineAlert>
      )}
    </>
  );

  if (checkingWorkspace || initialized !== true) {
    return (
      <Flex
        direction="column"
        alignItems="center"
        justifyContent="center"
        minHeight="calc(100vh - 80px)"
        padding={{ base: "size-200", L: "size-400" }}
      >
        <Flex
          direction="column"
          alignItems="center"
          gap="size-250"
          width="100%"
          maxWidth="size-8000"
        >
          <Text>SUPPLY DESK / APP BUILDER DATABASE LAB</Text>
          <Heading level={1}>
            {checkingWorkspace
              ? "Opening your workspace"
              : initialized === false
                ? "Set up your supplier catalog"
                : "Connect to your workspace"}
          </Heading>
          {checkingWorkspace ? (
            <>
              <ProgressCircle
                aria-label="Checking saved workspace setup"
                isIndeterminate
              />
              <Text>
                {ready
                  ? "Checking saved setup so you can pick up where you left off."
                  : "Connect through Experience Cloud Shell, or run npm run dev for the local database bridge."}
              </Text>
            </>
          ) : (
            <>
              {initialized === false && (
                <>
                  <Text>
                    A hands-on playground for importing, editing and reviewing
                    products with App Builder Database.
                  </Text>
                  <View
                    backgroundColor="gray-100"
                    borderWidth="thin"
                    borderColor="gray-300"
                    borderRadius="medium"
                    padding="size-300"
                    width="100%"
                  >
                    <Flex direction="column" gap="size-200">
                      <Heading level={2}>Your starting data</Heading>
                      <Text>
                        {seed.suppliers.length} suppliers (
                        {seed.suppliers
                          .map((supplier) => supplier.name)
                          .join(", ")}
                        ) and {seed.catalog.length} sample products in two
                        collections: suppliers and catalog.
                      </Text>
                      <Heading level={2}>What initialization does</Heading>
                      <Text>
                        Creates missing collections and unique indexes, then
                        saves the sample data. All actions in the app read and
                        change this workspace database. The database must
                        already be provisioned; this button never provisions or
                        deletes a database.
                      </Text>
                      <Heading level={2}>Continue where you left off</Heading>
                      <Text>
                        Setup is saved in the database, across browsers and
                        sessions for this workspace. Returning opens your
                        existing catalog. Retrying setup preserves your edits
                        and does not restore deleted products.
                      </Text>
                    </Flex>
                  </View>
                </>
              )}
              {alerts}
              <Button
                variant="accent"
                isDisabled={busy}
                onPress={() =>
                  initialized === false
                    ? perform("initialize")
                    : setBootstrapAttempt((attempt) => attempt + 1)
                }
              >
                {initialized === false ? "Initialize app" : "Retry connection"}
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    );
  }

  return (
    <View
      padding={{ base: "size-200", L: "size-400" }}
      maxWidth="size-20000"
      marginX="auto"
    >
      <Flex
        justifyContent="space-between"
        alignItems="center"
        wrap
        gap="size-200"
      >
        <View>
          <Text>SUPPLY DESK / DATABASE LAB</Text>
          <Heading level={1}>Supplier Catalog Importer</Heading>
        </View>
      </Flex>
      <Text>
        A hands-on catalog operations console. Make a change, see it saved, then
        explore the library calls behind it.
      </Text>
      <View marginY="size-300">
        <Picker
          label="Supplier"
          selectedKey={supplierId}
          isDisabled={busy}
          onSelectionChange={(key) =>
            perform("list", { supplierId: String(key), offset: 0 })
          }
        >
          {suppliers.map((supplier) => (
            <Item key={supplier.supplierId}>{supplier.name}</Item>
          ))}
        </Picker>
      </View>
      <Flex gap="size-200" marginY="size-200" wrap>
        <StatusLight variant="info">{suppliers.length} suppliers</StatusLight>
        <StatusLight variant="info">2 collections</StatusLight>
        <StatusLight variant="info">
          {products.length} products on this page
        </StatusLight>
        <StatusLight variant="notice">
          {products.filter((item) => item.reviewStatus === "pending").length}{" "}
          pending on this page
        </StatusLight>
      </Flex>
      <View marginY="size-200">{alerts}</View>
      <Grid
        columns={{
          base: ["minmax(0, 1fr)"],
          L: ["minmax(0, 3fr)", "minmax(260px, 1fr)"],
        }}
        gap="size-300"
      >
        <View minWidth={0}>
          <Tabs
            aria-label="Catalog learning workspaces"
            selectedKey={workspace}
            isDisabled={busy}
            onSelectionChange={(key) => {
              setWorkspace(key);
              if (
                key === "explorer" &&
                !explorerPage &&
                explorerTab === "documents"
              )
                perform("browse", { collection: "catalog" });
            }}
          >
            <TabList>
              <Item key="catalog">Catalog workspace</Item>
              <Item key="imports">Import studio</Item>
              <Item key="reviews">Review queue</Item>
              <Item key="explorer">Database explorer</Item>
            </TabList>
            <TabPanels>
              <Item key="catalog">
                <CatalogWorkspace
                  key={supplierId}
                  products={products}
                  product={product}
                  setProduct={setProduct}
                  saved={saved}
                  setSaved={setSaved}
                  supplierId={supplierId}
                  offset={offset}
                  busy={busy}
                  perform={perform}
                />
              </Item>
              <Item key="explorer">
                <DatabaseExplorer
                  page={explorerPage}
                  schema={explorerSchema}
                  tab={explorerTab}
                  setTab={setExplorerTab}
                  suppliers={suppliers}
                  busy={busy}
                  perform={perform}
                />
              </Item>
              <Item key="imports">
                <ImportStudio
                  key={supplierId}
                  products={products}
                  busy={busy}
                  perform={perform}
                />
              </Item>
              <Item key="reviews">
                <Heading level={2}>Review queue</Heading>
                <Text>
                  Stream through pending products using for await...of. The
                  action counts up to 1000 matches, retains just 20 preview
                  SKUs, and reports truncation.
                </Text>
                <Button
                  variant="accent"
                  marginY="size-250"
                  isDisabled={busy}
                  onPress={() => perform("scan-pending")}
                >
                  Scan pending reviews
                </Button>
                {scan && (
                  <View>
                    <Heading level={3}>
                      {scan.scanned}
                      {scan.truncated ? "+" : ""} products awaiting review
                    </Heading>
                    <Text>
                      {scan.truncated
                        ? "Scan limit reached; this is not the full catalog total."
                        : "Complete scan for this supplier."}
                    </Text>
                    <CodeBlock
                      code={JSON.stringify(scan, null, 2)}
                      label="Pending review scan result"
                    />
                  </View>
                )}
              </Item>
            </TabPanels>
          </Tabs>
        </View>
        <View
          backgroundColor="gray-100"
          padding="size-250"
          borderRadius="medium"
          minWidth={0}
        >
          <Heading level={2}>Learn by doing</Heading>
          <Text>
            1. Choose a supplier. 2. Make a change. 3. Inspect the SDK call.
          </Text>
          <Divider marginY="size-250" />
          <InitializationGuide />
          <Divider marginY="size-250" />
          <Heading level={3}>Recent activity</Heading>
          {history.length === 0 && (
            <Text>
              Your actions appear here. Select What happened? to explore how
              each one works.
            </Text>
          )}
          {history.map((entry) => (
            <Flex
              key={entry.id}
              marginBottom="size-250"
              gap="size-100"
              alignItems="start"
              wrap
            >
              <Text flex>{entry.activity}</Text>
              <OperationDetails entry={entry} />
            </Flex>
          ))}
        </View>
      </Grid>
      <DialogContainer isDismissable onDismiss={() => setDialog(null)}>
        {dialog && (
          <Dialog size="L">
            <Heading>{dialog.title}</Heading>
            <Divider />
            <Content>
              <Text>{dialog.description}</Text>
              <CodeBlock
                code={JSON.stringify(dialog.data, null, 2)}
                label={dialog.title}
              />
            </Content>
          </Dialog>
        )}
      </DialogContainer>
    </View>
  );
}

export default function App({ ims, locale = "en-US", invoke = callCatalog }) {
  const [colorScheme, setColorScheme] = useState(() => {
    try {
      const saved = localStorage.getItem("supplier-catalog-color-scheme");
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // Appearance preferences are optional when browser storage is blocked.
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const connection = useMemo(
    () => ({ token: ims.token, org: ims.org, local: ims.local }),
    [ims.token, ims.org, ims.local],
  );
  return (
    <CodeThemeContext.Provider value={colorScheme}>
      <Provider theme={defaultTheme} colorScheme={colorScheme} locale={locale}>
        <View
          maxWidth="size-20000"
          marginX="auto"
          paddingX="size-400"
          paddingTop="size-200"
        >
          <Flex justifyContent="end">
            <Switch
              isSelected={colorScheme === "dark"}
              onChange={(dark) => {
                const next = dark ? "dark" : "light";
                setColorScheme(next);
                try {
                  localStorage.setItem("supplier-catalog-color-scheme", next);
                } catch {
                  // Theme switching still works without persistent storage.
                }
              }}
            >
              Dark theme
            </Switch>
          </Flex>
        </View>
        <Workbench ims={connection} invoke={invoke} />
      </Provider>
    </CodeThemeContext.Provider>
  );
}
