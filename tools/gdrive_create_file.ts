import { google } from "googleapis";
import { GDriveCreateFileInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdrive_create_file",
  description: "Create a new file in Google Drive",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the file to create",
      },
      mimeType: {
        type: "string", 
        description: "MIME type of the file (e.g., 'text/plain', 'application/vnd.google-apps.document', 'application/vnd.google-apps.spreadsheet')",
      },
      content: {
        type: "string",
        description: "Content of the file (optional for Google Docs/Sheets)",
        optional: true,
      },
      parents: {
        type: "array",
        items: { type: "string" },
        description: "Array of parent folder IDs (optional)",
        optional: true,
      },
    },
    required: ["name", "mimeType"],
  },
} as const;

export async function createFile(
  args: GDriveCreateFileInput,
): Promise<InternalToolResponse> {
  try {
    const drive = google.drive("v3");

    const fileMetadata: any = {
      name: args.name,
      mimeType: args.mimeType,
    };

    if (args.parents && args.parents.length > 0) {
      fileMetadata.parents = args.parents;
    }

    let res;

    if (args.content && !args.mimeType.includes('google-apps')) {
      // File with content (for plain text, etc.)
      res = await drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: args.mimeType,
          body: args.content,
        },
        fields: "id, name, mimeType, webViewLink, parents",
      });
    } else {
      // Google Apps file (Docs, Sheets, etc.) or empty file
      res = await drive.files.create({
        requestBody: fileMetadata,
        fields: "id, name, mimeType, webViewLink, parents",
      });
    }

    const file = res.data;
    
    return {
      content: [
        {
          type: "text",
          text: `File created successfully:
- ID: ${file.id}
- Name: ${file.name}
- Type: ${file.mimeType}
- Link: ${file.webViewLink}
- Parents: ${file.parents ? file.parents.join(', ') : 'None'}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error creating file: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}