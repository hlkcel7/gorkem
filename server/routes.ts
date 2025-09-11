import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { googleSheetsService } from "./services/googleSheets";
import { setupAuth, requireAuth } from "./auth";
import { 
  insertSheetSchema, 
  addRecordFormSchema, 
  createSheetFormSchema,
  insertTransactionSchema,
  type SheetData,
  type User 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || process.env.SPREADSHEET_ID;

  if (!SPREADSHEET_ID) {
    console.warn('Warning: GOOGLE_SPREADSHEET_ID not found in environment variables');
  }

  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Get all sheets
  app.get("/api/sheets", requireAuth, async (req, res) => {
    try {
      const sheets = await storage.getSheets();
      
      // If no sheets in storage, try to sync from Google Sheets
      if (sheets.length === 0 && SPREADSHEET_ID) {
        try {
          const spreadsheetInfo = await googleSheetsService.getSpreadsheetInfo(SPREADSHEET_ID);
          
          // Create sheet records for each Google Sheet tab
          for (const sheetInfo of spreadsheetInfo.sheets) {
            await storage.createSheet({
              name: sheetInfo.title,
              googleSheetId: SPREADSHEET_ID,
              sheetTabId: sheetInfo.id,
              headers: []
            });
          }
          
          const updatedSheets = await storage.getSheets();
          res.json(updatedSheets);
        } catch (error) {
          console.error('Error syncing sheets from Google:', error);
          res.json(sheets); // Return empty array if sync fails
        }
      } else {
        res.json(sheets);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get sheets" });
    }
  });
  
  // Update sheet metadata (rename, headers update)
  app.put("/api/sheets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, headers } = req.body;
      const sheet = await storage.getSheet(id);
      if (!sheet) {
        return res.status(404).json({ message: "Sheet not found" });
      }

      const updateData: any = {};
      if (typeof name === 'string' && name.trim().length > 0) updateData.name = name.trim();
      if (Array.isArray(headers)) updateData.headers = headers;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      await storage.updateSheet(id, updateData);
      const updated = await storage.getSheet(id);
      res.json(updated);
    } catch (error) {
      console.error('Failed to update sheet:', error);
      res.status(500).json({ message: "Failed to update sheet" });
    }
  });

  // Get sheet data
  app.get("/api/sheets/:id/data", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const sheet = await storage.getSheet(id);
      
      if (!sheet) {
        return res.status(404).json({ message: "Sheet not found" });
      }

      let data: any[][] = [];
      let headers: string[] = sheet.headers;

      // Try to get data from Google Sheets
      if (SPREADSHEET_ID && sheet.name) {
        try {
          const sheetData = await googleSheetsService.getSheetData(SPREADSHEET_ID, sheet.name);
          
          if (sheetData.length > 0) {
            headers = sheetData[0]; // First row as headers
            data = sheetData.slice(1); // Rest as data
            
            // Update headers in storage
            await storage.updateSheet(id, { headers });
          }
        } catch (error) {
          console.error('Error getting data from Google Sheets:', error);
        }
      }

      const sheetData: SheetData = {
        sheet,
        records: data,
        headers
      };

      res.json(sheetData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sheet data" });
    }
  });

  // Add record to sheet
  app.post("/api/sheets/:id/records", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = addRecordFormSchema.parse(req.body);
      
      const sheet = await storage.getSheet(id);
      if (!sheet) {
        return res.status(404).json({ message: "Sheet not found" });
      }

      // Convert form data to row array
      const rowData = [
        validatedData.date,
        validatedData.description,
        validatedData.amount.toString(),
        validatedData.type,
        validatedData.category
      ];

      // Add to Google Sheets
      if (SPREADSHEET_ID && sheet.name) {
        try {
          await googleSheetsService.appendSheetData(SPREADSHEET_ID, sheet.name, [rowData]);
        } catch (error) {
          console.error('Error adding record to Google Sheets:', error);
          return res.status(500).json({ message: "Failed to add record to Google Sheets" });
        }
      }

      // Also create a transaction record if this is an accounting sheet
      if (sheet.name.toLowerCase().includes('muhasebe') || sheet.name.toLowerCase().includes('accounting')) {
        try {
          await storage.createTransaction({
            date: new Date(validatedData.date),
            description: validatedData.description,
            amount: validatedData.amount.toString(),
            type: validatedData.type === 'Gelir' ? 'income' : 'expense',
            category: validatedData.category
          });
        } catch (error) {
          console.error('Error creating transaction record:', error);
        }
      }

      res.json({ success: true, message: "Record added successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Update sheet record
  app.put("/api/sheets/:id/records/:rowIndex", async (req, res) => {
    try {
      const { id, rowIndex } = req.params;
      const rowData = req.body.data;
      
      const sheet = await storage.getSheet(id);
      if (!sheet) {
        return res.status(404).json({ message: "Sheet not found" });
      }

      // Update in Google Sheets
      if (SPREADSHEET_ID && sheet.name) {
        try {
          const range = `${sheet.name}!A${parseInt(rowIndex) + 2}:${String.fromCharCode(65 + rowData.length - 1)}${parseInt(rowIndex) + 2}`;
          await googleSheetsService.updateSheetData(SPREADSHEET_ID, range, [rowData]);
        } catch (error) {
          console.error('Error updating record in Google Sheets:', error);
          return res.status(500).json({ message: "Failed to update record in Google Sheets" });
        }
      }

      res.json({ success: true, message: "Record updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update record" });
    }
  });

  // Create new sheet
  app.post("/api/sheets", requireAuth, async (req, res) => {
    try {
      const validatedData = createSheetFormSchema.parse(req.body);
      const headers = googleSheetsService.getTemplateHeaders(validatedData.template);

      let sheetTabId = 0;

      // Create in Google Sheets
      if (SPREADSHEET_ID) {
        try {
          const result = await googleSheetsService.createSheet(SPREADSHEET_ID, validatedData.name, headers);
          sheetTabId = result.replies?.[0]?.addSheet?.properties?.sheetId || 0;
        } catch (error) {
          console.error('Error creating sheet in Google Sheets:', error);
          return res.status(500).json({ message: "Failed to create sheet in Google Sheets" });
        }
      }

      // Create in storage
      const sheet = await storage.createSheet({
        name: validatedData.name,
        googleSheetId: SPREADSHEET_ID || '',
        sheetTabId,
        headers
      });

      res.json(sheet);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Delete sheet
  app.delete("/api/sheets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const sheet = await storage.getSheet(id);
      
      if (!sheet) {
        return res.status(404).json({ message: "Sheet not found" });
      }

      // Delete from Google Sheets
      if (SPREADSHEET_ID && sheet.sheetTabId) {
        try {
          await googleSheetsService.deleteSheet(SPREADSHEET_ID, sheet.sheetTabId);
        } catch (error) {
          console.error('Error deleting sheet from Google Sheets:', error);
          return res.status(500).json({ message: "Failed to delete sheet from Google Sheets" });
        }
      }

      // Delete from storage
      await storage.deleteSheet(id);
      await storage.deleteSheetRecords(id);

      res.json({ success: true, message: "Sheet deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete sheet" });
    }
  });

  // Get dashboard data
  app.get("/api/dashboard", requireAuth, async (req, res) => {
    try {
      const dashboardData = await storage.getDashboardData();
      res.json(dashboardData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard data" });
    }
  });

  // Sync data from Google Sheets
  app.post("/api/sync", requireAuth, async (req, res) => {
    try {
      if (!SPREADSHEET_ID) {
        return res.status(400).json({ message: "Google Spreadsheet ID not configured" });
      }

      const sheets = await storage.getSheets();
      let syncedCount = 0;

      for (const sheet of sheets) {
        try {
          const sheetData = await googleSheetsService.getSheetData(SPREADSHEET_ID, sheet.name);
          
          if (sheetData.length > 0) {
            const headers = sheetData[0];
            await storage.updateSheet(sheet.id, { headers });
            syncedCount++;
          }
        } catch (error) {
          console.error(`Error syncing sheet ${sheet.name}:`, error);
        }
      }

      res.json({ 
        success: true, 
        message: `Synced ${syncedCount} sheets successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to sync data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
