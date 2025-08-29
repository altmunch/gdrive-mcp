#!/usr/bin/env node
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import { getValidCredentials, loadCredentialsQuietly, setupTokenRefresh } from './auth.js';
import { tools } from './tools/index.js';

const app = express();
const PORT = process.env.PORT || 8080;

// API Key Authentication Middleware
const API_KEY = process.env.API_KEY;

function requireApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Skip API key check for health and makecom-test endpoints
  if (req.path === '/health' || req.path === '/makecom-test') {
    return next();
  }
  
  // Check both X-API-Key header and Authorization Bearer token for Make.com compatibility
  const apiKey = req.headers['x-api-key'] as string;
  const authHeader = req.headers['authorization'] as string;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : null;
  
  if (!API_KEY) {
    console.warn('Warning: No API_KEY environment variable set. API is open to all requests.');
    return next();
  }
  
  // Accept API key from either X-API-Key header or Bearer token
  const providedKey = apiKey || bearerToken;
  
  if (!providedKey || providedKey !== API_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Valid API key required. Include X-API-Key header or Authorization Bearer token.' 
    });
  }
  
  next();
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(requireApiKey);

// Initialize Google auth
let authInitialized = false;

async function ensureAuth() {
  if (!authInitialized) {
    const auth = await getValidCredentials();
    if (auth) {
      google.options({ auth });
      authInitialized = true;
      // Setup automatic token refresh
      setupTokenRefresh();
      console.log('Authentication initialized successfully');
    } else {
      throw new Error('Failed to initialize authentication');
    }
  }
}

// Health check endpoint - publicly accessible
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'gdrive-mcp-server',
    authenticated: authInitialized 
  });
});

// Make.com specific endpoint for testing connection
app.get('/makecom-test', async (req, res) => {
  try {
    await ensureAuth();
    res.json({
      status: 'success',
      service: 'gdrive-mcp-server',
      authenticated: authInitialized,
      message: 'Make.com connection successful',
      endpoints: {
        search: 'POST /search',
        read: 'POST /read', 
        sheets_read: 'POST /sheets/read',
        sheets_update: 'POST /sheets/update'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Authentication failed',
      error: (error as Error).message
    });
  }
});

// List available tools
app.get('/tools', async (req, res) => {
  try {
    const toolList = tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }));
    res.json({ tools: toolList });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Execute a tool
app.post('/tools/:toolName', async (req, res) => {
  try {
    await ensureAuth();
    
    const { toolName } = req.params;
    const args = req.body;
    
    // Find the tool
    const tool = tools.find(t => t.name === toolName);
    if (!tool) {
      return res.status(404).json({ error: `Tool '${toolName}' not found` });
    }
    
    // Execute the tool
    console.log(`Executing tool: ${toolName}`, args);
    const result = await tool.handler(args);
    
    // Format response
    if (result.isError) {
      return res.status(400).json({ 
        error: true, 
        message: result.content[0].text 
      });
    }
    
    res.json({ 
      success: true,
      result: result.content[0].text 
    });
    
  } catch (error) {
    console.error('Tool execution error:', error);
    res.status(500).json({ 
      error: true, 
      message: (error as Error).message 
    });
  }
});

// Search Google Drive endpoint (simplified for Make.com)
app.post('/search', async (req, res) => {
  try {
    await ensureAuth();
    
    const { query = '', pageSize = 10, pageToken } = req.body;
    
    const searchTool = tools.find(t => t.name === 'gdrive_search');
    if (!searchTool) {
      return res.status(404).json({ error: 'Search tool not found' });
    }
    const result = await searchTool.handler({ query, pageSize, pageToken } as any);
    
    res.json({ 
      success: true,
      result: result.content[0].text 
    });
    
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Read file endpoint
app.post('/read', async (req, res) => {
  try {
    await ensureAuth();
    
    const { fileId } = req.body;
    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required' });
    }
    
    const readTool = tools.find(t => t.name === 'gdrive_read_file');
    if (!readTool) {
      return res.status(404).json({ error: 'Read tool not found' });
    }
    const result = await readTool.handler({ fileId } as any);
    
    res.json({ 
      success: true,
      content: result.content[0].text 
    });
    
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Read Google Sheets endpoint
app.post('/sheets/read', async (req, res) => {
  try {
    await ensureAuth();
    
    const { spreadsheetId, ranges, sheetId } = req.body;
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'spreadsheetId is required' });
    }
    
    const sheetsTool = tools.find(t => t.name === 'gsheets_read');
    if (!sheetsTool) {
      return res.status(404).json({ error: 'Sheets read tool not found' });
    }
    const result = await sheetsTool.handler({ spreadsheetId, ranges, sheetId } as any);
    
    res.json({ 
      success: true,
      data: JSON.parse(result.content[0].text)
    });
    
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update Google Sheets cell endpoint
app.post('/sheets/update', async (req, res) => {
  try {
    await ensureAuth();
    
    const { fileId, range, value } = req.body;
    if (!fileId || !range || value === undefined) {
      return res.status(400).json({ 
        error: 'fileId, range, and value are required' 
      });
    }
    
    const updateTool = tools.find(t => t.name === 'gsheets_update_cell');
    if (!updateTool) {
      return res.status(404).json({ error: 'Sheets update tool not found' });
    }
    const result = await updateTool.handler({ fileId, range, value } as any);
    
    res.json({ 
      success: true,
      message: result.content[0].text 
    });
    
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// API documentation endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Google Drive MCP Server API',
    version: '1.0.0',
    authentication: {
      type: 'API Key',
      header: 'X-API-Key',
      note: 'Include your API key in the X-API-Key header for all requests (except /health)'
    },
    endpoints: {
      'GET /health': 'Health check (no API key required)',
      'GET /tools': 'List available tools (requires API key)',
      'POST /tools/:toolName': 'Execute a specific tool (requires API key)',
      'POST /search': 'Search Google Drive files (requires API key)',
      'POST /read': 'Read a file from Google Drive (requires API key)',
      'POST /sheets/read': 'Read data from Google Sheets (requires API key)',
      'POST /sheets/update': 'Update a cell in Google Sheets (requires API key)'
    },
    example: {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'your-api-key-here'
      },
      body: {
        query: 'spreadsheet',
        pageSize: 10
      }
    },
    documentation: 'https://github.com/altmunch/gdrive-mcp'
  });
});

// Start server
async function startServer() {
  try {
    // Try to initialize auth on startup
    console.log('Initializing authentication...');
    await ensureAuth().catch(err => {
      console.error('Warning: Could not initialize auth on startup:', err.message);
      console.log('Auth will be initialized on first request');
    });
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API docs: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();