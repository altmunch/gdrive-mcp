import { google } from "googleapis";
import { GDocsReadInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gdocs_read",
  description: "Read the content of a Google Document",
  inputSchema: {
    type: "object",
    properties: {
      documentId: {
        type: "string",
        description: "ID of the Google Document to read",
      },
    },
    required: ["documentId"],
  },
} as const;

export async function readDoc(
  args: GDocsReadInput,
): Promise<InternalToolResponse> {
  try {
    const docs = google.docs({ version: "v1" });

    const res = await docs.documents.get({
      documentId: args.documentId,
    });

    const document = res.data;
    
    // Extract text content from document structure
    const extractText = (content: any[]): string => {
      let text = "";
      
      for (const element of content || []) {
        if (element.paragraph) {
          for (const textElement of element.paragraph.elements || []) {
            if (textElement.textRun) {
              text += textElement.textRun.content;
            }
          }
        } else if (element.table) {
          text += "\n[TABLE]\n";
          for (const row of element.table.tableRows || []) {
            for (const cell of row.tableCells || []) {
              text += extractText(cell.content || []);
              text += "\t";
            }
            text += "\n";
          }
          text += "[/TABLE]\n";
        } else if (element.sectionBreak) {
          text += "\n---SECTION BREAK---\n";
        }
      }
      
      return text;
    };

    const documentText = extractText(document.body?.content || []);
    
    return {
      content: [
        {
          type: "text",
          text: `Document: ${document.title}
Document ID: ${args.documentId}
Revision ID: ${document.revisionId || 'Unknown'}

Content:
${documentText}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error reading document: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}