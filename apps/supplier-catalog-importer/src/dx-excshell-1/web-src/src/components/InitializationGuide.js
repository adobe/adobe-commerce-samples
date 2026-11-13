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
import { initializationTutorial } from "../../../shared/database-tutorial";
import CodeBlock from "./CodeBlock";

export default function InitializationGuide() {
  return (
    <View>
      <Heading level={3}>Database initialization</Heading>
      <Text>
        Server-side client creation, two collections and their unique indexes,
        sample records, and saved readiness for your next visit.
      </Text>
      <DialogTrigger isDismissable>
        <Button variant="secondary" marginTop="size-150">
          How initialization works
        </Button>
        <Dialog size="L" isDismissable>
          <Heading>How database initialization works</Heading>
          <Divider />
          <Content>
            <Text>
              A reference walkthrough of Initialize app, independent of Recent
              activity. These SDK excerpts explain the server implementation;
              opening this guide does not run setup or change the database. On
              an already initialized workspace, seed writes are skipped.
            </Text>
            {Object.values(initializationTutorial()).map((step, index) => (
              <View key={step.title} marginTop="size-300">
                <Heading level={3}>
                  {index + 1}. {step.title}
                </Heading>
                <Text>{step.note}</Text>
                <CodeBlock
                  code={step.code}
                  language="javascript"
                  label={step.title}
                />
              </View>
            ))}
          </Content>
        </Dialog>
      </DialogTrigger>
    </View>
  );
}
