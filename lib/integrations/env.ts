export interface ProviderEnvStatus {
  isConfigured: boolean;
  status: 'CONFIGURATION_REQUIRED' | 'NOT_CONNECTED' | 'DEVELOPMENT_MODE';
}

export function getGoogleOAuthStatus(): ProviderEnvStatus {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const enableSimulator = process.env.ENABLE_INTEGRATION_SIMULATOR === 'true';

  if (clientId && clientSecret) {
    return { isConfigured: true, status: 'NOT_CONNECTED' };
  }

  if (enableSimulator) {
    return { isConfigured: false, status: 'DEVELOPMENT_MODE' };
  }

  return { isConfigured: false, status: 'CONFIGURATION_REQUIRED' };
}

export function getOutlookOAuthStatus(): ProviderEnvStatus {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const enableSimulator = process.env.ENABLE_INTEGRATION_SIMULATOR === 'true';

  if (clientId && clientSecret) {
    return { isConfigured: true, status: 'NOT_CONNECTED' };
  }

  if (enableSimulator) {
    return { isConfigured: false, status: 'DEVELOPMENT_MODE' };
  }

  return { isConfigured: false, status: 'CONFIGURATION_REQUIRED' };
}
