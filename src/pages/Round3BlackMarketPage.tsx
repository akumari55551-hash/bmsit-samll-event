import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  Coins,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Search,
  ArrowUpDown,
  Settings,
  Sparkles,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Plus,
  QrCode,
  KeyRound,
  Check,
  X,
  Info,
  Shield,
  Sliders,
  History,
  Ban,
  Filter,
} from 'lucide-react';
import { eventService } from '../services/eventService';
import {
  Round3Data,
  BlackMarketTransaction,
  BlackMarketRankingMetric,
  BlackMarketScoringDirection,
  Round3QualificationStatus,
} from '../types/round3';
import { formatTeamNumber } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

type TabView = 'leaderboard' | 'economy' | 'hidden_code';
type SortField = 'rank' | 'teamNumber' | 'name' | 'currentBalance' | 'totalEarned' | 'totalSpent' | 'fragments';

export const Round3BlackMarketPage: React.FC = () => {
  // Data State
  const [data, setData] = useState<Round3Data | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<TabView>('leaderboard');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCodeStatus, setFilterCodeStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Economy Tab Squad Selection
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('all');

  // Modals
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isRecordTxModalOpen, setIsRecordTxModalOpen] = useState(false);
  const [isReversalModalOpen, setIsReversalModalOpen] = useState(false);
  const [isLogFragmentModalOpen, setIsLogFragmentModalOpen] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Form States
  // Rules Config Form
  const [configForm, setConfigForm] = useState<{
    startingBalance: number;
    allowNegativeBalance: boolean;
    rankingMetric: BlackMarketRankingMetric;
    scoringDirection: BlackMarketScoringDirection;
    isScoringConfigured: boolean;
    isRequiredForQualification: boolean;
    requiredFragmentCount: number | null;
    isCodeConfigured: boolean;
    instructionsNote: string;
  }>({
    startingBalance: 100,
    allowNegativeBalance: false,
    rankingMetric: 'current_balance',
    scoringDirection: 'higher_is_better',
    isScoringConfigured: false,
    isRequiredForQualification: false,
    requiredFragmentCount: 2,
    isCodeConfigured: false,
    instructionsNote: '',
  });

  // Record Transaction Form
  const [txForm, setTxForm] = useState<{
    teamId: string;
    type: 'earn' | 'spend' | 'adjustment';
    amount: number;
    adjustmentSign: 'credit' | 'debit';
    reason: string;
    organizerRef: string;
    notes: string;
  }>({
    teamId: '',
    type: 'earn',
    amount: 25,
    adjustmentSign: 'credit',
    reason: '',
    organizerRef: 'Market-Ops',
    notes: '',
  });

  // Reversal Form
  const [targetReversalTx, setTargetReversalTx] = useState<BlackMarketTransaction | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversalOrganizerRef, setReversalOrganizerRef] = useState('Chief-Auditor');

  // Log Fragment Form
  const [fragmentForm, setFragmentForm] = useState<{
    teamId: string;
    fragmentIndex: number;
    notes: string;
    organizerRef: string;
  }>({
    teamId: '',
    fragmentIndex: 1,
    notes: '',
    organizerRef: 'Checkpoint-Marshal',
  });

  // Operational feedback states
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await eventService.getRound3Data();
      setData(res);

      // Initialize config form from loaded data
      setConfigForm({
        startingBalance: res.config.startingBalance,
        allowNegativeBalance: res.config.allowNegativeBalance,
        rankingMetric: res.config.rankingMetric,
        scoringDirection: res.config.scoringDirection,
        isScoringConfigured: res.config.isScoringConfigured,
        isRequiredForQualification: res.config.hiddenCodeConfig.isRequiredForQualification,
        requiredFragmentCount: res.config.hiddenCodeConfig.requiredFragmentCount ?? 2,
        isCodeConfigured: res.config.hiddenCodeConfig.isConfigured,
        instructionsNote: res.config.hiddenCodeConfig.instructionsNote || '',
      });

      // Set default team in txForm if not set
      if (!txForm.teamId && res.records.length > 0) {
        setTxForm((prev) => ({ ...prev, teamId: res.records[0].teamId }));
      }
      if (!fragmentForm.teamId && res.records.length > 0) {
        setFragmentForm((prev) => ({ ...prev, teamId: res.records[0].teamId }));
      }
    } catch (err: any) {
      console.error('Failed to load Round 3 data:', err);
      setActionError(err.message || 'Failed to load Round 3 data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = eventService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // Filtered and Sorted Records for Leaderboard
  const processedRecords = useMemo(() => {
    if (!data) return [];

    let filtered = [...data.records];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.teamName.toLowerCase().includes(q) ||
          r.teamNumber.toString().includes(q) ||
          formatTeamNumber(r.teamNumber).toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((r) => r.qualificationStatus === filterStatus);
    }

    // Code status filter
    if (filterCodeStatus === 'complete') {
      filtered = filtered.filter((r) => r.codeRecord.isComplete);
    } else if (filterCodeStatus === 'incomplete') {
      filtered = filtered.filter((r) => !r.codeRecord.isComplete);
    }

    // Custom sorting if user clicked column header
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'rank':
          comparison = (a.rank ?? 999) - (b.rank ?? 999);
          break;
        case 'teamNumber':
          comparison = a.teamNumber - b.teamNumber;
          break;
        case 'name':
          comparison = a.teamName.localeCompare(b.teamName);
          break;
        case 'currentBalance':
          comparison = a.ledger.currentBalance - b.ledger.currentBalance;
          break;
        case 'totalEarned':
          comparison = a.ledger.totalEarned - b.ledger.totalSpent;
          break;
        case 'totalSpent':
          comparison = a.ledger.totalSpent - b.ledger.totalSpent;
          break;
        case 'fragments':
          comparison = a.codeRecord.fragments.length - b.codeRecord.fragments.length;
          break;
        default:
          comparison = (a.rank ?? 999) - (b.rank ?? 999);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [data, searchQuery, filterStatus, filterCodeStatus, sortField, sortOrder]);

  // Filtered Transactions for Economy Tab
  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    let list = [...data.transactions];

    if (selectedTeamId !== 'all') {
      list = list.filter((t) => t.teamId === selectedTeamId);
    }

    if (txTypeFilter !== 'all') {
      list = list.filter((t) => t.type === txTypeFilter);
    }

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [data, selectedTeamId, txTypeFilter]);

  // Selected squad ledger info
  const activeSelectedLedger = useMemo(() => {
    if (!data || selectedTeamId === 'all') return null;
    const rec = data.records.find((r) => r.teamId === selectedTeamId);
    return rec ? rec.ledger : null;
  }, [data, selectedTeamId]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSaveRulesConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);
    try {
      await eventService.updateRound3Config({
        startingBalance: Number(configForm.startingBalance),
        allowNegativeBalance: configForm.allowNegativeBalance,
        rankingMetric: configForm.rankingMetric,
        scoringDirection: configForm.scoringDirection,
        isScoringConfigured: configForm.isScoringConfigured,
        hiddenCodeConfig: {
          isRequiredForQualification: configForm.isRequiredForQualification,
          requiredFragmentCount: configForm.isCodeConfigured ? Number(configForm.requiredFragmentCount) : null,
          isConfigured: configForm.isCodeConfigured,
          instructionsNote: configForm.instructionsNote,
        },
      });
      setActionSuccess('Round 3 economy rules and scoring configuration updated successfully.');
      setIsRulesModalOpen(false);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update configuration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);
    try {
      let finalAmount = Number(txForm.amount);
      if (txForm.type === 'adjustment' && txForm.adjustmentSign === 'debit') {
        finalAmount = -Math.abs(finalAmount);
      }

      await eventService.recordBlackMarketTransaction({
        teamId: txForm.teamId,
        type: txForm.type,
        amount: finalAmount,
        reason: txForm.reason,
        organizerRef: txForm.organizerRef,
        notes: txForm.notes,
      });

      setActionSuccess('Transaction successfully recorded in the audit ledger.');
      setIsRecordTxModalOpen(false);
      setTxForm((prev) => ({ ...prev, reason: '', notes: '', amount: 25 }));
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to record transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReversal = (tx: BlackMarketTransaction) => {
    setTargetReversalTx(tx);
    setReversalReason('');
    setReversalOrganizerRef('Chief-Auditor');
    setIsReversalModalOpen(true);
  };

  const handleExecuteReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetReversalTx) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      await eventService.reverseBlackMarketTransaction(
        targetReversalTx.id,
        reversalReason,
        reversalOrganizerRef
      );
      setActionSuccess(`Transaction ${targetReversalTx.id} reversed with compensating audit entry.`);
      setIsReversalModalOpen(false);
      setTargetReversalTx(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reverse transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogFragment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);
    try {
      await eventService.recordTeamCodeFragment(
        fragmentForm.teamId,
        Number(fragmentForm.fragmentIndex),
        fragmentForm.notes,
        fragmentForm.organizerRef
      );
      setActionSuccess(`Fragment #${fragmentForm.fragmentIndex} logged successfully.`);
      setIsLogFragmentModalOpen(false);
      setFragmentForm((prev) => ({ ...prev, notes: '' }));
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to record code fragment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFragment = async (teamId: string, fragmentIndex: number) => {
    if (!window.confirm(`Remove Fragment #${fragmentIndex} record for this squad?`)) return;
    try {
      await eventService.removeTeamCodeFragment(teamId, fragmentIndex);
      setActionSuccess(`Fragment #${fragmentIndex} removed.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove fragment.');
    }
  };

  const handleVerifyCode = async (teamId: string) => {
    try {
      await eventService.verifyTeamCode(teamId, 'Chief-Marshal');
      setActionSuccess('Squad hidden code officially stamped and verified.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to verify code.');
    }
  };

  const handleFinalizeRound3 = async () => {
    setActionError(null);
    setIsSubmitting(true);
    try {
      const res = await eventService.finalizeRound3();
      setActionSuccess(
        `Round 3 finalized! Exactly ${res.qualifiedTeamsCount} teams have qualified for Round 4: The Legal Battle.`
      );
      setIsFinalizeDialogOpen(false);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to finalize Round 3.');
      setIsFinalizeDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetLedgers = async () => {
    setActionError(null);
    setIsSubmitting(true);
    try {
      await eventService.resetRound3Ledger();
      setActionSuccess('All Black Market ledgers and code progress have been reset.');
      setIsResetDialogOpen(false);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reset ledgers.');
      setIsResetDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateFieldData = async () => {
    if (!window.confirm('Generate comprehensive demo trading transactions, audited reversals, and fragment recoveries for all 12 teams?')) return;
    try {
      await eventService.simulateRound3Field();
      setActionSuccess('Demo economy data applied for all 12 squads with confirmed rules.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Simulation failed.');
    }
  };

  // Helper for rendering status badge
  const renderStatusBadge = (status: Round3QualificationStatus) => {
    switch (status) {
      case 'Finalized Qualified':
        return <Badge variant="success" size="sm" dot>Round 4 Finalist</Badge>;
      case 'Finalized Eliminated':
        return <Badge variant="danger" size="sm">Eliminated (R3)</Badge>;
      case 'Provisional Top 8':
        return <Badge variant="primary" size="sm" dot>Provisional Top 8</Badge>;
      case 'Provisional Cutoff':
        return <Badge variant="neutral" size="sm">Provisional Cutoff</Badge>;
      case 'Tie Review Needed':
        return <Badge variant="danger" size="sm" dot>Tie Review Needed</Badge>;
      case 'Code Incomplete':
        return <Badge variant="warning" size="sm">Code Incomplete</Badge>;
      case 'Standings Provisional':
        return <Badge variant="warning" size="sm">Rules Pending</Badge>;
      case 'Round 2 Pending':
        return <Badge variant="neutral" size="sm">R2 Pending</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  // Helper for rank indicator
  const renderRankBadge = (rank: number | null | undefined) => {
    if (rank === null || rank === undefined) {
      return <span className="text-slate-400 font-mono text-xs">-</span>;
    }
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1">
          <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-black text-xs flex items-center justify-center shadow-xs">
            1
          </span>
          <span className="text-[10px] font-bold text-amber-700 uppercase">Lead</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1">
          <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center">
            2
          </span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1">
          <span className="w-5 h-5 rounded-full bg-amber-700/60 text-white font-bold text-xs flex items-center justify-center">
            3
          </span>
        </div>
      );
    }
    if (rank <= 8) {
      return (
        <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-700 font-mono font-bold text-xs flex items-center justify-center border border-blue-200">
          #{rank}
        </span>
      );
    }
    return (
      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 font-mono text-xs flex items-center justify-center border border-slate-200">
        #{rank}
      </span>
    );
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-white rounded-xl border border-slate-200/80 animate-pulse p-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200/80 animate-pulse" />
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { config, stats, engine, round2Finalized, round2QualifiedTeamsCount } = data;
  const isCutoffTie = engine.tiesAffectingCutoff;
  const rank8Team = data.records.find((r) => r.rank === 8);
  const cutoffThresholdScore = rank8Team ? rank8Team.ledger.currentBalance : null;

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Operations Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Coins className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Round 3: The Black Market
            </h2>
            {config.isFinalized ? (
              <Badge variant="success" size="sm" dot>
                Official Results Sealed
              </Badge>
            ) : !round2Finalized ? (
              <Badge variant="warning" size="sm" dot>
                Standby · Round 2 Pending
              </Badge>
            ) : config.isScoringConfigured ? (
              <Badge variant="primary" size="sm" dot>
                Market Operations Live
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" dot>
                Rules Unconfirmed (Demo Defaults)
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Points-based economy, transaction audit ledgers & hidden code verification · 12 Cabo qualifiers compete &rarr; Top 8 advance to Legal Battle
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Settings className="w-3.5 h-3.5" />}
            onClick={() => setIsRulesModalOpen(true)}
            title="Configure economy starting balance, scoring formulas and code rules"
          >
            Economy & Rules
          </Button>

          {!config.isFinalized && (
            <>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsRecordTxModalOpen(true)}
                title="Record an Earn, Spend or Adjustment transaction"
              >
                Record Transaction
              </Button>

              <Button
                size="sm"
                variant="outline"
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                onClick={handleSimulateFieldData}
                title="Populate test transactions and codes for all 12 teams"
              >
                Simulate Data
              </Button>

              <Button
                size="sm"
                variant="outline"
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-500" />}
                onClick={() => setIsResetDialogOpen(true)}
                title="Clear transactions and reset ledgers"
              >
                Reset
              </Button>

              <Button
                size="sm"
                variant="primary"
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={() => setIsFinalizeDialogOpen(true)}
                disabled={!engine.canFinalize}
                className={!engine.canFinalize ? 'opacity-60 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}
                title={engine.blockReason || 'Finalize official Top 8 qualification to Round 4'}
              >
                Finalize Top 8
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 2. System Alerts & Warnings */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Round 2 Pending Banner */}
      {!round2Finalized && (
        <div className="bg-amber-50 border border-amber-300/90 text-amber-900 p-4 rounded-xl flex items-start justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-bold text-amber-950 flex items-center gap-2">
                ROUND 2 (CABO) NOT FINALIZED · PROVISIONAL FIELD SHOWN
                <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-semibold uppercase">
                  Safeguard Active
                </span>
              </div>
              <p className="mt-1 text-amber-800 leading-relaxed">
                Round 3 consumes the top 12 squads qualified from finalized Round 2 results. Currently, provisional Cabo standings are displayed. 
                Official qualification and advancement to Round 4 are <strong>strictly blocked</strong> until Round 2 is officially sealed.
              </p>
            </div>
          </div>
          <Link to="/round-2" className="flex-shrink-0">
            <Button size="sm" variant="outline" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
              Go to Cabo Console
            </Button>
          </Link>
        </div>
      )}

      {/* Eligible Teams Discrepancy Alert */}
      {round2Finalized && round2QualifiedTeamsCount !== 12 && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded-xl flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-bold">TOURNAMENT DISCREPANCY: PARTICIPATING SQUADS COUNT</div>
            <p className="mt-0.5">
              Official tournament rules mandate exactly 12 teams advance from Round 2. Detected {round2QualifiedTeamsCount} qualifying squads.
              Organizer review is required.
            </p>
          </div>
        </div>
      )}

      {/* Cutoff Boundary Tie Warning */}
      {isCutoffTie && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded-xl flex items-start gap-3 text-xs shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-bold flex items-center gap-1.5">
              CRITICAL CUTOFF TIE DETECTED ACROSS RANK #8
              <Badge variant="danger" size="sm">Finalization Blocked</Badge>
            </div>
            <p className="mt-1 leading-relaxed">
              Two or more teams share identical points across the 8th-place qualification boundary (e.g. spanning Rank #8 and Rank #9).
              In accordance with official rules, no arbitrary tie-breaker is applied automatically. Manual marshal review and recorded tie-breaking procedures are required.
            </p>
          </div>
        </div>
      )}

      {/* Rules Confirmation Warning */}
      {round2Finalized && !config.isScoringConfigured && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3.5 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div>
              <span className="font-bold mr-1.5">(Demo Default · Unconfirmed Rule):</span>
              <span>
                Starting balance ({config.startingBalance} pts), scoring metric ({config.rankingMetric.replace('_', ' ')}), and direction are running on demo defaults.
              </span>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setIsRulesModalOpen(true)}>
            Review & Confirm Rules
          </Button>
        </div>
      )}

      {/* 3. Operational KPI Metric Cards (6 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-slate-200/80">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trading Field</span>
              <Coins className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">{data.records.length} Teams</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Top 12 from Cabo</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Volume</span>
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-600 mt-1">{stats.totalVolumeTransacted} pts</div>
            <p className="text-[10px] text-slate-500 mt-0.5">{stats.totalTransactionsCount} total operations</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Advancing Cutoff</span>
              <Trophy className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 mt-1">Top 8 Squads</div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {cutoffThresholdScore !== null ? `Rank #8: ${cutoffThresholdScore} pts` : 'Calculating...'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Elimination Zone</span>
              <Ban className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-xl font-bold font-mono text-rose-600 mt-1">4 Squads</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Records preserved</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Code Verification</span>
              <QrCode className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-xl font-bold font-mono text-purple-600 mt-1">
              {stats.codeCompletedCount} / {data.records.length}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              {config.hiddenCodeConfig.isConfigured
                ? `${config.hiddenCodeConfig.requiredFragmentCount} fragments req.`
                : 'Requirements unconfigured'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deficit Policy</span>
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-bold font-mono text-indigo-600 mt-1">
              {config.allowNegativeBalance ? 'Allowed' : 'Strict 0'}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {config.allowNegativeBalance ? 'Deficits permitted' : 'Overdrafts blocked'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Tab Navigation Switcher */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard & Advancement Cutoff</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-mono text-slate-600">
              {data.records.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('economy')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'economy'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Points Economy & Audit Ledger</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-mono text-slate-600">
              {data.transactions.length} tx
            </span>
          </button>

          <button
            onClick={() => setActiveTab('hidden_code')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'hidden_code'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-600" />
            <span>Hidden Code Tracker</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-mono border border-purple-200">
              Confidential
            </span>
          </button>
        </div>

        {/* Global rule indicator */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400">
          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
            Metric: {config.rankingMetric.replace('_', ' ')}
          </span>
          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
            Direction: {config.scoringDirection === 'higher_is_better' ? 'Higher wins' : 'Lower wins'}
          </span>
        </div>
      </div>

      {/* 5. Tab Content Views */}

      {/* TAB 1: LEADERBOARD & ADVANCEMENT CUTOFF */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Controls: Search & Filter */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search squad name or number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Qualification Statuses</option>
                <option value="Provisional Top 8">Provisional Top 8</option>
                <option value="Provisional Cutoff">Provisional Cutoff (9-12)</option>
                <option value="Tie Review Needed">Tie Review Needed</option>
                <option value="Code Incomplete">Code Incomplete</option>
                <option value="Finalized Qualified">Finalized Qualified</option>
                <option value="Finalized Eliminated">Finalized Eliminated</option>
              </select>

              <select
                value={filterCodeStatus}
                onChange={(e) => setFilterCodeStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Code Statuses</option>
                <option value="complete">Code Verified / Complete</option>
                <option value="incomplete">Code Incomplete</option>
              </select>
            </div>
          </div>

          {/* Standings Table */}
          <Card className="border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                      onClick={() => handleSort('rank')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Rank</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                      onClick={() => handleSort('teamNumber')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Squad</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors text-right"
                      onClick={() => handleSort('currentBalance')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Current Balance</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right">Earned (+)</th>
                    <th className="py-3 px-3 text-right">Spent (-)</th>
                    <th className="py-3 px-3 text-right">Net Adj</th>
                    <th className="py-3 px-4 text-center">Hidden Code Status</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8">
                        <EmptyState
                          icon={Coins}
                          title="No squads found"
                          description="No participating teams match the active filters or search criteria."
                        />
                      </td>
                    </tr>
                  ) : (
                    processedRecords.map((rec) => {
                      const isAfterCutoff = rec.rank !== null && rec.rank !== undefined && rec.rank === 9;
                      const isTop8 = rec.rank !== null && rec.rank !== undefined && rec.rank <= 8;

                      return (
                        <React.Fragment key={rec.teamId}>
                          {/* Cutoff Demarcation Line before Rank 9 */}
                          {isAfterCutoff && (
                            <tr className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50/20 border-y-2 border-purple-400">
                              <td colSpan={9} className="py-2.5 px-4">
                                <div className="flex items-center justify-between text-[11px] font-bold text-purple-900">
                                  <div className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-purple-600" />
                                    <span>ROUND 4 QUALIFICATION CUTOFF (TOP 8 ADVANCE TO THE LEGAL BATTLE)</span>
                                  </div>
                                  <span className="text-[10px] uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded border border-purple-200">
                                    Bottom 4 Eliminated (Records Preserved)
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )}

                          <tr
                            className={`transition-colors ${
                              rec.tieRequiresReview
                                ? 'bg-rose-50/60 hover:bg-rose-50'
                                : isTop8
                                ? 'hover:bg-blue-50/30'
                                : 'hover:bg-slate-50/70 bg-slate-50/30'
                            }`}
                          >
                            {/* Rank */}
                            <td className="py-3 px-4">
                              {renderRankBadge(rec.rank)}
                            </td>

                            {/* Squad Number & Name */}
                            <td className="py-3 px-4 font-medium text-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-bold text-blue-600">
                                  {formatTeamNumber(rec.teamNumber)}
                                </span>
                                <span className="truncate max-w-[180px] font-semibold text-slate-900" title={rec.teamName}>
                                  {rec.teamName}
                                </span>
                              </div>
                              {rec.tieReason && (
                                <p className="text-[10px] text-rose-600 mt-0.5 flex items-center gap-1 font-sans">
                                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate max-w-[280px]" title={rec.tieReason}>
                                    {rec.tieReason}
                                  </span>
                                </p>
                              )}
                            </td>

                            {/* Current Balance */}
                            <td className="py-3 px-4 text-right">
                              <span className="font-mono text-sm font-black text-slate-900 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/80">
                                {rec.ledger.currentBalance} <span className="text-[10px] font-normal text-slate-500">pts</span>
                              </span>
                            </td>

                            {/* Total Earned */}
                            <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold">
                              +{rec.ledger.totalEarned}
                            </td>

                            {/* Total Spent */}
                            <td className="py-3 px-3 text-right font-mono text-amber-600 font-semibold">
                              -{rec.ledger.totalSpent}
                            </td>

                            {/* Net Adjustments */}
                            <td className="py-3 px-3 text-right font-mono text-slate-600">
                              {rec.ledger.netAdjustments > 0 ? `+${rec.ledger.netAdjustments}` : rec.ledger.netAdjustments}
                            </td>

                            {/* Hidden Code Status */}
                            <td className="py-3 px-4 text-center">
                              {!config.hiddenCodeConfig.isConfigured ? (
                                <Badge variant="neutral" size="sm">
                                  Requirements TBD
                                </Badge>
                              ) : rec.codeRecord.isComplete ? (
                                <Badge variant="success" size="sm" dot>
                                  {rec.codeRecord.fragments.length}/{config.hiddenCodeConfig.requiredFragmentCount} Verified
                                </Badge>
                              ) : (
                                <Badge variant="warning" size="sm">
                                  {rec.codeRecord.fragments.length}/{config.hiddenCodeConfig.requiredFragmentCount} Fragments
                                </Badge>
                              )}
                            </td>

                            {/* Qualification Status */}
                            <td className="py-3 px-4">
                              {renderStatusBadge(rec.qualificationStatus)}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<Coins className="w-3 h-3 text-amber-600" />}
                                  onClick={() => {
                                    setSelectedTeamId(rec.teamId);
                                    setActiveTab('economy');
                                  }}
                                  title="View complete financial transaction ledger"
                                >
                                  Ledger
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<QrCode className="w-3 h-3 text-purple-600" />}
                                  onClick={() => {
                                    setFragmentForm((prev) => ({ ...prev, teamId: rec.teamId }));
                                    setActiveTab('hidden_code');
                                  }}
                                  title="Inspect hidden code fragments"
                                >
                                  Code
                                </Button>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: POINTS ECONOMY & AUDIT LEDGER */}
      {activeTab === 'economy' && (
        <div className="space-y-4">
          {/* Top Controls: Filter by squad, filter by transaction type, Record Tx button */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap flex-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Filter Squad:
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="all">All 12 Participating Squads</option>
                {data.records.map((r) => (
                  <option key={r.teamId} value={r.teamId}>
                    {formatTeamNumber(r.teamNumber)} — {r.teamName} ({r.ledger.currentBalance} pts)
                  </option>
                ))}
              </select>

              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Transaction Types</option>
                <option value="earn">Earn Transactions</option>
                <option value="spend">Spend Transactions</option>
                <option value="adjustment">Adjustments</option>
                <option value="reversal">Audited Reversals</option>
              </select>
            </div>

            {!config.isFinalized && (
              <Button
                size="sm"
                variant="primary"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (selectedTeamId !== 'all') {
                    setTxForm((prev) => ({ ...prev, teamId: selectedTeamId }));
                  }
                  setIsRecordTxModalOpen(true);
                }}
              >
                Record Transaction
              </Button>
            )}
          </div>

          {/* Individual Squad Ledger Summary Bar (when filtered to 1 squad) */}
          {activeSelectedLedger && (
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-xl border border-slate-700 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    Squad Financial Ledger
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {data.records.find((r) => r.teamId === selectedTeamId)?.teamName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Opening Balance: {activeSelectedLedger.openingBalance} pts · Active Entries: {activeSelectedLedger.activeTransactionCount} · Reversals: {activeSelectedLedger.reversalCount}
                  </p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Earned</span>
                    <span className="text-sm font-mono font-bold text-emerald-400">+{activeSelectedLedger.totalEarned}</span>
                  </div>
                  <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Spent</span>
                    <span className="text-sm font-mono font-bold text-amber-400">-{activeSelectedLedger.totalSpent}</span>
                  </div>
                  <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Net Adj</span>
                    <span className="text-sm font-mono font-bold text-slate-300">
                      {activeSelectedLedger.netAdjustments > 0 ? `+${activeSelectedLedger.netAdjustments}` : activeSelectedLedger.netAdjustments}
                    </span>
                  </div>
                  <div className="bg-blue-600/30 px-4 py-2 rounded-lg border border-blue-500/50 text-center">
                    <span className="text-[9px] uppercase tracking-wider text-blue-300 block">Current Balance</span>
                    <span className="text-lg font-mono font-black text-white">{activeSelectedLedger.currentBalance} pts</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <Card className="border-slate-200/80 overflow-hidden">
            <CardHeader
              title={`Audit Transaction History (${filteredTransactions.length})`}
              subtitle="All transactions remain permanently preserved in the double-entry audit ledger. Reversals create compensating entries."
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Squad</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-4">Reason / Description</th>
                    <th className="py-3 px-3">Logged By</th>
                    <th className="py-3 px-3 text-center">Audit Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8">
                        <EmptyState
                          icon={History}
                          title="No transactions recorded"
                          description="No financial operations match the selected squad and type filters."
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const team = data.records.find((r) => r.teamId === tx.teamId);
                      const isReversed = tx.isReversed;
                      const isReversalEntry = tx.type === 'reversal';

                      return (
                        <tr
                          key={tx.id}
                          className={`transition-colors ${
                            isReversed
                              ? 'bg-slate-50/80 text-slate-400 line-through'
                              : isReversalEntry
                              ? 'bg-rose-50/40 text-rose-900'
                              : 'hover:bg-slate-50/80 text-slate-700'
                          }`}
                        >
                          {/* Date & Time */}
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                            {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            <span className="text-[10px] block text-slate-400">
                              {new Date(tx.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </td>

                          {/* Squad */}
                          <td className="py-3 px-4 font-medium">
                            <span className="font-mono text-[11px] text-blue-600 mr-1.5 font-bold">
                              {team ? formatTeamNumber(team.teamNumber) : ''}
                            </span>
                            <span className="text-slate-800 font-semibold">{team ? team.teamName : tx.teamId}</span>
                          </td>

                          {/* Type */}
                          <td className="py-3 px-3">
                            {tx.type === 'earn' && (
                              <Badge variant="success" size="sm">
                                EARN
                              </Badge>
                            )}
                            {tx.type === 'spend' && (
                              <Badge variant="warning" size="sm">
                                SPEND
                              </Badge>
                            )}
                            {tx.type === 'adjustment' && (
                              <Badge variant="primary" size="sm">
                                ADJUST
                              </Badge>
                            )}
                            {tx.type === 'reversal' && (
                              <Badge variant="danger" size="sm">
                                REVERSAL
                              </Badge>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {tx.type === 'earn' && <span className="text-emerald-600">+{tx.amount} pts</span>}
                            {tx.type === 'spend' && <span className="text-amber-600">-{tx.amount} pts</span>}
                            {tx.type === 'adjustment' && (
                              <span className={tx.amount >= 0 ? 'text-blue-600' : 'text-rose-600'}>
                                {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} pts
                              </span>
                            )}
                            {tx.type === 'reversal' && (
                              <span className="text-rose-600 font-semibold">
                                {tx.amount} pts (Compensating)
                              </span>
                            )}
                          </td>

                          {/* Reason */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{tx.reason}</div>
                            {tx.notes && <div className="text-[10px] text-slate-400 mt-0.5">{tx.notes}</div>}
                            {tx.reversalTransactionId && (
                              <div className="text-[10px] text-rose-600 mt-0.5 font-mono">
                                Compensated by: {tx.reversalTransactionId}
                              </div>
                            )}
                            {tx.reversedTransactionId && (
                              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                Original Target: {tx.reversedTransactionId}
                              </div>
                            )}
                          </td>

                          {/* Logged By */}
                          <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-500 font-mono">
                            {tx.organizerRef || 'Marshal'}
                          </td>

                          {/* Audit Status */}
                          <td className="py-3 px-3 text-center">
                            {isReversed ? (
                              <Badge variant="neutral" size="sm">
                                REVERSED
                              </Badge>
                            ) : isReversalEntry ? (
                              <Badge variant="danger" size="sm">
                                AUDIT STAMP
                              </Badge>
                            ) : (
                              <Badge variant="success" size="sm" dot>
                                ACTIVE
                              </Badge>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            {!config.isFinalized && !isReversed && !isReversalEntry && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                                leftIcon={<RotateCcw className="w-3 h-3" />}
                                onClick={() => handleOpenReversal(tx)}
                                title="Execute audited reversal for this transaction"
                              >
                                Reverse
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: HIDDEN CODE TRACKER */}
      {activeTab === 'hidden_code' && (
        <div className="space-y-4">
          {/* Confidentiality Notice */}
          <div className="bg-purple-950 text-purple-200 p-4 rounded-xl border border-purple-800 shadow-md">
            <div className="flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-bold text-white flex items-center gap-2 text-xs">
                  ORGANIZER-ONLY CONFIDENTIAL INTERFACE
                  <Badge variant="neutral" size="sm" className="bg-purple-900/80 text-purple-200 border-purple-700">
                    RESTRICTED VIEW
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-purple-300 leading-relaxed">
                  Secret code contents and fragments are <strong>strictly protected and never displayed on public screens</strong>. 
                  This console tracks physical station recoveries, timestamp verification, and completion criteria for the 12 Round 3 teams.
                </p>
              </div>
            </div>
          </div>

          {/* Requirements Status Box */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Hidden Code Requirement Policy
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-slate-900">
                  {config.hiddenCodeConfig.isConfigured
                    ? `${config.hiddenCodeConfig.requiredFragmentCount} fragments required for completion`
                    : 'Requirements not configured (Pending Organizer Confirmation)'}
                </span>
                {config.hiddenCodeConfig.isRequiredForQualification ? (
                  <Badge variant="warning" size="sm">Mandatory for Round 4</Badge>
                ) : (
                  <Badge variant="neutral" size="sm">Optional / Parallel Track</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {config.hiddenCodeConfig.instructionsNote || 'Physical verification card tags recovered at designated stations.'}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              leftIcon={<Sliders className="w-3.5 h-3.5 text-purple-600" />}
              onClick={() => setIsRulesModalOpen(true)}
            >
              Configure Code Policy
            </Button>
          </div>

          {/* 12 Squads Code Verification Table */}
          <Card className="border-slate-200/80 overflow-hidden">
            <CardHeader
              title="Squad Fragment Recovery & Verification Log"
              subtitle="Log recovered fragments and issue official verification stamps."
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Squad</th>
                    <th className="py-3 px-4">Recovered Fragments</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Verification Stamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.records.map((rec) => {
                    const code = rec.codeRecord;
                    return (
                      <tr key={rec.teamId} className="hover:bg-slate-50/70 transition-colors">
                        {/* Squad */}
                        <td className="py-3.5 px-4 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-blue-600">
                              {formatTeamNumber(rec.teamNumber)}
                            </span>
                            <span className="font-semibold text-slate-900">{rec.teamName}</span>
                          </div>
                        </td>

                        {/* Fragments */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {code.fragments.length === 0 ? (
                              <span className="text-slate-400 italic text-[11px]">No fragments logged yet</span>
                            ) : (
                              code.fragments.map((frag) => (
                                <span
                                  key={frag.fragmentIndex}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-mono text-[11px]"
                                  title={frag.notes || `Recovered at ${new Date(frag.recoveredAt).toLocaleTimeString()}`}
                                >
                                  <KeyRound className="w-2.5 h-2.5 text-purple-600" />
                                  <span>Frag #{frag.fragmentIndex}</span>
                                  {!config.isFinalized && (
                                    <button
                                      onClick={() => handleRemoveFragment(rec.teamId, frag.fragmentIndex)}
                                      className="text-purple-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                                      title="Delete fragment record"
                                    >
                                      &times;
                                    </button>
                                  )}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {!config.hiddenCodeConfig.isConfigured ? (
                            <Badge variant="neutral" size="sm">TBD</Badge>
                          ) : code.isComplete ? (
                            <Badge variant="success" size="sm" dot>Complete</Badge>
                          ) : (
                            <Badge variant="warning" size="sm">Incomplete</Badge>
                          )}
                        </td>

                        {/* Stamp */}
                        <td className="py-3.5 px-4 text-[11px]">
                          {code.verifiedAt ? (
                            <div className="text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Verified by {code.verifiedBy || 'Marshal'}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {new Date(code.verifiedAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Unverified</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          {!config.isFinalized && (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<Plus className="w-3 h-3 text-purple-600" />}
                                onClick={() => {
                                  setFragmentForm({
                                    teamId: rec.teamId,
                                    fragmentIndex: (code.fragments.length || 0) + 1,
                                    notes: '',
                                    organizerRef: 'Checkpoint-Marshal',
                                  });
                                  setIsLogFragmentModalOpen(true);
                                }}
                              >
                                Log Frag
                              </Button>

                              {!code.verifiedAt && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<Check className="w-3 h-3 text-emerald-600" />}
                                  onClick={() => handleVerifyCode(rec.teamId)}
                                >
                                  Stamp
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 6. MODALS & DIALOGS */}

      {/* MODAL 1: RULES & CONFIGURATION */}
      {isRulesModalOpen && (
        <Modal
          isOpen={isRulesModalOpen}
          onClose={() => setIsRulesModalOpen(false)}
          title="Round 3: Economy & Scoring Configuration"
          subtitle="Adjust economy parameters, ranking formulas, and code verification rules. Clearly labeled demo defaults until officially confirmed."
          maxWidth="lg"
        >
          <form onSubmit={handleSaveRulesConfig} className="space-y-4 text-xs">
            {/* Economy Parameters */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>Points Economy Settings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Starting Balance (pts)
                    <span className="text-[10px] text-amber-700 font-normal block">
                      (Demo Default · Unconfirmed Rule)
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={configForm.startingBalance}
                    onChange={(e) => setConfigForm({ ...configForm, startingBalance: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Negative Balance Deficit Policy
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configForm.allowNegativeBalance}
                      onChange={(e) => setConfigForm({ ...configForm, allowNegativeBalance: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">Permit negative balances (overdrafts)</span>
                  </label>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    If unchecked, spends that would cause a deficit are strictly blocked.
                  </p>
                </div>
              </div>
            </div>

            {/* Ranking & Scoring Formula */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-blue-600" />
                <span>Leaderboard Ranking Formula</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ranking Metric
                    <span className="text-[10px] text-amber-700 font-normal block">
                      (Demo Default · Unconfirmed Rule)
                    </span>
                  </label>
                  <select
                    value={configForm.rankingMetric}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        rankingMetric: e.target.value as BlackMarketRankingMetric,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="current_balance">Current Net Balance (Pts on Hand)</option>
                    <option value="total_earned">Total Gross Points Earned</option>
                    <option value="net_profit">Net Profit (Earned minus Spent)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Scoring Direction
                    <span className="text-[10px] text-amber-700 font-normal block">
                      (Demo Default · Unconfirmed Rule)
                    </span>
                  </label>
                  <select
                    value={configForm.scoringDirection}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        scoringDirection: e.target.value as BlackMarketScoringDirection,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="higher_is_better">Higher Points Win (Standard)</option>
                    <option value="lower_is_better">Lower Points Win (Golf scoring)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Hidden Code Policy */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-purple-600" />
                <span>Hidden Code Policy</span>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configForm.isCodeConfigured}
                    onChange={(e) => setConfigForm({ ...configForm, isCodeConfigured: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Officially configure fragment requirements (Unlocks verified statuses)
                  </span>
                </label>

                {configForm.isCodeConfigured && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6 pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Fragments Required for Completion
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={configForm.requiredFragmentCount ?? 2}
                        onChange={(e) =>
                          setConfigForm({ ...configForm, requiredFragmentCount: Number(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mandatory for Round 4 Qualification?
                      </label>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={configForm.isRequiredForQualification}
                          onChange={(e) =>
                            setConfigForm({ ...configForm, isRequiredForQualification: e.target.checked })
                          }
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-slate-700">Yes, top 8 squads must have complete code</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Official Confirmation Checkbox */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configForm.isScoringConfigured}
                  onChange={(e) => setConfigForm({ ...configForm, isScoringConfigured: e.target.checked })}
                  className="mt-0.5 rounded border-amber-400 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-amber-950">
                    Certify Official Rules Confirmation
                  </span>
                  <p className="text-[10px] text-amber-800 leading-tight mt-0.5">
                    By checking this, you confirm that the BMSIT organizing committee has officially approved the starting balance, economy parameters, and qualification cutoff rules. Standings will transition from Provisional to Official.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsRulesModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: RECORD TRANSACTION */}
      {isRecordTxModalOpen && (
        <Modal
          isOpen={isRecordTxModalOpen}
          onClose={() => setIsRecordTxModalOpen(false)}
          title="Record Audit Transaction"
          subtitle="Log a financial credit, debit, or manual adjustment to a squad's Black Market ledger."
        >
          <form onSubmit={handleRecordTransaction} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Squad</label>
              <select
                value={txForm.teamId}
                onChange={(e) => setTxForm({ ...txForm, teamId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                required
              >
                {data.records.map((r) => (
                  <option key={r.teamId} value={r.teamId}>
                    {formatTeamNumber(r.teamNumber)} — {r.teamName} (Current: {r.ledger.currentBalance} pts)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction Type</label>
                <select
                  value={txForm.type}
                  onChange={(e) =>
                    setTxForm({
                      ...txForm,
                      type: e.target.value as 'earn' | 'spend' | 'adjustment',
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="earn">Earn (Credit +)</option>
                  <option value="spend">Spend (Debit -)</option>
                  <option value="adjustment">Manual Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (Points)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: Math.abs(Number(e.target.value)) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {txForm.type === 'adjustment' && (
              <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                <label className="block font-semibold text-blue-900 mb-1">Adjustment Direction</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-blue-900">
                    <input
                      type="radio"
                      name="adjSign"
                      value="credit"
                      checked={txForm.adjustmentSign === 'credit'}
                      onChange={() => setTxForm({ ...txForm, adjustmentSign: 'credit' })}
                    />
                    <span>Add Points (+)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-blue-900">
                    <input
                      type="radio"
                      name="adjSign"
                      value="debit"
                      checked={txForm.adjustmentSign === 'debit'}
                      onChange={() => setTxForm({ ...txForm, adjustmentSign: 'debit' })}
                    />
                    <span>Deduct Points (-)</span>
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason / Description (Required)</label>
              <input
                type="text"
                placeholder="e.g. Asset Trading: Station Alpha Intel Drop"
                value={txForm.reason}
                onChange={(e) => setTxForm({ ...txForm, reason: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Logged By (Marshal Ref)</label>
                <input
                  type="text"
                  placeholder="e.g. Market-Ops"
                  value={txForm.organizerRef}
                  onChange={(e) => setTxForm({ ...txForm, organizerRef: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Optional Notes</label>
                <input
                  type="text"
                  placeholder="Additional context"
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsRecordTxModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Recording...' : 'Record to Ledger'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: AUDITED REVERSAL */}
      {isReversalModalOpen && targetReversalTx && (
        <Modal
          isOpen={isReversalModalOpen}
          onClose={() => setIsReversalModalOpen(false)}
          title="Execute Audited Transaction Reversal"
          subtitle="Reverse a previously recorded transaction while preserving full audit trail integrity."
        >
          <form onSubmit={handleExecuteReversal} className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1 font-mono text-[11px]">
              <div>
                <strong>Target TX ID:</strong> {targetReversalTx.id}
              </div>
              <div>
                <strong>Type:</strong> {targetReversalTx.type.toUpperCase()} ·{' '}
                <strong>Amount:</strong> {targetReversalTx.amount} pts
              </div>
              <div>
                <strong>Original Reason:</strong> {targetReversalTx.reason}
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Audit Trail Guarantee</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                The original transaction record will NOT be deleted. It will be marked as reversed and permanently linked to a new compensating reversal entry.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reason for Reversal (Required)
              </label>
              <input
                type="text"
                placeholder="e.g. Duplicate claim logged erroneously by station marshal"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Authorized By (Auditor Ref)
              </label>
              <input
                type="text"
                value={reversalOrganizerRef}
                onChange={(e) => setReversalOrganizerRef(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsReversalModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-rose-600 hover:bg-rose-700" disabled={isSubmitting}>
                {isSubmitting ? 'Reversing...' : 'Execute Reversal'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: LOG FRAGMENT */}
      {isLogFragmentModalOpen && (
        <Modal
          isOpen={isLogFragmentModalOpen}
          onClose={() => setIsLogFragmentModalOpen(false)}
          title="Log Code Fragment Recovery"
          subtitle="Record a verified fragment checkpoint for a squad."
        >
          <form onSubmit={handleLogFragment} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Squad</label>
              <select
                value={fragmentForm.teamId}
                onChange={(e) => setFragmentForm({ ...fragmentForm, teamId: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                required
              >
                {data.records.map((r) => (
                  <option key={r.teamId} value={r.teamId}>
                    {formatTeamNumber(r.teamNumber)} — {r.teamName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fragment Index</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={fragmentForm.fragmentIndex}
                  onChange={(e) => setFragmentForm({ ...fragmentForm, fragmentIndex: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Logged By</label>
                <input
                  type="text"
                  value={fragmentForm.organizerRef}
                  onChange={(e) => setFragmentForm({ ...fragmentForm, organizerRef: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Station Notes</label>
              <input
                type="text"
                placeholder="e.g. Scanned physical tag at Checkpoint 02"
                value={fragmentForm.notes}
                onChange={(e) => setFragmentForm({ ...fragmentForm, notes: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsLogFragmentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Logging...' : 'Save Fragment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DIALOG: FINALIZE TOP 8 */}
      <ConfirmationDialog
        isOpen={isFinalizeDialogOpen}
        onClose={() => setIsFinalizeDialogOpen(false)}
        onConfirm={handleFinalizeRound3}
        title="Finalize Round 3: The Black Market"
        message="Sealing official results will permanently advance the Top 8 qualifying squads to Round 4 (The Legal Battle). The bottom 4 squads will be officially eliminated, with all records permanently preserved. Are you sure you want to proceed?"
        confirmLabel={isSubmitting ? 'Finalizing...' : 'Finalize & Advance Top 8'}
        isDestructive={false}
      />

      {/* DIALOG: RESET LEDGER */}
      <ConfirmationDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetLedgers}
        title="Reset Black Market Ledgers?"
        message="This will clear all transactions, reversals, and code progress back to the opening starting balance. Configuration will be preserved. This action cannot be undone."
        confirmLabel="Reset All Ledgers"
        isDestructive={true}
      />
    </div>
  );
};
