#!/usr/bin/env node

// Railway.app startup script for Comprehensive REST API server
const fs = require('fs');
const path = require('path');

console.log('Setting up credentials for Railway.app Comprehensive REST API server...');

// Create credentials from environment variables
const credentialsData = {
  "access_token": process.env.GOOGLE_ACCESS_TOKEN || "mock_token",
  "scope": "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents",
  "token_type": "Bearer",
  "expiry_date": parseInt(process.env.GOOGLE_TOKEN_EXPIRY) || Date.now() + 3600000,
  "refresh_token": process.env.GOOGLE_REFRESH_TOKEN || "mock_refresh_token"
};

// Create OAuth keys data
const oauthKeysData = {
  "installed": {
    "client_id": process.env.CLIENT_ID,
    "project_id": "gen-lang-client-0615382574",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": process.env.CLIENT_SECRET,
    "redirect_uris": ["http://localhost"]
  }
};

// Railway.app uses /app as working directory
const credsDir = process.env.GDRIVE_CREDS_DIR || '/app';
fs.mkdirSync(credsDir, { recursive: true });

// Write credentials file
const credentialsPath = path.join(credsDir, '.gdrive-server-credentials.json');
fs.writeFileSync(credentialsPath, JSON.stringify(credentialsData, null, 2));
console.log('✓ Credentials file created at:', credentialsPath);

// Write OAuth keys file  
const oauthKeysPath = path.join(credsDir, 'gcp-oauth.keys.json');
fs.writeFileSync(oauthKeysPath, JSON.stringify(oauthKeysData, null, 2));
console.log('✓ OAuth keys file created at:', oauthKeysPath);

console.log('🚀 Starting Comprehensive REST API server...');

// Start the Comprehensive REST API server
require(path.join(__dirname, 'dist', 'comprehensive-rest-api-server.js'));