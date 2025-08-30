import { google } from "googleapis";
import { GDriveListPermissionsInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdrive_list_permissions",
  description: "List all permissions (sharing settings) for a file or folder in Google Drive",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "ID of the file or folder to list permissions for",
      },
    },
    required: ["fileId"],
  },
} as const;

export async function listPermissions(
  args: GDriveListPermissionsInput,
): Promise<InternalToolResponse> {
  try {
    const drive = google.drive("v3");

    // Get file info
    const fileInfo = await drive.files.get({
      fileId: args.fileId,
      fields: "id, name, mimeType, webViewLink",
    });

    // List permissions
    const res = await drive.permissions.list({
      fileId: args.fileId,
      fields: "permissions(id, type, role, emailAddress, domain, displayName, expirationTime, allowFileDiscovery)",
    });

    const permissions = res.data.permissions || [];
    
    let permissionsList = permissions.map((perm: any) => {
      let details = `- ID: ${perm.id}
  Type: ${perm.type}
  Role: ${perm.role}`;
  
      if (perm.emailAddress) details += `\n  Email: ${perm.emailAddress}`;
      if (perm.displayName) details += `\n  Name: ${perm.displayName}`;
      if (perm.domain) details += `\n  Domain: ${perm.domain}`;
      if (perm.expirationTime) details += `\n  Expires: ${perm.expirationTime}`;
      if (perm.allowFileDiscovery !== undefined) details += `\n  Allow Discovery: ${perm.allowFileDiscovery}`;
      
      return details;
    }).join('\n\n');

    return {
      content: [
        {
          type: "text",
          text: `Permissions for file: ${fileInfo.data.name}
File ID: ${fileInfo.data.id}
File Type: ${fileInfo.data.mimeType}
Link: ${fileInfo.data.webViewLink}

Total Permissions: ${permissions.length}

${permissionsList || 'No permissions found'}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error listing permissions: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}