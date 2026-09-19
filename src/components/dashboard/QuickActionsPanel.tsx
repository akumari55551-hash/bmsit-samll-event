import { useState } from 'react';
import { UserCheck, FastForward, Megaphone, QrCode, Download, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

export function QuickActionsPanel() {
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const triggerAction = (name: string, detail: string) => {
    setModalMessage(`[Demo Action]: "${name}" clicked.\n\n${detail}\n\nThis control will connect to the FastAPI management endpoints in a future prompt.`);
  };

  return (
    <>
      <Card className="border-slate-200/80">
        <CardHeader
          title="Organizer Quick Controls"
          subtitle="Direct operational dispatch actions for event marshals"
        />
        <CardContent className="space-y-2.5">
          <Button
            variant="outline"
            className="w-full justify-start text-left py-2.5 px-3 hover:border-blue-300 hover:bg-blue-50/40"
            leftIcon={<UserCheck className="w-4 h-4 text-blue-600" />}
            onClick={() =>
              triggerAction(
                'Rapid Team Check-In',
                'Fast-scans team QR or USN at desk to mark 5 members present.'
              )
            }
          >
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-800">Rapid Team Check-in</div>
              <div className="text-[11px] text-slate-400 font-normal">Verify 5 members present</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-left py-2.5 px-3 hover:border-blue-300 hover:bg-blue-50/40"
            leftIcon={<QrCode className="w-4 h-4 text-emerald-600" />}
            onClick={() =>
              triggerAction(
                'Verify Clue Token',
                'Accepts secret code submissions from teams in Round 1 & passive hunt.'
              )
            }
          >
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-800">Verify Code Token</div>
              <div className="text-[11px] text-slate-400 font-normal">Confirm QR or fragment claim</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-left py-2.5 px-3 hover:border-blue-300 hover:bg-blue-50/40"
            leftIcon={<Megaphone className="w-4 h-4 text-amber-600" />}
            onClick={() =>
              triggerAction(
                'Broadcast Announcement',
                'Dispatches urgent broadcast audio/text alert across participant consoles.'
              )
            }
          >
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-800">Broadcast Alert</div>
              <div className="text-[11px] text-slate-400 font-normal">Send marshal notification</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-left py-2.5 px-3 hover:border-blue-300 hover:bg-blue-50/40"
            leftIcon={<FastForward className="w-4 h-4 text-purple-600" />}
            onClick={() =>
              triggerAction(
                'Advance Elimination Bracket',
                'Evaluates Round 1 Expedition scores and finalizes 24 qualified teams for Round 2 (Cabo).'
              )
            }
          >
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-800">Advance Elimination</div>
              <div className="text-[11px] text-slate-400 font-normal">Calculate top 24 cutoffs</div>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-left py-2 px-3 text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-200"
            leftIcon={<Download className="w-4 h-4 text-slate-400" />}
            onClick={() =>
              triggerAction(
                'Export Roster CSV',
                'Generates an export of the 32 teams, 160 participants, and current standings.'
              )
            }
          >
            <div className="text-xs font-medium">Export Roster & Standings</div>
          </Button>
        </CardContent>
      </Card>

      {/* Modal alert for quick action demonstration */}
      {modalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-blue-600 mb-3">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">Operator Console Dispatch</h3>
            </div>
            <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed mb-5 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
              {modalMessage}
            </p>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setModalMessage(null)}>
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
