// Define base types for our tool system
export interface Tool<T> {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required: readonly string[];
  };
  handler: (args: T) => Promise<InternalToolResponse>;
}

// Our internal tool response format
export interface InternalToolResponse {
  content: {
    type: string;
    text: string;
  }[];
  isError: boolean;
}

// Input types for each tool

// === GOOGLE DRIVE TOOLS ===
export interface GDriveSearchInput {
  query: string;
  pageToken?: string;
  pageSize?: number;
  includeItemsFromAllDrives?: boolean;
  orderBy?: string;
}

export interface GDriveReadFileInput {
  fileId: string;
}

export interface GDriveCreateFileInput {
  name: string;
  mimeType: string;
  content?: string;
  parents?: string[];
}

export interface GDriveUpdateFileInput {
  fileId: string;
  content?: string;
  name?: string;
}

export interface GDriveDeleteFileInput {
  fileId: string;
}

export interface GDriveCreateFolderInput {
  name: string;
  parents?: string[];
}

export interface GDriveMoveFileInput {
  fileId: string;
  newParents: string[];
  oldParents?: string[];
}

export interface GDriveCopyFileInput {
  fileId: string;
  name?: string;
  parents?: string[];
}

export interface GDriveListPermissionsInput {
  fileId: string;
}

export interface GDriveShareFileInput {
  fileId: string;
  type: 'user' | 'group' | 'domain' | 'anyone';
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
  emailAddress?: string;
  domain?: string;
  sendNotificationEmail?: boolean;
}

// === GOOGLE SHEETS TOOLS ===
export interface GSheetsReadInput {
  spreadsheetId: string;
  ranges?: string[]; // Optional A1 notation ranges like "Sheet1!A1:B10"
  sheetId?: number; // Optional specific sheet ID
}

export interface GSheetsUpdateCellInput {
  fileId: string;
  range: string;
  value: string;
}

export interface GSheetsUpdateRangeInput {
  spreadsheetId: string;
  range: string;
  values: any[][];
  valueInputOption?: 'RAW' | 'USER_ENTERED';
}

export interface GSheetsCreateSheetInput {
  name: string;
  parents?: string[];
}

export interface GSheetsAddWorksheetInput {
  spreadsheetId: string;
  title: string;
  rowCount?: number;
  columnCount?: number;
}

export interface GSheetsDeleteWorksheetInput {
  spreadsheetId: string;
  sheetId: number;
}

export interface GSheetsFormatCellsInput {
  spreadsheetId: string;
  range: string;
  format: {
    backgroundColor?: { red: number; green: number; blue: number };
    textFormat?: {
      bold?: boolean;
      italic?: boolean;
      fontSize?: number;
      fontFamily?: string;
    };
  };
}

export interface GSheetsInsertRowsInput {
  spreadsheetId: string;
  sheetId: number;
  startIndex: number;
  endIndex: number;
}

export interface GSheetsDeleteRowsInput {
  spreadsheetId: string;
  sheetId: number;
  startIndex: number;
  endIndex: number;
}

export interface GSheetsCreateChartInput {
  spreadsheetId: string;
  sheetId: number;
  chartType: string;
  sourceRange: string;
  title?: string;
}

export interface GSheetsBatchUpdateInput {
  spreadsheetId: string;
  requests: any[];
}

export interface GSheetsProtectRangeInput {
  spreadsheetId: string;
  range: string;
  description?: string;
}

export interface GSheetsConditionalFormatInput {
  spreadsheetId: string;
  range: string;
  condition: any;
  format: any;
}

// === GOOGLE DOCS TOOLS ===
export interface GDocsReadInput {
  documentId: string;
}

export interface GDocsCreateInput {
  title: string;
  parents?: string[];
}

export interface GDocsInsertTextInput {
  documentId: string;
  text: string;
  index: number;
}

export interface GDocsReplaceTextInput {
  documentId: string;
  containsText: string;
  replaceText: string;
  matchCase?: boolean;
}

export interface GDocsFormatTextInput {
  documentId: string;
  startIndex: number;
  endIndex: number;
  format: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    fontSize?: number;
    fontFamily?: string;
  };
}

export interface GDocsInsertTableInput {
  documentId: string;
  index: number;
  rows: number;
  columns: number;
}

export interface GDocsInsertImageInput {
  documentId: string;
  index: number;
  imageUri: string;
  width?: number;
  height?: number;
}

export interface GDocsBatchUpdateInput {
  documentId: string;
  requests: any[];
}

