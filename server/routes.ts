import fs from 'fs';
import path from 'path';
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { db, DbUser, DbHistoryItem, DbTransaction } from './db.js';
import { generateToken, authenticateUser, requireAdmin, sanitizeUser, AuthenticatedRequest } from './auth.js';
import { PdfService } from './pdfService.js';
import { AiService } from './aiService.js';

const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  storage: multer.memoryStorage(),
});

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================

apiRouter.post('/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const settings = db.getSettings();
    if (settings.allowNewRegistrations === false) {
      return res.status(403).json({ error: 'New user registrations are currently closed by administrator.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const initialStatus = settings.requireApproval ? 'pending' : 'active';
    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser: DbUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: 'user',
      plan: 'free',
      status: initialStatus,
      pdfOpsCount: 0,
      aiQueriesCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.createUser(newUser);

    if (initialStatus === 'pending') {
      return res.json({
        user: sanitizeUser(newUser),
        pendingApproval: true,
        message: 'Account registered! Your account is currently pending administrator approval. Please wait for the admin to activate your account.',
      });
    }

    const token = generateToken(newUser);
    return res.json({
      user: sanitizeUser(newUser),
      token,
      message: 'Account created successfully! Welcome to PurePDF AI (purepdf.store).',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

apiRouter.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check account status
    if (user.role !== 'admin') {
      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'Your account has been deactivated / suspended by administrator. Please contact support.' });
      }
      if (user.status === 'pending') {
        return res.status(403).json({ error: 'Your account is pending administrator approval. Please wait for approval.' });
      }
    }

    const token = generateToken(user);
    return res.json({
      user: sanitizeUser(user),
      token,
      message: 'Login successful!',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

apiRouter.get('/auth/me', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const freshUser = db.getUserById(req.user!.id);
  if (!freshUser) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.json({
    user: sanitizeUser(freshUser),
    settings: db.getSettings(),
  });
});

apiRouter.post('/auth/profile', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = db.getUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const updates: Partial<DbUser> = {};
    if (name && name.trim()) {
      updates.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password.' });
      }
      if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters.' });
      }
      updates.passwordHash = bcrypt.hashSync(newPassword, 10);
    }

    const updated = db.updateUser(user.id, updates);
    return res.json({
      user: sanitizeUser(updated!),
      message: 'Profile updated successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ==========================================
// 2. QUOTA VALIDATION HELPER
// ==========================================

function checkPdfQuota(user: DbUser): boolean {
  if (user.plan === 'pro') return true;
  const limit = db.getSettings().freePdfOpsLimit;
  return (user.pdfOpsCount || 0) < limit;
}

function checkAiQuota(user: DbUser): boolean {
  if (user.plan === 'pro') return true;
  const limit = db.getSettings().freeAiQueriesLimit;
  return (user.aiQueriesCount || 0) < limit;
}

// ==========================================
// 3. PDF OPERATIONS
// ==========================================

// Merge PDFs
apiRouter.post('/pdf/merge', authenticateUser, upload.array('files'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.getUserById(req.user!.id)!;
    if (!checkPdfQuota(user)) {
      return res.status(403).json({
        error: `Free plan limit reached (${db.getSettings().freePdfOpsLimit} PDF operations). Upgrade to Pro for unlimited operations!`,
        needsUpgrade: true,
      });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length < 2) {
      return res.status(400).json({ error: 'Please upload at least 2 PDF documents to merge.' });
    }

    const buffers = files.map((f) => f.buffer);
    const mergedBuffer = await PdfService.mergePdfs(buffers);

    db.incrementPdfOps(user.id);
    const historyItem: DbHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      toolName: 'Merge PDF',
      fileName: `merged_${files.length}_files.pdf`,
      fileSize: mergedBuffer.length,
      resultSummary: `Merged ${files.length} PDFs into one unified document (${(mergedBuffer.length / 1024).toFixed(1)} KB)`,
      timestamp: new Date().toISOString(),
      downloadName: `merged_document_${Date.now()}.pdf`,
    };
    db.addHistory(historyItem);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="merged_document.pdf"');
    res.setHeader('X-File-Size', mergedBuffer.length.toString());
    return res.send(mergedBuffer);
  } catch (err: any) {
    console.error('Merge error:', err);
    return res.status(500).json({ error: err.message || 'Failed to merge PDF files.' });
  }
});

// Split PDF
apiRouter.post('/pdf/split', authenticateUser, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.getUserById(req.user!.id)!;
    if (!checkPdfQuota(user)) {
      return res.status(403).json({
        error: `Free plan limit reached (${db.getSettings().freePdfOpsLimit} PDF operations). Upgrade to Pro for unlimited operations!`,
        needsUpgrade: true,
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF document to split.' });
    }

    const pageRangesStr = req.body.pages || '1'; // e.g., "1-3, 5"
    // Parse page numbers
    const pageNumbers: number[] = [];
    const parts = pageRangesStr.split(',').map((p: string) => p.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            pageNumbers.push(i);
          }
        }
      } else {
        const num = Number(part);
        if (!isNaN(num) && num > 0) pageNumbers.push(num);
      }
    }

    if (pageNumbers.length === 0) {
      return res.status(400).json({ error: 'Invalid page range specified. Example: 1-3, 5' });
    }

    const result = await PdfService.splitPdf(req.file.buffer, pageNumbers);

    db.incrementPdfOps(user.id);
    db.addHistory({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      toolName: 'Split PDF',
      fileName: req.file.originalname,
      fileSize: result.buffer.length,
      resultSummary: `Extracted ${result.extractedCount} pages out of ${result.totalOriginalPages} pages`,
      timestamp: new Date().toISOString(),
      downloadName: `split_${req.file.originalname}`,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="split_${req.file.originalname}"`);
    return res.send(result.buffer);
  } catch (err: any) {
    console.error('Split error:', err);
    return res.status(500).json({ error: err.message || 'Failed to split PDF.' });
  }
});

// Compress PDF
apiRouter.post('/pdf/compress', authenticateUser, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.getUserById(req.user!.id)!;
    if (!checkPdfQuota(user)) {
      return res.status(403).json({
        error: `Free plan limit reached (${db.getSettings().freePdfOpsLimit} PDF operations). Upgrade to Pro for unlimited operations!`,
        needsUpgrade: true,
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF document to compress.' });
    }

    const level = req.body.level || 'ebook';
    const result = await PdfService.compressPdf(req.file.buffer, level);

    db.incrementPdfOps(user.id);
    db.addHistory({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      toolName: 'Compress PDF',
      fileName: req.file.originalname,
      fileSize: result.compressedSize,
      resultSummary: `Compressed by ${result.percentSaved}% (Saved ${( (result.originalSize - result.compressedSize) / 1024).toFixed(1)} KB)`,
      timestamp: new Date().toISOString(),
      downloadName: `compressed_${req.file.originalname}`,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="compressed_${req.file.originalname}"`);
    res.setHeader('X-Original-Size', result.originalSize.toString());
    res.setHeader('X-Compressed-Size', result.compressedSize.toString());
    res.setHeader('X-Percent-Saved', result.percentSaved.toString());
    return res.send(result.buffer);
  } catch (err: any) {
    console.error('Compress error:', err);
    return res.status(500).json({ error: err.message || 'Failed to compress PDF.' });
  }
});

// Protect PDF
apiRouter.post('/pdf/protect', authenticateUser, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.getUserById(req.user!.id)!;
    if (!checkPdfQuota(user)) {
      return res.status(403).json({
        error: `Free plan limit reached (${db.getSettings().freePdfOpsLimit} PDF operations). Upgrade to Pro for unlimited operations!`,
        needsUpgrade: true,
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF document to protect.' });
    }

    const password = req.body.password;
    if (!password || password.length < 3) {
      return res.status(400).json({ error: 'Password must be at least 3 characters long.' });
    }

    const protectedBuffer = await PdfService.protectPdf(req.file.buffer, password);

    db.incrementPdfOps(user.id);
    db.addHistory({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      toolName: 'Protect PDF',
      fileName: req.file.originalname,
      fileSize: protectedBuffer.length,
      resultSummary: 'Encrypted with 128-bit AES/Standard security',
      timestamp: new Date().toISOString(),
      downloadName: `protected_${req.file.originalname}`,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="protected_${req.file.originalname}"`);
    return res.send(protectedBuffer);
  } catch (err: any) {
    console.error('Protect error:', err);
    return res.status(500).json({ error: err.message || 'Failed to encrypt PDF.' });
  }
});

// Add Watermark
apiRouter.post('/pdf/watermark', authenticateUser, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.getUserById(req.user!.id)!;
    if (!checkPdfQuota(user)) {
      return res.status(403).json({
        error: `Free plan limit reached (${db.getSettings().freePdfOpsLimit} PDF operations). Upgrade to Pro for unlimited operations!`,
        needsUpgrade: true,
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF document.' });
    }

    const {
      text = 'CONFIDENTIAL',
      fontSize = '40',
      opacity = '0.3',
      rotation = '45',
      color = 'gray',
    } = req.body;

    const watermarked = await PdfService.addWatermark(req.file.buffer, {
      text,
      fontSize: Number(fontSize) || 40,
      opacity: Number(opacity) || 0.3,
      rotation: Number(rotation) || 45,
      color: color as any,
    });

    db.incrementPdfOps(user.id);
    db.addHistory({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      toolName: 'Add Watermark',
      fileName: req.file.originalname,
      fileSize: watermarked.length,
      resultSummary: `Watermarked with text "${text}"`,
      timestamp: new Date().toISOString(),
      downloadName: `watermarked_${req.file.originalname}`,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="watermarked_${req.file.originalname}"`);
    return res.send(watermarked);
  } catch (err: any) {
    console.error('Watermark error:', err);
    return res.status(500).json({ error: err.message || 'Failed to watermark PDF.' });
  }
});

// Image to PDF
apiRouter.post('/pdf/image-to-pdf', authenticateUser, upload.array('images'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.getUserById(req.user!.id)!;
    if (!checkPdfQuota(user)) {
      return res.status(403).json({
        error: `Free plan limit reached (${db.getSettings().freePdfOpsLimit} PDF operations). Upgrade to Pro for unlimited operations!`,
        needsUpgrade: true,
      });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Please upload at least one image.' });
    }

    const imageObjects = files.map((f) => ({
      buffer: f.buffer,
      mimeType: f.mimetype,
      name: f.originalname,
    }));

    const pdfBuffer = await PdfService.imagesToPdf(imageObjects);

    db.incrementPdfOps(user.id);
    db.addHistory({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      toolName: 'Image to PDF',
      fileName: `${files.length}_images.pdf`,
      fileSize: pdfBuffer.length,
      resultSummary: `Converted ${files.length} images into single PDF`,
      timestamp: new Date().toISOString(),
      downloadName: `images_converted_${Date.now()}.pdf`,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="converted_images.pdf"');
    return res.send(pdfBuffer);
  } catch (err: any) {
    console.error('Image to PDF error:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert images to PDF.' });
  }
});

// Extract text for AI analysis or client preview
apiRouter.post('/pdf/extract-text', authenticateUser, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a PDF document.' });
    }

    const { text, numPages, info } = await PdfService.extractPdfText(req.file.buffer);
    return res.json({
      text,
      numPages,
      info,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to extract text from PDF.' });
  }
});

// ==========================================
// 4. AI INTELLIGENCE FEATURES
// ==========================================

// AI Summarizer
apiRouter.post('/ai/summarize', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.getUserById(req.user!.id)!;
    if (!checkAiQuota(user)) {
      return res.status(403).json({
        error: `Free plan limit reached (${db.getSettings().freeAiQueriesLimit} AI queries). Upgrade to Pro for unlimited AI intelligence!`,
        needsUpgrade: true,
      });
    }

    const { text, fileName = 'Document' } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Document content is empty or unreadable.' });
    }

    const summary = await AiService.summarizePdf(text, fileName);

    db.incrementAiQueries(user.id);
    db.addHistory({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      toolName: 'AI PDF Summarizer',
      fileName,
      fileSize: text.length,
      resultSummary: 'AI Executive summary generated with key findings and next steps',
      timestamp: new Date().toISOString(),
    });

    return res.json({ summary });
  } catch (err: any) {
    console.error('AI Summarizer error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate summary.' });
  }
});

