import { Scale } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export function JudgesPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              Round 4: The Legal Battle — Judges Portal
            </h2>
            <Badge variant="neutral" size="sm">
              Upcoming Phase
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Adversarial legal debating, argument cross-examinations, and scoring rubric for 8 finalist teams
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning" size="sm">
            8 Finalist Squads
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200/80">
          <CardHeader title="Moot Court Trials" />
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">4 Matchups</div>
            <p className="text-xs text-slate-500 mt-1">
              Head-to-head bracket arguments evaluated by invited faculty and advocate judges.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader title="Evaluation Rubric" />
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 font-mono">4 Criteria</div>
            <p className="text-xs text-slate-500 mt-1">
              Legal foundation, rhetorical rebuttal, evidentiary support, and time management.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader title="Finale Cutoff" />
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 font-mono">Top 3 Teams</div>
            <p className="text-xs text-slate-500 mt-1">
              Top 3 advancing teams proceed to the Grand Finale for trophy ranking.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80">
        <CardHeader
          title="Judges Scorecard Scoring Console (Scaffolding)"
          subtitle="Judge verification workflows will be activated in the Round 4 module"
        />
        <CardContent>
          <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
            <Scale className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <h4 className="text-xs font-bold text-slate-700">Judges Console Standby</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              The Legal Battle module will be implemented in subsequent prompts with digital scoring sheets, tamper-evident submit confirmations, and live aggregate calculations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
