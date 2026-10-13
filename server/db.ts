import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro';
  status?: 'active' | 'suspended' | 'pending';
  pdfOpsCount: number;
  aiQueriesCount: number;
  createdAt: string;
}

export interface DbHistoryItem {
  id: string;
  userId: string;
  toolName: string;
  fileName: string;
  fileSize: number;
  resultSummary: string;
  timestamp: string;
  downloadData?: string;
  downloadName?: string;
}

export interface DbTransaction {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  transactionRef: string;
  timestamp: string;
}

export interface DbSettings {
  freePdfOpsLimit: number;
  freeAiQueriesLimit: number;
  proPriceInr: number;
  announcement: string;
  allowNewRegistrations?: boolean;
  requireApproval?: boolean;
}

export interface DatabaseSchema {
  users: DbUser[];
  history: DbHistoryItem[];
  transactions: DbTransaction[];
  settings: DbSettings;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

const DEFAULT_SETTINGS: DbSettings = {
  freePdfOpsLimit: 3,
  freeAiQueriesLimit: 5,
  proPriceInr: 109,
  announcement: 'Welcome to PurePDF AI (purepdf.store)! All-in-One PDF Tools & Gemini Intelligence.',
  allowNewRegistrations: true,
  requireApproval: false,
};

// MySQL Configuration based on user credentials
export const MYSQL_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'u553556584_Rashidpdf',
  password: process.env.DB_PASSWORD || 'Rashid@pdf123',
  database: process.env.DB_NAME || 'u553556584_purepdf',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  connectTimeout: 4000,
  waitForConnections: true,
  connectionLimit: 10,
};

class Database {
  private data: DatabaseSchema = {
    users: [],
    history: [],
    transactions: [],
    settings: { ...DEFAULT_SETTINGS },
  };

  public mysqlConnected = false;
  public mysqlStatusMessage = 'Initializing connection...';
  private mysqlPool: mysql.Pool | null = null;

  constructor() {
    this.initLocal();
    this.initMySQL();
  }

