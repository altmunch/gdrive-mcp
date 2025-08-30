import { google } from "googleapis";
import { GDocsReplaceTextInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdocs_replace_text",
  description: "Find and replace text in a Google Document",
  inputSchema: {
    type: "object",
    properties: {
      documentId: {
        type: "string",
        description: "ID of the Google Document",
      },
      containsText: {
        type: "string",
        description: "Text to find and replace",
      },
      replaceText: {
        type: "string",
        description: "Text to replace with",
      },
      matchCase: {
        type: "boolean",
        description: "Whether to match case exactly (default: false)",
        optional: true,
      },
    },
    required: ["documentId", "containsText", "replaceText"],
  },
} as const;

export async function replaceText(
  args: GDocsReplaceTextInput,
): Promise<InternalToolResponse> {
  try {
    const docs = google.docs({ version: "v1" });

    const res = await docs.documents.batchUpdate({
      documentId: args.documentId,
      requestBody: {
        requests: [
          {
            replaceAllText: {
              containsText: {
                text: args.containsText,
                matchCase: args.matchCase || false,
              },
              replaceText: args.replaceText,
            },
          },
        ],
      },
    });

    const replaceResult = res.data.replies?.[0]?.replaceAllText;
    const occurrencesChanged = replaceResult?.occurrencesChanged || 0;

    return {
      content: [
        {
          type: "text",
          text: `Text replacement completed:
- Document ID: ${args.documentId}
- Find: "${args.containsText}"
- Replace: "${args.replaceText}"
- Match Case: ${args.matchCase || false}
- Occurrences Changed: ${occurrencesChanged}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error replacing text: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}