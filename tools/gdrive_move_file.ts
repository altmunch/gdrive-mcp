import { google } from "googleapis";
import { GDriveMoveFileInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdrive_move_file",
  description: "Move a file or folder to different parent folders in Google Drive",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "ID of the file or folder to move",
      },
      newParents: {
        type: "array",
        items: { type: "string" },
        description: "Array of new parent folder IDs",
      },
      oldParents: {
        type: "array", 
        items: { type: "string" },
        description: "Array of old parent folder IDs to remove from (optional, will be auto-detected if not provided)",
        optional: true,
      },
    },
    required: ["fileId", "newParents"],
  },
} as const;

export async function moveFile(
  args: GDriveMoveFileInput,
): Promise<InternalToolResponse> {
  try {
    const drive = google.drive("v3");

    // First get file info and current parents
    const fileInfo = await drive.files.get({
      fileId: args.fileId,
      fields: "id, name, mimeType, parents",
    });

    const currentParents = fileInfo.data.parents || [];
    const oldParents = args.oldParents || currentParents;

    // Update the file with new parents, removing old ones
    const res = await drive.files.update({
      fileId: args.fileId,
      addParents: args.newParents.join(','),
      removeParents: oldParents.join(','),
      fields: "id, name, mimeType, parents",
    });

    const updatedFile = res.data;
    
    return {
      content: [
        {
          type: "text",
          text: `File moved successfully:
- ID: ${updatedFile.id}
- Name: ${updatedFile.name}
- Type: ${updatedFile.mimeType}
- Old Parents: ${oldParents.join(', ') || 'None'}
- New Parents: ${updatedFile.parents?.join(', ') || 'Root'}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error moving file: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}