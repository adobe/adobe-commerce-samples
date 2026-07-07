import {
  parseMassActionRequest,
  okMassActionResponse,
  massActionErrorResponse,
} from "@adobe/aio-commerce-sdk/admin-ui/mass-actions";
import { CommerceSdkValidationError } from "@adobe/aio-commerce-sdk/core/error";

export async function main(params) {
  try {
    const { gridType, selectedIds } = parseMassActionRequest(params);

    // No additional business logic required for this sample action.
    return okMassActionResponse();
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      return massActionErrorResponse(400, error.display(false));
    }

    return massActionErrorResponse(500, error.message);
  }
}
