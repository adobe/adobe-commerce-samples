import {
  Button,
  Content,
  Divider,
  Flex,
  Form,
  Heading,
  ProgressCircle,
  Text,
  TextField,
  View,
  Well,
} from "@adobe/react-spectrum";
import { attach } from "@adobe/uix-guest";
import { useEffect, useState } from "react";

// Helper: Extract IMS credentials from shared context
async function extractIMSCredentials(context) {
  const imsToken = context?.get
    ? await context.get("imsToken")
    : context?.imsToken;
  const imsOrgId = context?.get
    ? await context.get("imsOrgId")
    : context?.imsOrgId;
  return { imsToken, imsOrgId };
}

// Helper: Validate configuration form
function validateConfig(config) {
  if (!config.serviceUrl) {
    return "Service URL is required";
  }
  if (!config.apiKey) {
    return "API Key is required";
  }
  if (
    !(
      config.warehouse.name &&
      config.warehouse.street &&
      config.warehouse.city &&
      config.warehouse.state &&
      config.warehouse.postalCode &&
      config.warehouse.country
    )
  ) {
    return "All warehouse address fields (except phone) are required";
  }
  return null;
}

// Helper: Fetch configuration from backend
async function fetchConfig(token, imsOrg) {
  const configBackendUrl = `https://${window.location.hostname}/api/v1/web/CustomMenu/config`;

  const response = await fetch(configBackendUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-gw-ims-org-id": imsOrg,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to load configuration: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

// Helper: Save configuration to backend
async function saveConfig(config, token, imsOrg) {
  const configBackendUrl = `https://${window.location.hostname}/api/v1/web/CustomMenu/config`;

  const response = await fetch(configBackendUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-gw-ims-org-id": imsOrg,
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(errorData.error || "Failed to save configuration");
  }

  return response.json();
}

const ExternalShippingConfig = (_props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    serviceUrl: "",
    apiKey: "",
    apiKeyMasked: false,
    warehouse: {
      name: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
    },
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [auth, setAuth] = useState({ token: null, imsOrg: null });

  // biome-ignore lint/correctness/useExhaustiveDependencies: initialization only needs to run once on mount
  useEffect(() => {
    console.log("ExternalShippingConfig mounted");

    // Initialize UIX guest connection and get shared context
    const initAuth = async () => {
      try {
        const guestConnection = await attach({
          id: "external-shipping-config",
        });
        const context = guestConnection.sharedContext;

        const { imsToken, imsOrgId } = await extractIMSCredentials(context);

        if (!(imsToken && imsOrgId)) {
          throw new Error(
            "IMS token or org ID not available in shared context",
          );
        }

        setAuth({ token: imsToken, imsOrg: imsOrgId });
        await loadConfigWithAuth(imsToken, imsOrgId);
      } catch (err) {
        setError(
          `Authentication failed: ${err.message}. Please ensure you're accessing this page through Commerce Admin menu.`,
        );
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const loadConfigWithAuth = async (token, imsOrg) => {
    try {
      setLoading(true);
      setError(null);

      if (!(token && imsOrg)) {
        throw new Error(
          "Authentication not available. Please ensure you're accessing this page through Commerce Admin menu.",
        );
      }

      const data = await fetchConfig(token, imsOrg);

      if (data.config) {
        setConfig({
          serviceUrl: data.config.serviceUrl || "",
          apiKey: data.config.apiKey || "",
          apiKeyMasked: data.config.apiKeyMasked,
          warehouse: data.config.warehouse || {
            name: "",
            phone: "",
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "US",
          },
        });
      }
    } catch (_err) {
      setError("Failed to load configuration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => loadConfigWithAuth(auth.token, auth.imsOrg);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const validationError = validateConfig(config);
      if (validationError) {
        setError(validationError);
        setSaving(false);
        return;
      }

      if (!(auth.token && auth.imsOrg)) {
        throw new Error(
          "Authentication not available. Please ensure you're accessing this page through Commerce Admin menu.",
        );
      }

      await saveConfig(config, auth.token, auth.imsOrg);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Reload to get masked API key
      await loadConfig();
    } catch (err) {
      setError(
        err.message || "Failed to save configuration. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWarehouseChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      warehouse: {
        ...prev.warehouse,
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <Flex
        alignItems="center"
        direction="column"
        height="100vh"
        justifyContent="center">
        <ProgressCircle
          aria-label="Loading configuration"
          isIndeterminate
          size="L"
        />
      </Flex>
    );
  }

  return (
    <View padding="size-400">
      <Heading level={1}>External Shipping Service Configuration</Heading>
      <Text marginTop="size-100">
        Configure your external shipping rates API connection and warehouse
        address.
      </Text>

      <Divider marginBottom="size-200" marginTop="size-200" size="M" />

      <Form maxWidth="size-6000">
        {/* Service Connection Section */}
        <Heading level={2} marginTop="size-300">
          Service Connection
        </Heading>

        <TextField
          description="HTTPS endpoint of your external shipping rates service"
          isRequired
          label="Service URL"
          marginTop="size-150"
          onChange={(value) => handleFieldChange("serviceUrl", value)}
          placeholder="https://example.m.pipedream.net"
          value={config.serviceUrl}
          width="100%"
        />

        <TextField
          description="Authentication key for the external service (stored securely)"
          isRequired
          label="API Key"
          marginTop="size-150"
          onChange={(value) => {
            handleFieldChange("apiKey", value);
            handleFieldChange("apiKeyMasked", false);
          }}
          placeholder="Enter API key"
          type="password"
          value={config.apiKey}
          width="100%"
        />

        {config.apiKeyMasked && (
          <Well marginTop="size-100">
            <Text>
              <strong>Note:</strong> API key is masked for security. To update,
              enter a new key above.
            </Text>
          </Well>
        )}

        <Divider marginBottom="size-200" marginTop="size-300" size="S" />

        {/* Warehouse Address Section */}
        <Heading level={2} marginTop="size-300">
          Warehouse Address (Ship From)
        </Heading>
        <Text marginTop="size-50">
          This address is used as the origin when requesting shipping rates.
        </Text>

        <TextField
          isRequired
          label="Warehouse Name"
          marginTop="size-150"
          onChange={(value) => handleWarehouseChange("name", value)}
          placeholder="Main Warehouse"
          value={config.warehouse.name}
          width="100%"
        />

        <TextField
          label="Phone"
          marginTop="size-150"
          onChange={(value) => handleWarehouseChange("phone", value)}
          placeholder="+1-555-0123"
          value={config.warehouse.phone}
          width="100%"
        />

        <TextField
          isRequired
          label="Street Address"
          marginTop="size-150"
          onChange={(value) => handleWarehouseChange("street", value)}
          placeholder="123 Warehouse Rd"
          value={config.warehouse.street}
          width="100%"
        />

        <Flex direction="row" gap="size-200" marginTop="size-150">
          <TextField
            flex={1}
            isRequired
            label="City"
            onChange={(value) => handleWarehouseChange("city", value)}
            placeholder="Dallas"
            value={config.warehouse.city}
          />

          <TextField
            flex={1}
            isRequired
            label="State/Province"
            onChange={(value) => handleWarehouseChange("state", value)}
            placeholder="TX"
            value={config.warehouse.state}
          />
        </Flex>

        <Flex direction="row" gap="size-200" marginTop="size-150">
          <TextField
            flex={1}
            isRequired
            label="Postal Code"
            onChange={(value) => handleWarehouseChange("postalCode", value)}
            placeholder="75201"
            value={config.warehouse.postalCode}
          />

          <TextField
            description="ISO 2-letter code"
            flex={1}
            isRequired
            label="Country Code"
            onChange={(value) => handleWarehouseChange("country", value)}
            placeholder="US"
            value={config.warehouse.country}
          />
        </Flex>

        {/* Error/Success Messages */}
        {error && (
          <Well marginTop="size-300" role="alert">
            <Content>
              <Text>
                <strong>Error:</strong> {error}
              </Text>
            </Content>
          </Well>
        )}

        {success && (
          <Well marginTop="size-300" role="status">
            <Content>
              <Text>
                <strong>Success:</strong> Configuration saved successfully!
              </Text>
            </Content>
          </Well>
        )}

        {/* Actions */}
        <Flex direction="row" gap="size-200" marginTop="size-400">
          <Button isDisabled={saving} onPress={handleSave} variant="cta">
            {saving ? "Saving..." : "Save Configuration"}
          </Button>

          <Button
            isDisabled={saving || loading}
            onPress={loadConfig}
            variant="secondary">
            Cancel
          </Button>
        </Flex>
      </Form>
    </View>
  );
};

export default ExternalShippingConfig;
