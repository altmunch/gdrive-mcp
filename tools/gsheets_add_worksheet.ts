import { google } from "googleapis";
import { GSheetsAddWorksheetInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gsheets_add_worksheet",
  description: "Add a new worksheet (tab) to an existing Google Spreadsheet",
  inputSchema: {
    type: "object",
    properties: {
      spreadsheetId: {
        type: "string",
        description: "ID of the spreadsheet to add worksheet to",
      },
      title: {
        type: "string",
        description: "Title of the new worksheet",
      },
      rowCount: {
        type: "number",
        description: "Number of rows in the new worksheet (default: 1000)",
        optional: true,
      },
      columnCount: {
        type: "number", 
        description: "Number of columns in the new worksheet (default: 26)",
        optional: true,
      },
    },
    required: ["spreadsheetId", "title"],
  },
} as const;

export async function addWorksheet(
  args: GSheetsAddWorksheetInput,
): Promise<InternalToolResponse> {
  try {
    const sheets = google.sheets({ version: "v4" });

    const res = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: args.spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: args.title,
                gridProperties: {
                  rowCount: args.rowCount || 1000,
                  columnCount: args.columnCount || 26,
                },
              },
            },
          },
        ],
      },
    });

    const addedSheet = res.data.replies?.[0]?.addSheet;
    const sheetProperties = addedSheet?.properties;
    
    return {
      content: [
        {
          type: "text",
          text: `Worksheet added successfully:
- Spreadsheet ID: ${args.spreadsheetId}
- Sheet ID: ${sheetProperties?.sheetId}
- Title: ${sheetProperties?.title}
- Rows: ${sheetProperties?.gridProperties?.rowCount}
- Columns: ${sheetProperties?.gridProperties?.columnCount}
- Index: ${sheetProperties?.index}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error adding worksheet: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}