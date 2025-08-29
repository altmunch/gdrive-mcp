# Google Drive MCP Server

A Model Context Protocol server for Google Drive and Google Sheets integration.

## Features

- **gdrive_search** - Search for files in Google Drive
- **gdrive_read_file** - Read contents of files from Google Drive  
- **gsheets_read** - Read data from Google Sheets
- **gsheets_update_cell** - Update cells in Google Sheets

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the server:**
   ```bash
   npm run build
   ```

3. **Authentication:**
   - Place your `gcp-oauth.keys.json` in the project root
   - Run the server once to authenticate: `npm start`
   - Follow the OAuth flow to create `.gdrive-server-credentials.json`

## Usage

### Local MCP Server
```bash
npm start
```

### With Make.com
Add this as an MCP server in Make.com:
- **Server Path**: Path to your built `dist/index.js`
- **Args**: (none needed)

### With Claude Desktop
Add to your Claude Desktop config:
```json
{
  "mcpServers": {
    "gdrive": {
      "command": "node",
      "args": ["path/to/gdrive-mcp/dist/index.js"]
    }
  }
}
```

## Authentication Files

- `gcp-oauth.keys.json` - OAuth client credentials (from Google Cloud Console)
- `.gdrive-server-credentials.json` - Generated access/refresh tokens (auto-created)

Both files should be kept secure and not committed to version control.
