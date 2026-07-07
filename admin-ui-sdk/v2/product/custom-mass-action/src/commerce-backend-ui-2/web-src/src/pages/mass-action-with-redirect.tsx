import {
  useHostConnection,
  useMassActionContext,
} from "@adobe/aio-commerce-lib-admin-ui/web";
import { Button, ComboBox, ComboBoxItem, Heading } from "@react-spectrum/s2";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };

/** Lists the product IDs the mass action was triggered with, then closes the iframe on demand. */
export function MassActionWithRedirect() {
  const { selectedIds } = useMassActionContext();
  const { close } = useHostConnection();

  return (
    <div className={style({ margin: 8 })}>
      <Heading level={1}>Selected Ids</Heading>
      <ComboBox defaultItems={selectedIds.map((id) => ({ id }))}>
        {(item) => <ComboBoxItem id={item.id}>{item.id}</ComboBoxItem>}
      </ComboBox>
      <Button variant="primary" styles={style({ marginTop: 8 })} onPress={close}>
        Done
      </Button>
    </div>
  );
}
