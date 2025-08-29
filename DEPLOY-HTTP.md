# Deploy HTTP MCP Server to Render.com

## ✅ **Converted Successfully!**

Your MCP server is now converted to **Streamable HTTP transport** and ready for deployment to Render.com.

## **Quick Deploy Steps**

### 1. Push to GitHub
```bash
git add .
git commit -m "Add HTTP MCP server with Streamable HTTP transport"
git push origin http-conversion
```

### 2. Deploy to Render.com

1. **Go to [render.com](https://render.com)** and sign in
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**: `gdrive-mcp`
4. **Select branch**: `http-conversion`
5. **Configure deployment:**
   - **Name**: `gdrive-mcp-http`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node start-render-http.js`
   - **Instance Type**: Free tier

### 3. Environment Variables

**Add these manually in Render dashboard:**
- `CLIENT_ID` = `[YOUR_CLIENT_ID_FROM_GCP_OAUTH_KEYS]`
- `CLIENT_SECRET` = `[YOUR_CLIENT_SECRET_FROM_GCP_OAUTH_KEYS]`
- `GOOGLE_ACCESS_TOKEN` = `[YOUR_ACCESS_TOKEN_FROM_CREDENTIALS]`
- `GOOGLE_REFRESH_TOKEN` = `[YOUR_REFRESH_TOKEN_FROM_CREDENTIALS]`

To find these values:
- Find `CLIENT_ID` and `CLIENT_SECRET` in your `gcp-oauth.keys.json` file
- Find `GOOGLE_ACCESS_TOKEN` and `GOOGLE_REFRESH_TOKEN` in your `.gdrive-server-credentials.json` file

## **Make.com Configuration**

Once deployed, you'll get a URL like: `https://gdrive-mcp-http.onrender.com`

### **In Make.com MCP Client:**
1. **Connection name**: `Google Drive MCP`
2. **MCP Server URL**: `https://gdrive-mcp-http.onrender.com/mcp`
3. **Access token**: Leave empty (no auth needed for tools)

## **Available Tools**

Your Make.com AI agents will have access to:
- ✅ `gdrive_search` - Search Google Drive files
- ✅ `gdrive_read_file` - Read file contents  
- ✅ `gsheets_read` - Read Google Sheets data
- ✅ `gsheets_update_cell` - Update spreadsheet cells

## **Test Endpoints**

- **Health**: `GET https://your-app.onrender.com/health`
- **Documentation**: `GET https://your-app.onrender.com/`
- **MCP Endpoint**: `POST https://your-app.onrender.com/mcp`

## **What's Different**

- ✅ **HTTP Transport**: Uses Streamable HTTP instead of stdio
- ✅ **Make.com Compatible**: Can be accessed via URL  
- ✅ **Cloud Ready**: Deploys to Render.com
- ✅ **Same Tools**: All 4 Google Drive/Sheets tools available

Ready to deploy! 🚀