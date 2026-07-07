import { useMassActionContext } from "@adobe/aio-commerce-lib-admin-ui/web";
import { Heading, ListView, ListViewItem } from "@react-spectrum/s2";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };

/** Lists the order IDs the mass action was triggered with. */
export function OrderMassAction() {
  const { selectedIds } = useMassActionContext();

  return (
    <div className={style({ margin: 8 })}>
      <Heading level={1}>Selected Ids</Heading>
      <ListView items={selectedIds.map((id) => ({ id }))}>
        {(item) => <ListViewItem id={item.id}>{item.id}</ListViewItem>}
      </ListView>
    </div>
  );
}
