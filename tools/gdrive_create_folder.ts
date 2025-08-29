import { google } from "googleapis";
import { GDriveCreateFolderInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdrive_create_folder",
  description: "Create a new folder in Google Drive",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the folder to create",
      },
      parents: {
        type: "array",
        items: { type: "string" },
        description: "Array of parent folder IDs (optional, defaults to root)",
        optional: true,
      },
    },
    required: ["name"],
  },
} as const;

export async function createFolder(
  args: GDriveCreateFolderInput,
): Promise<InternalToolResponse> {
  try {
    const drive = google.drive("v3");

    const fileMetadata: any = {
      name: args.name,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (args.parents && args.parents.length > 0) {
      fileMetadata.parents = args.parents;
    }

    const res = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id, name, mimeType, webViewLink, parents",
    });

    const folder = res.data;
    
    return {
      content: [
        {
          type: "text",
          text: `Folder created successfully:
- ID: ${folder.id}
- Name: ${folder.name}
- Link: ${folder.webViewLink}
- Parents: ${folder.parents ? folder.parents.join(', ') : 'Root'}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error creating folder: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}