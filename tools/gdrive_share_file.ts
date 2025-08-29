import { google } from "googleapis";
import { GDriveShareFileInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdrive_share_file",
  description: "Share a file or folder in Google Drive with specific permissions",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "ID of the file or folder to share",
      },
      type: {
        type: "string",
        enum: ["user", "group", "domain", "anyone"],
        description: "Type of permission: user, group, domain, or anyone",
      },
      role: {
        type: "string", 
        enum: ["owner", "organizer", "fileOrganizer", "writer", "commenter", "reader"],
        description: "Role to assign: owner, organizer, fileOrganizer, writer, commenter, or reader",
      },
      emailAddress: {
        type: "string",
        description: "Email address for user or group permissions (required for user/group types)",
        optional: true,
      },
      domain: {
        type: "string",
        description: "Domain name for domain permissions (required for domain type)",
        optional: true,
      },
      sendNotificationEmail: {
        type: "boolean",
        description: "Whether to send notification email (default true)",
        optional: true,
      },
    },
    required: ["fileId", "type", "role"],
  },
} as const;

export async function shareFile(
  args: GDriveShareFileInput,
): Promise<InternalToolResponse> {
  try {
    const drive = google.drive("v3");

    // Validate required fields based on type
    if ((args.type === 'user' || args.type === 'group') && !args.emailAddress) {
      throw new Error(`emailAddress is required for type '${args.type}'`);
    }
    if (args.type === 'domain' && !args.domain) {
      throw new Error(`domain is required for type 'domain'`);
    }

    // First get file info
    const fileInfo = await drive.files.get({
      fileId: args.fileId,
      fields: "id, name, mimeType",
    });

    // Create permission
    const permission: any = {
      type: args.type,
      role: args.role,
    };

    if (args.emailAddress) {
      permission.emailAddress = args.emailAddress;
    }
    if (args.domain) {
      permission.domain = args.domain;
    }

    const res = await drive.permissions.create({
      fileId: args.fileId,
      requestBody: permission,
      sendNotificationEmail: args.sendNotificationEmail !== false,
      fields: "id, type, role, emailAddress, domain",
    });

    const createdPermission = res.data;
    
    return {
      content: [
        {
          type: "text",
          text: `File shared successfully:
- File: ${fileInfo.data.name} (${fileInfo.data.id})
- Permission ID: ${createdPermission.id}
- Type: ${createdPermission.type}
- Role: ${createdPermission.role}
- Email: ${createdPermission.emailAddress || 'N/A'}
- Domain: ${createdPermission.domain || 'N/A'}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error sharing file: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}