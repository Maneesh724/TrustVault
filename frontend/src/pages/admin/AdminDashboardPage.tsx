import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { adminService } from '../../services/adminService';
import { User, UserRole } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  FileText,
  Users,
  Shield,
  Clock,
  Calendar,
  ChevronDown,
  Download,
  Upload,
  ShieldAlert,
  Trash2,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user, allUsers, refreshUsers } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Date range state
  const [dateRange, setDateRange] = useState('Apr 28, 2025 – May 4, 2025');
  const [isDateOpen, setIsDateOpen] = useState(false);

  // User action modal & dropdown
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('VIEWER');
  const [suspendingUser, setSuspendingUser] = useState<User | null>(null);
  const [isSuspendConfirmOpen, setIsSuspendConfirmOpen] = useState(false);

  // Active hover point for Document Activity Line Chart
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; upload: number; download: number; edit: number } | null>(null);

  // Exact data from reference screenshot
  const documentActivityData = [
    { day: 'Apr 28', upload: 16, download: 10, edit: 5 },
    { day: 'Apr 29', upload: 25, download: 15, edit: 8 },
    { day: 'Apr 30', upload: 24, download: 14, edit: 7 },
    { day: 'May 1', upload: 26, download: 15, edit: 8 },
    { day: 'May 2', upload: 29, download: 20, edit: 10 },
    { day: 'May 3', upload: 24, download: 14, edit: 7 },
    { day: 'May 4', upload: 26, download: 16, edit: 8 },
  ];

  const categoryData = [
    { name: 'Contracts', count: 32, color: '#1D68F2' },
    { name: 'HR', count: 28, color: '#10B981' },
    { name: 'Finance', count: 24, color: '#8B5CF6' },
    { name: 'Legal', count: 18, color: '#F59E0B' },
    { name: 'Design', count: 14, color: '#06B6D4' },
    { name: 'Other', count: 26, color: '#94A3B8' },
  ];

  const recentActivities = [
    {
      id: 'act-1',
      title: 'Document downloaded',
      user: 'Sarah Wilson',
      time: 'Apr 28, 2025, 4:32 PM',
      type: 'Download',
      color: 'blue',
      icon: Download,
    },
    {
      id: 'act-2',
      title: 'Permissions changed',
      user: 'Mike Johnson',
      time: 'Apr 28, 2025, 2:15 PM',
      type: 'Permissions',
      color: 'emerald',
      icon: Users,
    },
    {
      id: 'act-3',
      title: 'Document uploaded',
      user: 'Emily Davis',
      time: 'Apr 28, 2025, 11:03 AM',
      type: 'Upload',
      color: 'purple',
      icon: Upload,
    },
    {
      id: 'act-4',
      title: 'User deactivated',
      user: 'David Lee',
      time: 'Apr 27, 2025, 5:42 PM',
      type: 'Security',
      color: 'rose',
      icon: ShieldAlert,
    },
    {
      id: 'act-5',
      title: 'Document deleted',
      user: 'John Doe',
      time: 'Apr 27, 2025, 3:18 PM',
      type: 'Delete',
      color: 'rose',
      icon: Trash2,
    },
  ];

  // Users displayed in table (matching screenshot order & details)
  const displayUsers = allUsers.slice(0, 5);

  const handleOpenEditRole = (target: User) => {
    setEditingUser(target);
    setNewRole(target.role);
    setActiveMenuUserId(null);
  };

  const handleSaveRole = async () => {
    if (!editingUser || !user) return;
    try {
      await adminService.updateUserRole(editingUser.id, newRole, user);
      showToast('Role Updated', `Updated role to ${newRole} for ${editingUser.name}.`, 'success');
      setEditingUser(null);
      await refreshUsers();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handlePromptToggleStatus = (target: User) => {
    setSuspendingUser(target);
    setIsSuspendConfirmOpen(true);
    setActiveMenuUserId(null);
  };

  const handleConfirmToggleStatus = async () => {
    if (!suspendingUser || !user) return;
    try {
      const updated = await adminService.toggleUserStatus(suspendingUser.id, user);
      showToast(
        'Status Updated',
        `User ${updated.name} status is now ${updated.status}. Immediate zero-trust enforcement applied.`,
        'success'
      );
      setIsSuspendConfirmOpen(false);
      setSuspendingUser(null);
      await refreshUsers();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor system activity, manage users and ensure security.
          </p>
        </div>

        {/* Date Range Selector matching reference image */}
        <div className="relative self-start sm:self-auto">
          <button
            onClick={() => setIsDateOpen(!isDateOpen)}
            className="bg-white border border-slate-200/90 shadow-sm rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2.5"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDateOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-20 space-y-1 text-xs">
              {['Apr 28, 2025 – May 4, 2025', 'Last 7 Days', 'Last 30 Days', 'Year to Date'].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    setIsDateOpen(false);
                    showToast('Period Updated', `Telemetry filtered to ${range}`, 'info');
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                    dateRange === range ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{range}</span>
                  {dateRange === range && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4 Metric KPI Cards matching reference image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Documents */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">Total Documents</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900">142</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center">
                <ArrowUp className="w-3 h-3 stroke-[3]" /> +12%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">Active documents in the system</p>
          </div>
        </div>

        {/* Card 2: Total Users */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">Total Users</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900">18</span>
              <span className="text-xs font-semibold text-emerald-600">+2</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">Total registered users</p>
          </div>
        </div>

        {/* Card 3: Pending Access Requests */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">Pending Access Requests</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900">3</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center">
                <ArrowDown className="w-3 h-3 stroke-[3]" /> -25%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">Awaiting approval</p>
          </div>
        </div>

        {/* Card 4: Recent Activity */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">Recent Activity</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900">27</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center">
                <ArrowUp className="w-3 h-3 stroke-[3]" /> +8%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">in the last 7 days</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Charts & Table) + Right (Recent Activity Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left Column (spans 2) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Middle Row: Document Activity + Document Categories */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {/* Document Activity Chart (spans 3 cols) */}
            <div className="md:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Document Activity</h3>
                <div className="flex items-center gap-3 text-[11px] font-medium">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-[#1D68F2]" /> Uploads
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Downloads
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" /> Edits
                  </span>
                </div>
              </div>

              {/* Interactive SVG Chart matching reference */}
              <div className="relative h-56 w-full pt-2">
                <svg viewBox="0 0 450 180" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  {[0, 10, 20, 30, 40].map((val) => {
                    const y = 160 - (val / 40) * 140;
                    return (
                      <g key={val}>
                        <text x="12" y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-sans">
                          {val}
                        </text>
                        <line x1="25" y1={y} x2="440" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                      </g>
                    );
                  })}

                  {/* Uploads Line (Blue) */}
                  <path
                    d="M 40,104 C 80,72 130,75 165,74 C 200,72 230,68 265,60 C 300,52 330,75 365,74 C 400,72 420,68 430,66"
                    fill="none"
                    stroke="#1D68F2"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Downloads Line (Green) */}
                  <path
                    d="M 40,125 C 80,107 130,111 165,110 C 200,108 230,107 265,95 C 300,82 330,111 365,110 C 400,108 420,104 430,102"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Edits Line (Purple) */}
                  <path
                    d="M 40,142 C 80,135 130,138 165,137 C 200,135 230,135 265,130 C 300,123 330,138 365,137 C 400,135 420,133 430,132"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Interactive Points on lines */}
                  {documentActivityData.map((d, i) => {
                    const x = 40 + i * 65;
                    const yUpload = 160 - (d.upload / 40) * 140;
                    const yDownload = 160 - (d.download / 40) * 140;
                    const yEdit = 160 - (d.edit / 40) * 140;

                    return (
                      <g
                        key={d.day}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(d)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {/* Hover vertical rule */}
                        {hoveredPoint?.day === d.day && (
                          <line x1={x} y1={20} x2={x} y2={160} stroke="#94A3B8" strokeDasharray="3 3" strokeWidth="1" />
                        )}

                        {/* Blue dot */}
                        <circle cx={x} cy={yUpload} r="3.5" fill="#1D68F2" stroke="#FFFFFF" strokeWidth="1.5" />
                        {/* Green dot */}
                        <circle cx={x} cy={yDownload} r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                        {/* Purple dot */}
                        <circle cx={x} cy={yEdit} r="3.5" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="1.5" />

                        {/* X-axis labels */}
                        <text x={x} y="175" textAnchor="middle" className="text-[10px] fill-slate-500 font-sans">
                          {d.day}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Hover Tooltip */}
                {hoveredPoint && (
                  <div className="absolute top-2 right-4 bg-slate-900 text-white rounded-lg p-2 text-[10px] shadow-lg pointer-events-none animate-in fade-in">
                    <p className="font-bold">{hoveredPoint.day}</p>
                    <p className="text-blue-300">Uploads: {hoveredPoint.upload}</p>
                    <p className="text-emerald-300">Downloads: {hoveredPoint.download}</p>
                    <p className="text-purple-300">Edits: {hoveredPoint.edit}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Document Categories Donut Chart (spans 2 cols) */}
            <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Document Categories</h3>

              <div className="flex items-center justify-between gap-4 py-2">
                {/* Donut graphic matching reference */}
                <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* SVG Donut Segments */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1D68F2" strokeWidth="14" strokeDasharray="72 238" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10B981" strokeWidth="14" strokeDasharray="63 238" strokeDashoffset="-72" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8B5CF6" strokeWidth="14" strokeDasharray="54 238" strokeDashoffset="-135" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F59E0B" strokeWidth="14" strokeDasharray="40 238" strokeDashoffset="-189" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#06B6D4" strokeWidth="14" strokeDasharray="31 238" strokeDashoffset="-229" />
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#94A3B8" strokeWidth="14" strokeDasharray="58 238" strokeDashoffset="-260" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-base font-extrabold text-slate-900 leading-tight">142</span>
                    <span className="text-[9px] text-slate-400 uppercase font-medium">Total Documents</span>
                  </div>
                </div>

                {/* Category Legends with counts */}
                <div className="space-y-1.5 flex-1 text-xs">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </span>
                      <span className="text-[11px] font-bold text-slate-800">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                All classifications encrypted with SHA-256 integrity
              </div>
            </div>
          </div>

          {/* User Management Table matching reference image */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">User Management</h3>
              <button
                onClick={() => showToast('All Users', `Viewing complete corporate directory of ${allUsers.length} identities.`, 'info')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View all users
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Last Login</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayUsers.map((u) => {
                    const roleLabel =
                      u.role === 'ADMIN'
                        ? 'Administrator'
                        : u.role === 'OWNER'
                        ? 'Document Owner'
                        : 'Viewer';

                    const roleBadgeClass =
                      u.role === 'ADMIN'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : u.role === 'OWNER'
                        ? 'bg-purple-50 text-purple-600 border border-purple-200'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200';

                    const statusClass =
                      u.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-800">{u.name}</td>
                        <td className="py-3 px-3 text-slate-500">{u.email}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${roleBadgeClass}`}>
                            {roleLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusClass}`}>
                            {u.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(u.lastLoginAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          ,{' '}
                          {new Date(u.lastLoginAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-3 text-right relative">
                          <button
                            onClick={() => setActiveMenuUserId(activeMenuUserId === u.id ? null : u.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Action Popover */}
                          {activeMenuUserId === u.id && (
                            <div className="absolute right-3 top-8 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-20 w-44 text-left space-y-0.5 animate-in fade-in">
                              <button
                                onClick={() => handleOpenEditRole(u)}
                                className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                              >
                                Change Role
                              </button>
                              <button
                                onClick={() => handlePromptToggleStatus(u)}
                                className="w-full text-left px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                              >
                                {u.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity Feed matching reference image */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            <button
              onClick={() => navigate('/audit')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              View all
            </button>
          </div>

          <div className="space-y-4">
            {recentActivities.map((act) => {
              const Icon = act.icon;
              const badgeStyle =
                act.color === 'blue'
                  ? 'bg-blue-50 text-blue-600 border-blue-100'
                  : act.color === 'emerald'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : act.color === 'purple'
                  ? 'bg-purple-50 text-purple-600 border-purple-100'
                  : 'bg-rose-50 text-rose-600 border-rose-100';

              const iconContainerStyle =
                act.color === 'blue'
                  ? 'bg-blue-50 text-blue-600'
                  : act.color === 'emerald'
                  ? 'bg-emerald-50 text-emerald-600'
                  : act.color === 'purple'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-rose-50 text-rose-600';

              return (
                <div key={act.id} className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full ${iconContainerStyle} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-xs leading-tight">{act.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{act.user}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{act.time}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeStyle} shrink-0`}>
                    {act.type}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('/audit')}
              className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold text-center transition-colors"
            >
              Open Full Audit Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Modify Role: ${editingUser.name}`}
          subtitle={`Assign system-level permissions for ${editingUser.email}`}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select System Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="ADMIN">Administrator (Full System Control)</option>
                <option value="OWNER">Document Owner (Manage & Vault Documents)</option>
                <option value="VIEWER">Viewer (Read Authorized Grants)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
              >
                Save Role
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Deactivation Modal */}
      {suspendingUser && (
        <ConfirmDialog
          isOpen={isSuspendConfirmOpen}
          onClose={() => setIsSuspendConfirmOpen(false)}
          onConfirm={handleConfirmToggleStatus}
          title={suspendingUser.status === 'ACTIVE' ? 'Deactivate User Account' : 'Reactivate User Account'}
          message={
            suspendingUser.status === 'ACTIVE'
              ? `Are you sure you want to deactivate ${suspendingUser.name}? The zero-trust gate will immediately block subsequent document access and logins for this identity.`
              : `Are you sure you want to reactivate access for ${suspendingUser.name}?`
          }
          confirmText={suspendingUser.status === 'ACTIVE' ? 'Deactivate Immediately' : 'Reactivate'}
          danger={suspendingUser.status === 'ACTIVE'}
        />
      )}
    </div>
  );
};
