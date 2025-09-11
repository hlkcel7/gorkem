import { 
  type Sheet, 
  type InsertSheet,
  type SheetRecord,
  type InsertSheetRecord,
  type Project,
  type InsertProject,
  type Transaction,
  type InsertTransaction,
  type DashboardData,
  type User,
  type InsertUser
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;

  // Sheets
  getSheets(): Promise<Sheet[]>;
  getSheet(id: string): Promise<Sheet | undefined>;
  createSheet(sheet: InsertSheet): Promise<Sheet>;
  updateSheet(id: string, sheet: Partial<InsertSheet>): Promise<Sheet | undefined>;
  deleteSheet(id: string): Promise<boolean>;

  // Sheet Records
  getSheetRecords(sheetId: string): Promise<SheetRecord[]>;
  createSheetRecord(record: InsertSheetRecord): Promise<SheetRecord>;
  updateSheetRecord(id: string, record: Partial<InsertSheetRecord>): Promise<SheetRecord | undefined>;
  deleteSheetRecord(id: string): Promise<boolean>;
  deleteSheetRecords(sheetId: string): Promise<boolean>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;

  // Transactions
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;

  // Dashboard
  getDashboardData(): Promise<DashboardData>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sheets: Map<string, Sheet>;
  private sheetRecords: Map<string, SheetRecord>;
  private projects: Map<string, Project>;
  private transactions: Map<string, Transaction>;

  constructor() {
    this.users = new Map();
    this.sheets = new Map();
    this.sheetRecords = new Map();
    this.projects = new Map();
    this.transactions = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.googleId === googleId);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
  ...insertUser,
  id,
  role: insertUser.role || "user",
  // ensure optional fields conform to User type
  picture: insertUser.picture ?? null,
  createdAt: now,
  updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { 
      ...user, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async upsertUser(insertUser: InsertUser): Promise<User> {
    // Prefer matching by googleId when provided
    let existingUser: User | undefined = undefined;

    if (insertUser.googleId) {
      existingUser = await this.getUserByGoogleId(insertUser.googleId);
    }

    // Fallback: match by email
    if (!existingUser && insertUser.email) {
      existingUser = await this.getUserByEmail(insertUser.email);
    }

    if (existingUser) {
      // Update existing user
      return await this.updateUser(existingUser.id, insertUser) || existingUser;
    }

    // Create new user
    return await this.createUser(insertUser);
  }

  // Sheets
  async getSheets(): Promise<Sheet[]> {
    return Array.from(this.sheets.values());
  }

  async getSheet(id: string): Promise<Sheet | undefined> {
    return this.sheets.get(id);
  }

  async createSheet(insertSheet: InsertSheet): Promise<Sheet> {
    const id = randomUUID();
    const now = new Date();
    const sheet: Sheet = { 
      ...insertSheet, 
      id, 
      headers: insertSheet.headers || [],
      createdAt: now,
      updatedAt: now 
    };
    this.sheets.set(id, sheet);
    return sheet;
  }

  async updateSheet(id: string, updates: Partial<InsertSheet>): Promise<Sheet | undefined> {
    const sheet = this.sheets.get(id);
    if (!sheet) return undefined;
    
    const updatedSheet: Sheet = { 
      ...sheet, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.sheets.set(id, updatedSheet);
    return updatedSheet;
  }

  async deleteSheet(id: string): Promise<boolean> {
    return this.sheets.delete(id);
  }

  // Sheet Records
  async getSheetRecords(sheetId: string): Promise<SheetRecord[]> {
    return Array.from(this.sheetRecords.values()).filter(record => record.sheetId === sheetId);
  }

  async createSheetRecord(insertRecord: InsertSheetRecord): Promise<SheetRecord> {
    const id = randomUUID();
    const now = new Date();
    const record: SheetRecord = { 
      ...insertRecord, 
      id, 
      createdAt: now,
      updatedAt: now 
    };
    this.sheetRecords.set(id, record);
    return record;
  }

  async updateSheetRecord(id: string, updates: Partial<InsertSheetRecord>): Promise<SheetRecord | undefined> {
    const record = this.sheetRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord: SheetRecord = { 
      ...record, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.sheetRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  async deleteSheetRecord(id: string): Promise<boolean> {
    return this.sheetRecords.delete(id);
  }

  async deleteSheetRecords(sheetId: string): Promise<boolean> {
    const records = await this.getSheetRecords(sheetId);
    records.forEach(record => this.sheetRecords.delete(record.id));
    return true;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const now = new Date();
    const project: Project = { 
  ...insertProject,
  id,
  progress: insertProject.progress ?? 0,
  status: insertProject.status ?? 'active',
  description: insertProject.description ?? null,
  startDate: insertProject.startDate ?? null,
  endDate: insertProject.endDate ?? null,
  budget: insertProject.budget ?? null,
  spent: insertProject.spent ?? null,
  createdAt: now,
  updatedAt: now
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject: Project = { 
      ...project, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const now = new Date();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      projectId: insertTransaction.projectId || null,
      createdAt: now,
      updatedAt: now 
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction: Transaction = { 
      ...transaction, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Dashboard
  async getDashboardData(): Promise<DashboardData> {
    const transactions = await this.getTransactions();
    const projects = await this.getProjects();

    // Calculate financial metrics
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Group by month for chart data
    const monthlyData: Array<{ month: string; income: number; expenses: number }> = [];
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'];
    
    months.forEach(month => {
      // For demo purposes, generate some data based on existing transactions
      monthlyData.push({
        month,
        income: income / 6 + Math.random() * 100000,
        expenses: expenses / 6 + Math.random() * 80000
      });
    });

    // Group expenses by category
    const categoryTotals = new Map<string, number>();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const current = categoryTotals.get(t.category) || 0;
        categoryTotals.set(t.category, current + Number(t.amount));
      });

    const expenseCategories = Array.from(categoryTotals.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: expenses > 0 ? (amount / expenses) * 100 : 0
    }));

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses,
      activeProjects: projects.filter(p => p.status === 'active').length,
      monthlyData,
      expenseCategories,
      projects: projects.filter(p => p.status === 'active').slice(0, 3) // Show top 3 active projects
    };
  }
}

export const storage = new MemStorage();
