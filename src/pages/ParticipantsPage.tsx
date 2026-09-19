import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  ArrowUpDown,
  ArrowRightLeft,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { Pagination } from '../components/ui/Pagination';
import { TableRowSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { eventService } from '../services/eventService';
import { Participant, Team, ParticipantRole, CreateParticipantInput, UpdateParticipantInput } from '../types';

type SortField = 'name' | 'usn' | 'teamName' | 'checkedIn';
type SortOrder = 'asc' | 'desc';

export function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterCheckIn, setFilterCheckIn] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('usn');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals state
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [deleteTargetParticipant, setDeleteTargetParticipant] = useState<Participant | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUsn, setFormUsn] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<ParticipantRole>('Member');
  const [formTeamId, setFormTeamId] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data & subscribe to changes
  const loadData = async () => {
    try {
      const [partRes, teamsRes] = await Promise.all([
        eventService.getParticipants(),
        eventService.getTeams(),
      ]);
      setParticipants(partRes.data);
      setTeams(teamsRes.data);
      if (selectedParticipant) {
        const updated = partRes.data.find((p) => p.id === selectedParticipant.id);
        if (updated) setSelectedParticipant(updated);
      }
    } catch (err) {
      console.error('Error loading participants data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = eventService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, []);

  // Filter & Sort
  const filteredAndSortedParticipants = useMemo(() => {
    return participants
      .filter((p) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.usn.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          (p.teamName && p.teamName.toLowerCase().includes(query));

        let matchesTeam = true;
        if (filterTeam === 'unassigned') {
          matchesTeam = !p.teamId;
        } else if (filterTeam !== 'all') {
          matchesTeam = p.teamId === filterTeam;
        }

        let matchesCheckIn = true;
        if (filterCheckIn === 'checkedIn') {
          matchesCheckIn = p.checkedIn;
        } else if (filterCheckIn === 'pending') {
          matchesCheckIn = !p.checkedIn;
        }

        return matchesSearch && matchesTeam && matchesCheckIn;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortField === 'usn') {
          comparison = a.usn.localeCompare(b.usn);
        } else if (sortField === 'teamName') {
          comparison = (a.teamName || '').localeCompare(b.teamName || '');
        } else if (sortField === 'checkedIn') {
          comparison = (a.checkedIn === b.checkedIn) ? 0 : a.checkedIn ? -1 : 1;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [participants, searchQuery, filterTeam, filterCheckIn, sortField, sortOrder]);

  const paginatedParticipants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedParticipants.slice(start, start + pageSize);
  }, [filteredAndSortedParticipants, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Check-In toggle
  const handleToggleCheckIn = async (participantId: string) => {
    try {
      await eventService.toggleParticipantCheckIn(participantId);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  // Create Handlers
  const handleOpenCreate = () => {
    setFormName('');
    setFormEmail('');
    setFormUsn('');
    setFormPhone('');
    setFormRole('Member');
    // Default to first team with < 5 members if available
    const availableTeam = teams.find((t) => t.members.length < 5);
    setFormTeamId(availableTeam ? availableTeam.id : '');
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleCreateParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const input: CreateParticipantInput = {
        name: formName,
        email: formEmail,
        usn: formUsn,
        phone: formPhone || undefined,
        role: formRole,
        teamId: formTeamId || null,
        checkedIn: false,
      };
      await eventService.createParticipant(input);
      setIsCreateOpen(false);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Failed to add student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Handlers
  const handleOpenEdit = (p: Participant) => {
    setSelectedParticipant(p);
    setFormName(p.name);
    setFormEmail(p.email);
    setFormUsn(p.usn);
    setFormPhone(p.phone || '');
    setFormRole(p.role);
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleUpdateParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const input: UpdateParticipantInput = {
        name: formName,
        email: formEmail,
        usn: formUsn,
        phone: formPhone || undefined,
        role: formRole,
      };
      await eventService.updateParticipant(selectedParticipant.id, input);
      setIsEditOpen(false);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Failed to update participant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Transfer / Reassign Handlers
  const handleOpenTransfer = (p: Participant) => {
    setSelectedParticipant(p);
    setFormTeamId(p.teamId || '');
    setFormError(null);
    setIsTransferOpen(true);
  };

  const handleTransferParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      await eventService.updateParticipant(selectedParticipant.id, {
        teamId: formTeamId || null,
      });
      setIsTransferOpen(false);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDeleteParticipant = async () => {
    if (!deleteTargetParticipant) return;
    setIsSubmitting(true);
    try {
      await eventService.deleteParticipant(deleteTargetParticipant.id);
      setDeleteTargetParticipant(null);
      if (selectedParticipant?.id === deleteTargetParticipant.id) {
        setIsDetailsOpen(false);
        setSelectedParticipant(null);
      }
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              Student Participants Directory
            </h2>
            <Badge variant="primary" size="sm">
              {participants.length} Students Registered
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual student accreditation, desk check-in, and squad assignment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreate}
          >
            Register Student
          </Button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, USN, email, or squad..."
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
            <span>Squad:</span>
            <select
              value={filterTeam}
              onChange={(e) => {
                setFilterTeam(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer max-w-[180px]"
            >
              <option value="all">All Squads ({teams.length})</option>
              <option value="unassigned">Unassigned Only</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.members.length}/5)
                </option>
              ))}
            </select>
          </div>

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
              <option value="all">All Statuses</option>
              <option value="checkedIn">Checked In</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <Card className="border-slate-200/80">
        <CardHeader
          title="Student Roster"
          subtitle={`Showing ${paginatedParticipants.length} of ${filteredAndSortedParticipants.length} matching students`}
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort('usn')}
                  >
                    <div className="flex items-center gap-1">
                      <span>USN</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Student Name</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Role</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort('teamName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Assigned Squad</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSort('checkedIn')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Check-In</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                ) : paginatedParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12">
                      <EmptyState
                        icon={UserCheck}
                        title="No Participants Found"
                        description="No registered students match your filter or search criteria."
                        action={{
                          label: 'Clear Filters',
                          onClick: () => {
                            setSearchQuery('');
                            setFilterTeam('all');
                            setFilterCheckIn('all');
                          },
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedParticipants.map((participant) => (
                    <tr key={participant.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {participant.usn}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedParticipant(participant);
                            setIsDetailsOpen(true);
                          }}
                          className="font-semibold text-slate-900 hover:text-blue-600 text-left transition-colors cursor-pointer"
                        >
                          {participant.name}
                        </button>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {participant.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {participant.role === 'Leader' ? (
                          <Badge variant="purple" size="sm">
                            Leader
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Member
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {participant.teamId ? (
                          <span className="inline-flex items-center gap-1.5 font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200/80 text-[11px]">
                            <Users className="w-3 h-3 text-blue-500" />
                            {participant.teamName}
                          </span>
                        ) : (
                          <Badge variant="warning" size="sm">
                            Unassigned
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleCheckIn(participant.id)}
                          className="cursor-pointer transition-transform active:scale-95"
                          title="Click to toggle check-in"
                        >
                          {participant.checkedIn ? (
                            <Badge variant="success" size="sm" dot>
                              <CheckCircle2 className="w-3 h-3 inline mr-1" />
                              Checked In
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              <Clock className="w-3 h-3 inline mr-1" />
                              Pending
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedParticipant(participant);
                              setIsDetailsOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="View student profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenTransfer(participant)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                            title="Assign or move to another squad"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(participant)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetParticipant(participant)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredAndSortedParticipants.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* ========================================== */}
      {/* 1. Add Participant Modal                   */}
      {/* ========================================== */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Student Participant"
        subtitle="Add a college student to the tournament directory and assign to a squad"
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
              onClick={handleCreateParticipant}
              isLoading={isSubmitting}
            >
              Register Student
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateParticipant} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aditi Sharma"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                BMSIT USN *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1BY23CS161"
                value={formUsn}
                onChange={(e) => setFormUsn(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Institutional Email *
              </label>
              <input
                type="email"
                required
                placeholder="student@bmsit.in"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Squad Role
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as ParticipantRole)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
              >
                <option value="Member">Squad Member</option>
                <option value="Leader">Squad Leader</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assign to Squad
              </label>
              <select
                value={formTeamId}
                onChange={(e) => setFormTeamId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
              >
                <option value="">Leave Unassigned (Bench)</option>
                {teams.map((t) => {
                  const isFull = t.members.length >= 5;
                  return (
                    <option key={t.id} value={t.id} disabled={isFull}>
                      {t.name} ({t.members.length}/5 members) {isFull ? '— FULL' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
            <strong>Rule:</strong> A student can belong to at most 1 squad. Squads with 5 members cannot accept additional participants.
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* 2. Edit Participant Modal                  */}
      {/* ========================================== */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Participant Info"
        subtitle={`Update attributes for ${selectedParticipant?.name}`}
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
              onClick={handleUpdateParticipant}
              isLoading={isSubmitting}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateParticipant} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                BMSIT USN *
              </label>
              <input
                type="text"
                required
                value={formUsn}
                onChange={(e) => setFormUsn(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Squad Role
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as ParticipantRole)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
              >
                <option value="Member">Squad Member</option>
                <option value="Leader">Squad Leader</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Institutional Email *
              </label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Contact
              </label>
              <input
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* 3. Assign / Transfer Squad Modal           */}
      {/* ========================================== */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transfer / Assign Squad"
        subtitle={`Select target squad for ${selectedParticipant?.name}`}
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTransferOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleTransferParticipant}
              isLoading={isSubmitting}
            >
              Confirm Assignment
            </Button>
          </>
        }
      >
        <form onSubmit={handleTransferParticipant} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-500">Current Assignment:</div>
            <div className="font-bold text-slate-800 mt-0.5">
              {selectedParticipant?.teamName ? (
                <span>{selectedParticipant.teamName}</span>
              ) : (
                <span className="text-amber-600 font-normal">Unassigned (Bench)</span>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Destination Squad
            </label>
            <select
              value={formTeamId}
              onChange={(e) => setFormTeamId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
            >
              <option value="">Unassign from Squad (Move to Bench)</option>
              {teams.map((t) => {
                const isCurrentTeam = t.id === selectedParticipant?.teamId;
                const isFull = t.members.length >= 5 && !isCurrentTeam;
                return (
                  <option key={t.id} value={t.id} disabled={isFull}>
                    {t.name} ({t.members.length}/5 members){isCurrentTeam ? ' — (Current)' : ''}{isFull ? ' — FULL' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            <strong>Transfer Safeguard:</strong> Reassigning will automatically update both squads&apos; rosters and recalculate check-in completeness.
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* 4. Participant Details Modal               */}
      {/* ========================================== */}
      {selectedParticipant && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={selectedParticipant.name}
          subtitle={`USN: ${selectedParticipant.usn} · ${selectedParticipant.role}`}
          maxWidth="md"
          footer={
            <Button size="sm" variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Check-in Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                selectedParticipant.checkedIn
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  {selectedParticipant.checkedIn ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Check-In Verified
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-amber-600" />
                      Check-In Pending
                    </>
                  )}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {selectedParticipant.checkedIn
                    ? 'Student credential has been verified at the check-in desk.'
                    : 'Student has not yet presented credentials at the tech desk.'}
                </div>
              </div>

              <Button
                variant={selectedParticipant.checkedIn ? 'outline' : 'primary'}
                size="sm"
                onClick={() => handleToggleCheckIn(selectedParticipant.id)}
              >
                {selectedParticipant.checkedIn ? 'Revoke' : 'Check In'}
              </Button>
            </div>

            {/* Profile Data List */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">Assigned Squad</span>
                <span className="font-semibold text-slate-800">
                  {selectedParticipant.teamName || 'Unassigned'}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">Squad Role</span>
                <Badge variant={selectedParticipant.role === 'Leader' ? 'purple' : 'neutral'} size="sm">
                  {selectedParticipant.role}
                </Badge>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">Email Address</span>
                <span className="font-mono text-slate-700 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {selectedParticipant.email}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">Contact Number</span>
                <span className="text-slate-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {selectedParticipant.phone || 'Not Provided'}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">Participant ID</span>
                <span className="font-mono text-slate-400 text-[11px]">
                  {selectedParticipant.id}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================== */}
      {/* 5. Delete Participant Confirmation         */}
      {/* ========================================== */}
      {deleteTargetParticipant && (
        <ConfirmationDialog
          isOpen={true}
          onClose={() => setDeleteTargetParticipant(null)}
          onConfirm={handleDeleteParticipant}
          title={`Delete Student: ${deleteTargetParticipant.name}`}
          message={
            <p>
              Are you sure you want to permanently remove <strong>{deleteTargetParticipant.name}</strong> ({deleteTargetParticipant.usn}) from the tournament directory?
              {deleteTargetParticipant.teamName && (
                <span className="block mt-1 text-amber-700 font-medium">
                  This student will also be removed from {deleteTargetParticipant.teamName}&apos;s squad roster.
                </span>
              )}
            </p>
          }
          confirmLabel="Delete Student"
          cancelLabel="Cancel"
          isDestructive={true}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
