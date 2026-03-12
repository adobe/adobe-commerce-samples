import { Flex, ProgressCircle, View } from "@adobe/react-spectrum";
import { attach } from "@adobe/uix-guest";
import { useEffect, useState } from "react";

import { APP_EXTENSION_ID } from "../constants/extension";
import { DeliveryEstimatesPage } from "./DeliveryEstimatesPage";

export const MainPage = (props) => {
  const [imsToken, setImsToken] = useState(null);
  const [imsOrgId, setImsOrgId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    const loadImsInfo = async () => {
      try {
        if (props.ims?.token) {
          setImsToken(props.ims.token);
          setImsOrgId(props.ims.org);
        } else {
          const guestConnection = await attach({ id: APP_EXTENSION_ID });
          const context = guestConnection?.sharedContext;
          setImsToken(context?.get("imsToken"));
          setImsOrgId(context?.get("imsOrgId"));
        }
      } catch (error) {
        console.error("Error loading IMS info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadImsInfo();
  }, []);

  return (
    <View>
      {isLoading ? (
        <Flex alignItems="center" height="100vh" justifyContent="center">
          <ProgressCircle aria-label="Loading…" isIndeterminate size="L" />
        </Flex>
      ) : (
        <DeliveryEstimatesPage imsOrgId={imsOrgId} imsToken={imsToken} />
      )}
    </View>
  );
};
