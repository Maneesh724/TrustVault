import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Sparkles,
  Send,
  ShieldAlert,
  Bot,
  User as UserIcon,
  AlertTriangle,
  Lock,
  FileText,
  Key,
  Clock,
  RefreshCw,
  Terminal,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  configured?: boolean;
  missingKey?: string;
  model?: string;
}

export const AiAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [apiUnconfiguredInfo, setApiUnconfiguredInfo] = useState<{ configured: boolean; missingKey?: string } | null>(null);

  if (!user) return null;

  // Suggested prompt chips tailored to current user role
  const suggestedPrompts =
    user.role === 'ADMIN'
      ? [
          'Summarize recent security violations or blocked access attempts.',
          'Which accounts are currently pending review or approval?',
          'What is the distribution of documents and storage utilization?',
          'Audit recent administrative privilege changes or token requests.',
        ]
      : [
          'What documents do I currently own and what are their active permissions?',
          'Have any unauthorized viewers attempted to access my documents?',
          'Summarize the access audit history for my shared files.',
          'Which documents have expiration dates approaching?',
        ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsgId = `msg-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to query AI Security Assistant');
      }

      if (data.configured === false) {
        setApiUnconfiguredInfo(data);
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.message || 'AI Security Assistant requires a configured API key in server environment variables.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          configured: false,
          missingKey: data.missingKey,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.response || 'No analysis available.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          configured: true,
          model: data.model,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      showToast('Assistant Error', err.message, 'error');
      const errorReply: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: `Error connecting to AI service: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Role-Scoped Zero-Trust Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Security Assistant</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time security analytics, permission evaluation, and threat posture intelligence scoped strictly to your credentials.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>
            Scope: <strong className="text-slate-900">{user.role === 'ADMIN' ? 'System-Wide Platform' : 'Personal Documents & Shares'}</strong>
          </span>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[580px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {/* Welcome Intro Card */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3.5 max-w-2xl">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div className="text-xs text-slate-700 space-y-1.5">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span>TrustVault Security Engine</span>
                <span className="px-2 py-0.5 text-[10px] rounded bg-blue-100 text-blue-700 font-semibold uppercase">
                  Active Guard
                </span>
              </div>
              <p className="leading-relaxed">
                Hello <strong>{user.name}</strong>. I am your automated Zero-Trust Security Assistant. I synthesize real-time
                database records, permission policies, and cryptographic audit trails to answer security questions without exposing
                unauthorized data.
              </p>
            </div>
          </div>

          {/* Rendered Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-sm'
                }`}
              >
                {/* Assistant missing key notice */}
                {msg.sender === 'assistant' && msg.configured === false ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>AI Engine In Standby (Missing Server API Key)</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{msg.text}</p>
                    <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Required Server Configuration:</span>
                      </div>
                      <div className="text-emerald-400">
                        {msg.missingKey || 'GEMINI_API_KEY'}=&lt;your_real_api_key&gt;
                      </div>
                      <div className="text-[11px] text-slate-400 pt-1">
                        Add this variable to <code className="text-cyan-300">backend/.env</code> and restart the Django backend to enable live model inference.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}

                <div
                  className={`text-[10px] mt-1.5 font-mono ${
                    msg.sender === 'user' ? 'text-blue-100 text-right' : 'text-slate-400 flex items-center justify-between'
                  }`}
                >
                  {msg.sender === 'assistant' && msg.model && (
                    <span className="text-slate-400">Model: {msg.model}</span>
                  )}
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5 text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 shadow-sm flex items-center gap-2">
                <span>Evaluating zero-trust authorization context & querying AI model...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Prompt Chips */}
        {messages.length === 0 && (
          <div className="p-4 bg-white border-t border-slate-100">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Recommended Inquiries for {user.role === 'ADMIN' ? 'Administrator' : 'Document Owner'}:
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200 text-slate-700 transition-colors text-left"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Ask the AI assistant about your ${user.role === 'ADMIN' ? 'system security, users, and logs' : 'documents, shares, and audit records'}...`}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Ask</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>Only real database records scoped to your role are provided as context.</span>
            <span className="font-mono">Zero-Trust Anti-Hallucination Policy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
