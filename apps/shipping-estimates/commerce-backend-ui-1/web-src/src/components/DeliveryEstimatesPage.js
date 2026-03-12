import {
  Button,
  Flex,
  Form,
  Heading,
  NumberField,
  ProgressCircle,
  Switch,
  Text,
  TextArea,
  TextField,
  View,
  Well,
} from "@adobe/react-spectrum";
import { useCallback, useEffect, useState } from "react";

import { useDeliveryConfig } from "../hooks/useDeliveryConfig";

export const DeliveryEstimatesPage = ({ imsToken, imsOrgId }) => {
  const { config, isLoading, error, loadConfig, saveConfig, isSaving } =
    useDeliveryConfig({ imsToken, imsOrgId });

  const [formState, setFormState] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (config) {
      setFormState({
        ...config,
        default_carriers_text: (config.default_carriers ?? []).join(", "),
        default_service_levels_text: (config.default_service_levels ?? []).join(
          ", ",
        ),
        carrier_code_mapping_text: Object.entries(
          config.carrier_code_mapping ?? {},
        )
          .map(([k, v]) => `${k}=${v}`)
          .join("\n"),
      });
    }
  }, [config]);

  const updateField = useCallback((field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setSaveMessage(null);
  }, []);

  const updateOriginField = useCallback((field, value) => {
    setFormState((prev) => ({
      ...prev,
      origin: { ...prev.origin, [field]: value },
    }));
    setSaveMessage(null);
  }, []);

  const handleSave = useCallback(async () => {
    const carriers = formState.default_carriers_text
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const serviceLevels = formState.default_service_levels_text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const mappingEntries = formState.carrier_code_mapping_text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split("=");
        return [key?.trim(), rest.join("=")?.trim()];
      })
      .filter(([k, v]) => k && v);

    const payload = {
      enabled: formState.enabled,
      api_base_url: formState.api_base_url,
      api_key: formState.api_key,
      origin: formState.origin,
      default_carriers: carriers,
      default_service_levels: serviceLevels,
      cache_ttl_seconds: formState.cache_ttl_seconds,
      carrier_code_mapping: Object.fromEntries(mappingEntries),
    };

    try {
      await saveConfig(payload);
      setSaveMessage({ type: "positive", text: "Configuration saved." });
    } catch (e) {
      setSaveMessage({
        type: "negative",
        text: `Save failed: ${e.message}`,
      });
    }
  }, [formState, saveConfig]);

  if (isLoading || !formState) {
    return (
      <Flex alignItems="center" height="50vh" justifyContent="center">
        <ProgressCircle
          aria-label="Loading configuration…"
          isIndeterminate
          size="L"
        />
      </Flex>
    );
  }

  if (error) {
    return (
      <View padding="size-300">
        <Well>
          <Text>Error loading configuration: {error}</Text>
        </Well>
      </View>
    );
  }

  return (
    <View padding="size-300">
      <Heading level={2}>Delivery Estimates Configuration</Heading>
      <Text>
        Configure the external delivery date estimation API and caching
        settings. Changes take effect immediately without redeployment.
      </Text>

      <Form marginTop="size-300" maxWidth="size-6000">
        <Heading level={3}>General</Heading>
        <Switch
          isSelected={formState.enabled}
          onChange={(val) => updateField("enabled", val)}>
          Enable delivery estimates
        </Switch>

        <Heading level={3} marginTop="size-200">
          API Connection
        </Heading>
        <TextField
          description="e.g. https://api.example.com/v1"
          label="API Base URL"
          onChange={(val) => updateField("api_base_url", val)}
          value={formState.api_base_url}
          width="100%"
        />
        <TextField
          description={
            formState.api_key_set
              ? "Key is set. Enter a new value to replace it."
              : "Enter your Bearer token API key."
          }
          label="API Key"
          onChange={(val) => updateField("api_key", val)}
          type="password"
          value={formState.api_key}
          width="100%"
        />

        <Heading level={3} marginTop="size-200">
          Warehouse / Origin Address
        </Heading>
        <TextField
          description="ISO 3166-1 alpha-2 (e.g. US, FR)"
          label="Country Code"
          onChange={(val) => updateOriginField("country_code", val)}
          value={formState.origin?.country_code ?? ""}
          width="size-1700"
        />
        <TextField
          label="Postal Code"
          onChange={(val) => updateOriginField("postal_code", val)}
          value={formState.origin?.postal_code ?? ""}
          width="size-1700"
        />
        <TextField
          label="City"
          onChange={(val) => updateOriginField("city", val)}
          value={formState.origin?.city ?? ""}
          width="size-3000"
        />

        <Heading level={3} marginTop="size-200">
          Carrier Settings
        </Heading>
        <TextField
          description="Comma-separated carrier codes (e.g. standard, express)"
          label="Default Carriers"
          onChange={(val) => updateField("default_carriers_text", val)}
          value={formState.default_carriers_text}
          width="100%"
        />
        <TextField
          description="Comma-separated service level codes (e.g. standard, express, priority)"
          label="Default Service Levels"
          onChange={(val) => updateField("default_service_levels_text", val)}
          value={formState.default_service_levels_text}
          width="100%"
        />
        <TextArea
          description="Maps Commerce carrier codes to API carrier codes. One per line: CommerceCode=ApiCode (e.g. DPS=standard)"
          height="size-1200"
          label="Carrier Code Mapping"
          onChange={(val) => updateField("carrier_code_mapping_text", val)}
          value={formState.carrier_code_mapping_text}
          width="100%"
        />

        <Heading level={3} marginTop="size-200">
          Cache
        </Heading>
        <NumberField
          description="How long to cache delivery estimates (0 to disable)"
          label="Cache TTL (seconds)"
          maxValue={86_400}
          minValue={0}
          onChange={(val) => updateField("cache_ttl_seconds", val)}
          value={formState.cache_ttl_seconds}
          width="size-1700"
        />

        <Flex alignItems="center" gap="size-200" marginTop="size-300">
          <Button
            isDisabled={isSaving}
            onPress={handleSave}
            variant="cta"
            width="size-2000">
            {isSaving ? "Saving…" : "Save Configuration"}
          </Button>
          {saveMessage && (
            <Text
              UNSAFE_style={{
                color:
                  saveMessage.type === "positive"
                    ? "var(--spectrum-global-color-green-600)"
                    : "var(--spectrum-global-color-red-600)",
              }}>
              {saveMessage.text}
            </Text>
          )}
        </Flex>
      </Form>
    </View>
  );
};
