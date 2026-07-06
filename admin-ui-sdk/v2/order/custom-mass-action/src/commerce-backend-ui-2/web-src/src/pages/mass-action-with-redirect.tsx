import {
  useHostConnection,
  useMassActionContext,
} from "@adobe/aio-commerce-lib-admin-ui/web";
import { Button, ComboBox, ComboBoxItem, Heading } from "@react-spectrum/s2";

/** Lists the order IDs the mass action was triggered with, then closes the iframe on demand. */
export function MassActionWithRedirect() {
  const { selectedIds } = useMassActionContext();
  const { close } = useHostConnection();

  return (
    <div style={{ margin: 10 }}>
      <Heading level={1}>Selected Ids</Heading>
      <ComboBox defaultItems={selectedIds.map((id) => ({ id }))}>
        {(item) => <ComboBoxItem id={item.id}>{item.id}</ComboBoxItem>}
      </ComboBox>
      <div style={{ marginTop: 10 }}>
        <Button variant="primary" onPress={() => close()}>
          Done
        </Button>
      </div>
    </div>
  );
}