// Chat with PDF
apiRouter.post('/ai/chat', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.getUserById(req.user!.id)!;
    if (!checkAiQuota(user)) {
      return res.status(403).json({
        error: `Free plan limit reached (${db.getSettings().freeAiQueriesLimit} AI queries). Upgrade to Pro for unlimited AI intelligence!`,
        needsUpgrade: true,
      });
    }

    const { text, fileName = 'Document', message, history = [] } = req.body;
    if (!text || !message) {
      return res.status(400).json({ error: 'Document text and user question are required.' });
    }

    const reply = await AiService.chatWithPdf(text, fileName, message, history);

    db.incrementAiQueries(user.id);
    return res.json({ reply });
  } catch (err: any) {
    console.error('AI Chat error:', err);
    return res.status(500).json({ error: err.message || 'Failed to process chat query.' });
  }
});

// Extract Key Points
apiRouter.post('/ai/key-points', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.getUserById(req.user!.id)!;
    if (!checkAiQuota(user)) {
      return res.status(403).json({
        error: `Free plan limit reached (${db.getSettings().freeAiQueriesLimit} AI queries). Upgrade to Pro for unlimited AI intelligence!`,
        needsUpgrade: true,
      });
    }

    const { text, fileName = 'Document' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Document text is required.' });
    }

    const keyPoints = await AiService.extractKeyPoints(text, fileName);

    db.incrementAiQueries(user.id);
    db.addHistory({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      toolName: 'Extract Key Points',
      fileName,
      fileSize: text.length,
      resultSummary: 'Extracted key takeaways, metrics, and obligations',
      timestamp: new Date().toISOString(),
    });

    return res.json({ keyPoints });
  } catch (err: any) {
    console.error('Key Points error:', err);
    return res.status(500).json({ error: err.message || 'Failed to extract key points.' });
  }
});

