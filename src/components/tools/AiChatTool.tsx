import React, { useState, useRef, useEffect } from 'react';
import { Upload, Bot, Send, User, Sparkles, RefreshCw, FileText, CornerDownLeft, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, formatBytes } from '../../utils/api';
import { ChatMessage } from '../../types';

export const AiChatTool: React.FC = () => {
  const { user, isPro, remainingAiQueries, openAuthModal, openUpgradeModal, refreshUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setMessages([]);
      setError(null);
      setIsExtracting(true);

      try {
        const res = await api.extractText(selected);
        setExtractedText(res.text);

        // Add welcoming bot prompt
        setMessages([
          {
            id: 'init',
            role: 'assistant',
            content: `Hello! I've loaded and analyzed "${selected.name}". You can ask me any question about clauses, numbers, key takeaways, or specific sections in this document.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } catch (err: any) {
        setError(err.message || 'Failed to extract text from PDF.');
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;
    if (!extractedText) {
      setError('Please upload a PDF document first.');
      return;
    }
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!isPro && remainingAiQueries <= 0) {
      openUpgradeModal();
      return;
    }

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsSending(true);
    setError(null);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.chat(extractedText, file?.name || 'Document', userMsg.content, chatHistory);

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      await refreshUser();
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to process AI chat query.');
    } finally {
      setIsSending(false);
    }
  };

  const starterQuestions = [
    'What is the core purpose of this document?',
    'Summarize any financial figures, dates, or metrics.',
    'What are the key obligations or risks mentioned?',
    'List the primary conclusions and recommendations.',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Chat with PDF</h2>
            <p className="text-xs text-slate-400">
              Interactive conversational intelligence grounded directly in your document
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          AI Queries:{' '}
          <span className="font-semibold text-white">
            {isPro ? 'Unlimited (Pro)' : `${remainingAiQueries} queries left`}
          </span>
        </div>
      </div>

      {!file && (
        <div className="p-8 rounded-3xl bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 transition-colors text-center relative group">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 text-slate-400 flex items-center justify-center mb-3 transition-colors">
              <Upload className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">
              Upload PDF document to start chatting
            </p>
            <p className="text-xs text-slate-400">
              Chat, question clauses, extract data, and find citations instantly
            </p>
          </div>
        </div>
      )}

      {file && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-xs font-bold text-white block">{file.name}</span>
              <span className="text-[10px] text-slate-400">
                {formatBytes(file.size)} • {extractedText.split(/\s+/).length} words parsed
              </span>
            </div>
          </div>
          <label className="cursor-pointer text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline">
            Change PDF
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Chat Thread Container */}
      {file && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col h-[520px]">
          {/* Messages scroll area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                      : 'bg-slate-950 text-slate-200 border border-slate-800/80 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                  <span
                    className={`block text-[10px] mt-1.5 ${
                      msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Analyzing document with Gemini 3.8 Flash...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Starter Questions */}
          {messages.length <= 2 && (
            <div className="px-5 py-2.5 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Suggestions:
              </span>
              {starterQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isSending}
                  onClick={() => handleSendMessage(q)}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-4 bg-slate-950 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask anything about this document..."
                disabled={isSending || isExtracting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isSending || !inputQuery.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white disabled:opacity-40 transition-all shadow-md shadow-cyan-600/20"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
