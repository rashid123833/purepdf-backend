import React, { useState } from 'react';
import {
  Layers,
  Scissors,
  Minimize2,
  Lock,
  Stamp,
  Image as ImageIcon,
  Bot,
  ListChecks,
  HelpCircle,
  FileText,
  Sparkles,
  Search,
} from 'lucide-react';
import { ToolType } from '../types';
import { MergePdfTool } from './tools/MergePdfTool';
import { SplitPdfTool } from './tools/SplitPdfTool';
import { CompressPdfTool } from './tools/CompressPdfTool';
import { ProtectPdfTool } from './tools/ProtectPdfTool';
import { WatermarkPdfTool } from './tools/WatermarkPdfTool';
import { ImageToPdfTool } from './tools/ImageToPdfTool';
import { PdfToImageTool } from './tools/PdfToImageTool';
import { AiSummarizerTool } from './tools/AiSummarizerTool';
import { AiChatTool } from './tools/AiChatTool';
import { AiKeyPointsTool } from './tools/AiKeyPointsTool';
import { AiQATool } from './tools/AiQATool';

interface WorkspaceProps {
  initialTool?: ToolType;
}

interface ToolDefinition {
  id: ToolType;
  name: string;
  category: 'pdf' | 'ai';
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  badge?: string;
}

const TOOLS: ToolDefinition[] = [
  // PDF Tools
  {
    id: 'merge',
    name: 'Merge PDF',
    category: 'pdf',
    icon: Layers,
    tagline: 'Combine multiple PDFs into one document',
  },
  {
    id: 'split',
    name: 'Split PDF',
    category: 'pdf',
    icon: Scissors,
    tagline: 'Extract specific pages or page ranges',
  },
  {
    id: 'compress',
    name: 'Compress PDF',
    category: 'pdf',
    icon: Minimize2,
    tagline: 'Reduce file size while preserving quality',
    badge: 'Popular',
  },
  {
    id: 'protect',
    name: 'Protect PDF',
    category: 'pdf',
    icon: Lock,
    tagline: 'Encrypt with password and 128-bit security',
  },
  {
    id: 'watermark',
    name: 'Add Watermark',
    category: 'pdf',
    icon: Stamp,
    tagline: 'Stamp text watermarks across all pages',
  },
  {
    id: 'img-to-pdf',
    name: 'Image to PDF',
    category: 'pdf',
    icon: ImageIcon,
    tagline: 'Convert PNG/JPG photos into a PDF',
  },
  {
    id: 'pdf-to-img',
    name: 'PDF to Image',
    category: 'pdf',
    icon: ImageIcon,
    tagline: 'Extract all pages to high-res PNG/JPG images',
    badge: 'New',
  },

  // AI Features
  {
    id: 'ai-summarize',
    name: 'AI Summarizer',
    category: 'ai',
    icon: Bot,
    tagline: 'Executive summary & key findings via Gemini',
    badge: 'Gemini 3.8',
  },
  {
    id: 'ai-chat',
    name: 'Chat with PDF',
    category: 'ai',
    icon: Bot,
    tagline: 'Multi-turn conversation grounded in document',
    badge: 'Gemini 3.8',
  },
  {
    id: 'ai-keypoints',
    name: 'Extract Key Points',
    category: 'ai',
    icon: ListChecks,
    tagline: 'Distill essential metrics, pillars & takeaways',
    badge: 'Gemini 3.8',
  },
  {
    id: 'ai-qa',
    name: 'AI PDF Q&A',
    category: 'ai',
    icon: HelpCircle,
    tagline: 'Instant Q&A synthesis & question generation',
    badge: 'Gemini 3.8',
  },
];

export const Workspace: React.FC<WorkspaceProps> = ({ initialTool = 'merge' }) => {
  const [activeTool, setActiveTool] = useState<ToolType>(initialTool);
  const [filter, setFilter] = useState<'all' | 'pdf' | 'ai'>('all');
  const [search, setSearch] = useState('');

  // Update when initialTool changes from outside
  React.useEffect(() => {
    if (initialTool) setActiveTool(initialTool);
  }, [initialTool]);

  const filteredTools = TOOLS.filter((t) => {
    if (filter !== 'all' && t.category !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.tagline.toLowerCase().includes(q);
    }
    return true;
  });

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'merge':
        return <MergePdfTool />;
      case 'split':
        return <SplitPdfTool />;
      case 'compress':
        return <CompressPdfTool />;
      case 'protect':
        return <ProtectPdfTool />;
      case 'watermark':
        return <WatermarkPdfTool />;
      case 'img-to-pdf':
        return <ImageToPdfTool />;
      case 'pdf-to-img':
        return <PdfToImageTool />;
      case 'ai-summarize':
        return <AiSummarizerTool />;
      case 'ai-chat':
        return <AiChatTool />;
      case 'ai-keypoints':
        return <AiKeyPointsTool />;
      case 'ai-qa':
        return <AiQATool />;
      default:
        return <MergePdfTool />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Tool Selector Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 self-start">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Tools ({TOOLS.length})
            </button>
            <button
              onClick={() => setFilter('pdf')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filter === 'pdf'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              PDF Tools (7)
            </button>
            <button
              onClick={() => setFilter('ai')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filter === 'ai'
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              AI Intelligence (4)
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Scrollable Tool Pill Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filteredTools.map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            const isAi = t.category === 'ai';

            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold shrink-0 flex items-center gap-2 transition-all border ${
                  isActive
                    ? isAi
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                      : 'bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive
                      ? isAi
                        ? 'text-cyan-400'
                        : 'text-indigo-400'
                      : 'text-slate-400'
                  }`}
                />
                <span>{t.name}</span>
                {t.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      isAi
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Tool Screen */}
      <div>{renderActiveTool()}</div>
    </div>
  );
};
