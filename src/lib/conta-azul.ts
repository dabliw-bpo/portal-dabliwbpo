import { prisma } from "@/lib/prisma";

const AUTH_BASE = "https://auth.contaazul.com";
const SCOPE = "openid profile aws.cognito.signin.user.admin";
const EXPIRY_BUFFER_MS = 60_000;

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

function getClientId(): string {
  const value = process.env.CONTA_AZUL_CLIENT_ID;
  if (!value) throw new Error("CONTA_AZUL_CLIENT_ID não configurado.");
  return value;
}

function getClientSecret(): string {
  const value = process.env.CONTA_AZUL_CLIENT_SECRET;
  if (!value) throw new Error("CONTA_AZUL_CLIENT_SECRET não configurado.");
  return value;
}

function getRedirectUri(): string {
  const value = process.env.CONTA_AZUL_REDIRECT_URI;
  if (!value) throw new Error("CONTA_AZUL_REDIRECT_URI não configurado.");
  return value;
}

function basicAuthHeader(): string {
  return `Basic ${Buffer.from(`${getClientId()}:${getClientSecret()}`).toString("base64")}`;
}

export function buildAuthorizationUrl(state: string): string {
  const url = new URL("/login", AUTH_BASE);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", getClientId());
  url.searchParams.set("redirect_uri", getRedirectUri());
  url.searchParams.set("state", state);
  url.searchParams.set("scope", SCOPE);
  return url.toString();
}

async function requestToken(body: Record<string, string>): Promise<TokenResponse> {
  const response = await fetch(`${AUTH_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });

  if (!response.ok) {
    throw new Error(`Falha na autenticação com o Conta Azul (status ${response.status}).`);
  }

  return response.json() as Promise<TokenResponse>;
}

export async function connectCompany(companyId: string, code: string): Promise<void> {
  const tokens = await requestToken({
    code,
    grant_type: "authorization_code",
    redirect_uri: getRedirectUri(),
  });

  await prisma.contaAzulIntegration.upsert({
    where: { companyId },
    create: {
      companyId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });
}

export async function disconnectCompany(companyId: string): Promise<void> {
  await prisma.contaAzulIntegration.deleteMany({ where: { companyId } });
}

/**
 * Returns a valid access_token for the company, transparently refreshing
 * it (and persisting the rotated refresh_token) when it's near expiry.
 */
export async function getValidAccessToken(companyId: string): Promise<string> {
  const integration = await prisma.contaAzulIntegration.findUnique({ where: { companyId } });
  if (!integration) {
    throw new Error("Empresa não conectada ao Conta Azul.");
  }

  if (integration.expiresAt.getTime() - EXPIRY_BUFFER_MS > Date.now()) {
    return integration.accessToken;
  }

  const tokens = await requestToken({
    refresh_token: integration.refreshToken,
    grant_type: "refresh_token",
  });

  await prisma.contaAzulIntegration.update({
    where: { companyId },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });

  return tokens.access_token;
}
