import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';

const execAsync = util.promisify(exec);

export class PdfService {
  /**
   * Merge multiple PDF buffers into a single PDF
   */
  static async mergePdfs(pdfBuffers: Buffer[]): Promise<Buffer> {
    if (!pdfBuffers || pdfBuffers.length < 2) {
      throw new Error('At least two PDF files are required for merging.');
    }

    const mergedDoc = await PDFDocument.create();

    for (const buf of pdfBuffers) {
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      for (const page of copiedPages) {
        mergedDoc.addPage(page);
      }
    }

    const mergedBytes = await mergedDoc.save();
    return Buffer.from(mergedBytes);
  }

  /**
   * Split PDF by extracting specified page numbers (1-indexed)
   * e.g., pages: [1, 2, 5]
   */
  static async splitPdf(pdfBuffer: Buffer, pageNumbers: number[]): Promise<{ buffer: Buffer; totalOriginalPages: number; extractedCount: number }> {
    const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    // Sanitize and filter page numbers
    const validIndices: number[] = [];
    for (const pageNum of pageNumbers) {
      const idx = pageNum - 1;
      if (idx >= 0 && idx < totalPages && !validIndices.includes(idx)) {
        validIndices.push(idx);
      }
    }

    if (validIndices.length === 0) {
      throw new Error(`No valid pages selected. The document contains ${totalPages} page(s).`);
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, validIndices);
    for (const page of copiedPages) {
      newDoc.addPage(page);
    }

    const splitBytes = await newDoc.save();
    return {
      buffer: Buffer.from(splitBytes),
      totalOriginalPages: totalPages,
      extractedCount: validIndices.length,
    };
  }

  /**
   * Compress PDF using Ghostscript or stream optimization
   */
  static async compressPdf(
    pdfBuffer: Buffer,
    level: 'screen' | 'ebook' | 'printer' = 'ebook'
  ): Promise<{ buffer: Buffer; originalSize: number; compressedSize: number; percentSaved: number }> {
    const originalSize = pdfBuffer.length;
    const tempId = `comp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `${tempId}_in.pdf`);
    const outputPath = path.join(tempDir, `${tempId}_out.pdf`);

    try {
      await fs.promises.writeFile(inputPath, pdfBuffer);

      const gsSetting = level === 'screen' ? '/screen' : level === 'printer' ? '/printer' : '/ebook';
      const cmd = `gs -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${gsSetting} -sOutputFile="${outputPath}" "${inputPath}"`;

      await execAsync(cmd, { timeout: 30000 });

      if (fs.existsSync(outputPath)) {
        const compressedBuffer = await fs.promises.readFile(outputPath);
        const compressedSize = compressedBuffer.length;
        const percentSaved = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

        // If Ghostscript produced an output (even if slightly larger on already compressed docs, pick the smaller one)
        if (compressedSize < originalSize) {
          return {
            buffer: compressedBuffer,
            originalSize,
            compressedSize,
            percentSaved,
          };
        }
      }

      // Fallback: use pdf-lib stream minimization and object re-indexing
      const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const savedBytes = await doc.save({ useObjectStreams: true });
      const compBuf = Buffer.from(savedBytes);
      const compressedSize = compBuf.length;
      const percentSaved = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

      return {
        buffer: compBuf.length < originalSize ? compBuf : pdfBuffer,
        originalSize,
        compressedSize: Math.min(compressedSize, originalSize),
        percentSaved: compBuf.length < originalSize ? percentSaved : 0,
      };
    } catch (err) {
      console.warn('Ghostscript compression fallback to pdf-lib:', err);
      const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const savedBytes = await doc.save({ useObjectStreams: true });
      const compBuf = Buffer.from(savedBytes);
      return {
        buffer: compBuf,
        originalSize,
        compressedSize: compBuf.length,
        percentSaved: Math.max(0, Math.round(((originalSize - compBuf.length) / originalSize) * 100)),
      };
    } finally {
      try {
        if (fs.existsSync(inputPath)) await fs.promises.unlink(inputPath);
        if (fs.existsSync(outputPath)) await fs.promises.unlink(outputPath);
      } catch (e) {
        // cleanup ignore
      }
    }
  }

  /**
   * Password protect PDF with encryption
   */
  static async protectPdf(
    pdfBuffer: Buffer,
    userPassword: string,
    ownerPassword?: string
  ): Promise<Buffer> {
    if (!userPassword || userPassword.trim().length < 3) {
      throw new Error('Password must be at least 3 characters long.');
    }

    const oPass = ownerPassword || `${userPassword}_admin_${Date.now()}`;
    const tempId = `prot_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `${tempId}_in.pdf`);
    const outputPath = path.join(tempDir, `${tempId}_out.pdf`);

