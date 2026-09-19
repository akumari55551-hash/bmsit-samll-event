import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Crown,
  Award,
  AlertTriangle,
  CheckCircle2,
  Search,
  Settings,
  Sparkles,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  UserCheck,
  Lock,
  Info,
  Shield,
  Sliders,
  ChevronDown,
  ChevronUp,
  XCircle,
  Compass,
  Layers,
  ArrowLeftRight,
  Gavel,
  ArrowUpDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import { eventService } from '../services/eventService';
import {
  FinaleData,
  TeamFinaleRecord,
  FinaleScoringCriterion,
} from '../types/finale';
import { formatTeamNumber } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

type SortField = 'rank' | 'teamNumber' | 'teamName' | 'carriedR4' | 'activityScore' | 'totalScore';

export function FinalePage() {
  // Data State
  const [data, setData] = useState<FinaleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // UI Drawers & Accordions
  const [showChecklist, setShowChecklist] = useState(false);

  // Modals
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isScorecardModalOpen, setIsScorecardModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Modal Selection Targets
  const [selectedRecord, setSelectedRecord] = useState<TeamFinaleRecord | null>(null);

  // Scorecard Form State
  const [scorecardJudgeName, setScorecardJudgeName] = useState('');
  const [scorecardMarks, setScorecardMarks] = useState<Record<string, string>>({});
  const [scorecardComments, setScorecardComments] = useState('');
  const [scorecardError, setScorecardError] = useState<string | null>(null);

  // Agent Verdict Form State
  const [suspectedAgent, setSuspectedAgent] = useState('');
  const [actualAgent, setActualAgent] = useState('');
  const [isCorrectVerdict, setIsCorrectVerdict] = useState<boolean | null>(null);
  const [bonusPoints, setBonusPoints] = useState<string>('10');
  const [penaltyPoints, setPenaltyPoints] = useState<string>('5');
  const [isVerifiedVerdict, setIsVerifiedVerdict] = useState<boolean>(false);
  const [arbiterSignature, setArbiterSignature] = useState('');
  const [verdictNotes, setVerdictNotes] = useState('');

  // Rules Config Form State
  const [rulesConfirmed, setRulesConfirmed] = useState(false);
  const [carriedOverR4, setCarriedOverR4] = useState(true);
  const [r4Weight, setR4Weight] = useState('0.2');
  const [activityWeight, setActivityWeight] = useState('1.0');
  const [configBonusPoints, setConfigBonusPoints] = useState('10');
  const [configPenaltyPoints, setConfigPenaltyPoints] = useState('5');
  const [configSigner, setConfigSigner] = useState('');
  const [criteriaForm, setCriteriaForm] = useState<FinaleScoringCriterion[]>([]);

  // Finalize Form State
  const [finalizeArbiter, setFinalizeArbiter] = useState('Chief Arbiter & Tech Head');
  const [finalizeError, setFinalizeError] = useState<string | null>(null);

  // Stage Confidentiality State (Masks Secret Agent identities from projector/audience)
  const [revealedAgents, setRevealedAgents] = useState<Record<string, boolean>>({});
  const toggleRevealAgent = (teamId: string) => {
    setRevealedAgents((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  // Load Data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await eventService.getFinaleData();
      setData(res);
    } catch (err) {
      console.error('Failed to load Finale data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = eventService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, []);

  // Filter & Sort
  const filteredRecords = useMemo(() => {
    if (!data) return [];
    let list = [...data.records];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.teamName.toLowerCase().includes(q) ||
          formatTeamNumber(r.teamNumber).toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'complete') {
      list = list.filter((r) => r.scorecard.isComplete);
    } else if (statusFilter === 'incomplete') {
      list = list.filter((r) => !r.scorecard.isComplete);
    }

    list.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortField === 'rank') {
        valA = a.placement ?? (a.scoreBreakdown.totalFinaleScore !== null ? 0 : 999);
        valB = b.placement ?? (b.scoreBreakdown.totalFinaleScore !== null ? 0 : 999);
      } else if (sortField === 'teamNumber') {
        valA = a.teamNumber;
        valB = b.teamNumber;
      } else if (sortField === 'teamName') {
        valA = a.teamName.toLowerCase();
        valB = b.teamName.toLowerCase();
      } else if (sortField === 'carriedR4') {
        valA = a.scoreBreakdown.round4Contribution;
        valB = b.scoreBreakdown.round4Contribution;
      } else if (sortField === 'activityScore') {
        valA = a.scoreBreakdown.finaleActivityScore ?? -1;
        valB = b.scoreBreakdown.finaleActivityScore ?? -1;
      } else if (sortField === 'totalScore') {
        valA = a.scoreBreakdown.totalFinaleScore ?? -1;
        valB = b.scoreBreakdown.totalFinaleScore ?? -1;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [data, searchQuery, statusFilter, sortField, sortOrder]);

  // Handlers for Modals
  const openScorecardModal = (rec: TeamFinaleRecord) => {
    setSelectedRecord(rec);
    setScorecardJudgeName(rec.scorecard.judgeName || 'Grand Jury Panel');
    setScorecardComments(rec.scorecard.comments || '');
    setScorecardError(null);

    const initialMarks: Record<string, string> = {};
    if (data) {
      data.config.criteria.forEach((crit) => {
        const val = rec.scorecard.scores[crit.id];
        initialMarks[crit.id] = val !== null && val !== undefined ? String(val) : '';
      });
    }
    setScorecardMarks(initialMarks);
    setIsScorecardModalOpen(true);
  };

  const handleSaveScorecard = async () => {
    if (!selectedRecord || !data) return;
    try {
      setScorecardError(null);
      const parsedScores: Record<string, number | null> = {};

      for (const crit of data.config.criteria) {
        const strVal = scorecardMarks[crit.id]?.trim();
        if (!strVal) {
          parsedScores[crit.id] = null;
        } else {
          const num = Number(strVal);
          if (isNaN(num)) {
            setScorecardError(`Invalid numerical mark for "${crit.name}".`);
            return;
          }
          if (num < 0 || num > crit.maxMarks) {
            setScorecardError(
              `Mark for "${crit.name}" must be between 0 and ${crit.maxMarks}.`
            );
            return;
          }
          parsedScores[crit.id] = num;
        }
      }

      await eventService.recordFinaleScorecard({
        teamId: selectedRecord.teamId,
        judgeName: scorecardJudgeName || 'Grand Jury Panel',
        scores: parsedScores,
        comments: scorecardComments,
        lastEditedBy: scorecardJudgeName || 'Grand Jury Panel Arbiter',
      });

      setIsScorecardModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setScorecardError(err instanceof Error ? err.message : 'Failed to record scorecard.');
    }
  };

  const openAgentModal = (rec: TeamFinaleRecord) => {
    setSelectedRecord(rec);
    const av = rec.agentVerdict;
    setSuspectedAgent(av?.suspectedAgentNameOrId || '');
    setActualAgent(av?.actualAgentNameOrId || '');
    setIsCorrectVerdict(av?.isCorrect ?? null);
    setBonusPoints(av?.bonusPoints !== null && av?.bonusPoints !== undefined ? String(av.bonusPoints) : '10');
    setPenaltyPoints(av?.penaltyPoints !== null && av?.penaltyPoints !== undefined ? String(av.penaltyPoints) : '5');
    setIsVerifiedVerdict(av?.isVerified ?? false);
    setArbiterSignature(av?.verifiedBy || 'Chief Arbiter');
    setVerdictNotes(av?.notes || '');
    setIsAgentModalOpen(true);
  };

  const handleSaveAgentVerdict = async () => {
    if (!selectedRecord) return;
    try {
      await eventService.recordFinaleAgentVerdict(selectedRecord.teamId, {
        suspectedAgentNameOrId: suspectedAgent.trim() || undefined,
        actualAgentNameOrId: actualAgent.trim() || undefined,
        isCorrect: isCorrectVerdict,
        bonusPoints: bonusPoints.trim() ? Number(bonusPoints) : null,
        penaltyPoints: penaltyPoints.trim() ? Number(penaltyPoints) : null,
        isVerified: isVerifiedVerdict,
        organizerRef: arbiterSignature || 'Chief Arbiter',
        notes: verdictNotes,
      });

      setIsAgentModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to record agent verdict:', err);
    }
  };

  const openRulesModal = () => {
    if (!data) return;
    setRulesConfirmed(data.config.isScoringRulesConfirmed);
    setCarriedOverR4(data.config.round4ScoreCarriedOver);
    setR4Weight(String(data.config.round4ScoreWeight));
    setActivityWeight(String(data.config.finaleActivityWeight));
    setConfigBonusPoints(
      data.config.agentBonusPointsForCorrect !== null
        ? String(data.config.agentBonusPointsForCorrect)
        : '10'
    );
    setConfigPenaltyPoints(
      data.config.agentPenaltyPointsForIncorrect !== null
        ? String(data.config.agentPenaltyPointsForIncorrect)
        : '5'
    );
    setConfigSigner(data.config.confirmedBy || 'Chief Arbiter & Tech Head');
    setCriteriaForm([...data.config.criteria]);
    setIsRulesModalOpen(true);
  };

  const handleSaveRules = async () => {
    try {
      await eventService.updateFinaleConfig({
        isScoringRulesConfirmed: rulesConfirmed,
        confirmedAt: rulesConfirmed ? new Date().toISOString() : null,
        confirmedBy: rulesConfirmed ? (configSigner || 'Chief Arbiter') : null,
        round4ScoreCarriedOver: carriedOverR4,
        round4ScoreWeight: Number(r4Weight) || 0.2,
        finaleActivityWeight: Number(activityWeight) || 1.0,
        agentBonusPointsForCorrect: configBonusPoints ? Number(configBonusPoints) : null,
        agentPenaltyPointsForIncorrect: configPenaltyPoints ? Number(configPenaltyPoints) : null,
        criteria: criteriaForm,
      });
      setIsRulesModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to update rules config:', err);
    }
  };

  const handleSimulate = async () => {
    try {
      await eventService.simulateFinaleField();
      await loadData();
    } catch (err) {
      console.error('Failed to simulate finale field:', err);
    }
  };

  const handleReset = async () => {
    try {
      await eventService.resetFinaleData();
      setIsResetModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to reset finale data:', err);
    }
  };

  const handleFinalize = async () => {
    try {
      setFinalizeError(null);
      await eventService.finalizeFinale(finalizeArbiter);
      setIsFinalizeModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setFinalizeError(err instanceof Error ? err.message : 'Finalization failed.');
    }
  };

  if (isLoading || !data) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-xs text-slate-500 font-medium">Loading Grand Finale Adjudication Console...</p>
      </div>
    );
  }

  // Find podium placements:
  const championRecord = data.records.find((r) => r.placement === 1) || data.records[0];
  const runnerUp1Record = data.records.find((r) => r.placement === 2) || data.records[1];
  const runnerUp2Record = data.records.find((r) => r.placement === 3) || data.records[2];

  const isFinalized = data.config.isFinalized;
  const isRound4Finalized = data.round4Finalized;

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Grand Finale: Championship Console
            </h1>
            {isFinalized ? (
              <Badge variant="purple" size="sm">
                Finalized Championship Sealed
              </Badge>
            ) : isRound4Finalized ? (
              <Badge variant="warning" size="sm" dot>
                Championship Round Live
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                Round 4 Provisional Stage
              </Badge>
            )}
            <Badge variant="neutral" size="sm">
              Phase 5 Climax
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Championship oral defense adjudication, secret agent deduction unmasking, and official podium crowning for the top 3 finalists.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={openRulesModal}
            leftIcon={<Settings className="w-3.5 h-3.5 text-slate-500" />}
          >
            Rules & Rubric Config
          </Button>

          {!isFinalized && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulate}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-500" />}
              >
                Simulate Field
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResetModalOpen(true)}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-rose-500" />}
              >
                Reset Data
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!data.engine.canFinalize}
                onClick={() => {
                  setFinalizeError(null);
                  setIsFinalizeModalOpen(true);
                }}
                leftIcon={<Crown className="w-3.5 h-3.5 text-amber-300" />}
              >
                Finalize Championship
              </Button>
            </>
          )}

          {isFinalized && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-800 rounded-lg border border-purple-200 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-purple-600" />
              <span>Championship Placements Sealed</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. WARNING / DEPENDENCY BANNERS */}
      {/* 2A. Round 4 Unfinalized Dependency Banner */}
      {!isRound4Finalized && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Round 4 Dependency Notice: Provisional Finalist Eligibility
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Round 4: The Legal Battle has not been officially finalized. The 3 finalist squads shown below are based on provisional courtroom standings. Grand Finale finalization is locked until Round 4 results are sealed by organizers.
              </p>
            </div>
          </div>
          <Link to="/round-4" className="flex-shrink-0">
            <Button size="sm" variant="outline" rightIcon={<ExternalLink className="w-3 h-3" />}>
              Go to Round 4 Console
            </Button>
          </Link>
        </div>
      )}

      {/* 2B. Finalist Count Discrepancy Warning */}
      {data.records.length !== 3 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900">
          <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-900">
              Finalist Count Discrepancy Detected ({data.records.length} Teams Loaded)
            </h4>
            <p className="text-xs text-rose-800 mt-0.5">
              Official tournament rules mandate exactly 3 qualifying teams for the Grand Finale Championship. The system detected {data.records.length} teams. Organizer review is required before finalization can proceed.
            </p>
          </div>
        </div>
      )}

      {/* 2C. Rules Pending Confirmation Banner */}
      {!data.config.isScoringRulesConfirmed && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-900">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-blue-900">
                Championship Rubric & Rules Pending Official Confirmation
              </h4>
              <p className="text-xs text-blue-800 mt-0.5">
                Evaluation criteria marks, carried-over Round 4 weights (20%), and secret agent deduction points are currently demo defaults. Organizers must review and confirm scoring rules to unlock championship finalization.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={openRulesModal} leftIcon={<Sliders className="w-3 h-3" />}>
            Confirm Rules
          </Button>
        </div>
      )}

      {/* 3. CHAMPIONSHIP PODIUM (3 CARDS) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            BMSIT Tournament Championship Podium
          </h2>
          <span className="text-[11px] text-slate-400">
            {isFinalized ? 'Official Sealed Placements' : 'Live Projected Standings'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* 2nd Place (1st Runner Up) */}
          <div className="md:order-1 order-2">
            <Card
              className={`border-slate-200/90 transition-all ${
                runnerUp1Record?.placement === 2 ? 'ring-1 ring-slate-300 shadow-md' : ''
              }`}
            >
              <CardHeader
                className="bg-slate-50/70 py-3"
                title={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                      <Trophy className="w-4 h-4 text-slate-400" />
                      1st Runner Up (2nd Place)
                    </div>
                    {runnerUp1Record && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                        {formatTeamNumber(runnerUp1Record.teamNumber)}
                      </span>
                    )}
                  </div>
                }
              />
              <CardContent className="text-center py-6">
                <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xl mb-2.5 shadow-inner">
                  2
                </div>
                {runnerUp1Record ? (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{runnerUp1Record.teamName}</h3>
                    <div className="mt-2 text-xs font-semibold text-slate-500">
                      {runnerUp1Record.scoreBreakdown.totalFinaleScore !== null ? (
                        <span className="text-base font-black text-slate-800">
                          {runnerUp1Record.scoreBreakdown.totalFinaleScore}{' '}
                          <span className="text-xs font-normal text-slate-500">pts</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Score Pending Confirmation</span>
                      )}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-2">
                      <span>R4 Carried: +{runnerUp1Record.scoreBreakdown.round4Contribution}</span>
                      <span>•</span>
                      <span>
                        Activity: {runnerUp1Record.scoreBreakdown.finaleActivityScore ?? 'TBD'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-bold text-slate-700">Awaiting Finalist</div>
                    <p className="text-[11px] text-slate-400 mt-1">Pending Round 4 results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 1st Place (Grand Champion) - Center & Prominent */}
          <div className="md:order-2 order-1">
            <Card
              className={`border-amber-300 ring-2 ring-amber-400/40 shadow-lg bg-gradient-to-b from-amber-50/30 to-white relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              <CardHeader
                className="bg-amber-100/40 py-3.5"
                title={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                      Grand Champion (1st Place)
                    </div>
                    {championRecord && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-200/70 text-amber-900 border border-amber-300">
                        {formatTeamNumber(championRecord.teamNumber)}
                      </span>
                    )}
                  </div>
                }
              />
              <CardContent className="text-center py-7">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-white font-black text-2xl mb-3 shadow-md shadow-amber-500/20">
                  1
                </div>
                {championRecord ? (
                  <div>
                    <div className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
                      BMSIT Tournament Winner
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                      {championRecord.teamName}
                    </h3>
                    <div className="mt-2 text-xs font-semibold text-slate-500">
                      {championRecord.scoreBreakdown.totalFinaleScore !== null ? (
                        <span className="text-xl font-black text-amber-950">
                          {championRecord.scoreBreakdown.totalFinaleScore}{' '}
                          <span className="text-xs font-normal text-slate-500">pts</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Score Pending Confirmation</span>
                      )}
                    </div>
                    <div className="mt-2.5 pt-2.5 border-t border-amber-200/60 text-[11px] text-amber-900/80 flex items-center justify-center gap-2 font-medium">
                      <span>R4: +{championRecord.scoreBreakdown.round4Contribution}</span>
                      <span>•</span>
                      <span>
                        Defense: {championRecord.scoreBreakdown.finaleActivityScore ?? 'TBD'}
                      </span>
                      <span>•</span>
                      <span>
                        Agent: {championRecord.scoreBreakdown.agentAdjustment >= 0 ? '+' : ''}
                        {championRecord.scoreBreakdown.agentAdjustment}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-bold text-slate-700">Awaiting Champion</div>
                    <p className="text-[11px] text-slate-400 mt-1">Pending Round 4 results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 3rd Place (2nd Runner Up) */}
          <div className="md:order-3 order-3">
            <Card
              className={`border-amber-700/20 transition-all ${
                runnerUp2Record?.placement === 3 ? 'ring-1 ring-amber-700/30 shadow-md' : ''
              }`}
            >
              <CardHeader
                className="bg-amber-50/40 py-3"
                title={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <Award className="w-4 h-4 text-amber-700" />
                      2nd Runner Up (3rd Place)
                    </div>
                    {runnerUp2Record && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                        {formatTeamNumber(runnerUp2Record.teamNumber)}
                      </span>
                    )}
                  </div>
                }
              />
              <CardContent className="text-center py-6">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-100/60 flex items-center justify-center text-amber-800 font-black text-xl mb-2.5 shadow-inner">
                  3
                </div>
                {runnerUp2Record ? (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{runnerUp2Record.teamName}</h3>
                    <div className="mt-2 text-xs font-semibold text-slate-500">
                      {runnerUp2Record.scoreBreakdown.totalFinaleScore !== null ? (
                        <span className="text-base font-black text-slate-800">
                          {runnerUp2Record.scoreBreakdown.totalFinaleScore}{' '}
                          <span className="text-xs font-normal text-slate-500">pts</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Score Pending Confirmation</span>
                      )}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-2">
                      <span>R4 Carried: +{runnerUp2Record.scoreBreakdown.round4Contribution}</span>
                      <span>•</span>
                      <span>
                        Activity: {runnerUp2Record.scoreBreakdown.finaleActivityScore ?? 'TBD'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-bold text-slate-700">Awaiting Finalist</div>
                    <p className="text-[11px] text-slate-400 mt-1">Pending Round 4 results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 4. SUMMARY KPI METRIC BAR (5 CARDS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Finalist Squads
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-800">
              {data.stats.eligibleTeamsCount} / 3
            </span>
            <Badge
              variant={data.stats.eligibleTeamsCount === 3 ? 'success' : 'danger'}
              size="sm"
            >
              {data.stats.eligibleTeamsCount === 3 ? 'Verified' : 'Review'}
            </Badge>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isRound4Finalized ? 'Sealed from R4' : 'Provisional R4'}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Scoring Rubric
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-slate-800">
              {data.stats.rulesConfirmed ? 'Confirmed' : 'Pending'}
            </span>
            <Badge
              variant={data.stats.rulesConfirmed ? 'success' : 'warning'}
              size="sm"
            >
              {data.stats.rulesConfirmed ? 'Sealed' : 'Demo Default'}
            </Badge>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {data.config.criteria.length} Rubric Criteria
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Jury Scorecards
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-800">
              {data.stats.scorecardsCompletedCount} / 3
            </span>
            <Badge
              variant={data.stats.scorecardsCompletedCount === 3 ? 'success' : 'warning'}
              size="sm"
            >
              {data.stats.scorecardsCompletedCount === 3 ? 'Complete' : 'Pending'}
            </Badge>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Zero Missing Tolerated
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Agent Unmasking
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-800">
              {data.stats.agentVerdictsVerifiedCount} / 3
            </span>
            <Badge
              variant={data.stats.agentVerdictsVerifiedCount === 3 ? 'purple' : 'neutral'}
              size="sm"
            >
              {data.stats.agentVerdictsVerifiedCount === 3 ? 'Verified' : 'In Progress'}
            </Badge>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Bonus / Penalty Points
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Finalization Status
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-bold text-slate-800">
              {isFinalized ? 'Sealed & Crowned' : data.engine.canFinalize ? 'Ready to Seal' : 'Blocked'}
            </span>
            <Badge
              variant={isFinalized ? 'purple' : data.engine.canFinalize ? 'success' : 'danger'}
              size="sm"
            >
              {isFinalized ? 'Closed' : data.engine.canFinalize ? 'Pass' : 'Safeguards'}
            </Badge>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {data.engine.tiesAffectingPlacement ? 'Tie Review Needed' : 'Ties Clear'}
          </div>
        </div>
      </div>

      {/* 5. PRE-FINALIZATION DIAGNOSTICS CHECKLIST (COLLAPSIBLE) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
        <button
          onClick={() => setShowChecklist(!showChecklist)}
          className="w-full p-3.5 sm:px-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">
              Championship Pre-Finalization Diagnostics & Safeguards
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              ({data.engine.checklist.filter((c) => c.passed).length} of{' '}
              {data.engine.checklist.length} Passed)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {data.engine.canFinalize ? (
              <Badge variant="success" size="sm">
                Ready for Finalization
              </Badge>
            ) : (
              <Badge variant="danger" size="sm">
                Blocked by Safeguards
              </Badge>
            )}
            {showChecklist ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {showChecklist && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/40 space-y-2.5">
            {data.engine.checklist.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border flex items-start justify-between gap-3 text-xs ${
                  item.passed
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    : item.severity === 'blocker'
                    ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                    : 'bg-amber-50/60 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : item.severity === 'blocker' ? (
                    <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{item.label}</div>
                    <div className="mt-0.5 text-[11px] opacity-90">{item.details}</div>
                  </div>
                </div>
                <Badge
                  variant={item.passed ? 'success' : item.severity === 'blocker' ? 'danger' : 'warning'}
                  size="sm"
                >
                  {item.passed ? 'PASSED' : item.severity === 'blocker' ? 'BLOCKER' : 'WARNING'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. FINALISTS TABLE & SCORING ADJUDICATION */}
      <Card className="border-slate-200/80">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-slate-600" />
              <span>Finalist Squads Adjudication Table</span>
              <span className="text-xs font-normal text-slate-400">
                ({filteredRecords.length} Squads)
              </span>
            </div>
          }
          subtitle="Record jury oral defense marks, inspect multi-round cumulative scores, and verify agent bonuses."
          action={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search finalist squads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'complete' | 'incomplete')}
                className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Scorecards</option>
                <option value="complete">Complete Only</option>
                <option value="incomplete">Incomplete Only</option>
              </select>
            </div>
          }
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 cursor-pointer select-none" onClick={() => handleSort('rank')}>
                    <div className="flex items-center gap-1">
                      <span>Placement</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer select-none" onClick={() => handleSort('teamName')}>
                    <div className="flex items-center gap-1">
                      <span>Finalist Squad</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer select-none" onClick={() => handleSort('carriedR4')}>
                    <div className="flex items-center gap-1">
                      <span>R4 Carried ({Math.round(data.config.round4ScoreWeight * 100)}%)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer select-none" onClick={() => handleSort('activityScore')}>
                    <div className="flex items-center gap-1">
                      <span>Finale Defense (100 pts)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Agent Deduction</th>
                  <th className="py-3 px-4 cursor-pointer select-none" onClick={() => handleSort('totalScore')}>
                    <div className="flex items-center gap-1">
                      <span>Total Score</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8">
                      <EmptyState
                        icon={UserCheck}
                        title="No Finalist Squads Found"
                        description="Try adjusting your search criteria or ensuring Round 4 qualifiers are loaded."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const isChampion = rec.placement === 1;
                    const isRunner1 = rec.placement === 2;
                    const isRunner2 = rec.placement === 3;

                    return (
                      <tr
                        key={rec.teamId}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          isChampion ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {/* Placement Column */}
                        <td className="py-3.5 px-4 font-medium">
                          {rec.placement ? (
                            <div className="flex items-center gap-1.5">
                              {isChampion && <Crown className="w-4 h-4 text-amber-500" />}
                              {isRunner1 && <Trophy className="w-4 h-4 text-slate-400" />}
                              {isRunner2 && <Award className="w-4 h-4 text-amber-700" />}
                              <span
                                className={`font-bold ${
                                  isChampion
                                    ? 'text-amber-800'
                                    : isRunner1
                                    ? 'text-slate-700'
                                    : 'text-amber-900'
                                }`}
                              >
                                #{rec.placement}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              TBD
                            </Badge>
                          )}
                        </td>

                        {/* Finalist Squad Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                              {formatTeamNumber(rec.teamNumber)}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900">{rec.teamName}</div>
                              <div className="text-[10px] text-slate-400">
                                R4 Finish: Rank #{rec.round4Rank}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* R4 Carried Score */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-800">
                              +{rec.scoreBreakdown.round4Contribution}
                            </span>{' '}
                            <span className="text-[10px] text-slate-400">pts</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Raw: {rec.round4Score !== null ? `${rec.round4Score} pts` : 'Pending'}
                          </div>
                        </td>

                        {/* Finale Defense Activity */}
                        <td className="py-3.5 px-4">
                          {rec.scorecard.totalScore !== null ? (
                            <div>
                              <div className="font-bold text-slate-800">
                                {rec.scorecard.totalScore}{' '}
                                <span className="text-[10px] text-slate-400">/ 100</span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-emerald-600 font-medium">
                                  Complete Scorecard
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-amber-600 font-medium">Scores Incomplete</span>
                              <div className="text-[10px] text-slate-400">Missing criteria marks</div>
                            </div>
                          )}
                        </td>

                        {/* Agent Deduction */}
                        <td className="py-3.5 px-4">
                          {rec.agentVerdict?.isVerified ? (
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={rec.agentVerdict.isCorrect ? 'success' : 'danger'}
                                size="sm"
                              >
                                {rec.agentVerdict.isCorrect
                                  ? `+${rec.agentVerdict.bonusPoints ?? 10} pts`
                                  : `-${rec.agentVerdict.penaltyPoints ?? 5} pts`}
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Pending Sign-off
                            </Badge>
                          )}
                        </td>

                        {/* Total Score */}
                        <td className="py-3.5 px-4">
                          {rec.scoreBreakdown.totalFinaleScore !== null ? (
                            <div className="font-black text-sm text-slate-900">
                              {rec.scoreBreakdown.totalFinaleScore}{' '}
                              <span className="text-[10px] font-normal text-slate-500">pts</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Pending Entry</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              rec.status === 'finalized'
                                ? 'purple'
                                : rec.scorecard.isComplete
                                ? 'success'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {rec.reviewStatus}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openScorecardModal(rec)}
                              disabled={isFinalized}
                            >
                              Scorecard
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAgentModal(rec)}
                              disabled={isFinalized}
                            >
                              Agent
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRecord(rec);
                                setIsJourneyModalOpen(true);
                              }}
                            >
                              Journey
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 7. SECRET AGENT DEDUCTION CEREMONY SECTION */}
      <Card className="border-slate-200/80">
        <CardHeader
          title={
            <div className="flex items-center gap-2 text-purple-900 font-bold">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Secret Agent Unmasking & Deduction Ceremony Console</span>
            </div>
          }
          subtitle="Confidential organizer audit: Finalist squads submit their final deduction regarding campus infiltrator identities."
          action={
            <div className="flex items-center gap-2">
              <Badge variant="purple" size="sm" dot>
                Stage Masking Active
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allRevealed = data.records.length > 0 && data.records.every((r) => revealedAgents[r.teamId]);
                  const next: Record<string, boolean> = {};
                  data.records.forEach((r) => {
                    next[r.teamId] = !allRevealed;
                  });
                  setRevealedAgents(next);
                }}
                leftIcon={data.records.length > 0 && data.records.every((r) => revealedAgents[r.teamId]) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              >
                {data.records.length > 0 && data.records.every((r) => revealedAgents[r.teamId]) ? 'Mask All' : 'Reveal All'}
              </Button>
            </div>
          }
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.records.map((rec) => {
              const av = rec.agentVerdict;
              return (
                <div
                  key={rec.teamId}
                  className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900">{rec.teamName}</div>
                      <span className="font-mono text-[10px] text-blue-600 font-semibold bg-white px-1.5 py-0.2 rounded border border-blue-100">
                        {formatTeamNumber(rec.teamNumber)}
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Suspected Infiltrator:</span>
                        <span className="font-semibold text-slate-800">
                          {av?.suspectedAgentNameOrId || 'None Declared'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Actual Infiltrator:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 font-mono">
                            {revealedAgents[rec.teamId]
                              ? (av?.actualAgentNameOrId || 'Classified')
                              : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleRevealAgent(rec.teamId)}
                            className="text-slate-400 hover:text-purple-600 p-0.5 rounded transition-colors"
                            title={revealedAgents[rec.teamId] ? 'Mask identity' : 'Reveal identity (Chief Marshal Only)'}
                            aria-label={revealedAgents[rec.teamId] ? 'Mask infiltrator identity' : 'Reveal infiltrator identity'}
                          >
                            {revealedAgents[rec.teamId] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Deduction Verdict:</span>
                        {av?.isCorrect === null || av?.isCorrect === undefined ? (
                          <Badge variant="neutral" size="sm">
                            Pending
                          </Badge>
                        ) : av.isCorrect ? (
                          <Badge variant="success" size="sm">
                            CORRECT (+{av.bonusPoints ?? 10})
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            INCORRECT (-{av.penaltyPoints ?? 5})
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Audit Sign-off:</span>
                        <span className="font-medium text-slate-600">
                          {av?.isVerified ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {av.verifiedBy || 'Verified'}
                            </span>
                          ) : (
                            <span className="text-amber-600">Awaiting Sign-off</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Adjustment: {rec.scoreBreakdown.agentAdjustment >= 0 ? '+' : ''}
                      {rec.scoreBreakdown.agentAdjustment} pts
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isFinalized}
                      onClick={() => openAgentModal(rec)}
                    >
                      Audit Verdict
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: SCORECARD ENTRY & EDIT MODAL                                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isScorecardModalOpen}
        onClose={() => setIsScorecardModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-blue-600" />
            <span>
              Enter Finalist Scorecard — {selectedRecord ? selectedRecord.teamName : ''}
            </span>
          </div>
        }
        subtitle="Adjudicate Grand Jury panel evaluation marks. Missing marks are strictly held pending and never treated as zero."
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsScorecardModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveScorecard}>
              Save Scorecard
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {scorecardError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{scorecardError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Presiding Jury Member / Arbiter Name
            </label>
            <input
              type="text"
              value={scorecardJudgeName}
              onChange={(e) => setScorecardJudgeName(e.target.value)}
              placeholder="e.g. Dean of Academics / Chief Presiding Judge"
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-slate-700 font-bold">
              Evaluation Criteria & Marks
            </label>
            {data.config.criteria.map((crit) => (
              <div
                key={crit.id}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <span>{crit.name}</span>
                    <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                      Max: {crit.maxMarks} marks
                    </span>
                  </div>
                  {crit.description && (
                    <div className="text-[11px] text-slate-400 mt-0.5">{crit.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={crit.maxMarks}
                    step="0.5"
                    value={scorecardMarks[crit.id] ?? ''}
                    onChange={(e) =>
                      setScorecardMarks({ ...scorecardMarks, [crit.id]: e.target.value })
                    }
                    placeholder="Marks"
                    className="w-24 p-1.5 border border-slate-300 rounded text-right font-bold text-slate-800 text-xs"
                  />
                  <span className="text-slate-400 font-medium">/ {crit.maxMarks}</span>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Jury Panel Deliberation Notes
            </label>
            <textarea
              rows={3}
              value={scorecardComments}
              onChange={(e) => setScorecardComments(e.target.value)}
              placeholder="Record notes on team rebuttal, logical soundness, and cross-examination performance..."
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: SECRET AGENT VERDICT MODAL                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <span>
              Secret Agent Unmasking Verdict — {selectedRecord ? selectedRecord.teamName : ''}
            </span>
          </div>
        }
        subtitle="Audit and sign off on confidential secret agent identity deductions."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAgentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveAgentVerdict}>
              Save Verdict
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Finalist Suspected Agent Deduction
            </label>
            <input
              type="text"
              value={suspectedAgent}
              onChange={(e) => setSuspectedAgent(e.target.value)}
              placeholder="e.g. Agent Cipher"
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Actual Registered Campus Infiltrator
            </label>
            <input
              type="text"
              value={actualAgent}
              onChange={(e) => setActualAgent(e.target.value)}
              placeholder="e.g. Agent Cipher"
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Deduction Accuracy</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsCorrectVerdict(true)}
                className={`p-2.5 rounded-lg border text-center font-bold transition-all ${
                  isCorrectVerdict === true
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                ✓ Correct Identification
              </button>
              <button
                type="button"
                onClick={() => setIsCorrectVerdict(false)}
                className={`p-2.5 rounded-lg border text-center font-bold transition-all ${
                  isCorrectVerdict === false
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                ✗ Incorrect Deduction
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Bonus Points</label>
              <input
                type="number"
                value={bonusPoints}
                onChange={(e) => setBonusPoints(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Penalty Points</label>
              <input
                type="number"
                value={penaltyPoints}
                onChange={(e) => setPenaltyPoints(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isVerifiedVerdict}
                onChange={(e) => setIsVerifiedVerdict(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-bold text-slate-800">
                Official Sign-off & Audit Signature Verified
              </span>
            </label>

            <input
              type="text"
              value={arbiterSignature}
              onChange={(e) => setArbiterSignature(e.target.value)}
              placeholder="Chief Arbiter / Tech Head Signature"
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Auditor Notes</label>
            <textarea
              rows={2}
              value={verdictNotes}
              onChange={(e) => setVerdictNotes(e.target.value)}
              placeholder="Verification notes or discrepancy justifications..."
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: SCORING RULES & RUBRIC CONFIG MODAL                              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <span>Grand Finale Scoring Rules & Rubric Configuration</span>
          </div>
        }
        subtitle="Adjust championship criteria, carried weights, and confirm official evaluation rules."
        maxWidth="xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsRulesModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveRules}>
              Save Configuration
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Confirmation Checkbox */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rulesConfirmed}
                onChange={(e) => setRulesConfirmed(e.target.checked)}
                className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-bold text-blue-900 text-xs">
                Official Organizing Committee Confirmation
              </span>
            </label>
            <p className="text-[11px] text-blue-800 ml-6">
              Checking this seals the evaluation criteria as tournament policy and unlocks championship finalization once all scorecards are submitted.
            </p>
            <div className="ml-6">
              <input
                type="text"
                value={configSigner}
                onChange={(e) => setConfigSigner(e.target.value)}
                placeholder="Confirmed by (e.g. Chief Arbiter & Tech Head)"
                className="p-1.5 border border-blue-200 bg-white rounded text-xs w-full max-w-sm"
              />
            </div>
          </div>

          {/* Formula Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                <input
                  type="checkbox"
                  checked={carriedOverR4}
                  onChange={(e) => setCarriedOverR4(e.target.checked)}
                  className="rounded text-blue-600"
                />
                Carry Forward Round 4 Score
              </label>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Weight Multiplier:</span>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={r4Weight}
                  onChange={(e) => setR4Weight(e.target.value)}
                  className="w-20 p-1 border rounded text-right font-bold text-xs"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Suggested: 0.20 (20% weight from Legal Battle)
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="block font-bold text-slate-800 mb-1">
                Grand Finale Activity Weight
              </label>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Multiplier:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={activityWeight}
                  onChange={(e) => setActivityWeight(e.target.value)}
                  className="w-20 p-1 border rounded text-right font-bold text-xs"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Suggested: 1.0 (100% of defense rubric score)
              </span>
            </div>
          </div>

          {/* Secret Agent Points */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-800 mb-1">
              Secret Agent Unmasking Adjustment Formula
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">
                  Correct Deduction Bonus:
                </span>
                <input
                  type="number"
                  value={configBonusPoints}
                  onChange={(e) => setConfigBonusPoints(e.target.value)}
                  className="w-full p-1.5 border rounded text-xs"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">
                  Incorrect Deduction Penalty:
                </span>
                <input
                  type="number"
                  value={configPenaltyPoints}
                  onChange={(e) => setConfigPenaltyPoints(e.target.value)}
                  className="w-full p-1.5 border rounded text-xs"
                />
              </div>
            </div>
          </div>

          {/* Criteria List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-800">Scoring Rubric Criteria</span>
              <span className="text-[11px] text-slate-400">
                Total Max Marks:{' '}
                {criteriaForm.reduce((acc, c) => acc + c.maxMarks, 0)} pts
              </span>
            </div>
            <div className="space-y-2">
              {criteriaForm.map((crit, idx) => (
                <div
                  key={crit.id}
                  className="p-2.5 border border-slate-200 rounded-lg flex items-center justify-between gap-3 bg-white"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={crit.name}
                      onChange={(e) => {
                        const updated = [...criteriaForm];
                        updated[idx].name = e.target.value;
                        setCriteriaForm(updated);
                      }}
                      className="font-bold text-slate-800 text-xs w-full p-1 border border-transparent hover:border-slate-200 rounded focus:border-blue-400 focus:outline-hidden"
                    />
                    <input
                      type="text"
                      value={crit.description || ''}
                      onChange={(e) => {
                        const updated = [...criteriaForm];
                        updated[idx].description = e.target.value;
                        setCriteriaForm(updated);
                      }}
                      placeholder="Criterion description..."
                      className="text-[11px] text-slate-400 w-full p-0.5 border border-transparent hover:border-slate-200 rounded focus:border-blue-400 focus:outline-hidden"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[11px] text-slate-500">Max Marks:</span>
                    <input
                      type="number"
                      value={crit.maxMarks}
                      onChange={(e) => {
                        const updated = [...criteriaForm];
                        updated[idx].maxMarks = Number(e.target.value);
                        setCriteriaForm(updated);
                      }}
                      className="w-16 p-1 border rounded text-right font-bold text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: FINALIST MULTI-ROUND JOURNEY MODAL                              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isJourneyModalOpen}
        onClose={() => setIsJourneyModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Tournament Journey — {selectedRecord ? selectedRecord.teamName : ''}</span>
          </div>
        }
        subtitle="Complete multi-round progression record through all 5 event stages."
        maxWidth="lg"
        footer={
          <Button variant="outline" size="sm" onClick={() => setIsJourneyModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedRecord && (
          <div className="space-y-3.5 text-xs">
            {/* Squad Header */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] text-blue-600 font-bold">
                  {formatTeamNumber(selectedRecord.teamNumber)}
                </div>
                <div className="font-extrabold text-sm text-slate-900">
                  {selectedRecord.teamName}
                </div>
              </div>
              <Badge
                variant={selectedRecord.placement === 1 ? 'purple' : 'neutral'}
                size="sm"
              >
                {selectedRecord.placementTitle || selectedRecord.reviewStatus}
              </Badge>
            </div>

            {/* Progression Steps */}
            <div className="space-y-2 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Step 1 */}
              <div className="flex items-start gap-3 relative pl-8">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs absolute left-0 top-0 border-2 border-white shadow-xs">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex-1">
                  <div className="font-bold text-slate-800">
                    Round 1: The Great Expedition
                  </div>
                  <div className="text-slate-500 mt-0.5 text-[11px]">
                    Completed campus clues & logical problem-solving mini-rounds. Qualified for Round 2 Cabo.
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 relative pl-8">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs absolute left-0 top-0 border-2 border-white shadow-xs">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex-1">
                  <div className="font-bold text-slate-800">Round 2: Cabo</div>
                  <div className="text-slate-500 mt-0.5 text-[11px]">
                    Finished within top 12 placement points across 3 Cabo card rounds.
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 relative pl-8">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs absolute left-0 top-0 border-2 border-white shadow-xs">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex-1">
                  <div className="font-bold text-slate-800">Round 3: The Black Market</div>
                  <div className="text-slate-500 mt-0.5 text-[11px]">
                    Maintained positive ledger balance, decoded confidential fragments, and qualified for Round 4 Courtroom hearings.
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 relative pl-8">
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs absolute left-0 top-0 border-2 border-white shadow-xs">
                  <Gavel className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 flex-1">
                  <div className="font-bold text-slate-800">Round 4: The Legal Battle</div>
                  <div className="text-slate-500 mt-0.5 text-[11px]">
                    Rank #{selectedRecord.round4Rank} finish. Raw Score:{' '}
                    {selectedRecord.round4Score !== null ? `${selectedRecord.round4Score} pts` : 'Provisional'}
                    . Qualified for the 3-team Grand Finale podium!
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start gap-3 relative pl-8">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs absolute left-0 top-0 border-2 border-white shadow-xs">
                  <Crown className="w-3.5 h-3.5" />
                </div>
                <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200 flex-1">
                  <div className="font-bold text-amber-900">
                    Grand Finale: Championship
                  </div>
                  <div className="text-amber-800 mt-0.5 text-[11px]">
                    Carried: +{selectedRecord.scoreBreakdown.round4Contribution} pts • Defense: {selectedRecord.scoreBreakdown.finaleActivityScore ?? 'TBD'} pts • Agent: {selectedRecord.scoreBreakdown.agentAdjustment >= 0 ? '+' : ''}{selectedRecord.scoreBreakdown.agentAdjustment} pts • Total: {selectedRecord.scoreBreakdown.totalFinaleScore ?? 'Pending'} pts.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: FINALIZE CHAMPIONSHIP CONFIRMATION DIALOG                        */}
      {/* ========================================================================= */}
      <ConfirmationDialog
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        onConfirm={handleFinalize}
        title="Finalize Tournament Grand Finale?"
        message={
          <div className="space-y-3 text-xs">
            {finalizeError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
                {finalizeError}
              </div>
            )}
            <p>
              You are about to declare official tournament winners and seal the Grand Finale podium.
            </p>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-1">
              <div className="font-bold text-amber-900">Projected Champion:</div>
              <div className="text-amber-800">
                {championRecord ? `${championRecord.teamName} (${formatTeamNumber(championRecord.teamNumber)})` : 'None'}
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Authorizing Tech Head / Chief Arbiter
              </label>
              <input
                type="text"
                value={finalizeArbiter}
                onChange={(e) => setFinalizeArbiter(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded text-xs"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Once sealed, scorecards and placings cannot be modified without a database reset.
            </p>
          </div>
        }
        confirmLabel="Declare Official Champion"
        isDestructive={false}
      />

      {/* ========================================================================= */}
      {/* MODAL 6: RESET DATA CONFIRMATION DIALOG                                  */}
      {/* ========================================================================= */}
      <ConfirmationDialog
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleReset}
        title="Reset Grand Finale Records?"
        message="This will clear all recorded jury scorecards, agent unmasking verdicts, and return scoring rules to an unconfirmed blank state. Round 1-4 records will remain untouched."
        confirmLabel="Reset Finale Records"
        isDestructive={true}
      />
    </div>
  );
}
