import { google } from "googleapis";
import { GDocsCreateInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdocs_create",
  description: "Create a new Google Document",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Title of the new document",
      },
      parents: {
        type: "array",
        items: { type: "string" },
        description: "Array of parent folder IDs where the document should be created (optional)",
        optional: true,
      },
    },
    required: ["title"],
  },
} as const;

export async function createDoc(
  args: GDocsCreateInput,
): Promise<InternalToolResponse> {
  try {
    const docs = google.docs({ version: "v1" });
    const drive = google.drive("v3");

    // Create the document
    const res = await docs.documents.create({
      requestBody: {
        title: args.title,
      },
    });

    const document = res.data;

    // If parents are specified, move the document to those folders
    if (args.parents && args.parents.length > 0) {
      await drive.files.update({
        fileId: document.documentId!,
        addParents: args.parents.join(','),
        fields: "id, parents",
      });
    }

    return {
      content: [
        {
          type: "text",
          text: `Document created successfully:
- ID: ${document.documentId}
- Title: ${document.title}
- URL: https://docs.google.com/document/d/${document.documentId}/edit
- Parents: ${args.parents?.join(', ') || 'Root folder'}
- Created: ${new Date().toISOString()}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error creating document: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}