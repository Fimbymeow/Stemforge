import "server-only";

import { getAuthFeatureConfiguration } from "@/lib/auth/config";
import { resolveCurrentAuthenticatedOwner } from "@/lib/auth/current-owner.server";
import { authorizeInternalOperations, getInternalOperationsConfigurationStatus as configurationStatus } from "@/lib/beta-reports/internal-authorization";
import type { InternalOperationsAuthorization } from "@/lib/beta-reports/internal-authorization";
export type { InternalOperationsAuthorization } from "@/lib/beta-reports/internal-authorization";

export async function getInternalOperationsAuthorization(): Promise<InternalOperationsAuthorization> {
  return authorizeInternalOperations({
    environment: process.env,
    authConfiguration: getAuthFeatureConfiguration(),
    resolveOwner: resolveCurrentAuthenticatedOwner,
  });
}

export function getInternalOperationsConfigurationStatus() {
  return configurationStatus(process.env);
}
