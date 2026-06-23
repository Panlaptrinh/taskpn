import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Layout, CalendarDays, CheckCircle2, Clock, 
  Plus, Search, Bell, LogOut, FileText, 
  Printer, User, X, AlertCircle, Trash2, 
  ChevronDown, Calendar as CalendarIcon, Briefcase,
  Home, ArrowRight, Circle, ChevronRight, ChevronLeft,
  ChevronDown as ChevronDownIcon, FolderOpen,
  Edit2, Trash, BookOpen, Users, Timer, Play, Pause, RotateCcw,
  Phone, Mail, CheckCircle, Shield, Key, FileBarChart, CheckSquare
} from 'lucide-react';

// --- INITIAL STATES ---
const INITIAL_MEMBERS = [
  { id: 'm1', code: 'PN293', name: 'Founder PN293', role: 'Founder', status: 'active', createdAt: '2026-06-01' },
  { id: 'm2', code: 'PN121', name: 'Founder PN121', role: 'Founder', status: 'active', createdAt: '2026-06-01' }
];

// Hook to sync state with localStorage safely
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn("Error reading localStorage", error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn("Error setting localStorage", error);
    }
  };

  return [storedValue, setValue];
}

const getTodayStr = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today - offset)).toISOString().slice(0, 10);
    return localISOTime;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
};

// Calculate timeline styling constraints for Gantt view
const calculateTimelineStyle = (start, end, viewStart, viewEnd) => {
  const tStart = new Date(start).getTime();
  const tEnd = new Date(end).getTime();
  const vStart = new Date(viewStart).getTime();
  const vEnd = new Date(viewEnd).getTime();
  const totalDuration = vEnd - vStart;

  if (tEnd < vStart || tStart > vEnd) return { display: 'none' };

  const leftPercent = Math.max(0, ((tStart - vStart) / totalDuration) * 100);
  const rightPercent = Math.min(100, ((tEnd - vStart) / totalDuration) * 100);
  const widthPercent = rightPercent - leftPercent;

  return { left: `${leftPercent}%`, width: `${widthPercent}%` };
};

