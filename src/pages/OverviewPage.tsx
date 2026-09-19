import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Compass,
  Trophy,
  Activity,
  Shield,
  QrCode,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { MetricCard } from '../components/dashboard/MetricCard';
import { RoundProgressCard } from '../components/dashboard/RoundProgressCard';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import { QuickActionsPanel } from '../components/dashboard/QuickActionsPanel';
import { MetricCardSkeleton } from '../components/ui/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { eventService } from '../services/eventService';
import { DashboardOverviewData } from '../types';

export function OverviewPage() {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const loadDashboardData = async () => {
    setError(null);
    try {
      const res = await eventService.getDashboardOverview();
      setData(res.data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load dashboard overview data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const unsubscribe = eventService.subscribe(() => {
      loadDashboardData();
    });
    return unsubscribe;
  }, []);

  const handleResetDemo = () => {
    setIsResetConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-card">
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Operations Command Center
          </h2>
          <p className="text-xs text-slate-500">
            Live telemetry, team accreditation, and tournament check-in status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDemo}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            title="Reset data to default 32 teams"
          >
            Reset Demo State
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="danger" onClick={loadDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* Primary KPI Metric Cards Grid */}
      {isLoading || !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Registered Squads"
            value={`${data.stats.totalTeams}`}
            subtitle={`${data.stats.completeRosterTeams} with full 5-member rosters`}
            icon={Users}
            badge={{
              text: `${data.stats.totalTeams} Total`,
              variant: data.stats.totalTeams >= 32 ? 'blue' : 'amber',
            }}
            trend={{
              text: `${data.stats.incompleteRosterTeams} incomplete`,
              isPositive: data.stats.incompleteRosterTeams === 0,
            }}
          />

          <MetricCard
            label="Accredited Students"
            value={`${data.stats.totalParticipants}`}
            subtitle={`${data.stats.checkedInParticipants} checked in at desk`}
            icon={UserCheck}
            badge={{
              text: `${Math.round((data.stats.checkedInParticipants / Math.max(1, data.stats.totalParticipants)) * 100)}% Verified`,
              variant: 'emerald',
            }}
            trend={{
              text: `${data.stats.totalParticipants - data.stats.checkedInParticipants} pending`,
              isPositive: false,
            }}
          />

          <MetricCard
            label="Current Phase"
            value="Round 1"
            subtitle="The Great Expedition"
            icon={Compass}
            badge={{ text: 'LIVE NOW', variant: 'amber' }}
            trend={{ text: `${data.stats.totalTeams} squads competing`, isPositive: true }}
          />

          <MetricCard
            label="Ready Squads"
            value={`${data.stats.checkedInTeams} / ${data.stats.totalTeams}`}
            subtitle="5 members present & verified"
            icon={Trophy}
            badge={{
              text: `Cutoff: Top ${data.stats.qualifiedTeamsTarget}`,
              variant: 'purple',
            }}
            trend={{
              text: `${data.stats.checkedInTeams >= 24 ? 'Target met' : 'Awaiting check-ins'}`,
              isPositive: data.stats.checkedInTeams >= 24,
            }}
          />
        </div>
      )}

      {/* Secondary Highlights */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Tournament Stage Progress</div>
              <div className="text-base font-bold text-slate-800">{data.stats.eventProgressPercentage}% Completed</div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${data.stats.eventProgressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Secret Agent Network</div>
              <div className="text-base font-bold text-slate-800">{data.stats.agentsAssigned} Agents Active</div>
              <div className="text-xs text-purple-600 font-medium mt-0.5">1 per squad · Confidential</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Code Fragments Discovered</div>
              <div className="text-base font-bold text-slate-800">
                {data.stats.fragmentsDiscovered} / {data.stats.totalFragments} Claimed
              </div>
              <div className="text-xs text-emerald-600 font-medium mt-0.5">Campus Hunt Active</div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Round Pipeline Stepper */}
      {data && <RoundProgressCard steps={data.progression} />}

      {/* Bottom Grid: Activity Feed & Quick Actions */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivityFeed activities={data.recentActivities} />
          </div>
          <div>
            <QuickActionsPanel />
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Reset Tournament Demo State"
        message={
          data?.stats.currentRoundNumber && data.stats.currentRoundNumber > 1
            ? 'Warning: Tournament rounds are currently underway or finalized. Resetting will erase all competition timings, Cabo game placements, Black Market ledgers, courtroom arguments, and scorecards back to the initial 32 squads. This action cannot be undone.'
            : 'Are you sure you want to reset all team rosters, check-in statuses, and activity logs back to the default demo state (32 teams, 160 participants)?'
        }
        confirmLabel="Reset All Data"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          eventService.resetToDemoData();
          setIsResetConfirmOpen(false);
          loadDashboardData();
        }}
      />
    </div>
  );
}
