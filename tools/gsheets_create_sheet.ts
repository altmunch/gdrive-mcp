import { google } from "googleapis";
import { GSheetsCreateSheetInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gsheets_create_sheet",
  description: "Create a new Google Spreadsheet",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the new spreadsheet",
      },
      parents: {
        type: "array",
        items: { type: "string" },
        description: "Array of parent folder IDs where the spreadsheet should be created (optional)",
        optional: true,
      },
    },
    required: ["name"],
  },
} as const;

export async function createSheet(
  args: GSheetsCreateSheetInput,
): Promise<InternalToolResponse> {
  try {
    const sheets = google.sheets({ version: "v4" });
    const drive = google.drive("v3");

    // First create the spreadsheet
    const res = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: args.name,
        },
      },
    });

    const spreadsheet = res.data;

    // If parents are specified, move the spreadsheet to those folders
    if (args.parents && args.parents.length > 0) {
      await drive.files.update({
        fileId: spreadsheet.spreadsheetId!,
        addParents: args.parents.join(','),
        fields: "id, parents",
      });
    }

    return {
      content: [
        {
          type: "text",
          text: `Spreadsheet created successfully:
- ID: ${spreadsheet.spreadsheetId}
- Name: ${spreadsheet.properties?.title}
- URL: ${spreadsheet.spreadsheetUrl}
- Default Sheet: ${spreadsheet.sheets?.[0]?.properties?.title || 'Sheet1'}
- Parents: ${args.parents?.join(', ') || 'Root folder'}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error creating spreadsheet: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}