const ConfirmDialog = ({ isOpen, title, message, confirmText = "Xác nhận", cancelText = "Hủy", onConfirm, onCancel, isDanger = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-slate-50 mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          {cancelText && (
            <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-50 hover:bg-slate-800 transition-colors">
              {cancelText}
            </button>
          )}
          <button onClick={onConfirm} className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-all shadow-lg ${isDanger ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const Badge = ({ text, color = "blue", className="" }) => {
  const colorMap = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20 print:bg-blue-100 print:text-blue-800 print:border-blue-200",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20 print:bg-violet-100 print:text-violet-800 print:border-violet-200",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 print:bg-emerald-100 print:text-emerald-800 print:border-emerald-200",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20 print:bg-orange-100 print:text-orange-800 print:border-orange-200",
    pink: "text-pink-400 bg-pink-500/10 border-pink-500/20 print:bg-pink-100 print:text-pink-800 print:border-pink-200",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20 print:bg-rose-100 print:text-rose-800 print:border-rose-200",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20 print:bg-amber-100 print:text-amber-800 print:border-amber-200",
    slate: "text-slate-400 bg-slate-800 border-slate-700 print:bg-slate-200 print:text-slate-800 print:border-slate-300",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center w-max print-exact-color ${colorMap[color] || colorMap.blue} ${className}`}>
      {text}
    </span>
  );
};

const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-lg overflow-hidden ${onClick ? 'cursor-pointer hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5' : ''} ${className}`}>
    {children}
  </div>
);

const ProgressBar = ({ progress, colorClass = "bg-blue-500", heightClass = "h-1.5" }) => (
  <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${heightClass}`}>
    <div className={`h-full ${colorClass} transition-all duration-500 ease-out`} style={{ width: `${progress}%` }}></div>
  </div>
);

// Built-in Focus Timer widget for maximum utility
const FocusTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl shadow-inner">
      <Timer size={14} className={isRunning ? "text-emerald-400 animate-pulse" : "text-slate-400"} />
      <span className="text-xs font-mono font-bold text-slate-300">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
      <button onClick={toggleTimer} className="p-0.5 text-slate-400 hover:text-white transition-colors" title={isRunning ? "Tạm dừng" : "Bắt đầu"}>
        {isRunning ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <button onClick={resetTimer} className="p-0.5 text-slate-400 hover:text-rose-400 transition-colors" title="Đặt lại">
        <RotateCcw size={12} />
      </button>
    </div>
  );
};

const LoginView = ({ onLogin, validMembers }) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const code = accessCode.trim().toUpperCase();
    
    const member = validMembers.find(m => m.code === code && m.status === 'active');
    
    if (member) {
      onLogin({ username: code, name: member.name, level: member.role });
    } else {
      setError('Mã truy cập không hợp lệ hoặc đã bị vô hiệu hóa.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-slate-50 font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-2xl p-10 rounded-[2rem] border border-slate-800 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-violet-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20 transform rotate-3 hover:rotate-6 transition-transform">
            <Shield size={36} className="text-white transform -rotate-3" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-slate-50 to-slate-400">Task PN</h1>
          <p className="text-slate-400 text-sm font-medium">Hệ thống Lên Kế Hoạch & Quản lý</p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mã Cấp Phép (Access Code)</label>
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input type="text" required value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-slate-50 font-mono tracking-[0.2em] uppercase focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600 placeholder:tracking-normal placeholder:normal-case text-lg shadow-inner" placeholder="PN293 HOẶC PN121..." autoComplete="off"/>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 text-center uppercase tracking-widest font-bold">Dành riêng cho nhân sự được cấp phép</p>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all mt-4 shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 flex justify-center items-center gap-2">
            Truy cập hệ thống <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

const GuideView = ({ setActiveTab }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-10">
      <header className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-black text-slate-50 mb-3 tracking-tight">Chào mừng đến với Task PN 👋</h1>
        <p className="text-slate-400 text-base leading-relaxed">
          Task PN là hệ thống giúp bạn tổ chức công việc, quản lý lịch trình dự án và xuất báo cáo một cách trực quan. 
          Dưới đây là các tính năng chính của hệ thống.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-slate-900/40 hover:bg-slate-900/60 transition-colors border-slate-800 cursor-default" onClick={() => {}}>
           <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl shrink-0 w-max mb-4"><CalendarDays size={24}/></div>
           <h3 className="text-lg font-bold text-slate-200 mb-2">1. Timeline PiEn</h3>
           <p className="text-slate-400 text-sm mb-4 leading-relaxed">Quản lý tổng quan các chiến dịch bằng Lịch Block hoặc biểu đồ Gantt chi tiết.</p>
           <button onClick={() => setActiveTab('timeline')} className="text-sm font-bold text-blue-400 hover:underline">Mở Timeline →</button>
        </Card>

        <Card className="p-6 bg-slate-900/40 hover:bg-slate-900/60 transition-colors border-slate-800 cursor-default" onClick={() => {}}>
           <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0 w-max mb-4"><Layout size={24}/></div>
           <h3 className="text-lg font-bold text-slate-200 mb-2">2. Bảng Kanban</h3>
           <p className="text-slate-400 text-sm mb-4 leading-relaxed">Chia nhỏ dự án thành các đầu việc, kéo thả qua lại giữa các cột "Cần làm", "Đang làm".</p>
           <button onClick={() => setActiveTab('board')} className="text-sm font-bold text-emerald-400 hover:underline">Mở Bảng Task →</button>
        </Card>

        <Card className="p-6 bg-slate-900/40 hover:bg-slate-900/60 transition-colors border-slate-800 cursor-default" onClick={() => {}}>
           <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl shrink-0 w-max mb-4"><FileBarChart size={24}/></div>
           <h3 className="text-lg font-bold text-slate-200 mb-2">3. Báo cáo Tự động</h3>
           <p className="text-slate-400 text-sm mb-4 leading-relaxed">Hệ thống tự gom nhóm công việc theo ngày để xuất file PDF lịch trình gửi sếp/khách hàng.</p>
           <button onClick={() => setActiveTab('reports')} className="text-sm font-bold text-violet-400 hover:underline">Mở Báo cáo →</button>
        </Card>

        <Card className="p-6 bg-slate-900/40 hover:bg-slate-900/60 transition-colors border-slate-800 cursor-default" onClick={() => {}}>
           <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl shrink-0 w-max mb-4"><Users size={24}/></div>
           <h3 className="text-lg font-bold text-slate-200 mb-2">4. Phân Quyền Founder</h3>
           <p className="text-slate-400 text-sm mb-4 leading-relaxed">Tài khoản Founder có quyền cấp mã (Access Code) cho các thành viên mới vào hệ thống.</p>
           <button onClick={() => setActiveTab('team')} className="text-sm font-bold text-rose-400 hover:underline">Mở Quản lý Nhóm →</button>
        </Card>
      </div>
    </div>
  )
}

const DashboardView = ({ user, tasks, toggleTaskStatus, projects, setActiveTab, searchQuery }) => {
  // Integrate live search filtering
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const activeTasks = filteredTasks.filter(t => t.status !== 'done');
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-1.5 tracking-tight">Tổng quan</h1>
          <p className="text-slate-400 text-sm">Hôm nay là {formatDate(getTodayStr())}. Vai trò: <span className="font-bold text-blue-400">{user.level}</span>.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 md:p-8 flex flex-col min-h-[420px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-50">Nhiệm vụ cần làm</h2>
              <p className="text-sm text-slate-400 mt-1">Đã xong {completedTasks}/{totalTasks} công việc</p>
            </div>
            <button onClick={() => setActiveTab('board')} className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20 hover:bg-blue-500/20">
              Mở Bảng Task <ArrowRight size={16}/>
            </button>
          </div>
          
          <div className="mb-6">
            <ProgressBar progress={progress} colorClass={progress === 100 && totalTasks > 0 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"} />
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {totalTasks === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                 <Layout size={48} className="mb-4 opacity-30" />
                 <p className="text-sm font-bold text-slate-400">Bạn chưa tạo công việc nào.</p>
               </div>
            ) : activeTasks.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                 <CheckCircle2 size={48} className="mb-4 opacity-50 text-emerald-500" />
                 <p className="text-sm font-bold text-slate-400">Đã hoàn thành mọi công việc hoặc không tìm thấy task khớp!</p>
               </div>
            ) : (
               activeTasks.map(task => {
                 const project = projects.find(p => p.id === task.projectId);
                 const pColor = task.priority === 'high' ? 'rose' : task.priority === 'medium' ? 'amber' : 'slate';
                 return (
                   <div key={task.id} onClick={() => toggleTaskStatus(task.id, 'done')} className="flex items-center gap-4 p-4 rounded-xl border border-slate-800/80 hover:border-blue-500/50 bg-slate-900/40 cursor-pointer group transition-all hover:bg-slate-800/50 hover:shadow-md">
                     <button className="shrink-0 text-slate-500 group-hover:text-emerald-400 transition-colors"><Circle size={24} strokeWidth={2} /></button>
                     <div className="flex-1 min-w-0 flex justify-between items-center">
                       <div>
                         <p className="text-sm font-bold text-slate-200 group-hover:text-blue-100 transition-colors">{task.title}</p>
                         <div className="flex items-center gap-2 mt-1.5">
                           <Badge text={project ? project.name : 'Chung'} color={project ? project.color : 'slate'} className="text-[9px]" />
                           <span className="text-slate-400 text-xs flex items-center gap-1 font-medium"><CalendarIcon size={12}/> {formatDate(task.endDate)}</span>
                         </div>
                       </div>
                       <Badge text={task.priority === 'high' ? 'Gấp' : task.priority === 'medium' ? 'Vừa' : 'Thấp'} color={pColor} className="mb-1.5 justify-end" />
                     </div>
                   </div>
                 )
               })
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 md:p-8 flex flex-col gap-4 min-h-[420px]">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2"><Layout size={14}/> Tiến độ Dự án</h3>
             <div className="space-y-6 flex-1 overflow-y-auto pr-1 custom-scrollbar">
               {projects.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-10">Chưa có dự án nào.</p>
               ) : (
                 projects.map(p => {
                    const pTasks = tasks.filter(t => t.projectId === p.id);
                    const pDone = pTasks.filter(t => t.status === 'done').length;
                    const pProg = pTasks.length ? Math.round((pDone/pTasks.length)*100) : 0;
                    return (
                      <div key={p.id}>
                        <div className="flex justify-between text-sm mb-2 font-medium">
                          <span className="text-slate-200 truncate pr-2">{p.name}</span>
                          <span className="text-slate-400 font-bold">{pProg}%</span>
                        </div>
                        <ProgressBar progress={pProg} colorClass={`bg-${p.color}-500`} heightClass="h-1.5" />
                      </div>
                    )
                 })
               )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ReportView = ({ projects, tasks, clients }) => {
  const [config, setConfig] = useState({ showProjects: true, showTimeline: true, showCRM: false });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const filteredReportTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!dateRange.start && !dateRange.end) return true;
      const tDate = new Date(task.endDate).getTime();
      const sDate = dateRange.start ? new Date(dateRange.start).getTime() : 0;
      const eDate = dateRange.end ? new Date(dateRange.end).setHours(23,59,59,999) : Infinity;
      return tDate >= sDate && tDate <= eDate;
    });
  }, [tasks, dateRange]);

  const filteredReportProjects = useMemo(() => {
    return projects.filter(p => {
      if (!dateRange.start && !dateRange.end) return true;
      const pStart = new Date(p.startDate).getTime();
      const pEnd = new Date(p.endDate).getTime();
      const sDate = dateRange.start ? new Date(dateRange.start).getTime() : 0;
      const eDate = dateRange.end ? new Date(dateRange.end).setHours(23,59,59,999) : Infinity;
      return pStart <= eDate && pEnd >= sDate;
    });
  }, [projects, dateRange]);

  // Group tasks by deadline date
  const groupedTasks = useMemo(() => {
    const groups = {};
    filteredReportTasks.forEach(task => {
      const d = task.endDate;
      if(!groups[d]) groups[d] = [];
      groups[d].push(task);
    });
    const sortedDates = Object.keys(groups).sort((a,b) => new Date(a) - new Date(b));
    return sortedDates.map(date => ({ date, tasks: groups[date] }));
  }, [filteredReportTasks]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-6 shrink-0 no-print">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2 tracking-tight">Báo cáo Tổng hợp</h1>
          <p className="text-slate-400 text-sm">Xuất lịch trình chi tiết và tình trạng dự án ra định dạng chuẩn in ấn.</p>
        </div>
        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2">
          <Printer size={18} /> In / Lưu PDF
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0">
        <div className="w-full md:w-64 shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-5 h-max no-print">
          <h3 className="font-bold text-slate-50 mb-4 flex items-center gap-2"><CheckSquare size={18}/> Chọn mục báo cáo</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={config.showTimeline} onChange={e => setConfig({...config, showTimeline: e.target.checked})} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900" />
              <span className="text-sm font-medium text-slate-300 group-hover:text-slate-50 transition-colors">Lịch trình công việc</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={config.showProjects} onChange={e => setConfig({...config, showProjects: e.target.checked})} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900" />
              <span className="text-sm font-medium text-slate-300 group-hover:text-slate-50 transition-colors">Tiến độ Dự án</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={config.showCRM} onChange={e => setConfig({...config, showCRM: e.target.checked})} className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900" />
              <span className="text-sm font-medium text-slate-300 group-hover:text-slate-50 transition-colors">Danh sách Khách hàng</span>
            </label>
          </div>

          <h3 className="font-bold text-slate-50 mt-8 mb-4 flex items-center gap-2"><CalendarIcon size={18}/> Lọc theo thời gian</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Từ ngày</label>
              <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 outline-none [color-scheme:dark] focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Đến ngày</label>
              <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 outline-none [color-scheme:dark] focus:border-blue-500 transition-colors" />
            </div>
            {(dateRange.start || dateRange.end) && (
              <button onClick={() => setDateRange({start: '', end: ''})} className="w-full mt-2 text-xs text-rose-400 hover:text-rose-300 font-medium text-right transition-colors">Xóa bộ lọc</button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex justify-center pb-10 bg-slate-950 no-print-bg">
          <div className="bg-white text-slate-900 w-full max-w-[800px] min-h-[1122px] rounded-sm shadow-2xl p-10 md:p-14 print-area relative">
            <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase font-sans">Báo Cáo Hoạt Động</h1>
                <p className="text-slate-500 font-medium mt-1">Lập bởi: Hệ thống Task PN</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">Ngày xuất báo cáo</p>
                <p className="text-sm text-slate-500">{formatDate(getTodayStr())}</p>
              </div>
            </div>

            {config.showTimeline && (
              <section className="mb-12 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold border-b border-slate-300 pb-2 mb-4 flex items-center gap-2"><CalendarIcon size={20}/> LỊCH TRÌNH CÔNG VIỆC THEO NGÀY</h2>
                {groupedTasks.length === 0 ? <p className="text-slate-500 italic">Không có công việc nào.</p> : (
                  <div className="space-y-6">
                    {groupedTasks.map(group => (
                      <div key={group.date} className="relative pl-6 border-l-2 border-blue-250">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1 print-exact-color"></div>
                        <h3 className="font-bold text-blue-800 mb-2 tracking-wide uppercase text-sm">{formatDate(group.date)}</h3>
                        <ul className="space-y-2">
                          {group.tasks.map(t => {
                            const prj = projects.find(p => p.id === t.projectId);
                            return (
                              <li key={t.id} className="text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-150 flex justify-between items-center print-exact-color">
                                <div className="flex items-center gap-2">
                                  <span className={t.status === 'done' ? 'text-emerald-500' : 'text-slate-400'}>{t.status === 'done' ? '☑' : '☐'}</span>
                                  <span className={`font-medium ${t.status === 'done' ? 'line-through text-slate-550' : 'text-slate-800'}`}>{t.title}</span>
                                </div>
                                {prj && <Badge text={prj.name} color={prj.color} />}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {config.showProjects && (
              <section className="mb-12 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold border-b border-slate-300 pb-2 mb-4 flex items-center gap-2"><Layout size={20}/> TÌNH TRẠNG DỰ ÁN</h2>
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-100 border-b-2 border-slate-300 print-exact-color">
                    <tr>
                      <th className="py-3 px-4 font-bold">Tên Dự án</th>
                      <th className="py-3 px-4 font-bold">Thời gian</th>
                      <th className="py-3 px-4 font-bold text-center">Tiến độ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReportProjects.map(p => {
                      const pTasks = tasks.filter(t => t.projectId === p.id);
                      const pDone = pTasks.filter(t => t.status === 'done').length;
                      const pProg = pTasks.length ? Math.round((pDone/pTasks.length)*100) : 0;
                      return (
                        <tr key={p.id} className="border-b border-slate-200">
                          <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                          <td className="py-3 px-4 text-slate-600">{formatDate(p.startDate)} - {formatDate(p.endDate)}</td>
                          <td className="py-3 px-4 text-center font-bold text-blue-600">{pProg}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </section>
            )}

            {config.showCRM && (
              <section className="mb-12 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold border-b border-slate-300 pb-2 mb-4 flex items-center gap-2"><Users size={20}/> DANH SÁCH KHÁCH HÀNG</h2>
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-100 border-b-2 border-slate-300 print-exact-color">
                    <tr>
                      <th className="py-3 px-4 font-bold">Khách hàng</th>
                      <th className="py-3 px-4 font-bold">Liên hệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c.id} className="border-b border-slate-200">
                        <td className="py-3 px-4"><span className="font-bold text-slate-800">{c.name}</span><br/><span className="text-slate-500 text-xs">{c.company}</span></td>
                        <td className="py-3 px-4 text-slate-600">{c.phone} | {c.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamView = ({ user, members, setMembers, triggerAlert, triggerConfirm }) => {
  const [newCodeName, setNewCodeName] = useState('');
  
  const generateCode = (e) => {
    e.preventDefault();
    if(user.level !== 'Founder') {
      triggerAlert("Quyền hạn hạn chế", "Chỉ Founder mới được cấp mã.");
      return;
    }
    
    const randomCode = 'PN' + Math.floor(100 + Math.random() * 900);
    const newMember = {
      id: 'm_' + Date.now(),
      code: randomCode,
      name: newCodeName,
      role: 'Thành viên',
      status: 'active',
      createdAt: getTodayStr()
    };
    setMembers(prev => [newMember, ...prev]);
    setNewCodeName('');
    triggerAlert("Cấp mã thành công", `Đã tạo thành công mã truy cập ${randomCode} cho thành viên ${newCodeName}`);
  };

  const revokeCode = (id, name) => {
    if(user.level !== 'Founder') return;
    triggerConfirm(
      "Thu hồi mã truy cập",
      `Bạn có chắc chắn muốn khóa mã truy cập của ${name}?`,
      () => {
        setMembers(prev => prev.map(m => m.id === id ? {...m, status: 'revoked'} : m));
      },
      true
    );
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-bold text-slate-50 mb-2 tracking-tight">Quản lý Đội ngũ</h1>
        <p className="text-slate-400 text-sm">Quản lý thành viên và cấp mã truy cập (Access Code) vào hệ thống.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2"><Key size={20} className="text-blue-400"/> Cấp mã mới</h2>
            {user.level === 'Founder' ? (
              <form onSubmit={generateCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tên người sử dụng</label>
                  <input required type="text" value={newCodeName} onChange={e => setNewCodeName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-50 focus:border-blue-500 outline-none transition-all" placeholder="Vd: Nguyễn Văn A" />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20">
                  Tạo Mã Truy Cập
                </button>
              </form>
            ) : (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3">
                <Shield size={20} className="text-rose-400 shrink-0"/>
                <p className="text-sm text-rose-400 font-medium">Bạn không có quyền cấp mã. Chức năng này chỉ dành cho cấp bậc Founder.</p>
              </div>
            )}
          </Card>
        </div>

        <Card className="lg:col-span-2 flex flex-col p-0">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
            <h2 className="text-lg font-bold text-slate-50">Danh sách Access Code</h2>
            <Badge text={`${members.filter(m => m.status==='active').length} Active`} color="emerald"/>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar p-6">
            <table className="w-full text-left">
              <thead className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="pb-3 font-bold">Thành viên</th>
                  <th className="pb-3 font-bold">Mã Code</th>
                  <th className="pb-3 font-bold">Vai trò</th>
                  <th className="pb-3 font-bold text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {members.map(m => (
                  <tr key={m.id} className={m.status === 'revoked' ? 'opacity-50' : ''}>
                    <td className="py-4">
                      <p className="font-bold text-slate-200">{m.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Tạo: {m.createdAt}</p>
                    </td>
                    <td className="py-4">
                      <code className="bg-slate-950 border border-slate-800 px-2 py-1 rounded text-blue-400 font-bold tracking-wider">{m.code}</code>
                    </td>
                    <td className="py-4">
                      <Badge text={m.role} color={m.role === 'Founder' ? 'violet' : 'slate'} />
                    </td>
                    <td className="py-4 text-right">
                      {m.status === 'active' ? (
                        <div className="flex items-center justify-end gap-3">
                           <Badge text="Hoạt động" color="emerald" />
                           {user.level === 'Founder' && m.role !== 'Founder' && (
                             <button onClick={() => revokeCode(m.id, m.name)} className="text-xs text-rose-400 hover:underline font-medium">Thu hồi</button>
                           )}
                        </div>
                      ) : (
                        <Badge text="Đã khóa" color="rose" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

const TimelineView = ({ projects, tasks, setProjects, setTasks, searchQuery, triggerAlert, triggerConfirm }) => {
  const [viewMode, setViewMode] = useState('calendar'); 
  const [currentCalMonth, setCurrentCalMonth] = useState(() => {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1);
  }); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState(projects.map(p => p.id)); 
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);

  const initialForm = { name: '', client: '', manager: '', startDate: getTodayStr(), endDate: getTodayStr(), status: 'planning', color: 'blue' };
  const [formData, setFormData] = useState(initialForm);

  // Dynamic filter based on global search query
  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [projects, searchQuery]);

  const today = new Date();
  const viewStart = new Date(today.getFullYear(), today.getMonth() - 1, 1); 
  const viewEnd = new Date(today.getFullYear(), today.getMonth() + 4, 0); 
  const months = [];
  let currentMonth = new Date(viewStart);
  while (currentMonth <= viewEnd) {
    months.push(new Date(currentMonth));
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  const nextMonth = () => setCurrentCalMonth(new Date(currentCalMonth.getFullYear(), currentCalMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentCalMonth(new Date(currentCalMonth.getFullYear(), currentCalMonth.getMonth() - 1, 1));

  const calYear = currentCalMonth.getFullYear();
  const calMonth = currentCalMonth.getMonth();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const blanksCount = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; 
  const blanks = Array.from({length: blanksCount}, (_, i) => i);
  const calendarDays = Array.from({length: daysInMonth}, (_, i) => new Date(calYear, calMonth, i + 1));

  const toggleExpand = (id) => setExpandedProjects(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);

  const handleOpenCreate = () => { setEditingProject(null); setFormData(initialForm); setIsModalOpen(true); };
  const handleOpenEdit = (project, e) => { e.stopPropagation(); setEditingProject(project); setFormData(project); setIsModalOpen(true); };
  
  const handleOpenDelete = (project, e) => { 
    e.stopPropagation(); 
    setProjectToDelete(project);
    triggerConfirm(
      "Xóa Dự Án",
      `Bạn có chắc chắn muốn xóa dự án "${project.name}" cùng tất cả các đầu việc liên quan?`,
      () => {
        setProjects(prev => prev.filter(p => p.id !== project.id));
        setTasks(prev => prev.filter(t => t.projectId !== project.id));
        setProjectToDelete(null);
      },
      true
    );
  };

  const handleSaveProject = (e) => {
    e.preventDefault();
    if (new Date(formData.startDate) > new Date(formData.endDate)) { 
      triggerAlert("Lỗi ngày tháng", "Ngày bắt đầu không được lớn hơn ngày kết thúc!"); 
      return; 
    }
    if (editingProject) setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...formData } : p));
    else setProjects(prev => [...prev, { ...formData, id: 'p_' + Date.now() }]);
    setIsModalOpen(false);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active': return <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider">Đang chạy</span>;
      case 'planning': return <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider">Kế hoạch</span>;
      case 'done': return <span className="text-slate-400 font-bold bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider">Hoàn thành</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6 shrink-0 z-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2 tracking-tight">Timeline PiEn</h1>
          <p className="text-slate-400 text-sm">Quản lý lịch trình dự án chuyên nghiệp dưới dạng Block và sơ đồ Gantt.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex shadow-sm">
              <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-slate-800 text-slate-50 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Lịch trình Block</button>
              <button onClick={() => setViewMode('details')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'details' ? 'bg-slate-800 text-slate-50 shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Chi tiết Gantt</button>
           </div>
           <button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2">
             <Plus size={16}/> Tạo Dự án
           </button>
        </div>
      </div>

      {viewMode === 'calendar' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 animate-in fade-in duration-300">
          <Card className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-800 gap-4">
                 <h2 className="text-xl font-bold text-slate-50 flex items-center gap-3">
                    <CalendarIcon size={24} className="text-blue-400"/>
                    Tổng Quan Lịch Block Booking - Tháng {String(calMonth + 1).padStart(2, '0')}, {calYear}
                 </h2>
                 <div className="text-xs font-mono text-slate-400 flex items-center gap-4">
                    <span className="hidden md:inline">Dưới dạng sơ đồ Block (Ngày 1-{daysInMonth})</span>
                    <div className="flex gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800">
                       <button onClick={prevMonth} className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"><ChevronLeft size={16}/></button>
                       <button onClick={() => setCurrentCalMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className="px-3 font-bold hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors">Nay</button>
                       <button onClick={nextMonth} className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"><ChevronRight size={16}/></button>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-7 gap-3 md:gap-4 mb-4">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <div key={d} className="text-center text-sm font-bold text-slate-500 tracking-wider">{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-3 md:gap-4">
                 {blanks.map(b => <div key={`blank-${b}`} className="min-h-[90px] md:min-h-[110px]"></div>)}
                 {calendarDays.map((date, idx) => {
                     const dTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                     const dayProjects = filteredProjects.filter(p => {
                        const sTime = new Date(p.startDate + 'T00:00:00').getTime();
                        const eTime = new Date(p.endDate + 'T23:59:59').getTime();
                        return dTime >= sTime && dTime <= eTime;
                     });
                     
                     let dayStatus = 'available';
                     if (dayProjects.length > 0) dayStatus = dayProjects.some(p => p.status === 'active') ? 'confirmed' : 'pending';

                     return (
                         <div key={idx} onClick={() => setSelectedDayInfo(date)} className={`min-h-[90px] md:min-h-[110px] rounded-2xl p-3 flex flex-col justify-between transition-all group cursor-pointer ${dayStatus === 'available' ? 'bg-[#0f172a]/60 border border-slate-800/80 hover:border-slate-600 hover:bg-[#1e293b]' : 'bg-slate-800/50 border border-slate-700 shadow-sm hover:border-blue-500/50 hover:bg-slate-800'}`}>
                            <span className={`text-base font-bold ${dayStatus === 'available' ? 'text-slate-400' : 'text-slate-50'}`}>{date.getDate()}</span>
                            <div className="mt-2">
                                {dayStatus === 'available' && <div className="text-[10px] font-bold text-slate-600 group-hover:text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-slate-400"></span>Rảnh</div>}
                                {dayStatus === 'confirmed' && <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider truncate flex items-center gap-1.5" title={dayProjects[0]?.name}><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Khóa</div>}
                                {dayStatus === 'pending' && <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider truncate flex items-center gap-1.5" title={dayProjects[0]?.name}><span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>Chờ</div>}
                            </div>
                         </div>
                     );
                 })}
              </div>

              <div className="mt-8 border border-slate-800 rounded-xl bg-slate-900/50 px-6 py-4 flex flex-wrap gap-6 items-center">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span> Đã khóa / CONFIRMED</div>
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]"></span> Chờ xác nhận / PENDING</div>
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-505 uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-slate-600"></span> Còn trống / AVAILABLE</div>
              </div>
          </Card>
        </div>
      )}

      {viewMode === 'details' && (
        <div className={`flex-1 overflow-x-auto overflow-y-auto custom-scrollbar animate-in fade-in duration-300 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-inner`}>
          <div className="min-w-[1200px] flex h-full">
            <div className="w-[400px] shrink-0 border-r border-slate-800 flex flex-col">
               <div className="h-14 border-b border-slate-800 text-slate-400 bg-slate-900 flex items-center px-4 text-xs font-bold uppercase tracking-widest">
                  <div className="flex-1">Dự án & Công việc</div>
                  <div className="w-20 text-center">Tiến độ</div>
                  <div className="w-24 text-right">Trạng thái</div>
               </div>
               <div className="flex-1 pb-10">
                 {filteredProjects.map(project => {
                   const pTasks = tasks.filter(t => t.projectId === project.id);
                   const progress = pTasks.length ? Math.round((pTasks.filter(t => t.status === 'done').length/pTasks.length)*100) : 0;
                   const isExpanded = expandedProjects.includes(project.id);
                   return (
                     <React.Fragment key={`info-${project.id}`}>
                       <div className="group h-16 border-b border-slate-800 hover:bg-slate-800/50 px-4 flex items-center cursor-pointer transition-colors" onClick={() => toggleExpand(project.id)}>
                         <div className="flex-1 flex items-center gap-2.5 pr-2 min-w-0">
                           {isExpanded ? <ChevronDownIcon size={16} className="text-slate-500 shrink-0"/> : <ChevronRight size={16} className="text-slate-500 shrink-0"/>}
                           <FolderOpen size={16} className="shrink-0 text-blue-400" />
                           <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                  <p className="text-sm font-bold truncate text-slate-50">{project.name}</p>
                                  <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-2">
                                    <button onClick={(e) => handleOpenEdit(project, e)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-blue-600 transition-colors"><Edit2 size={12}/></button>
                                    <button onClick={(e) => handleOpenDelete(project, e)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-600 transition-colors"><Trash size={12}/></button>
                                  </div>
                              </div>
                           </div>
                         </div>
                         <div className="w-20 text-center text-xs font-bold text-slate-300">{progress}%</div>
                         <div className="w-24 text-right">{getStatusBadge(project.status)}</div>
                       </div>
                       
                       {isExpanded && pTasks.map(task => (
                          <div key={`info-task-${task.id}`} className="h-12 border-b border-slate-800/50 bg-slate-900/30 px-4 flex items-center pl-10">
                             <div className="flex-1 flex items-center gap-2.5 truncate pr-2">
                               {task.status === 'done' ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0"/> : <Circle size={14} className="text-slate-600 shrink-0"/>}
                               <p className={`text-xs font-medium truncate ${task.status === 'done' ? 'text-slate-600 line-through' : 'text-slate-300'}`}>{task.title}</p>
                             </div>
                             <div className="w-20 text-center text-[11px] font-medium text-slate-500">{task.status === 'done' ? '100%' : '0%'}</div>
                             <div className="w-24 text-right text-[10px] font-medium text-slate-500">{formatDate(task.startDate).slice(0,5)} - {formatDate(task.endDate).slice(0,5)}</div>
                          </div>
                       ))}
                     </React.Fragment>
                   )
                 })}
               </div>
            </div>

            <div className="flex-1 relative flex flex-col">
              <div className="h-14 border-b border-slate-800 bg-slate-900 flex relative">
                {months.map((month, idx) => {
                  const width = (new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() / ((viewEnd - viewStart) / 86400000)) * 100;
                  return <div key={idx} className="border-l border-slate-800 text-slate-400 px-3 flex items-center text-xs font-bold uppercase tracking-widest" style={{ width: `${width}%` }}>Tháng {month.getMonth() + 1}</div>;
                })}
                <div className="absolute top-0 bottom-[-1000px] border-l-2 border-rose-500 border-dashed z-20 pointer-events-none" style={calculateTimelineStyle(getTodayStr(), getTodayStr(), viewStart, viewEnd)}>
                   <div className="absolute top-2 -translate-x-1/2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold shadow-sm">Nay</div>
                </div>
              </div>

              <div className="flex-1 relative pb-10">
                <div className="absolute inset-0 flex pointer-events-none">
                  {months.map((month, idx) => (
                    <div key={idx} className="border-l h-full relative border-slate-800" style={{ flex: 1 }}>
                       <div className="absolute top-0 left-1/2 h-full border-l border-dashed border-slate-800/50"></div>
                    </div>
                  ))}
                </div>

                <div>
                  {filteredProjects.map(project => {
                    const timelineStyle = calculateTimelineStyle(project.startDate, project.endDate, viewStart, viewEnd);
                    const pTasks = tasks.filter(t => t.projectId === project.id);
                    const progress = pTasks.length ? Math.round((pTasks.filter(t => t.status === 'done').length/pTasks.length)*100) : 0;
                    
                    return (
                      <React.Fragment key={`bar-${project.id}`}>
                        <div className="h-16 border-b border-slate-800 flex items-center relative">
                          <div className={`absolute h-8 rounded-lg bg-${project.color}-500 shadow-md shadow-${project.color}-500/20 overflow-hidden flex items-center`} style={timelineStyle}>
                            <div className="absolute top-0 left-0 h-full bg-black/20" style={{ width: `${progress}%` }}></div>
                            <span className="text-white text-[10px] font-bold px-3 whitespace-nowrap relative z-10 drop-shadow-md">{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                          </div>
                        </div>

                        {expandedProjects.includes(project.id) && pTasks.map(task => {
                           const taskStyle = calculateTimelineStyle(task.startDate, task.endDate, viewStart, viewEnd);
                           const taskColor = task.status === 'done' ? 'bg-slate-700' : 'bg-blue-500/50 border border-blue-500/50';
                           return (
                             <div key={`bar-task-${task.id}`} className="h-12 border-b flex items-center relative border-slate-800/50">
                               <div className={`absolute h-3.5 rounded-full ${taskColor}`} style={taskStyle}></div>
                             </div>
                           )
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal chi tiết khối ngày (Day Block Details) */}
      {selectedDayInfo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-800 shadow-2xl p-6 md:p-8 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-50 flex items-center gap-2">
                  <CalendarIcon size={20} className="text-blue-400"/> Lịch trình ngày {selectedDayInfo.getDate().toString().padStart(2, '0')}/{(selectedDayInfo.getMonth() + 1).toString().padStart(2, '0')}/{selectedDayInfo.getFullYear()}
                </h2>
              </div>
              <button onClick={() => setSelectedDayInfo(null)} className="text-slate-500 hover:text-slate-50 bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
              {(() => {
                const dTime = new Date(selectedDayInfo.getFullYear(), selectedDayInfo.getMonth(), selectedDayInfo.getDate()).getTime();
                const activeProjects = projects.filter(p => {
                    const sTime = new Date(p.startDate + 'T00:00:00').getTime();
                    const eTime = new Date(p.endDate + 'T23:59:59').getTime();
                    return dTime >= sTime && dTime <= eTime;
                });
                const activeTasks = tasks.filter(t => {
                    const sTime = new Date(t.startDate + 'T00:00:00').getTime();
                    const eTime = new Date(t.endDate + 'T23:59:59').getTime();
                    return dTime >= sTime && dTime <= eTime;
                });

                return (
                  <>
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Briefcase size={14}/> Dự án trong khoảng thời gian này ({activeProjects.length})</h3>
                      {activeProjects.length === 0 ? <p className="text-sm text-slate-500 italic px-2">Trống</p> : (
                        <div className="space-y-2.5">
                          {activeProjects.map(p => (
                            <div key={p.id} className="bg-slate-800/50 border border-slate-700/50 p-3.5 rounded-xl flex justify-between items-center group hover:border-slate-600 transition-colors">
                              <span className="font-bold text-slate-200 text-sm">{p.name}</span>
                              {getStatusBadge(p.status)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 mt-2"><CheckSquare size={14}/> Danh sách Công việc (Task) ({activeTasks.length})</h3>
                      {activeTasks.length === 0 ? <p className="text-sm text-slate-500 italic px-2">Trống</p> : (
                        <div className="space-y-2.5">
                          {activeTasks.map(t => {
                            const p = projects.find(proj => proj.id === t.projectId);
                            return (
                              <div key={t.id} className="bg-slate-800/50 border border-slate-700/50 p-3.5 rounded-xl group hover:border-slate-600 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                   <span className={t.status === 'done' ? 'text-emerald-500' : 'text-slate-500'}>{t.status === 'done' ? <CheckCircle2 size={16}/> : <Circle size={16}/>}</span>
                                   <span className={`text-sm font-medium ${t.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{t.title}</span>
                                </div>
                                <div className="flex justify-between items-center pl-7">
                                   <Badge text={p ? p.name : 'N/A'} color={p ? p.color : 'slate'} className="text-[10px]" />
                                   <Badge text={t.status === 'done' ? 'Đã xong' : t.status === 'in-progress' ? 'Đang làm' : 'Cần làm'} color={t.status === 'done' ? 'emerald' : t.status === 'in-progress' ? 'blue' : 'slate'} className="text-[10px]" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            
            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end shrink-0">
               <button onClick={() => setSelectedDayInfo(null)} className="px-5 py-2.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">Đóng cửa sổ</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 rounded-3xl w-full max-w-md border border-slate-800 shadow-2xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-50">{editingProject ? 'Chỉnh Sửa Dự Án' : 'Tạo Dự Án Mới'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-50 bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors"><X size={18}/></button>
            </div>
            <form onSubmit={handleSaveProject} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tên dự án</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-50 focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bắt đầu</label>
                  <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-400 outline-none [color-scheme:dark] focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Kết thúc</label>
                  <input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-400 outline-none [color-scheme:dark] focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Trạng thái</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-50 outline-none focus:border-blue-500">
                    <option value="planning">Kế hoạch</option>
                    <option value="active">Đang chạy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Màu hiển thị</label>
                  <select value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-50 outline-none focus:border-blue-500">
                    <option value="blue">Xanh dương (Blue)</option>
                    <option value="emerald">Xanh lá (Emerald)</option>
                    <option value="violet">Tím (Violet)</option>
                    <option value="amber">Cam (Amber)</option>
                    <option value="rose">Hồng (Rose)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-50 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">Hủy</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 transition-all">{editingProject ? 'Cập nhật' : 'Tạo Dự Án'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const KanbanView = ({ projects, tasks, setTasks, searchQuery, triggerAlert, triggerConfirm }) => {
  const [draggedTask, setDraggedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterProject, setFilterProject] = useState('all');

  const initialFormState = { title: '', projectId: projects[0]?.id || '', startDate: getTodayStr(), endDate: getTodayStr(), status: 'todo', priority: 'medium' };
  const [formData, setFormData] = useState(initialFormState);

  const onDragStart = (e, task) => { setDraggedTask(task); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e, targetStatus) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === targetStatus) return;
    setTasks(prev => prev.map(t => t.id === draggedTask.id ? { ...t, status: targetStatus } : t));
    setDraggedTask(null);
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (new Date(formData.startDate) > new Date(formData.endDate)) { 
      triggerAlert("Lỗi ngày tháng", "Ngày bắt đầu không được lớn hơn Deadline!"); 
      return; 
    }
    if (editingTask) setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...formData } : t));
    else setTasks(prev => [...prev, { ...formData, id: 't_' + Date.now() }]);
    setIsModalOpen(false);
  };

  const openModal = (task = null) => {
    if (projects.length === 0) {
      triggerAlert("Thiếu thông tin", "Bạn cần tạo ít nhất 1 Dự Án trước khi tạo công việc!");
      return;
    }
    if (task) { 
      setEditingTask(task); 
      setFormData(task); 
    } else { 
      setEditingTask(null); 
      setFormData({ ...initialFormState, projectId: filterProject !== 'all' ? filterProject : (projects[0]?.id || '') }); 
    }
    setIsModalOpen(true);
  };

  const handleDeleteTask = (task) => {
    triggerConfirm(
      "Xóa Công việc",
      "Bạn có chắc chắn muốn xóa công việc này?",
      () => {
        setTasks(prev => prev.filter(t => t.id !== task.id));
        setIsModalOpen(false);
      },
      true
    );
  };

  const columns = [ { id: 'todo', title: 'CẦN LÀM', dot: 'bg-slate-500' }, { id: 'in-progress', title: 'ĐANG LÀM', dot: 'bg-blue-500' }, { id: 'done', title: 'ĐÃ XONG', dot: 'bg-emerald-500' } ];
  
  // Combine live search filter + dropdown filter
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchProject = filterProject === 'all' || t.projectId === filterProject;
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchProject && matchSearch;
    });
  }, [tasks, filterProject, searchQuery]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2 tracking-tight">Bảng Công Việc</h1>
          <div className="relative inline-block">
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="appearance-none bg-slate-900 border border-slate-800 text-sm font-medium text-slate-300 rounded-xl pl-4 pr-10 py-2.5 outline-none cursor-pointer focus:border-blue-500 transition-colors shadow-sm">
              <option value="all">Tất cả dự án</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
          </div>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 flex items-center gap-2">
          <Plus size={18} /> Thêm Task
        </button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0 overflow-x-auto pb-4 custom-scrollbar snap-x">
        {columns.map(col => (
          <div key={col.id} onDragOver={onDragOver} onDrop={(e) => onDrop(e, col.id)} className="flex-1 min-w-[320px] max-w-[400px] bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col snap-center">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-300 text-sm flex items-center gap-2 tracking-widest uppercase">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dot} shadow-[0_0_8px_currentColor]`}></span> {col.title}
              </h3>
              <span className="bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-slate-700">{filteredTasks.filter(t => t.status === col.id).length}</span>
            </div>
            <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
              {filteredTasks.filter(t => t.status === col.id).map(task => {
                const project = projects.find(p => p.id === task.projectId);
                const pColor = task.priority === 'high' ? 'rose' : task.priority === 'medium' ? 'amber' : 'slate';
                return (
                  <div key={task.id} draggable onDragStart={(e) => onDragStart(e, task)} onClick={() => openModal(task)} className={`bg-slate-800 border border-slate-700 p-4 rounded-xl cursor-grab active:cursor-grabbing hover:border-blue-500/50 transition-all shadow-sm group ${col.id === 'done' ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <Badge text={project ? project.name : 'N/A'} color={project ? project.color : 'slate'} />
                      <Badge text={task.priority === 'high' ? 'Gấp' : task.priority === 'medium' ? 'Vừa' : 'Thấp'} color={pColor} />
                    </div>
                    <h4 className={`text-sm font-semibold mb-4 leading-snug ${col.id === 'done' ? 'line-through text-slate-500' : 'text-slate-100'}`}>{task.title}</h4>
                    <div className="flex justify-between items-center text-xs font-medium">
                      <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900/50 px-2.5 py-1.5 rounded-lg border border-slate-800"><CalendarIcon size={12}/> {formatDate(task.endDate)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-800 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-50">{editingTask ? 'Chỉnh sửa Task' : 'Tạo Task mới'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-50 bg-slate-800 p-2 rounded-full"><X size={18}/></button>
            </div>
            <form onSubmit={handleSaveTask} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tên công việc</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-50 outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Dự án</label>
                  <select required value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-50 outline-none focus:border-blue-500">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Độ Ưu tiên</label>
                  <select required value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-50 outline-none focus:border-blue-500">
                    <option value="high">Gấp</option><option value="medium">Vừa</option><option value="low">Thấp</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bắt đầu</label>
                  <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-400 outline-none [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hạn chót</label>
                  <input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-400 outline-none [color-scheme:dark]" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-slate-800 mt-6">
                {editingTask ? (
                  <button type="button" onClick={() => handleDeleteTask(editingTask)} className="text-rose-400 hover:text-slate-50 bg-rose-500/10 hover:bg-rose-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                    <Trash2 size={16} /> Xóa
                  </button>
                ) : <div/>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl">Hủy</button>
                  <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg">Lưu lại</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ClientCRMView = ({ clients, setClients, searchQuery, triggerConfirm }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const initialForm = { name: '', phone: '', email: '', company: '', status: 'new' };
  const [formData, setFormData] = useState(initialForm);

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  const handleSave = (e) => {
    e.preventDefault();
    if (editingClient) setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...formData } : c));
    else setClients(prev => [{ ...formData, id: 'c_' + Date.now() }, ...prev]);
    setIsModalOpen(false);
  };
  const openModal = (client = null) => { if (client) { setEditingClient(client); setFormData(client); } else { setEditingClient(null); setFormData(initialForm); } setIsModalOpen(true); };
  
  const deleteClient = (id) => { 
    triggerConfirm(
      "Xóa khách hàng", 
      "Bạn có chắc chắn muốn xóa liên hệ khách hàng này khỏi hệ thống?", 
      () => { 
        setClients(prev => prev.filter(c => c.id !== id)); 
        setIsModalOpen(false); 
      },
      true
    ); 
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2 tracking-tight">Quản lý Khách hàng</h1>
          <p className="text-slate-400 text-sm">Lưu trữ thông tin liên hệ và trạng thái khách hàng.</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2"><Plus size={18} /> Thêm Khách hàng</button>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col p-0">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-xs uppercase sticky top-0 z-10">
              <tr><th className="p-4 font-bold">Tên / Công ty</th><th className="p-4 font-bold">Liên hệ</th><th className="p-4 font-bold">Trạng thái</th><th className="p-4 font-bold text-right">Hành động</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-800/50">
                  <td className="p-4"><p className="font-bold text-slate-200">{client.name}</p><p className="text-xs text-slate-500 mt-0.5">{client.company || 'Cá nhân'}</p></td>
                  <td className="p-4"><p className="text-sm text-slate-300 flex items-center gap-2"><Phone size={12}/> {client.phone}</p><p className="text-sm text-slate-300 flex items-center gap-2 mt-1"><Mail size={12}/> {client.email}</p></td>
                  <td className="p-4"><Badge text={client.status === 'active' ? 'Đang hợp tác' : 'Khách mới'} color={client.status === 'active' ? 'emerald' : 'blue'} /></td>
                  <td className="p-4 text-right"><button onClick={() => openModal(client)} className="p-2 text-slate-500 hover:text-blue-400 bg-slate-900 rounded-lg border border-slate-800"><Edit2 size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full border border-slate-800 p-8">
            <h2 className="text-xl font-bold text-slate-50 mb-6">{editingClient ? 'Sửa thông tin' : 'Thêm Khách'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Tên khách hàng" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-50 outline-none focus:border-blue-500" />
              <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Công ty" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-50 outline-none focus:border-blue-500" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Số điện thoại" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-50 outline-none focus:border-blue-500" />
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-50 outline-none focus:border-blue-500"><option value="new">Khách mới</option><option value="active">Đang hợp tác</option></select>
              </div>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-50 outline-none focus:border-blue-500" />
              <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-800">
                {editingClient ? <button type="button" onClick={() => deleteClient(editingClient.id)} className="text-rose-400 hover:underline text-sm font-bold">Xóa</button> : <div/>}
                <div className="flex gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-800 rounded-xl text-sm font-bold">Hủy</button><button type="submit" className="px-5 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white">Lưu</button></div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
};

export default function App() {
  const [members, setMembers] = useLocalStorage('taskpn_members', INITIAL_MEMBERS);
  const [user, setUser] = useLocalStorage('taskpn_user', null);
  const [activeTab, setActiveTab] = useState('guide');
  
  const [projects, setProjects] = useLocalStorage('taskpn_projects', []);
  const [tasks, setTasks] = useLocalStorage('taskpn_tasks', []);
  const [clients, setClients] = useLocalStorage('taskpn_clients', []);

  // Global search and filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Modals replacing browser default dialogs (Crucial to avoid sandboxed iframe freeze)
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '' });
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDanger: false, cancelText: "Hủy" });

  const triggerAlert = (title, message) => {
    setAlertConfig({ isOpen: true, title, message });
  };

  const triggerConfirm = (title, message, onConfirm, isDanger = false, cancelText = "Hủy") => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      },
      isDanger,
      cancelText
    });
  };

  const handleLogin = (userData) => { setUser(userData); setActiveTab('guide'); };
  const handleLogoutRequest = () => {
    triggerConfirm(
      "Đăng xuất", 
      "Tiến trình công việc của bạn đã được tự động lưu. Bạn có chắc chắn muốn đăng xuất ngay bây giờ?", 
      () => { setUser(null); }, 
      true
    );
  };

  const toggleTaskStatus = (taskId, status) => setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

  if (!user) return <LoginView onLogin={handleLogin} validMembers={members} />;

  const NavItem = ({ icon: Icon, label, id }) => (
    <button onClick={() => { setActiveTab(id); setSearchQuery(''); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === id ? 'bg-blue-600/10 text-blue-400 font-bold border border-blue-500/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}>
      <Icon size={18} className={activeTab === id ? 'text-blue-400' : 'opacity-70'} />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 font-sans overflow-hidden selection:bg-blue-500/30">
      
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 relative z-20 no-print">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-3 font-black text-xl tracking-tight">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <span>Task PN</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Tổng quan</p>
          <NavItem icon={BookOpen} label="Hướng dẫn bắt đầu" id="guide" />
          <NavItem icon={Home} label="Dashboard" id="dashboard" />
          
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mt-8 mb-2">Điều phối Công việc</p>
          <NavItem icon={CalendarDays} label="Timeline PiEn" id="timeline" />
          <NavItem icon={Layout} label="Bảng Công việc" id="board" />

          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mt-8 mb-2">Công cụ hỗ trợ</p>
          <NavItem icon={Users} label="Quản lý Khách hàng" id="crm" />
          <NavItem icon={FileBarChart} label="Báo cáo & Xuất file" id="reports" />

          <p className="text-[10px] font-bold text-rose-500/80 uppercase tracking-widest px-4 mt-8 mb-2">Quản trị Hệ thống</p>
          <NavItem icon={Key} label="Quản lý Đội ngũ" id="team" />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 transition-colors rounded-2xl border border-slate-700 cursor-pointer group shadow-sm">
            <div className="flex items-center gap-3 min-w-0" onClick={() => setActiveTab('team')}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-inner text-white border border-white/10 ${user.level === 'Founder' ? 'bg-violet-600' : 'bg-blue-600'}`}>
                {user.username.replace('PN', '')}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate text-slate-200 group-hover:text-white transition-colors">{user.name}</p>
                <p className={`text-[10px] truncate uppercase tracking-widest font-medium mt-0.5 ${user.level === 'Founder' ? 'text-violet-400' : 'text-blue-400'}`}>{user.level}</p>
              </div>
            </div>
            <button onClick={handleLogoutRequest} className="text-slate-500 hover:text-rose-400 transition-colors p-2" title="Đăng xuất"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative print-area">
        <header className="h-20 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10 sticky top-0 no-print">
             <div className="relative w-full max-w-md hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm nhanh dự án, task..." className="w-full bg-slate-950 border border-slate-800 rounded-full py-2.5 pl-11 pr-4 text-sm text-slate-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-inner placeholder:text-slate-500" />
             </div>
             <div className="flex items-center gap-5 ml-auto">
               <FocusTimer />
               <button className="text-slate-500 hover:text-slate-50 transition-colors relative p-2" title="Thông báo"><Bell size={20}/></button>
             </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar relative no-print-padding">
          <div className="max-w-[1400px] mx-auto h-full w-full">
            {activeTab === 'guide' && <GuideView setActiveTab={setActiveTab}/>}
            
            {activeTab === 'dashboard' && (
              <DashboardView 
                user={user} 
                tasks={tasks} 
                toggleTaskStatus={toggleTaskStatus} 
                projects={projects} 
                setActiveTab={setActiveTab} 
                searchQuery={searchQuery}
              />
            )}
            
            {activeTab === 'timeline' && (
              <TimelineView 
                projects={projects} 
                tasks={tasks} 
                setProjects={setProjects} 
                setTasks={setTasks} 
                searchQuery={searchQuery}
                triggerAlert={triggerAlert}
                triggerConfirm={triggerConfirm}
              />
            )}
            
            {activeTab === 'board' && (
              <KanbanView 
                projects={projects} 
                tasks={tasks} 
                setTasks={setTasks} 
                searchQuery={searchQuery}
                triggerAlert={triggerAlert}
                triggerConfirm={triggerConfirm}
              />
            )}
            
            {activeTab === 'crm' && (
              <ClientCRMView 
                clients={clients} 
                setClients={setClients} 
                searchQuery={searchQuery}
                triggerConfirm={triggerConfirm}
              />
            )}
            
            {activeTab === 'reports' && <ReportView projects={projects} tasks={tasks} clients={clients} />}
            
            {activeTab === 'team' && (
              <TeamView 
                user={user} 
                members={members} 
                setMembers={setMembers} 
                triggerAlert={triggerAlert}
                triggerConfirm={triggerConfirm}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modern Dialogs replacing system alert/confirm */}
      <ConfirmDialog 
        isOpen={alertConfig.isOpen} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        confirmText="Đồng ý" 
        cancelText="" 
        onConfirm={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))} 
        onCancel={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))} 
      />
      
      <ConfirmDialog 
        isOpen={confirmConfig.isOpen} 
        title={confirmConfig.title} 
        message={confirmConfig.message} 
        confirmText="Xác nhận" 
        cancelText={confirmConfig.cancelText} 
        onConfirm={confirmConfig.onConfirm} 
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} 
        isDanger={confirmConfig.isDanger}
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important; color: black !important; }
          .no-print { display: none !important; }
          .no-print-bg { background: transparent !important; }
          .no-print-padding { padding: 0 !important; }
          .print-area { display: block !important; width: 100% !important; margin: 0 !important; box-shadow: none !important; }
          * { text-shadow: none !important; box-shadow: none !important; }
          .print-exact-color { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}} />
    </div>
  );
}