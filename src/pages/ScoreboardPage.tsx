import { ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MOCK_TEAMS } from '../data/mockData';
import { formatTeamNumber } from '../utils/formatters';

export function ScoreboardPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              Live Tournament Scoreboard & Cutoff Tracker
            </h2>
            <Badge variant="warning" size="sm">
              Demo Standings
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Round 1 (The Great Expedition) scoring in progress · Cutoff line set at Rank 24
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm">
            Unresolved Cutoff Ties Require Marshal Review
          </Badge>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-center gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
        <span>
          <strong>Notice:</strong> Points below reflect mock testing scores. Official scores will be verified and entered through the scoring engine module in a subsequent prompt.
        </span>
      </div>

      <Card className="border-slate-200/80">
        <CardHeader
          title="Consolidated Standings (Round 1 Live)"
          subtitle="Top 24 advance to Round 2 (Cabo). Teams 25-32 face elimination."
          action={
            <span className="text-xs text-slate-500 font-mono">
              Auto-refresh: 30s
            </span>
          }
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4">Squad</th>
                  <th className="py-3 px-4">Round 1 (Expedition)</th>
                  <th className="py-3 px-4">Code Fragments</th>
                  <th className="py-3 px-4">Bonus / Penalties</th>
                  <th className="py-3 px-4">Total Aggregate</th>
                  <th className="py-3 px-4">Projected Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_TEAMS.slice(0, 16).map((team, idx) => {
                  const rank = idx + 1;
                  const isTop24 = rank <= 24;
                  // Sample mock points strictly labeled
                  const mockR1 = 100 - (idx * 3);
                  const mockClues = idx % 3 === 0 ? 10 : 0;
                  const total = mockR1 + mockClues;

                  return (
                    <tr
                      key={team.id}
                      className={rank === 24 ? 'bg-amber-50/30 border-b-2 border-amber-400' : 'hover:bg-slate-50'}
                    >
                      <td className="py-3 px-4 text-center font-bold font-mono text-slate-700">
                        {rank <= 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs">
                            {rank}
                          </span>
                        ) : (
                          `#${rank}`
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{team.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{formatTeamNumber(team.teamNumber)}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {mockR1} pts
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        +{mockClues} pts
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        0
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {total} pts
                      </td>
                      <td className="py-3 px-4">
                        {isTop24 ? (
                          <Badge variant="success" size="sm">
                            In Cutoff (Safe)
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            Elimination Risk
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
            Previewing top 16 of 32 teams. Additional round columns (Cabo, Market, Legal) activate as rounds commence.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
