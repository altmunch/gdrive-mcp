import { google } from "googleapis";
import { GSheetsFormatCellsInput, InternalToolResponse } from "./types.js";

export const schema = {
  name: "gsheets_format_cells",
  description: "Format cells in a Google Spreadsheet (background color, text formatting, etc.)",
  inputSchema: {
    type: "object",
    properties: {
      spreadsheetId: {
        type: "string",
        description: "ID of the spreadsheet",
      },
      range: {
        type: "string",
        description: "Range to format in A1 notation (e.g., 'Sheet1!A1:C10')",
      },
      format: {
        type: "object",
        properties: {
          backgroundColor: {
            type: "object",
            properties: {
              red: { type: "number", minimum: 0, maximum: 1 },
              green: { type: "number", minimum: 0, maximum: 1 },
              blue: { type: "number", minimum: 0, maximum: 1 }
            },
            description: "Background color (RGB values 0-1)",
            optional: true,
          },
          textFormat: {
            type: "object",
            properties: {
              bold: { type: "boolean", optional: true },
              italic: { type: "boolean", optional: true },
              fontSize: { type: "number", optional: true },
              fontFamily: { type: "string", optional: true }
            },
            description: "Text formatting options",
            optional: true,
          },
        },
        description: "Formatting options to apply",
      },
    },
    required: ["spreadsheetId", "range", "format"],
  },
} as const;

export async function formatCells(
  args: GSheetsFormatCellsInput,
): Promise<InternalToolResponse> {
  try {
    const sheets = google.sheets({ version: "v4" });

    // Parse range to get sheet name and range
    const [sheetName, cellRange] = args.range.split('!');
    
    // Convert A1 notation to grid range
    const parseA1 = (a1: string) => {
      const match = a1.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
      if (!match) throw new Error(`Invalid range format: ${a1}`);
      
      const colToIndex = (col: string) => {
        let index = 0;
        for (let i = 0; i < col.length; i++) {
          index = index * 26 + (col.charCodeAt(i) - 65 + 1);
        }
        return index - 1;
      };
      
      return {
        startColumnIndex: colToIndex(match[1]),
        startRowIndex: parseInt(match[2]) - 1,
        endColumnIndex: colToIndex(match[3]) + 1,
        endRowIndex: parseInt(match[4]),
      };
    };

    let gridRange;
    try {
      gridRange = parseA1(cellRange);
    } catch {
      // If parsing fails, try single cell
      const singleMatch = cellRange.match(/([A-Z]+)(\d+)/);
      if (singleMatch) {
        const colToIndex = (col: string) => {
          let index = 0;
          for (let i = 0; i < col.length; i++) {
            index = index * 26 + (col.charCodeAt(i) - 65 + 1);
          }
          return index - 1;
        };
        
        const colIndex = colToIndex(singleMatch[1]);
        const rowIndex = parseInt(singleMatch[2]) - 1;
        gridRange = {
          startColumnIndex: colIndex,
          startRowIndex: rowIndex,
          endColumnIndex: colIndex + 1,
          endRowIndex: rowIndex + 1,
        };
      } else {
        throw new Error(`Could not parse range: ${cellRange}`);
      }
    }

    // Get sheet ID from sheet name
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: args.spreadsheetId,
      fields: "sheets.properties",
    });

    const sheet = spreadsheetInfo.data.sheets?.find(
      s => s.properties?.title === sheetName
    );
    
    if (!sheet?.properties?.sheetId) {
      throw new Error(`Sheet '${sheetName}' not found`);
    }

    // Build format request
    const cellFormat: any = {};
    
    if (args.format.backgroundColor) {
      cellFormat.backgroundColor = args.format.backgroundColor;
    }
    
    if (args.format.textFormat) {
      cellFormat.textFormat = args.format.textFormat;
    }

    const res = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: args.spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheet.properties.sheetId,
                ...gridRange,
              },
              cell: {
                userEnteredFormat: cellFormat,
              },
              fields: "userEnteredFormat",
            },
          },
        ],
      },
    });

    return {
      content: [
        {
          type: "text",
          text: `Cells formatted successfully:
- Spreadsheet ID: ${args.spreadsheetId}
- Range: ${args.range}
- Sheet ID: ${sheet.properties.sheetId}
- Applied formatting: ${JSON.stringify(args.format, null, 2)}
- Requests processed: ${res.data.replies?.length || 0}`,
        },
      ],
      isError: false,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error formatting cells: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}