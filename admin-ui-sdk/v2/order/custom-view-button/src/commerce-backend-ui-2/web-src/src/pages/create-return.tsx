import { Button } from "@react-spectrum/s2";
import {
  useHostConnection,
  useOrderViewButtonContext,
} from "@adobe/aio-commerce-lib-admin-ui/web";

/** Entrypoint for the "Create Return" order view button. */
export function CreateReturnPage() {
  const { orderId } = useOrderViewButtonContext();
  const { close } = useHostConnection();

  return (
    <main>
      <h1>Request Return</h1>
      <p>Order ID is: {orderId}</p>
      <Button variant="primary" onPress={() => close()}>
        Done
      </Button>
    </main>
  );
}
