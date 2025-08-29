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
  res.json({ status: 'ok', message: 'Comprehensive Google Workspace REST API server is running' });
});

// API documentation endpoint
app.get('/', (req, res) => {
  const toolsByCategory = {
    'Google Drive': tools.filter(t => t.name.startsWith('gdrive_')),
    'Google Sheets': tools.filter(t => t.name.startsWith('gsheets_')),
    'Google Docs': tools.filter(t => t.name.startsWith('gdocs_'))
  };

  const endpoints: any = {};
  
  Object.entries(toolsByCategory).forEach(([category, categoryTools]) => {
    endpoints[category] = {};
    categoryTools.forEach((tool: any) => {
      const endpoint = `/api/${tool.name.replace(/_/g, '/')}`;
      endpoints[category][endpoint] = {
        method: 'POST',
        description: tool.description,
        body: tool.inputSchema.properties
      };
    });
  });

  res.json({
    name: 'Comprehensive Google Workspace REST API Server',
    version: '1.0.0',
    description: 'Complete suite of REST API endpoints for Google Drive, Sheets, and Docs operations',
    totalTools: tools.length,
    endpoints,
    usage: {
      authentication: 'OAuth 2.0 handled server-side',
      contentType: 'application/json',
      method: 'POST for all tool endpoints',
      healthCheck: 'GET /health',
      documentation: 'GET /'
    }
  });
});

// Generic tool execution endpoint
async function executeTool(toolName: string, args: any, res: express.Response) {
  try {
    await ensureAuth();
    
    const tool = tools.find((t: any) => t.name === toolName);
    if (!tool) {
      return res.status(404).json({
        success: false,
        error: `Tool not found: ${toolName}`,
        availableTools: tools.map((t: any) => t.name)
      });
    }

    const result = await tool.handler(args);

    res.json({
      success: !result.isError,
      tool: toolName,
      data: result.content[0].text,
      isError: result.isError
    });

  } catch (error: any) {
    console.error(`${toolName} error:`, error);
    res.status(500).json({
      success: false,
      tool: toolName,
      error: error?.message || 'Internal server error'
    });
  }
}

// === GOOGLE DRIVE ENDPOINTS ===

// Search Google Drive
app.post('/api/gdrive/search', async (req, res) => {
  await executeTool('gdrive_search', req.body, res);
});

// Read Google Drive file
app.post('/api/gdrive/read', async (req, res) => {
  await executeTool('gdrive_read_file', { fileId: req.body.fileId }, res);
});

// Create Google Drive file
app.post('/api/gdrive/create/file', async (req, res) => {
  await executeTool('gdrive_create_file', req.body, res);
});

// Create Google Drive folder
app.post('/api/gdrive/create/folder', async (req, res) => {
  await executeTool('gdrive_create_folder', req.body, res);
});

// Delete Google Drive file
app.post('/api/gdrive/delete', async (req, res) => {
  await executeTool('gdrive_delete_file', { fileId: req.body.fileId }, res);
});

// Move Google Drive file
app.post('/api/gdrive/move', async (req, res) => {
  await executeTool('gdrive_move_file', req.body, res);
});

// Copy Google Drive file
app.post('/api/gdrive/copy', async (req, res) => {
  await executeTool('gdrive_copy_file', req.body, res);
});

// List Google Drive file permissions
app.post('/api/gdrive/permissions', async (req, res) => {
  await executeTool('gdrive_list_permissions', { fileId: req.body.fileId }, res);
});

// Share Google Drive file
app.post('/api/gdrive/share', async (req, res) => {
  await executeTool('gdrive_share_file', req.body, res);
});

// === GOOGLE SHEETS ENDPOINTS ===

// Read Google Sheets
app.post('/api/gsheets/read', async (req, res) => {
  await executeTool('gsheets_read', req.body, res);
});

// Update Google Sheets cell
app.post('/api/gsheets/update/cell', async (req, res) => {
  await executeTool('gsheets_update_cell', req.body, res);
});

// Update Google Sheets range
app.post('/api/gsheets/update/range', async (req, res) => {
  await executeTool('gsheets_update_range', req.body, res);
});

// Create Google Spreadsheet
app.post('/api/gsheets/create', async (req, res) => {
  await executeTool('gsheets_create_sheet', req.body, res);
});

// Add worksheet to spreadsheet
app.post('/api/gsheets/add/worksheet', async (req, res) => {
  await executeTool('gsheets_add_worksheet', req.body, res);
});

// Format Google Sheets cells
app.post('/api/gsheets/format', async (req, res) => {
  await executeTool('gsheets_format_cells', req.body, res);
});

// === GOOGLE DOCS ENDPOINTS ===

// Read Google Document
app.post('/api/gdocs/read', async (req, res) => {
  await executeTool('gdocs_read', { documentId: req.body.documentId }, res);
});

// Create Google Document
app.post('/api/gdocs/create', async (req, res) => {
  await executeTool('gdocs_create', req.body, res);
});

// Insert text in Google Document
app.post('/api/gdocs/insert/text', async (req, res) => {
  await executeTool('gdocs_insert_text', req.body, res);
});

// Replace text in Google Document
app.post('/api/gdocs/replace/text', async (req, res) => {
  await executeTool('gdocs_replace_text', req.body, res);
});

// Generic tool endpoint (for any tool by name)
app.post('/api/tool/:toolName', async (req, res) => {
  await executeTool(req.params.toolName, req.body, res);
});

async function startServer() {
  try {
    console.log('🚀 Starting Comprehensive Google Workspace REST API server...');
    
    // Initialize authentication
    await ensureAuth();
    console.log('✓ Authentication initialized');

    // Set up periodic token refresh
    setupTokenRefresh();
    console.log('✓ Token refresh scheduled');

    app.listen(port, () => {
      console.log(`✓ Comprehensive REST API server running on port ${port}`);
      console.log(`  Health: http://localhost:${port}/health`);
      console.log(`  Docs: http://localhost:${port}/`);
      console.log(`  Total Tools Available: ${tools.length}`);
      console.log('  📂 Google Drive Tools: 9');
      console.log('  📊 Google Sheets Tools: 6');
      console.log('  📝 Google Docs Tools: 4');
      console.log('');
      console.log('Sample endpoints:');
      console.log('  POST /api/gdrive/search - Search Google Drive');
      console.log('  POST /api/gsheets/read - Read Google Sheets');
      console.log('  POST /api/gdocs/read - Read Google Docs');
      console.log('  POST /api/tool/[toolName] - Execute any tool by name');
    });
  } catch (error) {
    console.error('Error starting Comprehensive REST API server:', error);
    process.exit(1);
  }
}

// Start server immediately
startServer().catch(console.error);