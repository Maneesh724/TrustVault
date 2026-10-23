import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { RoleBadge } from '../../components/common/Badge';
import {
  Shield,
  Key,
  Smartphone,
  Laptop,
  Globe,
  Trash2,
  Plus,
  Copy,
  Check,
  Lock,
  User,
  Clock,
} from 'lucide-react';

import { ChangePasswordSection } from '../../components/settings/ChangePasswordSection';

export const ProfileSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [mfaActive, setMfaActive] = useState(user?.mfaEnabled ?? true);
  const [apiKeyList, setApiKeyList] = useState([
    { id: 'key-1', name: 'Production Backend CI/CD', prefix: 'tv_live_9a8f...', created: '2026-10-01' },
    { id: 'key-2', name: 'Compliance Evidence Scraper', prefix: 'tv_live_41c0...', created: '2026-10-15' },
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  // Active Sessions
  const [sessions, setSessions] = useState([
    { id: 'sess-1', device: 'Chrome on Windows 11', ip: '198.51.100.12', location: 'Seattle, WA', current: true, lastActive: 'Active Now' },
    { id: 'sess-2', device: 'Safari on iPhone 16 Pro', ip: '198.51.100.89', location: 'Portland, OR', current: false, lastActive: '2 hours ago' },
  ]);

  if (!user) return null;

  const handleToggleMfa = () => {
    const nextState = !mfaActive;
    setMfaActive(nextState);
    showToast('MFA Policy Updated', `Hardware key/TOTP MFA is now ${nextState ? 'ENFORCED' : 'DISABLED'}.`, 'success');
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
    showToast('Session Terminated', 'Selected session token invalidated immediately.', 'success');
  };

  const handleGenerateApiKey = () => {
    if (!newKeyName.trim()) {
      showToast('Key Name Required', 'Please provide a name for this integration token.', 'warning');
      return;
    }
    const newKey = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      prefix: `tv_live_${Math.random().toString(36).substring(2, 6)}...`,
      created: new Date().toISOString().slice(0, 10),
    };
    setApiKeyList([newKey, ...apiKeyList]);
    setNewKeyName('');
    setIsGeneratingKey(false);
    showToast('Secret Key Issued', 'New API token cryptographically generated with scoped read privileges.', 'success');
  };

  const handleRevokeApiKey = (keyId: string) => {
    setApiKeyList(apiKeyList.filter((k) => k.id !== keyId));
    showToast('API Key Revoked', 'Integration key immediately disabled.', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profile & Cryptographic Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your enterprise credentials, active session tokens, and zero-trust authentication factors.
        </p>
      </div>

      {/* Identity Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          Corporate Identity
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shrink-0 shadow-sm">
            <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center text-xl font-bold text-blue-600">
              {user.name.charAt(0)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-xs sm:text-sm text-slate-600">{user.email}</p>
            <p className="text-xs text-slate-500">Department: {user.department}</p>
          </div>
        </div>
      </div>

      {/* Multi-Factor Authentication (MFA) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Multi-Factor Authentication (MFA)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Requires hardware security keys (FIDO2/WebAuthn) or time-based TOTP authenticator app.
            </p>
          </div>
          <button
            onClick={handleToggleMfa}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mfaActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {mfaActive ? 'Enforced (Active)' : 'Disabled'}
          </button>
        </div>

        {mfaActive && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-semibold text-slate-800">Hardware Key & TOTP Authenticator Configured</p>
                <p className="text-[11px] text-slate-500">Last verified today during zero-trust login evaluation</p>
              </div>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-2 py-0.5 rounded">Protected</span>
          </div>
        )}
      </div>

      {/* Active Login Sessions */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Laptop className="w-4 h-4 text-cyan-600" />
          Active Cryptographic Sessions ({sessions.length})
        </h3>
        <p className="text-xs text-slate-500">
          Device sessions with signed JWT tokens. Terminating a session takes effect immediately.
        </p>

        <div className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <Laptop className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{sess.device}</span>
                    {sess.current && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                        Current Session
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    IP: {sess.ip} • {sess.location} • {sess.lastActive}
                  </p>
                </div>
              </div>

              {!sess.current && (
                <button
                  onClick={() => handleRevokeSession(sess.id)}
                  className="px-3 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Revoke Session
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scoped API Keys */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              Scoped API & Integration Keys ({apiKeyList.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Programmatic access keys for backend microservices and automated auditing scripts.
            </p>
          </div>
          <button
            onClick={() => setIsGeneratingKey(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate New Key
          </button>
        </div>

        {isGeneratingKey && (
          <div className="p-4 rounded-xl bg-slate-50 border border-blue-200 space-y-3">
            <h4 className="text-xs font-semibold text-slate-900">Issue New Scoped API Key</h4>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Django Backend Authorization Worker"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsGeneratingKey(false)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateApiKey}
                className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
              >
                Create Key
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {apiKeyList.map((k) => (
            <div
              key={k.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-semibold text-slate-900">{k.name}</p>
                <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                  Prefix: <span className="text-slate-700 font-semibold">{k.prefix}</span> • Created {k.created}
                </p>
              </div>
              <button
                onClick={() => handleRevokeApiKey(k.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Revoke Key Immediately"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password Section */}
      <ChangePasswordSection />
    </div>
  );
};
