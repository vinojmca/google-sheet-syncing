import { SignJWT, importPKCS8 } from 'jose';
import { DateTime } from 'luxon';

interface AccessTokenParams {
  GOOGLE_PRIVATE_KEY: string;
  GOOGLE_CLIENT_EMAIL: string;
  GOOGLE_TOKEN_URI: string;
}

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export async function fetchAccessToken({ GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL, GOOGLE_TOKEN_URI }: AccessTokenParams): Promise<string> {
  try {
    const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
    const now = DateTime.now().toSeconds();
    const privateKey = GOOGLE_PRIVATE_KEY;

    const payload = {
      iss: GOOGLE_CLIENT_EMAIL,
      sub: GOOGLE_CLIENT_EMAIL,
      scope: SCOPES.join(' '),
      aud: GOOGLE_TOKEN_URI,
      exp: now + 3600, // 1 hour
      iat: now,
    };
    const jwk = await importPKCS8(privateKey, 'RS256');

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .setAudience(GOOGLE_TOKEN_URI)
      .sign(jwk);
    const response = await fetch(GOOGLE_TOKEN_URI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error fetching access token: ${response.statusText}`);
    }

    const data: AccessTokenResponse = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error fetching access token:', error);
    throw new Error('Error fetching access token');
  }
}
