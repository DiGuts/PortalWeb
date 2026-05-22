import { PublicClientApplication, AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';

const CLIENT_ID = '5332e88e-feec-4a16-88e1-e5d27f64d937';
const TENANT_ID = '907e5052-9888-4060-8c20-4ddba36732b3';
const SP_HOST   = 'tavil.sharepoint.com';
const SP_SITE   = '/teams/provespermisos';
const SCOPES    = ['Files.Read.All', 'Sites.Read.All'];

// MSAL requires crypto.subtle (only available in HTTPS / localhost).
// Guard creation so the app doesn't crash on plain HTTP.
const IS_SECURE = window.isSecureContext || window.location.hostname === 'localhost';

export const msalInstance: PublicClientApplication | null = IS_SECURE
  ? new PublicClientApplication({
      auth: {
        clientId:    CLIENT_ID,
        authority:   `https://login.microsoftonline.com/${TENANT_ID}`,
        redirectUri: window.location.hostname === 'localhost'
          ? 'http://localhost:3000/'
          : `${window.location.origin}/public_html/portal_web/`,
      },
      cache: { cacheLocation: 'localStorage' },
    })
  : null;

let _initialized = false;

export async function initGraph(): Promise<AccountInfo | null> {
  if (!msalInstance) return null;
  if (!_initialized) {
    await msalInstance.initialize();
    _initialized = true;
  }
  const result = await msalInstance.handleRedirectPromise();
  if (result?.account) return result.account;
  const accounts = msalInstance.getAllAccounts();
  return accounts[0] ?? null;
}

export function getGraphAccount(): AccountInfo | null {
  if (!_initialized || !msalInstance) return null;
  const accounts = msalInstance.getAllAccounts();
  return accounts[0] ?? null;
}

export async function graphLogin(): Promise<void> {
  if (!msalInstance) return;
  if (!_initialized) { await msalInstance.initialize(); _initialized = true; }
  await msalInstance.loginRedirect({ scopes: SCOPES });
}

export async function graphLogout(): Promise<void> {
  if (!msalInstance) return;
  const account = getGraphAccount();
  await msalInstance.logoutRedirect({ account: account ?? undefined });
}

async function getToken(): Promise<string> {
  if (!msalInstance) throw new Error('MSAL not available (HTTP context)');
  const account = getGraphAccount();
  if (!account) throw new Error('Not authenticated');
  try {
    const res = await msalInstance.acquireTokenSilent({ scopes: SCOPES, account });
    return res.accessToken;
  } catch (e) {
    if (e instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({ scopes: SCOPES, account });
    }
    throw e;
  }
}

async function graphGet(path: string): Promise<any> {
  const token = await getToken();
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`[${path}] Graph ${res.status}: ${await res.text()}`);
  return res.json();
}

let _driveId: string | null = null;

async function getDriveId(): Promise<string> {
  if (_driveId) return _driveId;
  const site   = await graphGet(`/sites/${SP_HOST}:${SP_SITE}`);
  const drives = await graphGet(`/sites/${site.id}/drives`);
  console.log('[Graph] drives available:', drives.value.map((d: any) => `"${d.name}" (${d.id})`));
  const drive  = drives.value.find((d: any) =>
    d.name === 'Documentos compartidos' || d.name === 'Documents' || d.name === 'Documentos'
  ) ?? drives.value[0];
  console.log('[Graph] using drive:', drive.name, drive.id);
  _driveId = drive.id;
  return _driveId!;
}

export interface SPFile {
  id:                    string;
  name:                  string;
  size:                  number;
  webUrl:                string;
  lastModifiedDateTime:  string;
  file?:  { mimeType?: string };
  folder?: { childCount: number };
}

export async function listGraphFolder(folderPath: string): Promise<SPFile[]> {
  const driveId     = await getDriveId();
  const encodedPath = folderPath.split('/').map(encodeURIComponent).join('/');
  console.log('[Graph] listing folder path:', folderPath, '→ encoded:', encodedPath);
  const data        = await graphGet(
    `/drives/${driveId}/root:/${encodedPath}:/children` +
    `?$select=id,name,size,webUrl,lastModifiedDateTime,file,folder&$orderby=name&$top=200`
  );
  console.log('[Graph] folder items:', data.value?.length, data.value?.map((f: any) => f.name));
  return data.value as SPFile[];
}
