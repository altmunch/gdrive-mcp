import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

export const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
];

// Get credentials directory from environment variable or use default
// Fix: Hardcode correct path for Cloud Run container
const CREDS_DIR = "/app/credentials";



// Ensure the credentials directory exists
function ensureCredsDirectory() {
  try {
    fs.mkdirSync(CREDS_DIR, { recursive: true });
    console.error(`Ensured credentials directory exists at: ${CREDS_DIR}`);
  } catch (error) {
    console.error(
      `Failed to create credentials directory: ${CREDS_DIR}`,
      error,
    );
    throw error;
  }
}

const credentialsPath = path.join(CREDS_DIR, ".gdrive-server-credentials.json");

async function authenticateWithTimeout(
  keyfilePath: string,
  SCOPES: string[],
  timeoutMs = 60000,
): Promise<any | null> {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Authentication timed out")), timeoutMs),
  );

  const authPromise = authenticate({
    keyfilePath,
    scopes: SCOPES,
  });

  try {
    return await Promise.race([authPromise, timeoutPromise]);
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function authenticateAndSaveCredentials() {
  console.error("Launching auth flow…");
  console.error("Using credentials path:", credentialsPath);

  const keyfilePath = path.join(CREDS_DIR, "gcp-oauth.keys.json");
  console.error("Using keyfile path:", keyfilePath);

  const auth = await authenticateWithTimeout(keyfilePath, SCOPES);
  
  if (!auth) {
    console.error("Authentication failed or timed out");
    return null;
  }

  if (auth) {
    const newAuth = new google.auth.OAuth2();
    newAuth.setCredentials(auth.credentials);
  }

  try {
    const { credentials } = await auth.refreshAccessToken();
    console.error("Received new credentials with scopes:", credentials.scope);

    // Ensure directory exists before saving
    ensureCredsDirectory();

    fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    console.error(
      "Credentials saved successfully with refresh token to:",
      credentialsPath,
    );
    auth.setCredentials(credentials);
    return auth;
  } catch (error) {
    console.error("Error refreshing token during initial auth:", error);
    return auth;
  }
}

// Try to load credentials without prompting for auth
export async function loadCredentialsQuietly() {

  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
  );

  // Check for Google Cloud Secret Manager credentials
  if (process.env.GOOGLE_CREDENTIALS_JSON && !fs.existsSync(credentialsPath)) {
    try {
      console.error("Loading credentials from environment variable");
      const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
      fs.writeFileSync(credentialsPath, credentialsJson);
      console.error("Credentials loaded successfully");
    } catch (error) {
      console.error("Failed to load credentials from environment:", error);
    }
  }

  // Check for OAuth keys from environment and create the file if needed
  const keyfilePath = path.join(CREDS_DIR, "gcp-oauth.keys.json");
  if (process.env.OAUTH_KEYS_JSON && !fs.existsSync(keyfilePath)) {
    try {
      console.error("Loading OAuth keys from environment variable");
      const oauthKeysJson = process.env.OAUTH_KEYS_JSON;
      fs.writeFileSync(keyfilePath, oauthKeysJson);
      console.error("OAuth keys loaded successfully");
    } catch (error) {
      console.error("Failed to load OAuth keys from environment:", error);
    }
  }

  if (!fs.existsSync(credentialsPath)) {
    console.error("No credentials file found");
    return null;
  }

  try {
    const savedCreds = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
    console.error("Loaded existing credentials with scopes:", savedCreds.scope);
    
    // Check if this is a mock credential for testing
    if (savedCreds.access_token === "mock_access_token_for_testing") {
      console.error("WARNING: Using mock credentials for testing - API calls will fail");
      console.error("To use real authentication, delete .gdrive-server-credentials.json and restart");
    }
    
    oauth2Client.setCredentials(savedCreds);

    const expiryDate = new Date(savedCreds.expiry_date);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;
    const timeToExpiry = expiryDate.getTime() - now.getTime();

    console.error("Token expiry status:", {
      expiryDate: expiryDate.toISOString(),
      timeToExpiryMinutes: Math.floor(timeToExpiry / (60 * 1000)),
      hasRefreshToken: !!savedCreds.refresh_token,
    });

    if (timeToExpiry < fiveMinutes && savedCreds.refresh_token) {
      console.error("Attempting to refresh token using refresh_token");
      try {
        const response = await oauth2Client.refreshAccessToken();
        const newCreds = response.credentials;
        ensureCredsDirectory();
        fs.writeFileSync(credentialsPath, JSON.stringify(newCreds, null, 2));
        oauth2Client.setCredentials(newCreds);
        console.error("Token refreshed and saved successfully");
      } catch (error) {
        console.error("Failed to refresh token:", error);
        return null;
      }
    }

    return oauth2Client;
  } catch (error) {
    console.error("Error loading credentials:", error);
    return null;
  }
}

// Get valid credentials, prompting for auth if necessary
export async function getValidCredentials(forceAuth = false) {
  if (!forceAuth) {
    const quietAuth = await loadCredentialsQuietly();
    if (quietAuth) {
      return quietAuth;
    }
  }

  return await authenticateAndSaveCredentials();
}

// Background refresh that never prompts for auth
export function setupTokenRefresh() {
  console.error("Setting up automatic token refresh interval (45 minutes)");
  return setInterval(
    async () => {
      try {
        console.error("Running scheduled token refresh check");
        const auth = await loadCredentialsQuietly();
        if (auth) {
          google.options({ auth });
          console.error("Completed scheduled token refresh");
        } else {
          console.error("Skipping token refresh - no valid credentials");
        }
      } catch (error) {
        console.error("Error in automatic token refresh:", error);
      }
    },
    45 * 60 * 1000,
  );
}
