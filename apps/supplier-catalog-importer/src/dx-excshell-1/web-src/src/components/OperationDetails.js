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
import { useId, useState } from "react";
import {
  Button,
  Content,
  Dialog,
  DialogTrigger,
  Divider,
  Heading,
  Text,
  View,
} from "@adobe/react-spectrum";
import CodeBlock from "./CodeBlock";
import {
  CLIENT_SETUP,
  CLIENT_CLEANUP,
} from "../../../shared/database-tutorial";

export default function OperationDetails({ entry }) {
  const [showClient, setShowClient] = useState(false);
  const clientDetailsId = useId();
  return (
    <DialogTrigger isDismissable>
      <Button
        variant="secondary"
        aria-label={`What happened? ${entry.activity || entry.lesson.title}`}
      >
        What happened?
      </Button>
      <Dialog size="L" isDismissable>
        <Heading>{entry.lesson.title}</Heading>
        <Divider />
        <Content>
          <Heading level={3}>What this does</Heading>
          <View marginBottom="size-250">
            <Text>{entry.lesson.note}</Text>
          </View>
          <Heading level={3}>Database client lifecycle</Heading>
          <Text>
            Each validated database request opens one server-side client, reuses
            it for that request's SDK calls, then closes it in finally.
          </Text>
          <Button
            variant="secondary"
            marginY="size-150"
            aria-expanded={showClient}
            aria-controls={clientDetailsId}
            onPress={() => setShowClient((shown) => !shown)}
          >
            {showClient ? "Hide client setup" : "Show client setup"}
          </Button>
          {showClient && (
            <View id={clientDetailsId} marginBottom="size-250">
              {[CLIENT_SETUP, CLIENT_CLEANUP].map((step) => (
                <View key={step.title}>
                  <Text>{step.note}</Text>
                  <CodeBlock
                    code={step.code}
                    language="javascript"
                    label={step.title}
                  />
                </View>
              ))}
            </View>
          )}
          <Heading level={3}>SDK calls in the action</Heading>
          <CodeBlock
            code={entry.lesson.code}
            language="javascript"
            label="Action SDK calls"
          />
          <Heading level={3}>Database result</Heading>
          <CodeBlock
            code={JSON.stringify(entry.result, null, 2)}
            label="Database result"
          />
          {entry.followUps?.map((followUp) => (
            <View key={followUp.operation}>
              <Heading level={3}>UI follow-up: {followUp.lesson.title}</Heading>
              <Text>{followUp.lesson.note}</Text>
              <CodeBlock
                code={followUp.lesson.code}
                language="javascript"
                label={`Follow-up ${followUp.operation} SDK calls`}
              />
            </View>
          ))}
        </Content>
      </Dialog>
    </DialogTrigger>
  );
}
