import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  ArrowUpDown,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge, BadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { Pagination } from '../components/ui/Pagination';
import { TableRowSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { eventService } from '../services/eventService';
import { Team, Participant, CreateTeamInput, UpdateTeamInput } from '../types';
import { formatTeamNumber } from '../utils/formatters';

type SortField = 'teamNumber' | 'name' | 'membersCount' | 'checkedInCount';
type SortOrder = 'asc' | 'desc';

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCheckIn, setFilterCheckIn] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('teamNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Modals state
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTargetTeam, setDeleteTargetTeam] = useState<Team | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formTable, setFormTable] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load teams and subscribe to pub/sub updates
  const loadTeams = async () => {
    try {
      const res = await eventService.getTeams();
      setTeams(res.data);
      // Update selected team if open
      if (selectedTeam) {
        const updated = res.data.find((t) => t.id === selectedTeam.id);
        if (updated) setSelectedTeam(updated);
      }
    } catch (err) {
      console.error('Error loading teams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
    const unsubscribe = eventService.subscribe(() => {
      loadTeams();
    });
    return unsubscribe;
  }, []);

  // Compute check-in metrics
  const getTeamCheckInMetrics = (team: Team) => {
    const total = team.members.length;
    const checkedIn = team.members.filter((m) => m.checkedIn).length;
    const isCompleteRoster = total === 5;
    const isFullyCheckedIn = isCompleteRoster && checkedIn === 5;

    let label = 'Unchecked';
    let variant: BadgeVariant = 'neutral';

    if (!isCompleteRoster) {
      label = `Incomplete Roster (${total}/5)`;
      variant = 'warning';
    } else if (isFullyCheckedIn) {
      label = 'Ready · 5/5 Checked In';
      variant = 'success';
    } else if (checkedIn > 0) {
      label = `Partial · ${checkedIn}/5 Checked In`;
      variant = 'primary';
    } else {
      label = '0/5 Checked In';
      variant = 'neutral';
    }

    return { total, checkedIn, isCompleteRoster, isFullyCheckedIn, label, variant };
  };

  // Filter & Sort
  const filteredAndSortedTeams = useMemo(() => {
    return teams
      .filter((team) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          team.name.toLowerCase().includes(query) ||
          formatTeamNumber(team.teamNumber).toLowerCase().includes(query) ||
          team.leaderName.toLowerCase().includes(query);

        const metrics = getTeamCheckInMetrics(team);
        let matchesCheckIn = true;
        if (filterCheckIn === 'ready') {
          matchesCheckIn = metrics.isFullyCheckedIn;
        } else if (filterCheckIn === 'partial') {
          matchesCheckIn = metrics.isCompleteRoster && metrics.checkedIn > 0 && !metrics.isFullyCheckedIn;
        } else if (filterCheckIn === 'incomplete') {
          matchesCheckIn = !metrics.isCompleteRoster;
        } else if (filterCheckIn === 'unchecked') {
          matchesCheckIn = metrics.isCompleteRoster && metrics.checkedIn === 0;
        }

        const matchesStatus = filterStatus === 'all' || team.status === filterStatus;

        return matchesSearch && matchesCheckIn && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'teamNumber') {
          comparison = a.teamNumber - b.teamNumber;
        } else if (sortField === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortField === 'membersCount') {
          comparison = a.members.length - b.members.length;
        } else if (sortField === 'checkedInCount') {
          const aCount = a.members.filter((m) => m.checkedIn).length;
          const bCount = b.members.filter((m) => m.checkedIn).length;
          comparison = aCount - bCount;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [teams, searchQuery, filterCheckIn, filterStatus, sortField, sortOrder]);

  // Paginate
  const paginatedTeams = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedTeams.slice(start, start + pageSize);
  }, [filteredAndSortedTeams, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handlers for Create
  const handleOpenCreate = () => {
    setFormName('');
    setFormTable(`Table ${teams.length + 1}`);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const input: CreateTeamInput = {
        name: formName,
        assignedTable: formTable,
      };
      await eventService.createTeam(input);
      setIsCreateOpen(false);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Failed to register squad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Edit
  const handleOpenEdit = (team: Team) => {
    setSelectedTeam(team);
    setFormName(team.name);
    setFormTable(team.assignedTable || '');
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const input: UpdateTeamInput = {
        name: formName,
        assignedTable: formTable,
      };
      await eventService.updateTeam(selectedTeam.id, input);
      setIsEditOpen(false);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Failed to update squad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Delete
  const handleDeleteTeam = async () => {
    if (!deleteTargetTeam) return;
    setIsSubmitting(true);
    try {
      await eventService.deleteTeam(deleteTargetTeam.id);
      setDeleteTargetTeam(null);
      if (selectedTeam?.id === deleteTargetTeam.id) {
        setIsDetailsOpen(false);
        setSelectedTeam(null);
      }
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick check-in toggle from Details Modal
  const handleToggleMemberCheckIn = async (memberId: string) => {
    try {
      await eventService.toggleParticipantCheckIn(memberId);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  // Remove member from team
  const handleRemoveMemberFromTeam = async (participant: Participant) => {
    if (confirm(`Remove ${participant.name} from ${selectedTeam?.name}? They will become an unassigned participant.`)) {
      try {
        await eventService.updateParticipant(participant.id, { teamId: null });
      } catch (err: unknown) {
        alert((err as Error).message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              Tournament Squads Management
            </h2>
            <Badge variant="primary" size="sm">
              {teams.length} Squads Registered
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            5 members per squad maximum · Target capacity: 32 Squads (160 Students)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreate}
          >
            Register New Squad
          </Button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search squad name, number, or leader..."
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
            <span>Check-in:</span>
            <select
              value={filterCheckIn}
              onChange={(e) => {
                setFilterCheckIn(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">All Check-In Statuses</option>
              <option value="ready">Ready (5/5 Checked In)</option>
              <option value="partial">Partial Check-In</option>
              <option value="incomplete">Incomplete Roster (&lt; 5 Members)</option>
              <option value="unchecked">Unchecked (0/5)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Checked In">Checked In</option>
              <option value="Registered">Registered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Teams Table */}
      <Card className="border-slate-200/80">
        <CardHeader
          title="Registered Squads Roster"
          subtitle={`Showing ${paginatedTeams.length} of ${filteredAndSortedTeams.length} matching squads`}
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort('teamNumber')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Tag</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Team Name</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort('membersCount')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Assigned Members</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort('checkedInCount')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Check-In Progress</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Desk Location</th>
                  <th className="py-3 px-4">Team Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
                ) : paginatedTeams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12">
                      <EmptyState
                        icon={Users}
                        title="No Squads Found"
                        description="No registered teams match your filter or search criteria."
                        action={{
                          label: 'Clear Filters',
                          onClick: () => {
                            setSearchQuery('');
                            setFilterCheckIn('all');
                            setFilterStatus('all');
                          },
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedTeams.map((team) => {
                    const metrics = getTeamCheckInMetrics(team);
                    return (
                      <tr key={team.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {formatTeamNumber(team.teamNumber)}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => {
                              setSelectedTeam(team);
                              setIsDetailsOpen(true);
                            }}
                            className="font-semibold text-slate-900 hover:text-blue-600 text-left transition-colors cursor-pointer"
                          >
                            {team.name}
                          </button>
                          <div className="text-[11px] text-slate-400">
                            Leader: <span className="text-slate-600">{team.leaderName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-semibold font-mono text-[11px] px-2 py-0.5 rounded ${
                                metrics.isCompleteRoster
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {metrics.total} / 5
                            </span>
                            {!metrics.isCompleteRoster && (
                              <span className="text-[10px] text-amber-600 font-medium">
                                Needs {5 - metrics.total}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 max-w-[150px]">
                            <Badge variant={metrics.variant} size="sm" dot={metrics.isFullyCheckedIn}>
                              {metrics.label}
                            </Badge>
                            {/* Progress mini bar */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  metrics.isFullyCheckedIn
                                    ? 'bg-emerald-500'
                                    : metrics.checkedIn > 0
                                    ? 'bg-blue-500'
                                    : 'bg-slate-300'
                                }`}
                                style={{ width: `${(metrics.checkedIn / 5) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {team.assignedTable || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          {team.status === 'Checked In' ? (
                            <Badge variant="success" size="sm">
                              Checked In
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Registered
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedTeam(team);
                                setIsDetailsOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="View squad details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(team)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit squad"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTargetTeam(team)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete squad"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
            totalItems={filteredAndSortedTeams.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* ========================================== */}
      {/* 1. Create Team Modal                       */}
      {/* ========================================== */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Squad"
        subtitle="Create an official 5-participant squad slot in tournament roster"
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateTeam}
              isLoading={isSubmitting}
            >
              Register Squad
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Squad / Team Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Neural Knights"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Assigned Table / Station
            </label>
            <input
              type="text"
              placeholder="e.g. Table A-1"
              value={formTable}
              onChange={(e) => setFormTable(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
            />
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-[11px] leading-relaxed">
            <strong>Capacity Rule:</strong> Once registered, you can assign up to 5 participants to this squad. Squads with fewer than 5 participants are flagged as incomplete.
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* 2. Edit Team Modal                         */}
      {/* ========================================== */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Squad Details"
        subtitle={`Update attributes for ${selectedTeam?.name}`}
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateTeam}
              isLoading={isSubmitting}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateTeam} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Squad Name *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Assigned Table / Station
            </label>
            <input
              type="text"
              value={formTable}
              onChange={(e) => setFormTable(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
            />
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* 3. Team Details Drawer / Modal             */}
      {/* ========================================== */}
      {selectedTeam && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-bold text-blue-600">
                {formatTeamNumber(selectedTeam.teamNumber)}
              </span>
              <span>{selectedTeam.name}</span>
            </div>
          }
          subtitle={`Assigned Table: ${selectedTeam.assignedTable || 'None'} · Round ${selectedTeam.currentRound}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-[11px] text-slate-500">
                Registered: {new Date(selectedTeam.createdAt).toLocaleDateString()}
              </div>
              <Button size="sm" variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Done
              </Button>
            </div>
          }
        >
          <div className="space-y-6 text-xs">
            {/* Check-in Completion Banner */}
            {(() => {
              const metrics = getTeamCheckInMetrics(selectedTeam);
              return (
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    metrics.isFullyCheckedIn
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : metrics.isCompleteRoster
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2">
                      {metrics.isFullyCheckedIn ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-600" />
                      )}
                      <span>{metrics.label}</span>
                    </div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {metrics.isFullyCheckedIn
                        ? 'All 5 members are present and verified. Squad is ready to compete in Round 1.'
                        : !metrics.isCompleteRoster
                        ? `Incomplete squad: Only ${metrics.total} of 5 members assigned. Squad cannot compete until full.`
                        : `${metrics.checkedIn} of 5 members checked in at the desk.`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono font-bold text-lg">
                      {metrics.checkedIn} / 5
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Members Roster Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Squad Members ({selectedTeam.members.length} / 5)
                </h4>
                {selectedTeam.members.length < 5 && (
                  <span className="text-[11px] text-amber-600 font-medium">
                    {5 - selectedTeam.members.length} member slot(s) remaining
                  </span>
                )}
              </div>

              {selectedTeam.members.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500">
                  <UserX className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-semibold text-xs text-slate-700">No Participants Assigned</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Navigate to the Participants page to register students and assign them to this squad.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Participant</th>
                        <th className="py-2.5 px-3">USN</th>
                        <th className="py-2.5 px-3">Check-In Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedTeam.members.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3">
                            {member.role === 'Leader' ? (
                              <Badge variant="purple" size="sm">
                                Leader
                              </Badge>
                            ) : (
                              <Badge variant="neutral" size="sm">
                                Member
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{member.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{member.email}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {member.usn}
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => handleToggleMemberCheckIn(member.id)}
                              className="cursor-pointer"
                            >
                              {member.checkedIn ? (
                                <Badge variant="success" size="sm" dot>
                                  <UserCheck className="w-3 h-3 inline mr-1" />
                                  Checked In
                                </Badge>
                              ) : (
                                <Badge variant="warning" size="sm">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleRemoveMemberFromTeam(member)}
                              className="text-[11px] text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Unassign from this squad"
                            >
                              Unassign
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================== */}
      {/* 4. Delete Team Safeguard Dialog            */}
      {/* ========================================== */}
      {deleteTargetTeam && (
        <ConfirmationDialog
          isOpen={true}
          onClose={() => setDeleteTargetTeam(null)}
          onConfirm={handleDeleteTeam}
          title={`Delete Squad: ${deleteTargetTeam.name}`}
          message={
            deleteTargetTeam.members.length > 0 ? (
              <p>
                This squad cannot be deleted because it currently has{' '}
                <strong>{deleteTargetTeam.members.length} assigned participant(s)</strong>.
              </p>
            ) : (
              <p>
                Are you sure you want to permanently delete <strong>{deleteTargetTeam.name}</strong> ({formatTeamNumber(deleteTargetTeam.teamNumber)}) from the tournament? This action cannot be undone.
              </p>
            )
          }
          isBlocked={deleteTargetTeam.members.length > 0}
          blockedReason="Data Integrity Safeguard: To prevent silent data loss or orphaned records, please unassign or transfer all participants before deleting this squad."
          confirmLabel="Delete Squad"
          cancelLabel="Close"
          isDestructive={true}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
