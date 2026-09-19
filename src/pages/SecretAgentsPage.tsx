import { Lock, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function SecretAgentsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              Secret Agent Programme Management
            </h2>
            <Badge variant="purple" size="sm">
              RESTRICTED CONSOLE
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Undercover operatives program running throughout all tournament rounds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="danger" size="sm" dot>
            Confidentiality Protocol Active
          </Badge>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 flex items-start gap-4 shadow-lg">
        <div className="w-10 h-10 rounded-lg bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Operation Undercover — Compartmentalized Access
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Per event regulations, individual secret agent identities and sabotage objectives are strictly encrypted. 
            Identities are stored in isolated cryptographic envelopes and will only be revealed during the <strong>Grand Finale Deduction Ceremony</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200/80">
          <CardHeader title="Agent Allocation" />
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-slate-900 font-mono">32 / 32</div>
            <p className="text-xs text-slate-500">
              Exactly 1 secret agent embedded within each of the 32 participating squads.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader title="Transmission Status" />
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-emerald-600 font-mono">100% Locked</div>
            <p className="text-xs text-slate-500">
              Initial briefing tokens transmitted to encrypted organizer handoffs.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader title="Finale Unmasking" />
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-purple-600 font-mono">Phase 5</div>
            <p className="text-xs text-slate-500">
              Teams will submit deduction votes before final podium computation.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80">
        <CardHeader
          title="Agent Operations Architecture (Scaffolding)"
          subtitle="Module implementation will be enabled in subsequent prompt"
        />
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <EyeOff className="w-4 h-4 text-purple-600" />
              Role-Based Access Control Architecture
            </div>
            <p>
              In Prompt 00, agent identities are securely omitted from client state. When the backend FastAPI module is built, this screen will provide role-authenticated access for the Chief Marshal to audit undercover progress without leaking data to projector displays or participant screens.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
