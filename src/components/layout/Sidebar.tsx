import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Compass,
  Layers,
  Trophy,
  Shield,
  QrCode,
  ArrowLeftRight,
  Gavel,
  Award,
  Settings,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  isConfidential?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Teams', path: '/teams', icon: Users, badge: '32' },
  { label: 'Participants', path: '/participants', icon: UserCheck, badge: '160' },
  { label: 'Round 1 — Expedition', path: '/round-1', icon: Compass, badge: 'R1' },
  { label: 'Round 2 — Cabo', path: '/round-2', icon: Layers, badge: 'R2' },
  { label: 'Round 3 — Black Market', path: '/round-3', icon: ArrowLeftRight, badge: 'R3' },
  { label: 'Round 4 — Legal Battle', path: '/round-4', icon: Gavel, badge: 'R4' },
  { label: 'Rounds', path: '/rounds', icon: Layers, badge: '5' },
  { label: 'Scoreboard', path: '/scoreboard', icon: Trophy },
  { label: 'Secret Agents', path: '/secret-agents', icon: Shield, isConfidential: true },
  { label: 'Code Fragments', path: '/code-fragments', icon: QrCode },
  { label: 'Judges', path: '/judges', icon: Gavel },
  { label: 'Finale — Championship', path: '/finale', icon: Award, badge: 'R5' },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Persistent Dark Navy Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0A1128] text-slate-300 flex flex-col border-r border-slate-800/80 transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
              HQ
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                EVENT HQ
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                  BMSIT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Ops & Live Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Round Indicator */}
        <Link
          to="/round-1"
          onClick={() => {
            if (window.innerWidth < 1024) onClose();
          }}
          className="mx-3 my-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/90 flex items-center justify-between hover:border-blue-500/50 hover:bg-slate-900 transition-all cursor-pointer group"
          title="Open Round 1 Operations Console"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-[11px] font-medium text-slate-300">
              <span className="text-slate-400 block text-[9px] uppercase tracking-wider group-hover:text-blue-400 transition-colors">Active Phase</span>
              Round 1: Expedition
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/20 group-hover:bg-emerald-500/20">
            LIVE
          </span>
        </Link>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            Competition Console
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          'w-4 h-4 flex-shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-200'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded font-mono',
                          isActive
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.isConfidential && !item.badge && (
                      <span
                        className={cn(
                          'text-[9px] uppercase px-1.5 py-0.5 rounded tracking-wider font-semibold',
                          isActive
                            ? 'bg-purple-900/60 text-purple-200 border border-purple-400/40'
                            : 'bg-purple-950/70 text-purple-400 border border-purple-800/40'
                        )}
                      >
                        RESTRICTED
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              FastAPI Ready
            </span>
            <span className="font-mono text-[10px] text-slate-400">v0.1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
