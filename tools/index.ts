// Google Drive Tools
import { schema as gdriveSearchSchema, search } from './gdrive_search.js';
import { schema as gdriveReadFileSchema, readFile } from './gdrive_read_file.js';
import { schema as gdriveCreateFileSchema, createFile } from './gdrive_create_file.js';
import { schema as gdriveCreateFolderSchema, createFolder } from './gdrive_create_folder.js';
import { schema as gdriveDeleteFileSchema, deleteFile } from './gdrive_delete_file.js';
import { schema as gdriveMoveFileSchema, moveFile } from './gdrive_move_file.js';
import { schema as gdriveCopyFileSchema, copyFile } from './gdrive_copy_file.js';
import { schema as gdriveListPermissionsSchema, listPermissions } from './gdrive_list_permissions.js';
import { schema as gdriveShareFileSchema, shareFile } from './gdrive_share_file.js';

// Google Sheets Tools
import { schema as gsheetsReadSchema, readSheet } from './gsheets_read.js';
import { schema as gsheetsUpdateCellSchema, updateCell } from './gsheets_update_cell.js';
import { schema as gsheetsUpdateRangeSchema, updateRange } from './gsheets_update_range.js';
import { schema as gsheetsCreateSheetSchema, createSheet } from './gsheets_create_sheet.js';
import { schema as gsheetsAddWorksheetSchema, addWorksheet } from './gsheets_add_worksheet.js';
import { schema as gsheetsFormatCellsSchema, formatCells } from './gsheets_format_cells.js';

// Google Docs Tools
import { schema as gdocsReadSchema, readDoc } from './gdocs_read.js';
import { schema as gdocsCreateSchema, createDoc } from './gdocs_create.js';
import { schema as gdocsInsertTextSchema, insertText } from './gdocs_insert_text.js';
import { schema as gdocsReplaceTextSchema, replaceText } from './gdocs_replace_text.js';

import { 
  Tool, 
  // Google Drive Types
  GDriveSearchInput, 
  GDriveReadFileInput,
  GDriveCreateFileInput,
  GDriveCreateFolderInput,
  GDriveDeleteFileInput,
  GDriveMoveFileInput,
  GDriveCopyFileInput,
  GDriveListPermissionsInput,
  GDriveShareFileInput,
  // Google Sheets Types
  GSheetsReadInput,
  GSheetsUpdateCellInput,
  GSheetsUpdateRangeInput,
  GSheetsCreateSheetInput,
  GSheetsAddWorksheetInput,
  GSheetsFormatCellsInput,
  // Google Docs Types
  GDocsReadInput,
  GDocsCreateInput,
  GDocsInsertTextInput,
  GDocsReplaceTextInput
} from './types.js';

export const tools: Tool<any>[] = [
  // === GOOGLE DRIVE TOOLS ===
  {
    ...gdriveSearchSchema,
    handler: search,
  },
  {
    ...gdriveReadFileSchema,
    handler: readFile,
  },
  {
    ...gdriveCreateFileSchema,
    handler: createFile,
  },
  {
    ...gdriveCreateFolderSchema,
    handler: createFolder,
  },
  {
    ...gdriveDeleteFileSchema,
    handler: deleteFile,
  },
  {
    ...gdriveMoveFileSchema,
    handler: moveFile,
  },
  {
    ...gdriveCopyFileSchema,
    handler: copyFile,
  },
  {
    ...gdriveListPermissionsSchema,
    handler: listPermissions,
  },
  {
    ...gdriveShareFileSchema,
    handler: shareFile,
  },

  // === GOOGLE SHEETS TOOLS ===
  {
    ...gsheetsReadSchema,
    handler: readSheet,
  },
  {
    ...gsheetsUpdateCellSchema,
    handler: updateCell,
  },
  {
    ...gsheetsUpdateRangeSchema,
    handler: updateRange,
  },
  {
    ...gsheetsCreateSheetSchema,
    handler: createSheet,
  },
  {
    ...gsheetsAddWorksheetSchema,
    handler: addWorksheet,
  },
  {
    ...gsheetsFormatCellsSchema,
    handler: formatCells,
  },

  // === GOOGLE DOCS TOOLS ===
  {
    ...gdocsReadSchema,
    handler: readDoc,
  },
  {
    ...gdocsCreateSchema,
    handler: createDoc,
  },
  {
    ...gdocsInsertTextSchema,
    handler: insertText,
  },
  {
    ...gdocsReplaceTextSchema,
    handler: replaceText,
  },
];