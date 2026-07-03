import { useOrderViewButtonContext } from "@adobe/aio-commerce-lib-admin-ui/web";

/** Entrypoint for the "Delete" order view button. */
export function DeleteOrderPage() {
  const { orderId } = useOrderViewButtonContext();

  return (
    <main>
      <h1>Delete Order</h1>
      <p>Order ID to delete is: {orderId}</p>
    </main>
  );
}
