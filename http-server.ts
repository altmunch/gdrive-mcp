#!/usr/bin/env node

import 'dotenv/config';
import express from 'express';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { 
  CallToolRequestSchema, 
  ListResourcesRequestSchema, 
  ListToolsRequestSchema, 
  ReadResourceRequestSchema 
} from "@modelcontextprotocol/sdk/types.js";
import { google } from "googleapis";
import { getValidCredentials, setupTokenRefresh, loadCredentialsQuietly } from "./auth.js";
import { tools } from "./tools/index.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

const drive = google.drive("v3");

const server = new Server({
  name: "example-servers/gdrive",
  version: "0.1.0",
}, {
  capabilities: {
    resources: {
      schemes: ["gdrive"], // Declare that we handle gdrive:/// URIs
      listable: true, // Support listing available resources
      readable: true, // Support reading resource contents
    },
    tools: {},
  },
});

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

server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
  await ensureAuthQuietly();
  const pageSize = 10;
  const params: any = {
    pageSize,
    fields: "nextPageToken, files(id, name, mimeType)",
  };

  if (request.params?.cursor) {
    params.pageToken = request.params.cursor;
  }

  const res = await drive.files.list(params);
  const files = res.data.files;

  return {
    resources: files!.map((file: any) => ({
      uri: `gdrive:///${file.id}`,
      mimeType: file.mimeType,
      name: file.name,
    })),
    nextCursor: res.data.nextPageToken,
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  await ensureAuthQuietly();
  const fileId = request.params.uri.replace("gdrive:///", "");
  const readFileTool = tools[1]; // gdrive_read_file is the second tool
  const result = await readFileTool.handler({ fileId });

  // Extract the file contents from the tool response
  const fileContents = result.content[0].text.split("\n\n")[1]; // Skip the "Contents of file:" prefix

  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: "text/plain", // You might want to determine this dynamically
        text: fileContents,
      },
    ],
  };
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Helper function to convert internal tool response to SDK format
function convertToolResponse(response: any) {
  return {
    _meta: {},
    content: response.content,
    isError: response.isError,
  };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  await ensureAuth();
  const tool = tools.find((t: any) => t.name === request.params.name);
  if (!tool) {
    throw new Error("Tool not found");
  }

  const result = await tool.handler(request.params.arguments as any);
  return convertToolResponse(result);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MCP HTTP server is running' });
});

// Documentation endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Google Drive MCP Server',
    version: '0.1.0',
    transport: 'HTTP (Streamable HTTP)',
    endpoints: {
      mcp: '/mcp (POST) - MCP protocol endpoint',
      health: '/health (GET) - Health check',
      docs: '/ (GET) - This documentation'
    },
    tools: tools.map((tool: any) => ({ name: tool.name, description: tool.description }))
  });
});

// MCP endpoint for Streamable HTTP transport
app.all('/mcp', async (req, res) => {
  try {
    // Handle both GET and POST for MCP protocol
    let method = '';
    let params: any = {};
    let id = null;

    if (req.method === 'GET') {
      // Handle initialization request
      method = 'initialize';
      params = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'make-mcp-client',
          version: '1.0.0'
        }
      };
      id = 1;
    } else if (req.method === 'POST') {
      // Handle JSON-RPC request
      const { method: reqMethod, params: reqParams, id: reqId } = req.body;
      method = reqMethod;
      params = reqParams || {};
      id = reqId;
    }

    let result;

    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            resources: {
              schemes: ["gdrive"],
              listable: true,
              readable: true,
            },
            tools: {},
          },
          serverInfo: {
            name: 'example-servers/gdrive',
            version: '0.1.0'
          }
        };
        break;

      case 'tools/list':
        result = {
          tools: tools.map((tool: any) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          })),
        };
        break;

      case 'tools/call':
        await ensureAuth();
        const tool = tools.find((t: any) => t.name === params.name);
        if (!tool) {
          throw new Error(`Tool not found: ${params.name}`);
        }
        const toolResult = await tool.handler(params.arguments as any);
        result = {
          content: toolResult.content,
          isError: toolResult.isError || false,
        };
        break;

      case 'resources/list':
        await ensureAuthQuietly();
        const pageSize = 10;
        const listParams: any = {
          pageSize,
          fields: "nextPageToken, files(id, name, mimeType)",
        };

        if (params.cursor) {
          listParams.pageToken = params.cursor;
        }

        const res = await drive.files.list(listParams);
        const files = res.data.files;

        result = {
          resources: files!.map((file: any) => ({
            uri: `gdrive:///${file.id}`,
            mimeType: file.mimeType,
            name: file.name,
          })),
          nextCursor: res.data.nextPageToken,
        };
        break;

      case 'resources/read':
        await ensureAuthQuietly();
        const fileId = params.uri?.replace("gdrive:///", "");
        const readFileTool = tools[1]; // gdrive_read_file is the second tool
        const readResult = await readFileTool.handler({ fileId });

        // Extract the file contents from the tool response
        const fileContents = readResult.content[0].text.split("\n\n")[1]; // Skip the "Contents of file:" prefix

        result = {
          contents: [
            {
              uri: params.uri || "",
              mimeType: "text/plain", // You might want to determine this dynamically
              text: fileContents,
            },
          ],
        };
        break;

      default:
        throw new Error(`Unknown method: ${method}`);
    }

    // Send JSON-RPC response
    res.json({
      jsonrpc: '2.0',
      id,
      result
    });

  } catch (error: any) {
    console.error('MCP endpoint error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: error?.message || 'Internal error'
      }
    });
  }
});

async function startServer() {
  try {
    console.log('🚀 Starting HTTP MCP server...');
    
    // Initialize authentication
    await ensureAuth();
    console.log('✓ Authentication initialized');

    // Set up periodic token refresh
    setupTokenRefresh();
    console.log('✓ Token refresh scheduled');

    app.listen(port, () => {
      console.log(`✓ HTTP MCP server running on port ${port}`);
      console.log(`  Health: http://localhost:${port}/health`);
      console.log(`  Docs: http://localhost:${port}/`);
      console.log(`  MCP: http://localhost:${port}/mcp`);
    });
  } catch (error) {
    console.error('Error starting HTTP server:', error);
    process.exit(1);
  }
}

// Start server immediately
startServer().catch(console.error);