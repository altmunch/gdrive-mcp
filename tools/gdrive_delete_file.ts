import { google } from "googleapis";
import { GDriveDeleteFileInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdrive_delete_file",
  description: "Delete a file or folder from Google Drive (moves to trash)",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "ID of the file or folder to delete",
      },
    },
    required: ["fileId"],
  },
} as const;

export async function deleteFile(
  args: GDriveDeleteFileInput,
): Promise<InternalToolResponse> {
  try {
    const drive = google.drive("v3");

    // First get file info for confirmation
    const fileInfo = await drive.files.get({
      fileId: args.fileId,
      fields: "id, name, mimeType",
    });

    // Delete the file (moves to trash)
    await drive.files.delete({
      fileId: args.fileId,
    });
    
    return {
      content: [
        {
          type: "text",
          text: `File deleted successfully:
- ID: ${fileInfo.data.id}
- Name: ${fileInfo.data.name}
- Type: ${fileInfo.data.mimeType}
- Status: Moved to trash`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error deleting file: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}