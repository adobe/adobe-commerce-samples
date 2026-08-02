/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
  useHostConnection,
  useMassActionContext,
} from "@adobe/aio-commerce-lib-admin-ui/web";
import { Button, ComboBox, ComboBoxItem, Heading } from "@react-spectrum/s2";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };

import { throwIfError } from "#web/utils.ts";

/** Lists the customer IDs the mass action was triggered with, then closes the iframe on demand. */
export function MassActionWithRedirect() {
  const { data } = throwIfError(useMassActionContext());
  const { actions } = throwIfError(useHostConnection());

  return (
    <div className={style({ margin: 8 })}>
      <Heading level={1}>Selected Ids</Heading>
      <ComboBox defaultItems={data.selectedIds.map((id) => ({ id }))}>
        {(item) => <ComboBoxItem id={item.id}>{item.id}</ComboBoxItem>}
      </ComboBox>
      <Button
        onPress={actions.close}
        styles={style({ marginTop: 8 })}
        variant="primary">
        Done
      </Button>
    </div>
  );
}
