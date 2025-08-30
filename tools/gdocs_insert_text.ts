import { google } from "googleapis";
import { GDocsInsertTextInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdocs_insert_text",
  description: "Insert text at a specific position in a Google Document",
  inputSchema: {
    type: "object",
    properties: {
      documentId: {
        type: "string",
        description: "ID of the Google Document",
      },
      text: {
        type: "string",
        description: "Text to insert",
      },
      index: {
        type: "number",
        description: "Character index where to insert text (0 = beginning, 1 = after first character). Use -1 to append at end.",
      },
    },
    required: ["documentId", "text", "index"],
  },
} as const;

export async function insertText(
  args: GDocsInsertTextInput,
): Promise<InternalToolResponse> {
  try {
    const docs = google.docs({ version: "v1" });

    // If index is -1, get document length to append at end
    let insertIndex = args.index;
    if (insertIndex === -1) {
      const docInfo = await docs.documents.get({
        documentId: args.documentId,
      });
      
      // Calculate document length
      let length = 1; // Start at 1 for the document
      const content = docInfo.data.body?.content || [];
      for (const element of content) {
        if (element.endIndex) {
          length = Math.max(length, element.endIndex);
        }
      }
      insertIndex = length - 1; // Insert before the final newline
    }

    const res = await docs.documents.batchUpdate({
      documentId: args.documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: insertIndex,
              },
              text: args.text,
            },
          },
        ],
      },
    });

    return {
      content: [
        {
          type: "text",
          text: `Text inserted successfully:
- Document ID: ${args.documentId}
- Text: "${args.text}"
- Position: ${insertIndex}
- Request ID: ${res.data.replies?.[0] ? 'Success' : 'N/A'}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error inserting text: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}