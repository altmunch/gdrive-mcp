# Deploy REST API Server to Render.com

## ✅ **REST API Conversion Complete!**

Your Google Drive tools are now available as simple REST API endpoints that Make.com's HTTP module can call directly.

## **Quick Deploy Steps**

### 1. Deploy to Render.com

1. **Go to [render.com](https://render.com)** and sign in
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**: `gdrive-mcp`
4. **Select branch**: `http-conversion`
5. **Configure deployment:**
   - **Name**: `gdrive-rest-api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node start-render-rest.js`
   - **Instance Type**: Free tier

### 2. Environment Variables

**Add these manually in Render dashboard:**
- `CLIENT_ID` = `[YOUR_CLIENT_ID_FROM_GCP_OAUTH_KEYS]`
- `CLIENT_SECRET` = `[YOUR_CLIENT_SECRET_FROM_GCP_OAUTH_KEYS]`
- `GOOGLE_ACCESS_TOKEN` = `[YOUR_ACCESS_TOKEN_FROM_CREDENTIALS]`
- `GOOGLE_REFRESH_TOKEN` = `[YOUR_REFRESH_TOKEN_FROM_CREDENTIALS]`

## **Make.com HTTP Module Integration**

Once deployed, you'll get a URL like: `https://gdrive-rest-api.onrender.com`

### **Available API Endpoints:**

#### **1. Search Google Drive Files**
- **URL**: `POST https://gdrive-rest-api.onrender.com/api/gdrive/search`
- **Body**:
```json
{
  "query": "type:document modified > 2024-01-01",
  "maxResults": 10
}
```

#### **2. Read Google Drive File**
- **URL**: `POST https://gdrive-rest-api.onrender.com/api/gdrive/read`
- **Body**:
```json
{
  "fileId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
}
```

#### **3. Read Google Sheets Data**
- **URL**: `POST https://gdrive-rest-api.onrender.com/api/gsheets/read`
- **Body**:
```json
{
  "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "range": "Sheet1!A1:C10",
  "valueRenderOption": "FORMATTED_VALUE"
}
```

#### **4. Update Google Sheets Cell**
- **URL**: `POST https://gdrive-rest-api.onrender.com/api/gsheets/update`
- **Body**:
```json
{
  "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "range": "Sheet1!A1",
  "values": [["Hello World"]],
  "valueInputOption": "RAW"
}
```

## **Make.com HTTP Module Configuration**

For each endpoint in Make.com:

1. **Add HTTP Module** → **Make a Request**
2. **Method**: `POST`
3. **URL**: Use the endpoint URL above
4. **Headers**: 
   - `Content-Type`: `application/json`
5. **Body**: Use JSON examples above with your actual parameters

## **Test Endpoints**

- **Health**: `GET https://your-app.onrender.com/health`
- **Documentation**: `GET https://your-app.onrender.com/`

## **Advantages of REST API Approach**

- ✅ **Simple Integration**: Direct HTTP calls, no special MCP client needed
- ✅ **Make.com Native**: Works perfectly with Make.com's HTTP module
- ✅ **Flexible**: Each tool is a separate endpoint you can call independently
- ✅ **Standard**: Uses familiar REST API patterns
- ✅ **Same Functionality**: All 4 Google Drive/Sheets operations available

This approach is much simpler for Make.com integration than the full MCP protocol! 🚀