    try {
      await fs.promises.writeFile(inputPath, pdfBuffer);

      // Sanitize passwords for shell
      const safeUserPass = userPassword.replace(/"/g, '\\"');
      const safeOwnerPass = oPass.replace(/"/g, '\\"');

      const cmd = `gs -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sOwnerPassword="${safeOwnerPass}" -sUserPassword="${safeUserPass}" -dEncryptionR=3 -dKeyLength=128 -sOutputFile="${outputPath}" "${inputPath}"`;

      await execAsync(cmd, { timeout: 20000 });

      if (fs.existsSync(outputPath)) {
        const protectedBuffer = await fs.promises.readFile(outputPath);
        return protectedBuffer;
      }
      throw new Error('Failed to generate encrypted PDF document.');
    } finally {
      try {
        if (fs.existsSync(inputPath)) await fs.promises.unlink(inputPath);
        if (fs.existsSync(outputPath)) await fs.promises.unlink(outputPath);
      } catch (e) {
        // cleanup ignore
      }
    }
  }

  /**
   * Add text watermark to all pages of PDF
   */
  static async addWatermark(
    pdfBuffer: Buffer,
    options: {
      text: string;
      fontSize?: number;
      opacity?: number;
      rotation?: number;
      color?: 'gray' | 'red' | 'blue' | 'black';
    }
  ): Promise<Buffer> {
    const {
      text,
      fontSize = 48,
      opacity = 0.25,
      rotation = 45,
      color = 'gray',
    } = options;

    if (!text || !text.trim()) {
      throw new Error('Watermark text cannot be empty.');
    }

    const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const pages = doc.getPages();

    let colorObj = rgb(0.5, 0.5, 0.5);
    if (color === 'red') colorObj = rgb(0.85, 0.2, 0.2);
    else if (color === 'blue') colorObj = rgb(0.2, 0.35, 0.85);
    else if (color === 'black') colorObj = rgb(0.1, 0.1, 0.1);

    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      // Centered calculation with rotation
      const x = width / 2 - (textWidth / 2) * Math.cos((rotation * Math.PI) / 180);
      const y = height / 2 - (textHeight / 2) * Math.sin((rotation * Math.PI) / 180);

      page.drawText(text, {
        x: Math.max(20, Math.min(width - 50, x)),
        y: Math.max(20, Math.min(height - 50, y)),
        size: fontSize,
        font,
        color: colorObj,
        opacity: Math.max(0.05, Math.min(1, opacity)),
        rotate: degrees(rotation),
      });
    }

    const watermarkedBytes = await doc.save();
    return Buffer.from(watermarkedBytes);
  }

  /**
   * Convert image buffers (PNG/JPEG) into a unified PDF
   */
  static async imagesToPdf(
    images: { buffer: Buffer; mimeType: string; name: string }[]
  ): Promise<Buffer> {
    if (!images || images.length === 0) {
      throw new Error('At least one image is required to build a PDF.');
    }

    const pdfDoc = await PDFDocument.create();

    for (const img of images) {
      let embeddedImage;
      if (img.mimeType === 'image/png' || img.name.toLowerCase().endsWith('.png')) {
        embeddedImage = await pdfDoc.embedPng(img.buffer);
      } else {
        // default JPEG
        embeddedImage = await pdfDoc.embedJpg(img.buffer);
      }

      const { width, height } = embeddedImage;
      // Add page sized precisely to image dimensions
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width,
        height,
      });
    }

    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
  }

  /**
   * Extract text and metadata from PDF for AI processing
   */
  static async extractPdfText(pdfBuffer: Buffer): Promise<{ text: string; numPages: number; info: any }> {
    try {
      const parser = new PDFParse({ data: pdfBuffer });
      const textResult = await parser.getText();
      let infoResult = {};
      try {
        infoResult = await parser.getInfo();
      } catch (e) {
        // ignore info failure
      }
      return {
        text: textResult.text || '',
        numPages: textResult.total || 1,
        info: infoResult,
      };
    } catch (err: any) {
      throw new Error(`Failed to extract text from PDF: ${err.message || 'Corrupted or password-locked file'}`);
    }
  }
}
