import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  Settings,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  Trophy,
  Users,
  Eye,
  KeyRound,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { Pagination } from '../components/ui/Pagination';
import { TableRowSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { MetricCard } from '../components/dashboard/MetricCard';
import { eventService } from '../services/eventService';
import {
  TeamRound1Record,
  Round1Config,
  Team,
  UpdateMiniRoundTimingInput,
} from '../types';
import { formatDuration } from '../utils/timing';
import { formatTeamNumber } from '../utils/formatters';
import { ScoringEngineResult } from '../utils/round1Scoring';

type SortField = 'rank' | 'teamNumber' | 'name' | 'adjustedTotalSeconds' | 'rawTotalSeconds';
type SortOrder = 'asc' | 'desc';

export function Round1ExpeditionPage() {
  const [data, setData] = useState<{
    records: TeamRound1Record[];
    config: Round1Config;
    engine: ScoringEngineResult;
  } | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search, filter, sorting, pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProgress, setFilterProgress] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<TeamRound1Record | null>(null);
  const [isManageTimingOpen, setIsManageTimingOpen] = useState(false);
  const [activeMiniRoundTab, setActiveMiniRoundTab] = useState<1 | 2 | 3>(1);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isFinalizeConfirmOpen, setIsFinalizeConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for timing edit
  const [timingStartTime, setTimingStartTime] = useState('');
  const [timingEndTime, setTimingEndTime] = useState('');
  const [timingHints, setTimingHints] = useState(0);
  const [timingCheckpoints, setTimingCheckpoints] = useState<string[]>([]);
  const [timingError, setTimingError] = useState<string | null>(null);

  // Config modal form states (120s / 2m is a demo default pending official organizer confirmation)
  const [configPenaltyMinutes, setConfigPenaltyMinutes] = useState(2);
  const [configCheckpointNames, setConfigCheckpointNames] = useState<string[]>([
    'Checkpoint 1 [Location TBD]',
    'Checkpoint 2 [Location TBD]',
    'Checkpoint 3 [Location TBD]',
  ]);
  const [configHiddenCodeRecovered, setConfigHiddenCodeRecovered] = useState(false);
  const [configHiddenCodeTeamId, setConfigHiddenCodeTeamId] = useState('');
  const [configHiddenCodeNotes, setConfigHiddenCodeNotes] = useState('');

  // Load round 1 data & subscribe
  const loadRound1 = async () => {
    try {
      const [r1Res, teamsRes] = await Promise.all([
        eventService.getRound1Data(),
        eventService.getTeams(),
      ]);
      setData(r1Res);
      setTeams(teamsRes.data);

      setConfigPenaltyMinutes(Math.round(r1Res.config.penaltyPerHintSeconds / 60));
      setConfigCheckpointNames([...r1Res.config.checkpointNames]);
      setConfigHiddenCodeRecovered(r1Res.config.hiddenCodeRecovered);
      setConfigHiddenCodeTeamId(r1Res.config.hiddenCodeRecoveredByTeamId || '');
      setConfigHiddenCodeNotes(r1Res.config.hiddenCodeNotes || '');

      if (selectedRecord) {
        const updated = r1Res.records.find((r) => r.teamId === selectedRecord.teamId);
        if (updated) setSelectedRecord(updated);
      }
    } catch (err) {
      console.error('Failed to load Round 1 data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRound1();
    const unsubscribe = eventService.subscribe(() => {
      loadRound1();
    });
    return unsubscribe;
  }, []);

  // Filter & Sort
  const filteredAndSortedRecords = useMemo(() => {
    if (!data) return [];

    return data.records
      .filter((rec) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          rec.teamName.toLowerCase().includes(query) ||
          formatTeamNumber(rec.teamNumber).toLowerCase().includes(query);

        let matchesStatus = true;
        if (filterStatus === 'qualified') {
          matchesStatus =
            rec.qualificationStatus === 'Provisional Qualified' ||
            rec.qualificationStatus === 'Finalized Qualified';
        } else if (filterStatus === 'eliminated') {
          matchesStatus =
            rec.qualificationStatus === 'Provisional Eliminated' ||
            rec.qualificationStatus === 'Finalized Eliminated';
        } else if (filterStatus === 'incomplete') {
          matchesStatus = rec.qualificationStatus === 'Incomplete';
        } else if (filterStatus === 'tied') {
          matchesStatus = !!rec.tieRequiresReview;
        }

        let matchesProgress = true;
        if (filterProgress === 'completed') {
          matchesProgress = rec.isComplete;
        } else if (filterProgress === 'inProgress') {
          matchesProgress =
            !rec.isComplete && rec.miniRounds.some((m) => m.status === 'In Progress');
        } else if (filterProgress === 'notStarted') {
          matchesProgress = rec.miniRounds.every((m) => m.status === 'Not Started');
        }

        return matchesSearch && matchesStatus && matchesProgress;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'rank') {
          const aRank = a.rank ?? null;
          const bRank = b.rank ?? null;
          if (aRank === null && bRank === null) comparison = a.teamNumber - b.teamNumber;
          else if (aRank === null) comparison = 1;
          else if (bRank === null) comparison = -1;
          else comparison = aRank - bRank;
        } else if (sortField === 'teamNumber') {
          comparison = a.teamNumber - b.teamNumber;
        } else if (sortField === 'name') {
          comparison = a.teamName.localeCompare(b.teamName);
        } else if (sortField === 'adjustedTotalSeconds') {
          const aAdj = a.adjustedTotalSeconds ?? null;
          const bAdj = b.adjustedTotalSeconds ?? null;
          if (aAdj === null && bAdj === null) comparison = 0;
          else if (aAdj === null) comparison = 1;
          else if (bAdj === null) comparison = -1;
          else comparison = aAdj - bAdj;
        } else if (sortField === 'rawTotalSeconds') {
          const aRaw = a.rawTotalSeconds ?? null;
          const bRaw = b.rawTotalSeconds ?? null;
          if (aRaw === null && bRaw === null) comparison = 0;
          else if (aRaw === null) comparison = 1;
          else if (bRaw === null) comparison = -1;
          else comparison = aRaw - bRaw;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [data, searchQuery, filterStatus, filterProgress, sortField, sortOrder]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRecords.slice(start, start + pageSize);
  }, [filteredAndSortedRecords, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Open Manage Timing Modal
  const handleOpenManageTiming = (rec: TeamRound1Record, initialTab: 1 | 2 | 3 = 1) => {
    setSelectedRecord(rec);
    setActiveMiniRoundTab(initialTab);
    loadMiniRoundForm(rec, initialTab);
    setTimingError(null);
    setIsManageTimingOpen(true);
  };

  const loadMiniRoundForm = (rec: TeamRound1Record, mrNum: 1 | 2 | 3) => {
    const mr = rec.miniRounds[mrNum - 1];
    setTimingStartTime(mr.startTime ? mr.startTime.slice(11, 19) : '');
    setTimingEndTime(mr.completionTime ? mr.completionTime.slice(11, 19) : '');
    setTimingHints(mr.hintsUsed || 0);
    setTimingCheckpoints(
      mr.checkpoints.map((cp) => (cp.arrivalTime ? cp.arrivalTime.slice(11, 19) : ''))
    );
  };

  const handleTabChange = (tab: 1 | 2 | 3) => {
    if (!selectedRecord) return;
    setActiveMiniRoundTab(tab);
    loadMiniRoundForm(selectedRecord, tab);
    setTimingError(null);
  };

  // Save Mini-Round Timing
  const handleSaveMiniRoundTiming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !data) return;
    setTimingError(null);
    setIsSubmitting(true);

    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const toIso = (timeStr: string) => {
        if (!timeStr.trim()) return null;
        return `${todayStr}T${timeStr.trim()}${timeStr.length === 5 ? ':00' : ''}Z`;
      };

      const startIso = toIso(timingStartTime);
      const endIso = toIso(timingEndTime);

      if (startIso && endIso) {
        if (new Date(endIso).getTime() < new Date(startIso).getTime()) {
          throw new Error('Completion time cannot precede start time.');
        }
      }

      const cpNames = data.config.checkpointNames;
      const updatedCheckpoints = cpNames.map((name, i) => ({
        checkpointId: `cp-${activeMiniRoundTab}-${i + 1}`,
        name,
        arrivalTime: toIso(timingCheckpoints[i] || ''),
      }));

      const input: UpdateMiniRoundTimingInput = {
        miniRoundNumber: activeMiniRoundTab,
        startTime: startIso,
        completionTime: endIso,
        hintsUsed: timingHints,
        checkpoints: updatedCheckpoints,
      };

      await eventService.updateRound1MiniRoundTiming(selectedRecord.teamId, input);

      // Refresh form
      const updatedR1 = await eventService.getRound1Data();
      const rec = updatedR1.records.find((r) => r.teamId === selectedRecord.teamId);
      if (rec) {
        setSelectedRecord(rec);
        loadMiniRoundForm(rec, activeMiniRoundTab);
      }
    } catch (err: unknown) {
      setTimingError((err as Error).message || 'Failed to update timing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Config Changes
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await eventService.updateRound1Config({
        penaltyPerHintSeconds: configPenaltyMinutes * 60,
        checkpointNames: configCheckpointNames,
      });

      await eventService.recordRound1HiddenCode(
        configHiddenCodeRecovered,
        configHiddenCodeTeamId || null,
        configHiddenCodeNotes
      );

      setIsConfigOpen(false);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Finalize Round 1
  const handleFinalizeRound1 = async () => {
    setIsSubmitting(true);
    try {
      await eventService.finalizeRound1();
      setIsFinalizeConfirmOpen(false);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Round 1
  const handleResetTimings = async () => {
    if (confirm('Reset all Round 1 timings back to initial state? Team rosters and participant records will NOT be erased.')) {
      await eventService.resetRound1Timings();
    }
  };

  // Simulate Complete Field
  const handleSimulateComplete = async () => {
    if (confirm('Simulate complete timing for all 32 squads? This sets valid completion times so you can test full 24-team qualification and finalization.')) {
      await eventService.simulateCompleteFieldRound1();
    }
  };

  const getStatusBadge = (status: TeamRound1Record['qualificationStatus'], tieReview?: boolean) => {
    if (tieReview) {
      return (
        <Badge variant="warning" size="sm" dot>
          Tie Review Needed
        </Badge>
      );
    }

    switch (status) {
      case 'Finalized Qualified':
        return (
          <Badge variant="success" size="sm" dot>
            Finalized Qualified
          </Badge>
        );
      case 'Finalized Eliminated':
        return (
          <Badge variant="danger" size="sm">
            Eliminated
          </Badge>
        );
      case 'Provisional Qualified':
        return (
          <Badge variant="primary" size="sm" dot>
            Provisional Top 24
          </Badge>
        );
      case 'Provisional Eliminated':
        return (
          <Badge variant="danger" size="sm">
            Elimination Zone
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            Incomplete
          </Badge>
        );
    }
  };

  // Derived counts for overview
  const stats = useMemo(() => {
    if (!data) {
      return {
        participating: 0,
        started: 0,
        completed: 0,
        awaiting: 0,
        qualified: 0,
        eliminated: 0,
      };
    }

    const records = data.records;
    const completed = records.filter((r) => r.isComplete).length;
    const started = records.filter((r) => r.miniRounds.some((m) => m.status !== 'Not Started')).length;
    const awaiting = records.length - completed;

    const qualified = records.filter(
      (r) =>
        r.qualificationStatus === 'Provisional Qualified' ||
        r.qualificationStatus === 'Finalized Qualified'
    ).length;

    const eliminated = records.filter(
      (r) =>
        r.qualificationStatus === 'Provisional Eliminated' ||
        r.qualificationStatus === 'Finalized Eliminated'
    ).length;

    return {
      participating: records.length,
      started,
      completed,
      awaiting,
      qualified,
      eliminated,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">
              Round 1: The Great Expedition Operations
            </h2>
            {data?.config.isFinalized ? (
              <Badge variant="success" size="sm" dot>
                Finalized &amp; Official
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" dot>
                Live Competition
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Configurable checkpoint placeholders</span>
            <span>&middot;</span>
            <span>3 Timed Mini-Rounds</span>
            <span>&middot;</span>
            <span>Top 24 advance to Cabo</span>
            <span>&middot;</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Hint Penalty: Demo default (120s / hint · Unconfirmed rule)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfigOpen(true)}
            leftIcon={<Settings className="w-3.5 h-3.5" />}
          >
            Round Settings &amp; Clue
          </Button>

          {!data?.config.isFinalized && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateComplete}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                title="Fill all 32 teams with completed times to test qualification"
              >
                Simulate Field
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsFinalizeConfirmOpen(true)}
                leftIcon={<Trophy className="w-3.5 h-3.5" />}
                disabled={!data?.engine.canFinalize}
              >
                Finalize Top 24
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetTimings}
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-400" />}
            title="Reset timing records"
          >
            Reset Timings
          </Button>
        </div>
      </div>

      {/* Dynamic Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Field Size"
          value={`${stats.participating} Teams`}
          subtitle="32 Target Roster"
          icon={Users}
          badge={{ text: '32 Squads', variant: 'blue' }}
        />

        <MetricCard
          label="Timing Started"
          value={`${stats.started}`}
          subtitle={`${stats.participating - stats.started} Pending Gate`}
          icon={Clock}
          badge={{ text: 'In Motion', variant: 'amber' }}
        />

        <MetricCard
          label="All 3 Finished"
          value={`${stats.completed}`}
          subtitle={`${Math.round((stats.completed / Math.max(1, stats.participating)) * 100)}% Completed`}
          icon={CheckCircle2}
          badge={{ text: 'Finished', variant: 'emerald' }}
        />

        <MetricCard
          label="Awaiting Timing"
          value={`${stats.awaiting}`}
          subtitle="In Progress / Incomplete"
          icon={AlertTriangle}
          badge={{ text: 'Pending', variant: 'amber' }}
        />

        <MetricCard
          label="Top 24 Cutoff"
          value={`${stats.qualified}`}
          subtitle={data?.config.isFinalized ? 'Advanced to Cabo' : 'Eligible to Advance'}
          icon={Trophy}
          badge={{
            text: data?.config.isFinalized ? 'Sealed' : 'Provisional',
            variant: 'purple',
          }}
        />

        <MetricCard
          label="Elimination"
          value={`${stats.eliminated}`}
          subtitle="Slowest 8 Teams"
          icon={ShieldAlert}
          badge={{ text: 'Eliminated', variant: 'amber' }}
        />
      </div>

      {/* Cutoff & Tie Warning Banner */}
      {data?.engine.tiesCount ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Tie-Breaker Active:</span>
            <p className="mt-0.5 leading-relaxed">
              Teams with equal adjusted totals are sorted by their <strong>fastest single mini-round duration</strong>. 
              If any teams remain identical and affect the 24th qualification cutoff, finalization is blocked until manual marshal review.
            </p>
          </div>
        </div>
      ) : null}

      {!data?.config.isFinalized && !data?.engine.canFinalize && data?.engine.blockReason && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              <strong>Finalization Standby:</strong> {data.engine.blockReason}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Provisional Standings Active
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search squad name or tag (T-01)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Standings:</span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">All Standings</option>
              <option value="qualified">Top 24 (Advancing)</option>
              <option value="eliminated">Ranks 25-32 (Elimination)</option>
              <option value="incomplete">Incomplete Only</option>
              <option value="tied">Tied Teams Only</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Progress:</span>
            <select
              value={filterProgress}
              onChange={(e) => {
                setFilterProgress(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">All Progress States</option>
              <option value="completed">All 3 Mini-Rounds Done</option>
              <option value="inProgress">In Progress</option>
              <option value="notStarted">Not Started</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Timing Standings Table */}
      <Card className="border-slate-200/80">
        <CardHeader
          title="Round 1 Leaderboard &amp; Mini-Round Timing Grid"
          subtitle={`Showing ${paginatedRecords.length} of ${filteredAndSortedRecords.length} squads &middot; Penalty: ${configPenaltyMinutes}m per hint &middot; Top 24 advance`}
          action={
            data?.engine.top24CutoffTime ? (
              <span className="text-xs font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg">
                24th Cutoff: <strong>{formatDuration(data.engine.top24CutoffTime)}</strong>
              </span>
            ) : null
          }
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  <th
                    className="py-3 px-4 w-16 text-center cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort('rank')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Rank</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Squad</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Mini-Round 1</th>
                  <th className="py-3 px-3 text-center">Mini-Round 2</th>
                  <th className="py-3 px-3 text-center">Mini-Round 3</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort('rawTotalSeconds')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Raw Total</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">
                    <div>
                      <div className="flex items-center gap-1">
                        <span>Hint Penalties</span>
                        <span
                          className="text-[9px] font-semibold text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded border border-amber-200 uppercase tracking-tight"
                          title="Rule unconfirmed by organizers: Currently using a demo default of 120s (2 min) per hint"
                        >
                          Demo Default
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal block">
                        +{configPenaltyMinutes}m/hint (unconfirmed)
                      </span>
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort('adjustedTotalSeconds')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Adjusted Time</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Qualification</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={10} />)
                ) : paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12">
                      <EmptyState
                        icon={Compass}
                        title="No Squad Timing Found"
                        description="No records match your filter criteria."
                        action={{
                          label: 'Clear Filters',
                          onClick: () => {
                            setSearchQuery('');
                            setFilterStatus('all');
                            setFilterProgress('all');
                          },
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((rec) => {
                    const rankNum = rec.rank ?? null;
                    const isCutoffLine = rankNum === 24;
                    const isBeyondCutoff = rankNum !== null && rankNum > 24;

                    return (
                      <tr
                        key={rec.teamId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCutoffLine ? 'border-b-2 border-purple-400 bg-purple-50/20' : ''
                        } ${isBeyondCutoff ? 'opacity-85' : ''}`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {rec.rank ? (
                            rec.rank <= 3 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                                {rec.rank}
                              </span>
                            ) : (
                              <span className="text-slate-700">#{rec.rank}</span>
                            )
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Squad */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleOpenManageTiming(rec)}
                            className="font-semibold text-slate-900 hover:text-blue-600 text-left transition-colors cursor-pointer"
                          >
                            {rec.teamName}
                          </button>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {formatTeamNumber(rec.teamNumber)}
                          </div>
                        </td>

                        {/* Mini-Round 1 */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                              rec.miniRounds[0].status === 'Completed'
                                ? 'bg-slate-100 text-slate-700 font-medium'
                                : rec.miniRounds[0].status === 'In Progress'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'text-slate-300'
                            }`}
                          >
                            {rec.miniRounds[0].status === 'Completed'
                              ? formatDuration(rec.miniRounds[0].durationSeconds)
                              : rec.miniRounds[0].status === 'In Progress'
                              ? 'In Progress'
                              : 'Not Started'}
                          </span>
                        </td>

                        {/* Mini-Round 2 */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                              rec.miniRounds[1].status === 'Completed'
                                ? 'bg-slate-100 text-slate-700 font-medium'
                                : rec.miniRounds[1].status === 'In Progress'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'text-slate-300'
                            }`}
                          >
                            {rec.miniRounds[1].status === 'Completed'
                              ? formatDuration(rec.miniRounds[1].durationSeconds)
                              : rec.miniRounds[1].status === 'In Progress'
                              ? 'In Progress'
                              : 'Not Started'}
                          </span>
                        </td>

                        {/* Mini-Round 3 */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                              rec.miniRounds[2].status === 'Completed'
                                ? 'bg-slate-100 text-slate-700 font-medium'
                                : rec.miniRounds[2].status === 'In Progress'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'text-slate-300'
                            }`}
                          >
                            {rec.miniRounds[2].status === 'Completed'
                              ? formatDuration(rec.miniRounds[2].durationSeconds)
                              : rec.miniRounds[2].status === 'In Progress'
                              ? 'In Progress'
                              : 'Not Started'}
                          </span>
                        </td>

                        {/* Raw Total */}
                        <td className="py-3 px-4 font-mono font-medium text-slate-600">
                          {formatDuration(rec.rawTotalSeconds)}
                        </td>

                        {/* Hint Penalties */}
                        <td className="py-3 px-3">
                          {rec.totalPenaltySeconds > 0 ? (
                            <span
                              className="font-mono text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 cursor-help"
                              title={`Calculated with demo default of ${Math.round((data?.config?.penaltyPerHintSeconds || 120) / 60)}m per hint (rule unconfirmed by organizers)`}
                            >
                              +{Math.round(rec.totalPenaltySeconds / 60)}m ({Math.round(rec.totalPenaltySeconds / (data?.config?.penaltyPerHintSeconds || 120))} hints)
                            </span>
                          ) : (
                            <span
                              className="text-slate-400 font-mono cursor-help"
                              title="No hints requested"
                            >
                              0m
                            </span>
                          )}
                        </td>

                        {/* Adjusted Total */}
                        <td className="py-3 px-4">
                          <span
                            className={`font-mono font-bold text-xs ${
                              rec.adjustedTotalSeconds !== null
                                ? 'text-blue-600'
                                : 'text-slate-400 font-normal'
                            }`}
                          >
                            {formatDuration(rec.adjustedTotalSeconds)}
                          </span>
                        </td>

                        {/* Qualification Status */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5">
                            {getStatusBadge(rec.qualificationStatus, rec.tieRequiresReview)}
                            {rec.tieRequiresReview && rec.tieReason && (
                              <span
                                className="text-[10px] text-amber-700 truncate max-w-[140px]"
                                title={rec.tieReason}
                              >
                                {rec.tieReason}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenManageTiming(rec)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Timing
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredAndSortedRecords.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* ========================================== */}
      {/* 1. Timing Management Modal                 */}
      {/* ========================================== */}
      {selectedRecord && (
        <Modal
          isOpen={isManageTimingOpen}
          onClose={() => setIsManageTimingOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <span className="font-mono text-blue-600">
                {formatTeamNumber(selectedRecord.teamNumber)}
              </span>
              <span>{selectedRecord.teamName}</span>
              <span className="text-xs font-normal text-slate-400">&middot; Mini-Round Timing Console</span>
            </div>
          }
          subtitle={`Current Adjusted Time: ${formatDuration(selectedRecord.adjustedTotalSeconds)} · Rank: ${selectedRecord.rank ? `#${selectedRecord.rank}` : 'Unranked'}`}
          maxWidth="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-[11px] text-slate-500 font-mono">
                {data?.config.isFinalized ? 'Results sealed (Read-only)' : 'Live marshal timing entry'}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsManageTimingOpen(false)}>
                  Close
                </Button>
                {!data?.config.isFinalized && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveMiniRoundTiming}
                    isLoading={isSubmitting}
                  >
                    Save Mini-Round {activeMiniRoundTab}
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Mini-Round Tabs */}
            <div className="flex border-b border-slate-200">
              {([1, 2, 3] as const).map((num) => {
                const mr = selectedRecord.miniRounds[num - 1];
                const isActive = activeMiniRoundTab === num;
                return (
                  <button
                    key={num}
                    onClick={() => handleTabChange(num)}
                    className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>Mini-Round {num}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        mr.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : mr.status === 'In Progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {mr.status === 'Completed'
                        ? formatDuration(mr.durationSeconds)
                        : mr.status}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Error banner */}
            {timingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{timingError}</span>
              </div>
            )}

            {/* Timing Inputs Form */}
            <form onSubmit={handleSaveMiniRoundTiming} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Start Timestamp (HH:mm:ss)
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={timingStartTime}
                    onChange={(e) => setTimingStartTime(e.target.value)}
                    disabled={data?.config.isFinalized}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Recorded when team unlocks initial envelope clue
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Completion Timestamp (HH:mm:ss)
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={timingEndTime}
                    onChange={(e) => setTimingEndTime(e.target.value)}
                    disabled={data?.config.isFinalized}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Recorded when final puzzle answer verified
                  </span>
                </div>
              </div>

              {/* Checkpoints Arrival Times */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-700 text-xs flex items-center justify-between">
                  <span>Volunteer Checkpoint Arrival Timestamps</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional intermediate logs</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {data?.config.checkpointNames.map((name, i) => (
                    <div key={i}>
                      <label className="block text-[11px] text-slate-600 mb-1 truncate" title={name}>
                        {name}
                      </label>
                      <input
                        type="time"
                        step="1"
                        value={timingCheckpoints[i] || ''}
                        onChange={(e) => {
                          const updated = [...timingCheckpoints];
                          updated[i] = e.target.value;
                          setTimingCheckpoints(updated);
                        }}
                        disabled={data?.config.isFinalized}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Hints & Penalties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hints Requested in Mini-Round {activeMiniRoundTab}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={timingHints}
                      onChange={(e) => setTimingHints(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      disabled={data?.config.isFinalized}
                      className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-slate-500 text-[11px]">
                      &times; {configPenaltyMinutes} mins penalty per hint
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-700 block mt-1">
                    * Using demo default ({configPenaltyMinutes}m / hint) — unconfirmed rule
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px]">
                  <div>Hint Penalty Added: <strong>+{timingHints * configPenaltyMinutes} minutes</strong></div>
                  <div className="text-amber-800 mt-0.5 opacity-90">
                    Adjusted time = Duration + ({timingHints} &times; {configPenaltyMinutes}m)
                  </div>
                  <div className="text-[10px] text-amber-600 mt-1 font-medium">
                    Note: Official penalty duration not yet confirmed by organizers.
                  </div>
                </div>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ========================================== */}
      {/* 2. Round 1 Config & Clue Modal             */}
      {/* ========================================== */}
      <Modal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Round 1 Parameters &amp; Hidden Code Fragment"
        subtitle="Manage configurable penalties, checkpoint stations, and hidden clue recovery"
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsConfigOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveConfig} isLoading={isSubmitting}>
              Save Configuration
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
          {/* Unconfirmed Tournament Rules Alert */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Organizer Notice: Unconfirmed Tournament Rules &amp; Placeholders</span>
            </div>
            <ul className="text-[11px] text-amber-800 space-y-1 list-disc list-inside leading-relaxed">
              <li>
                <strong>Hint Penalty</strong>: The penalty of <strong>{configPenaltyMinutes} minutes (120s)</strong> per hint is a <em>demo default only</em>. The official tournament penalty duration is not confirmed by organizers and can be adjusted below.
              </li>
              <li>
                <strong>Checkpoint Locations</strong>: Station names are initialized with generic placeholders (<code>Checkpoint 1 [Location TBD]</code>). Replace them below with actual rooms, labs, or buildings once confirmed by the organizing committee.
              </li>
            </ul>
          </div>

          {/* Hint Penalty Configuration */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Penalty Per Hint (Minutes)
              </label>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded border border-amber-200">
                Demo Default &middot; Unconfirmed Rule
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="30"
                value={configPenaltyMinutes}
                onChange={(e) => setConfigPenaltyMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-slate-500 text-[11px]">
                Minutes added to raw duration for each hint requested
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Default value is 2 minutes (120s) for demonstration purposes until confirmed by organizers.
            </span>
          </div>

          {/* Station Checkpoint Names */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Checkpoint Station Names / Placeholders (Configurable)
              </label>
              <span className="text-[10px] text-slate-400">
                Update when official stations are confirmed
              </span>
            </div>
            <div className="space-y-2">
              {configCheckpointNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 text-xs w-6 text-center">#{i + 1}</span>
                  <input
                    type="text"
                    value={name}
                    placeholder={`e.g. Checkpoint ${i + 1} [Location TBD] or Official Room/Station`}
                    onChange={(e) => {
                      const updated = [...configCheckpointNames];
                      updated[i] = e.target.value;
                      setConfigCheckpointNames(updated);
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Do not enter unverified campus locations until confirmed by the organizers.
            </span>
          </div>

          {/* Hidden Code Fragment Restricted Field */}
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-purple-900 text-xs">
                <KeyRound className="w-4 h-4 text-purple-700" />
                <span>Restricted: Round 1 Hidden Code Fragment #01</span>
              </div>
              <span className="text-[10px] bg-purple-200/70 text-purple-900 font-semibold px-2 py-0.5 rounded">
                Organizer Only
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configHiddenCodeRecovered}
                  onChange={(e) => setConfigHiddenCodeRecovered(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                />
                <span className="font-semibold text-slate-800">
                  Fragment Recovered / Claimed
                </span>
              </label>
            </div>

            {configHiddenCodeRecovered && (
              <div>
                <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                  Claimed By Squad:
                </label>
                <select
                  value={configHiddenCodeTeamId}
                  onChange={(e) => setConfigHiddenCodeTeamId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="">Select Squad...</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {formatTeamNumber(t.teamNumber)} — {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                Marshal Verification Notes:
              </label>
              <input
                type="text"
                placeholder="Notes on physical clue recovery..."
                value={configHiddenCodeNotes}
                onChange={(e) => setConfigHiddenCodeNotes(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* 3. Finalize Qualification Dialog           */}
      {/* ========================================== */}
      <ConfirmationDialog
        isOpen={isFinalizeConfirmOpen}
        onClose={() => setIsFinalizeConfirmOpen(false)}
        onConfirm={handleFinalizeRound1}
        title="Finalize Round 1 Qualification Results"
        message={
          <div className="space-y-2 text-xs">
            <p>
              Are you sure you want to seal the official results for <strong>Round 1: The Great Expedition</strong>?
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li>
                <strong>Exactly 24 squads</strong> will be marked Qualified and advanced to <strong>Round 2: Cabo</strong>.
              </li>
              <li>
                The <strong>slowest 8 squads</strong> will be officially Eliminated.
              </li>
              <li>
                Round 1 status will transition to <strong>Completed</strong> and Round 2 will become <strong>Live</strong>.
              </li>
            </ul>
            <p className="text-amber-700 font-semibold mt-2">
              This action will permanently persist the qualification outcome in the tournament state.
            </p>
          </div>
        }
        confirmLabel="Finalize & Advance 24 Squads"
        cancelLabel="Cancel"
        isDestructive={false}
        isLoading={isSubmitting}
      />
    </div>
  );
}