// PDF Q&A
apiRouter.post('/ai/qa', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.getUserById(req.user!.id)!;
    if (!checkAiQuota(user)) {
      return res.status(403).json({
        error: `Free plan limit reached (${db.getSettings().freeAiQueriesLimit} AI queries). Upgrade to Pro for unlimited AI intelligence!`,
        needsUpgrade: true,
      });
    }

    const { text, fileName = 'Document', question } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Document text is required.' });
    }

    const qaResult = await AiService.generateQAndA(text, fileName, question);

    db.incrementAiQueries(user.id);
    db.addHistory({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      toolName: 'AI PDF Q&A',
      fileName,
      fileSize: text.length,
      resultSummary: question ? `Answered: "${question.slice(0, 40)}..."` : 'Generated Top 5 document Q&A',
      timestamp: new Date().toISOString(),
    });

    return res.json({ qa: qaResult });
  } catch (err: any) {
    console.error('Q&A error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate Q&A.' });
  }
});

// ==========================================
// 5. USER HISTORY & PRO UPGRADE
// ==========================================

apiRouter.get('/user/history', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const history = db.getUserHistory(req.user!.id);
  return res.json({ history });
});

apiRouter.post('/user/upgrade', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = db.getUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { paymentMethod = 'UPI', transactionRef } = req.body;
    const settings = db.getSettings();
    const amount = settings.proPriceInr || 109;

    const ref = transactionRef || `TXN_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Verify & activate Pro access
    const updated = db.updateUser(user.id, { plan: 'pro' });

    const txn: DbTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: user.id,
      userEmail: user.email,
      amount,
      currency: 'INR',
      status: 'completed',
      paymentMethod,
      transactionRef: ref,
      timestamp: new Date().toISOString(),
    };
    db.addTransaction(txn);

    return res.json({
      success: true,
      user: sanitizeUser(updated!),
      transaction: txn,
      message: `🎉 Pro Plan Activated! Thank you for your payment of ₹${amount}. Unlimited PDF and AI features are now unlocked.`,
    });
  } catch (err: any) {
    console.error('Upgrade error:', err);
    return res.status(500).json({ error: 'Failed to process upgrade.' });
  }
});

// ==========================================
// 6. ADMIN DASHBOARD & CONTROLS
// ==========================================

apiRouter.get('/admin/stats', authenticateUser, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers();
  const txns = db.getTransactions();

  const totalUsers = users.length;
  const proUsers = users.filter((u) => u.plan === 'pro').length;
  const freeUsers = users.filter((u) => u.plan === 'free').length;
  const totalPdfOps = users.reduce((acc, u) => acc + (u.pdfOpsCount || 0), 0);
  const totalAiQueries = users.reduce((acc, u) => acc + (u.aiQueriesCount || 0), 0);
  const totalRevenue = txns
    .filter((t) => t.status === 'completed')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  return res.json({
    totalUsers,
    proUsers,
    freeUsers,
    totalPdfOps,
    totalAiQueries,
    totalRevenue,
  });
});

apiRouter.get('/admin/users', authenticateUser, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers().map(sanitizeUser);
  return res.json({ users });
});

apiRouter.post('/admin/toggle-pro', authenticateUser, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { userId, plan } = req.body;
  if (!userId || !['free', 'pro'].includes(plan)) {
    return res.status(400).json({ error: 'Valid userId and plan (free or pro) required.' });
  }
  const updated = db.updateUser(userId, { plan });
  if (!updated) return res.status(404).json({ error: 'User not found.' });
  return res.json({ user: sanitizeUser(updated), message: `User plan updated to ${plan}.` });
});

apiRouter.post('/admin/reset-quota', authenticateUser, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required.' });
  const updated = db.updateUser(userId, { pdfOpsCount: 0, aiQueriesCount: 0 });
  if (!updated) return res.status(404).json({ error: 'User not found.' });
  return res.json({ user: sanitizeUser(updated), message: 'Usage quotas reset successfully.' });
});

apiRouter.delete('/admin/user/:id', authenticateUser, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  if (id === req.user!.id) {
    return res.status(400).json({ error: 'Cannot delete your own administrator account.' });
  }
  const deleted = db.deleteUser(id);
  if (!deleted) return res.status(404).json({ error: 'User not found.' });
  return res.json({ success: true, message: 'User deleted.' });
});

apiRouter.post('/admin/user-status', authenticateUser, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { userId, status } = req.body;
  if (!userId || !['active', 'suspended', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Valid userId and status (active, suspended, pending) required.' });
  }
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.role === 'admin' && status !== 'active') {
    return res.status(400).json({ error: 'Cannot deactivate an administrator account.' });
  }
  const updated = db.updateUser(userId, { status });
  return res.json({ user: sanitizeUser(updated!), message: `User status changed to ${status}.` });
});

apiRouter.post('/admin/approve-user', authenticateUser, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { userId, plan } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required.' });
  const updates: Partial<DbUser> = { status: 'active' };
  if (plan === 'pro') updates.plan = 'pro';
  const updated = db.updateUser(userId, updates);
  if (!updated) return res.status(404).json({ error: 'User not found.' });
  return res.json({ user: sanitizeUser(updated), message: `User approved and activated.` });
});

apiRouter.post('/admin/reject-user', authenticateUser, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required.' });
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.role === 'admin') {
    return res.status(400).json({ error: 'Cannot reject an administrator.' });
  }
  const updated = db.updateUser(userId, { status: 'suspended' });
  return res.json({ user: sanitizeUser(updated!), message: 'User registration/access rejected.' });
});

apiRouter.get('/admin/transactions', authenticateUser, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const transactions = db.getTransactions();
  return res.json({ transactions });
});

apiRouter.get('/admin/settings', (req, res) => {
  return res.json({ settings: db.getSettings() });
});

apiRouter.post('/admin/settings', authenticateUser, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { freePdfOpsLimit, freeAiQueriesLimit, proPriceInr, announcement, allowNewRegistrations, requireApproval } = req.body;
  const updated = db.updateSettings({
    ...(freePdfOpsLimit !== undefined && { freePdfOpsLimit: Number(freePdfOpsLimit) }),
    ...(freeAiQueriesLimit !== undefined && { freeAiQueriesLimit: Number(freeAiQueriesLimit) }),
    ...(proPriceInr !== undefined && { proPriceInr: Number(proPriceInr) }),
    ...(announcement !== undefined && { announcement }),
    ...(allowNewRegistrations !== undefined && { allowNewRegistrations: Boolean(allowNewRegistrations) }),
    ...(requireApproval !== undefined && { requireApproval: Boolean(requireApproval) }),
  });
  return res.json({ settings: updated, message: 'Settings saved successfully.' });
});

// Database & MySQL Management Endpoints
apiRouter.get('/database/schema-sql', (req, res) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf-8');
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', 'attachment; filename="purepdf_schema.sql"');
      return res.send(sqlContent);
    }
    return res.status(404).json({ error: 'schema.sql file not found' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/database-info', authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'schema.sql');
    const sqlContent = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, 'utf-8') : '';

    return res.json({
      database: {
        engine: 'MySQL (Hostinger / cPanel)',
        host: process.env.DB_HOST || 'localhost',
        dbName: 'u553556584_purepdf',
        dbUser: 'u553556584_Rashidpdf',
        website: 'purepdf.store',
        connected: db.mysqlConnected,
        statusMessage: db.mysqlStatusMessage,
      },
      sqlScript: sqlContent,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/admin/test-mysql', authenticateUser, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.initMySQL();
    return res.json({
      connected: db.mysqlConnected,
      statusMessage: db.mysqlStatusMessage,
      dbName: 'u553556584_purepdf',
      dbUser: 'u553556584_Rashidpdf',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. HOSTINGER / PUBLIC_HTML DOWNLOAD ENDPOINTS
// ==========================================

// Download hostinger public_html package
apiRouter.get('/download/public-html-zip', (req, res) => {
  const zipPath = path.resolve(process.cwd(), 'public_html.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="public_html.zip"');
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(zipPath);
  }
  return res.status(404).json({ error: 'public_html.zip not generated yet' });
});

// Download full-stack project zip
apiRouter.get('/download/fullstack-zip', (req, res) => {
  const zipPath = path.resolve(process.cwd(), 'purepdf_fullstack_project.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="purepdf_fullstack_project.zip"');
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(zipPath);
  }
  return res.status(404).json({ error: 'purepdf_fullstack_project.zip not generated yet' });
});

// List of public_html files with sizes
apiRouter.get('/download/public-files-list', (req, res) => {
  try {
    const buildDir = path.resolve(process.cwd(), 'public_html_build');
    const files: Array<{ name: string; path: string; size: number; isDir: boolean }> = [];

    if (fs.existsSync(buildDir)) {
      const scanDir = (dir: string, relativePrefix = '') => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const relPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath, relPath);
          } else {
            const stat = fs.statSync(fullPath);
            files.push({
              name: entry.name,
              path: relPath,
              size: stat.size,
              isDir: false,
            });
          }
        }
      };
      scanDir(buildDir);
    }

    return res.json({
      files,
      zipSize: fs.existsSync(path.resolve(process.cwd(), 'public_html.zip'))
        ? fs.statSync(path.resolve(process.cwd(), 'public_html.zip')).size
        : 0,
      fullstackSize: fs.existsSync(path.resolve(process.cwd(), 'purepdf_fullstack_project.zip'))
        ? fs.statSync(path.resolve(process.cwd(), 'purepdf_fullstack_project.zip')).size
        : 0,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Download individual public_html file (e.g. index.html, .htaccess, schema.sql, or assets)
apiRouter.get('/download/file/*', (req, res) => {
  try {
    const relPath = (req.params as any)[0];
    if (!relPath) return res.status(400).json({ error: 'File path required' });

    // Prevent path traversal
    const safeRel = path.normalize(relPath).replace(/^(\.\.[\/\\])+/, '');
    const buildDir = path.resolve(process.cwd(), 'public_html_build');
    const targetPath = path.join(buildDir, safeRel);

    if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
      return res.status(404).json({ error: `File ${safeRel} not found` });
    }

    const filename = path.basename(targetPath);
    let contentType = 'text/plain';
    if (filename.endsWith('.html')) contentType = 'text/html';
    else if (filename.endsWith('.css')) contentType = 'text/css';
    else if (filename.endsWith('.js')) contentType = 'application/javascript';
    else if (filename.endsWith('.sql')) contentType = 'application/sql';
    else if (filename.endsWith('.json')) contentType = 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(targetPath);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get raw text content of config/schema files to display/copy in UI
apiRouter.get('/download/content/:fileKey', (req, res) => {
  try {
    const key = req.params.fileKey;
    const allowedMap: Record<string, string> = {
      htaccess: path.resolve(process.cwd(), 'public_html_build/.htaccess'),
      indexHtml: path.resolve(process.cwd(), 'public_html_build/index.html'),
      readme: path.resolve(process.cwd(), 'public_html_build/README_HOSTINGER.txt'),
      schema: path.resolve(process.cwd(), 'schema.sql'),
    };

    const target = allowedMap[key];
    if (!target || !fs.existsSync(target)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = fs.readFileSync(target, 'utf-8');
    return res.json({ content });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});



