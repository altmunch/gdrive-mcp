import { google } from "googleapis";
import { GSheetsUpdateRangeInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gsheets_update_range",
  description: "Update a range of cells in a Google Spreadsheet with batch data",
  inputSchema: {
    type: "object",
    properties: {
      spreadsheetId: {
        type: "string",
        description: "ID of the spreadsheet",
      },
      range: {
        type: "string",
        description: "Range to update in A1 notation (e.g., 'Sheet1!A1:C10')",
      },
      values: {
        type: "array",
        items: {
          type: "array",
          items: { type: "string" }
        },
        description: "2D array of values to update. Each sub-array represents a row.",
      },
      valueInputOption: {
        type: "string",
        enum: ["RAW", "USER_ENTERED"],
        description: "How values should be interpreted: RAW (not parsed) or USER_ENTERED (parsed as if typed)",
        optional: true,
      },
    },
    required: ["spreadsheetId", "range", "values"],
  },
} as const;

export async function updateRange(
  args: GSheetsUpdateRangeInput,
): Promise<InternalToolResponse> {
  try {
    const sheets = google.sheets({ version: "v4" });

    const res = await sheets.spreadsheets.values.update({
      spreadsheetId: args.spreadsheetId,
      range: args.range,
      valueInputOption: args.valueInputOption || "USER_ENTERED",
      requestBody: {
        values: args.values,
      },
    });

    const updateInfo = res.data;
    
    return {
      content: [
        {
          type: "text",
          text: `Range updated successfully:
- Spreadsheet ID: ${args.spreadsheetId}
- Range: ${args.range}
- Updated Range: ${updateInfo.updatedRange}
- Updated Rows: ${updateInfo.updatedRows}
- Updated Columns: ${updateInfo.updatedColumns}
- Updated Cells: ${updateInfo.updatedCells}
- Value Input Option: ${args.valueInputOption || "USER_ENTERED"}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error updating range: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}