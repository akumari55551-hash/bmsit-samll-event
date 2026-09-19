import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  User,
  CheckCircle2,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Operations Overview', subtitle: 'Live event monitoring & command center' },
  '/teams': { title: 'Registered Teams', subtitle: '32 Teams roster & qualification tracking' },
  '/participants': { title: 'Participants Directory', subtitle: '160 college participants directory' },
  '/round-1': { title: 'Round 1: The Great Expedition', subtitle: '3 Timed Mini-Rounds · 32 squads compete for 24 spots' },
  '/round-2': { title: 'Round 2: Cabo', subtitle: '3 Cabo card games · 24 squads compete for 12 spots' },
  '/round-3': { title: 'Round 3: The Black Market', subtitle: 'Points-based economy & hidden code verification · 12 squads compete for 8 spots' },
  '/black-market': { title: 'Round 3: The Black Market', subtitle: 'Points-based economy & hidden code verification · 12 squads compete for 8 spots' },
  '/round-4': { title: 'Round 4: The Legal Battle', subtitle: '4 Fictional Courtroom Trials · 8 finalist squads compete for Grand Finale' },
  '/legal-battle': { title: 'Round 4: The Legal Battle', subtitle: '4 Fictional Courtroom Trials · 8 finalist squads compete for Grand Finale' },
  '/rounds': { title: 'Round Progression', subtitle: '5-Stage elimination and qualification structure' },
  '/scoreboard': { title: 'Live Scoreboard', subtitle: 'Official multi-round cumulative leaderboard' },
  '/secret-agents': { title: 'Secret Agent Programme', subtitle: 'Confidential agent operations & sabotage audit' },
  '/code-fragments': { title: 'Hidden Code Hunt', subtitle: 'Campus QR clues & code discovery tracker' },
  '/judges': { title: 'Judges Panel (Round 4)', subtitle: 'Moot court debate scorecards & criteria' },
  '/finale': { title: 'Grand Finale & Awards', subtitle: 'Top 3 podium calculation & agent deductions' },
  '/settings': { title: 'Event Settings', subtitle: 'Configuration, timers & system diagnostics' },
};

export function TopNavbar({ onOpenMobileMenu }: TopNavbarProps) {
  const location = useLocation();
  const current = PAGE_TITLES[location.pathname] || {
    title: 'Operations Dashboard',
    subtitle: 'BMSIT Event HQ Console',
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Open sidebar navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-600 hidden sm:inline">
                EVENT HQ · BMSIT 2026
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {current.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500 hidden md:block mt-0.5">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Center: Search UI Placeholder */}
        <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search teams, USN, clues... (Ctrl+K)"
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100/80 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              readOnly
              onClick={() => alert('Search will be connected to backend query indices in a future prompt.')}
            />
          </div>
        </div>

        {/* Right: Status Badges, Notifications & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Demo Mode Badge */}
          <Badge variant="warning" size="sm" dot className="hidden sm:inline-flex">
            Demo Mode Active
          </Badge>

          {/* Notifications Dropdown Placeholder */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative cursor-pointer"
              title="Recent alerts"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="font-semibold text-xs text-slate-800">Operational Notices</div>
                  <span className="text-[10px] text-slate-400">Mock Data</span>
                </div>
                <div className="mt-2 space-y-2 text-xs text-slate-600">
                  <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                    <div className="font-medium text-blue-900 text-[11px]">Station 1 Active</div>
                    <div className="text-[10px] text-blue-700 mt-0.5">
                      Checkpoints currently accepting physical verification cards.
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="font-medium text-slate-800 text-[11px]">System Ready</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      FastAPI backend connection point configured at port 8000.
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 italic">
                    Placeholder alerts — live WebSockets will be added in later phase.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Placeholder */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-slate-800 leading-none">Tech Ops Lead</div>
                <div className="text-[10px] text-slate-400 leading-none mt-1">BMSIT Organizer</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block ml-0.5" />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 text-xs">
                <div className="px-2 py-1.5 border-b border-slate-100">
                  <p className="font-semibold text-slate-800">Operator Console</p>
                  <p className="text-[11px] text-slate-500">tech.lead@bmsit.in</p>
                  <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                    Role: Event Admin
                  </span>
                </div>
                <div className="p-2 text-[11px] text-slate-500 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Permissions: Full Organizer Access</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-700">
                    <Info className="w-3.5 h-3.5 text-amber-600" />
                    <span>Auth system disabled (Phase 0 Foundation)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