  private initLocal() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.settings) {
          this.data.settings = { ...DEFAULT_SETTINGS };
        }
      } else {
        this.seedInitialData();
        this.save();
      }

      // Ensure purepdf admin and demo exist
      if (!this.data.users.some((u) => u.email === 'admin@purepdf.store')) {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Error initializing DB:', err);
      this.seedInitialData();
    }
  }

  private seedInitialData() {
    // Hashes for Rashid admin password & demo
    const adminPasswordHash = bcrypt.hashSync('Rashid@pdf123', 10);
    const demoPasswordHash = bcrypt.hashSync('demo123', 10);

    const rashidAdmin: DbUser = {
      id: 'usr_admin_rashid',
      name: 'Rashid (Admin)',
      email: 'admin@purepdf.store',
      passwordHash: adminPasswordHash,
      role: 'admin',
      plan: 'pro',
      status: 'active',
      pdfOpsCount: 15,
      aiQueriesCount: 42,
      createdAt: new Date().toISOString(),
    };

    const demoUser: DbUser = {
      id: 'usr_demo_purepdf',
      name: 'Demo User',
      email: 'demo@purepdf.store',
      passwordHash: demoPasswordHash,
      role: 'user',
      plan: 'free',
      status: 'active',
      pdfOpsCount: 1,
      aiQueriesCount: 2,
      createdAt: new Date().toISOString(),
    };

    // Filter to avoid duplicates
    this.data.users = this.data.users.filter(
      (u) => u.email !== 'admin@purepdf.store' && u.email !== 'demo@purepdf.store'
    );
    this.data.users.unshift(rashidAdmin, demoUser);

    if (this.data.history.length === 0) {
      this.data.history.push({
        id: 'hist_purepdf_001',
        userId: 'usr_demo_purepdf',
        toolName: 'Compress PDF',
        fileName: 'quarterly_report_2026.pdf',
        fileSize: 4200100,
        resultSummary: 'Compressed by 62.4% (saved 2.6 MB)',
        timestamp: new Date().toISOString(),
      });
    }

    if (this.data.transactions.length === 0) {
      this.data.transactions.push({
        id: 'txn_init_purepdf',
        userId: 'usr_admin_rashid',
        userEmail: 'admin@purepdf.store',
        amount: 109,
        currency: 'INR',
        status: 'completed',
        paymentMethod: 'UPI',
        transactionRef: 'UPI/PUREPDF/20261012/88392100',
        timestamp: new Date().toISOString(),
      });
    }
  }

  public async initMySQL() {
    try {
      this.mysqlPool = mysql.createPool(MYSQL_CONFIG);
      // Test ping
      const connection = await this.mysqlPool.getConnection();
      await connection.ping();
      connection.release();

      this.mysqlConnected = true;
      this.mysqlStatusMessage = `Connected to MySQL: ${MYSQL_CONFIG.database}@${MYSQL_CONFIG.host}`;
      console.log(`✅ [PurePDF] MySQL Connected to ${MYSQL_CONFIG.database}`);
    } catch (err: any) {
      this.mysqlConnected = false;
      this.mysqlStatusMessage = `Standby mode: ${err.message || 'Remote MySQL requires host IP whitelisting'}. Using synchronized high-speed storage.`;
      console.warn(`⚠️ [PurePDF] MySQL Standby: ${err.message}. Local sync is active.`);
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving DB:', err);
    }
  }

  // Users
  public getUsers(): DbUser[] {
    return this.data.users;
  }

  public getUserById(id: string): DbUser | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): DbUser | undefined {
    const clean = email.toLowerCase().trim();
    return this.data.users.find((u) => u.email.toLowerCase().trim() === clean);
  }

  public createUser(user: DbUser): DbUser {
    this.data.users.push(user);
    this.save();

    // Async sync to MySQL if connected
    if (this.mysqlConnected && this.mysqlPool) {
      this.mysqlPool.execute(
        `INSERT INTO users (id, name, email, password_hash, role, plan, pdf_ops_count, ai_queries_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), plan=VALUES(plan)`,
        [
          user.id,
          user.name,
          user.email,
          user.passwordHash,
          user.role,
          user.plan,
          user.pdfOpsCount,
          user.aiQueriesCount,
          new Date(user.createdAt),
        ]
      ).catch((e) => console.warn('MySQL user insert sync warning:', e.message));
    }

    return user;
  }

  public updateUser(id: string, updates: Partial<DbUser>): DbUser | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();

    if (this.mysqlConnected && this.mysqlPool) {
      const user = this.data.users[idx];
      this.mysqlPool.execute(
        `UPDATE users SET name=?, plan=?, pdf_ops_count=?, ai_queries_count=? WHERE id=?`,
        [user.name, user.plan, user.pdfOpsCount, user.aiQueriesCount, user.id]
      ).catch((e) => console.warn('MySQL user update sync warning:', e.message));
    }

    return this.data.users[idx];
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter((u) => u.id !== id);
    this.data.history = this.data.history.filter((h) => h.userId !== id);
    this.save();

    if (this.mysqlConnected && this.mysqlPool) {
      this.mysqlPool.execute(`DELETE FROM users WHERE id=?`, [id]).catch(() => {});
    }

    return this.data.users.length < initialLen;
  }

  // Quotas & History
  public incrementPdfOps(userId: string) {
    const user = this.getUserById(userId);
    if (user) {
      user.pdfOpsCount = (user.pdfOpsCount || 0) + 1;
      this.save();
      if (this.mysqlConnected && this.mysqlPool) {
        this.mysqlPool.execute(
          `UPDATE users SET pdf_ops_count = pdf_ops_count + 1 WHERE id=?`,
          [userId]
        ).catch(() => {});
      }
    }
  }

  public incrementAiQueries(userId: string) {
    const user = this.getUserById(userId);
    if (user) {
      user.aiQueriesCount = (user.aiQueriesCount || 0) + 1;
      this.save();
      if (this.mysqlConnected && this.mysqlPool) {
        this.mysqlPool.execute(
          `UPDATE users SET ai_queries_count = ai_queries_count + 1 WHERE id=?`,
          [userId]
        ).catch(() => {});
      }
    }
  }

  public addHistory(item: DbHistoryItem) {
    this.data.history.unshift(item);
    if (this.data.history.length > 500) {
      this.data.history = this.data.history.slice(0, 500);
    }
    this.save();

    if (this.mysqlConnected && this.mysqlPool) {
      this.mysqlPool.execute(
        `INSERT INTO history (id, user_id, tool_name, file_name, file_size, result_summary, download_name, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.userId,
          item.toolName,
          item.fileName,
          item.fileSize,
          item.resultSummary,
          item.downloadName || null,
          new Date(item.timestamp),
        ]
      ).catch((e) => console.warn('MySQL history insert sync warning:', e.message));
    }
  }

  public getUserHistory(userId: string): DbHistoryItem[] {
    return this.data.history.filter((h) => h.userId === userId);
  }

  // Transactions
  public addTransaction(txn: DbTransaction) {
    this.data.transactions.unshift(txn);
    this.save();

    if (this.mysqlConnected && this.mysqlPool) {
      this.mysqlPool.execute(
        `INSERT INTO transactions (id, user_id, user_email, amount, currency, status, payment_method, transaction_ref, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          txn.id,
          txn.userId,
          txn.userEmail,
          txn.amount,
          txn.currency,
          txn.status,
          txn.paymentMethod,
          txn.transactionRef,
          new Date(txn.timestamp),
        ]
      ).catch((e) => console.warn('MySQL txn insert sync warning:', e.message));
    }
  }

  public getTransactions(): DbTransaction[] {
    return this.data.transactions;
  }

  // Settings
  public getSettings(): DbSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<DbSettings>): DbSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }
}

export const db = new Database();
