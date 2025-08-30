import { google } from "googleapis";
import { GDriveCopyFileInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdrive_copy_file",
  description: "Copy a file in Google Drive to the same or different location",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "ID of the file to copy",
      },
      name: {
        type: "string",
        description: "Name for the copied file (optional, defaults to 'Copy of [original name]')",
        optional: true,
      },
      parents: {
        type: "array",
        items: { type: "string" },
        description: "Array of parent folder IDs for the copy (optional, defaults to same location)",
        optional: true,
      },
    },
    required: ["fileId"],
  },
} as const;

export async function copyFile(
  args: GDriveCopyFileInput,
): Promise<InternalToolResponse> {
  try {
    const drive = google.drive("v3");

    // First get original file info
    const originalFile = await drive.files.get({
      fileId: args.fileId,
      fields: "id, name, mimeType, parents",
    });

    // Prepare copy metadata
    const copyMetadata: any = {
      name: args.name || `Copy of ${originalFile.data.name}`,
    };

    if (args.parents && args.parents.length > 0) {
      copyMetadata.parents = args.parents;
    }

    // Copy the file
    const res = await drive.files.copy({
      fileId: args.fileId,
      requestBody: copyMetadata,
      fields: "id, name, mimeType, webViewLink, parents",
    });

    const copiedFile = res.data;
    
    return {
      content: [
        {
          type: "text",
          text: `File copied successfully:
Original File:
- ID: ${originalFile.data.id}
- Name: ${originalFile.data.name}

Copied File:
- ID: ${copiedFile.id}
- Name: ${copiedFile.name}
- Type: ${copiedFile.mimeType}
- Link: ${copiedFile.webViewLink}
- Parents: ${copiedFile.parents?.join(', ') || 'Root'}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error copying file: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}