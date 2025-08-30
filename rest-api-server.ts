#!/usr/bin/env node

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { google } from "googleapis";
import { getValidCredentials, setupTokenRefresh, loadCredentialsQuietly } from "./auth.js";
import { tools } from "./tools/index.js";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure we have valid credentials before making API calls
async function ensureAuth() {
  const auth = await getValidCredentials();
  google.options({ auth });
  return auth;
}

async function ensureAuthQuietly() {
  const auth = await loadCredentialsQuietly();
  if (auth) {
    google.options({ auth });
  }
  return auth;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Google Drive REST API server is running' });
});

// API documentation endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Google Drive REST API Server',
    version: '0.1.0',
    description: 'REST API endpoints for Google Drive and Sheets operations',
    endpoints: {
      'POST /api/gdrive/search': {
        description: 'Search Google Drive files',
        body: {
          query: 'string - Search query (required)',
          maxResults: 'number - Max results to return (optional, default: 10)'
        },
        example: {
          query: 'type:document modified > 2024-01-01',
          maxResults: 5
        }
      },
      'POST /api/gdrive/read': {
        description: 'Read Google Drive file contents',
        body: {
          fileId: 'string - Google Drive file ID (required)'
        },
        example: {
          fileId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
        }
      },
      'POST /api/gsheets/read': {
        description: 'Read Google Sheets data',
        body: {
          spreadsheetId: 'string - Google Sheets ID (required)',
          range: 'string - Sheet range (required)',
          valueRenderOption: 'string - Value render option (optional)'
        },
        example: {
          spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
          range: 'Sheet1!A1:C10'
        }
      },
      'POST /api/gsheets/update': {
        description: 'Update Google Sheets cell',
        body: {
          spreadsheetId: 'string - Google Sheets ID (required)',
          range: 'string - Cell range (required)',
          values: 'array - 2D array of values (required)',
          valueInputOption: 'string - Value input option (optional)'
        },
        example: {
          spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
          range: 'Sheet1!A1',
          values: [['Hello World']]
        }
      },
      'GET /health': 'Health check',
      'GET /': 'This documentation'
    }
  });
});

// Google Drive Search endpoint
app.post('/api/gdrive/search', async (req, res) => {
  try {
    await ensureAuth();
    
    const { query, maxResults } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Missing required parameter: query'
      });
    }

    // Find the search tool (first tool in the array)
    const searchTool = tools[0];
    const result = await searchTool.handler({ 
      query, 
      pageSize: maxResults || 10 
    });

    res.json({
      success: true,
      data: result.content[0].text
    });

  } catch (error: any) {
    console.error('Google Drive search error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
});

// Google Drive Read File endpoint
app.post('/api/gdrive/read', async (req, res) => {
  try {
    await ensureAuth();
    
    const { fileId } = req.body;
    
    if (!fileId) {
      return res.status(400).json({
        error: 'Missing required parameter: fileId'
      });
    }

    // Find the read file tool (second tool in the array)
    const readFileTool = tools[1];
    const result = await readFileTool.handler({ fileId });

    res.json({
      success: true,
      data: result.content[0].text
    });

  } catch (error: any) {
    console.error('Google Drive read file error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
});

// Google Sheets Read endpoint
app.post('/api/gsheets/read', async (req, res) => {
  try {
    await ensureAuth();
    
    const { spreadsheetId, range, valueRenderOption } = req.body;
    
    if (!spreadsheetId || !range) {
      return res.status(400).json({
        error: 'Missing required parameters: spreadsheetId and range'
      });
    }

    // Find the sheets read tool (fourth tool in the array)
    const sheetsReadTool = tools[3];
    const result = await sheetsReadTool.handler({ 
      spreadsheetId, 
      ranges: range ? [range] : undefined
    });

    res.json({
      success: true,
      data: result.content[0].text
    });

  } catch (error: any) {
    console.error('Google Sheets read error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
});

// Google Sheets Update endpoint
app.post('/api/gsheets/update', async (req, res) => {
  try {
    await ensureAuth();
    
    const { spreadsheetId, range, values, valueInputOption } = req.body;
    
    if (!spreadsheetId || !range || !values) {
      return res.status(400).json({
        error: 'Missing required parameters: spreadsheetId, range, and values'
      });
    }

    // Find the sheets update tool (third tool in the array)
    const sheetsUpdateTool = tools[2];
    // The update tool expects fileId, range, and value (single string)
    const value = Array.isArray(values) && Array.isArray(values[0]) ? values[0][0] : values;
    const result = await sheetsUpdateTool.handler({ 
      fileId: spreadsheetId, 
      range, 
      value: String(value)
    });

    res.json({
      success: true,
      data: result.content[0].text
    });

  } catch (error: any) {
    console.error('Google Sheets update error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
});

async function startServer() {
  try {
    console.log('🚀 Starting Google Drive REST API server...');
    
    // Initialize authentication
    await ensureAuth();
    console.log('✓ Authentication initialized');

    // Set up periodic token refresh
    setupTokenRefresh();
    console.log('✓ Token refresh scheduled');

    app.listen(port, () => {
      console.log(`✓ REST API server running on port ${port}`);
      console.log(`  Health: http://localhost:${port}/health`);
      console.log(`  Docs: http://localhost:${port}/`);
      console.log(`  Google Drive Search: POST http://localhost:${port}/api/gdrive/search`);
      console.log(`  Google Drive Read: POST http://localhost:${port}/api/gdrive/read`);
      console.log(`  Google Sheets Read: POST http://localhost:${port}/api/gsheets/read`);
      console.log(`  Google Sheets Update: POST http://localhost:${port}/api/gsheets/update`);
    });
  } catch (error) {
    console.error('Error starting REST API server:', error);
    process.exit(1);
  }
}

// Start server immediately
startServer().catch(console.error);