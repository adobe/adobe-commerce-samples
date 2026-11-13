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
  Content,
  Flex,
  Heading,
  InlineAlert,
  NumberField,
  Text,
  TextArea,
  View,
} from "@adobe/react-spectrum";
import { generateRows } from "../generate-data";

export default function ImportStudio({ products, busy, perform }) {
  const [count, setCount] = useState(75);
  const [initialRows, setInitialRows] = useState("");
  const [feedRows, setFeedRows] = useState("");
  const [error, setError] = useState("");

  function generate(mixed) {
    try {
      const generated = generateRows(count, mixed ? products : null);
      (mixed ? setFeedRows : setInitialRows)(
        JSON.stringify(generated, null, 2),
      );
      setError("");
    } catch (failure) {
      setError(failure.message);
    }
  }
  function ingest(operation, text) {
    try {
      const rows = JSON.parse(text);
      setError("");
      perform(operation, { rows });
    } catch {
      setError("Generate data first, or enter a valid JSON array.");
    }
  }
  return (
    <Flex direction="column" gap="size-250">
      <Heading level={2}>Import studio</Heading>
      <Text>
        Generate 75 records to watch two bounded batches execute. Generated SKUs
        are unique; nothing is written until you import.
      </Text>
      <NumberField
        label="Records to generate"
        value={count}
        onChange={setCount}
        minValue={1}
        maxValue={500}
        step={1}
        isDisabled={busy}
      />
      {error && (
        <InlineAlert variant="negative">
          <Heading>Check your feed</Heading>
          <Content>{error}</Content>
        </InlineAlert>
      )}
      <View
        borderWidth="thin"
        borderColor="gray-300"
        borderRadius="medium"
        padding="size-250"
      >
        <Heading level={3}>New catalog products</Heading>
        <Text>
          insertMany inserts new records in batches of 50. Existing SKUs fail
          rather than overwrite.
        </Text>
        <Flex gap="size-100" marginY="size-200" wrap>
          <Button
            variant="secondary"
            isDisabled={busy}
            onPress={() => generate(false)}
          >
            Generate initial catalog
          </Button>
          <Button
            variant="accent"
            isDisabled={busy}
            onPress={() => ingest("initial-import", initialRows)}
          >
            Import initial catalog
          </Button>
        </Flex>
        <TextArea
          label="Initial catalog JSON"
          value={initialRows}
          onChange={setInitialRows}
          width="100%"
          height="size-2400"
          isDisabled={busy}
        />
      </View>
      <View
        borderWidth="thin"
        borderColor="gray-300"
        borderRadius="medium"
        padding="size-250"
      >
        <Heading level={3}>Subsequent supplier feed</Heading>
        <Text>
          bulkWrite changes an existing product, discontinues another when
          available, and upserts fresh products. A discontinued SKU is never
          inserted.
        </Text>
        <Flex gap="size-100" marginY="size-200" wrap>
          <Button
            variant="secondary"
            isDisabled={busy}
            onPress={() => generate(true)}
          >
            Generate mixed feed
          </Button>
          <Button
            variant="accent"
            isDisabled={busy}
            onPress={() => ingest("sync-feed", feedRows)}
          >
            Apply mixed feed
          </Button>
        </Flex>
        <TextArea
          label="Mixed feed JSON"
          value={feedRows}
          onChange={setFeedRows}
          width="100%"
          height="size-2400"
          isDisabled={busy}
        />
      </View>
    </Flex>
  );
}
