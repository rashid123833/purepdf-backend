export type UserRole = 'user' | 'admin';
export type UserPlan = 'free' | 'pro';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  status?: UserStatus;
  pdfOpsCount: number;
  aiQueriesCount: number;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  userId: string;
  toolName: string;
  fileName: string;
  fileSize: number;
  resultSummary: string;
  timestamp: string;
  downloadData?: string; // base64 or identifier
  downloadName?: string;
}

export interface Transaction {
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

export interface PlatformSettings {
  freePdfOpsLimit: number;
  freeAiQueriesLimit: number;
  proPriceInr: number;
  announcement: string;
  allowNewRegistrations?: boolean;
  requireApproval?: boolean;
}

export interface AdminStats {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  totalPdfOps: number;
  totalAiQueries: number;
  totalRevenue: number;
}

export type ToolType =
  | 'merge'
  | 'split'
  | 'compress'
  | 'protect'
  | 'watermark'
  | 'img-to-pdf'
  | 'pdf-to-img'
  | 'ai-summarize'
  | 'ai-chat'
  | 'ai-keypoints'
  | 'ai-qa';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  pageReferences?: number[];
}
