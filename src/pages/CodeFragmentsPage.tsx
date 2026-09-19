import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface FragmentMock {
  id: string;
  codeNumber: number;
  zone: string;
  pointValue: number;
  isFound: boolean;
  discoveredByTeam?: string;
  discoveredAt?: string;
}

const MOCK_FRAGMENTS: FragmentMock[] = Array.from({ length: 16 }).map((_, idx) => ({
  id: `frag-${idx + 1}`,
  codeNumber: idx + 1,
  zone: idx % 4 === 0 ? 'Main Library' : idx % 4 === 1 ? 'Innovation Quad' : idx % 4 === 2 ? 'Auditorium Corridor' : 'Sports Complex',
  pointValue: 10 + (idx % 3) * 5,
  isFound: idx < 6,
  discoveredByTeam: idx < 6 ? `Team T-${String(idx + 1).padStart(2, '0')}` : undefined,
  discoveredAt: idx < 6 ? '10:45 AM' : undefined,
}));

export function CodeFragmentsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              Campus Hidden Code Fragments Hunt
            </h2>
            <Badge variant="primary" size="sm">
              32 Physical Checkpoints
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Decentralized QR & cipher code discovery running in parallel with all rounds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm" dot>
            6 Discovered
          </Badge>
          <Badge variant="neutral" size="sm">
            26 Hidden in Campus
          </Badge>
        </div>
      </div>

      <Card className="border-slate-200/80">
        <CardHeader
          title="Code Fragment Ledger (Preview)"
          subtitle="Showing preview of 16 clue stations across BMSIT campus"
        />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  <th className="py-3 px-4">Clue #</th>
                  <th className="py-3 px-4">Campus Sector / Zone</th>
                  <th className="py-3 px-4">Point Weight</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Discovered By</th>
                  <th className="py-3 px-4">Logged Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_FRAGMENTS.map((frag) => (
                  <tr key={frag.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      CLUE-#{String(frag.codeNumber).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {frag.zone}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600 font-semibold">
                      +{frag.pointValue} pts
                    </td>
                    <td className="py-3 px-4">
                      {frag.isFound ? (
                        <Badge variant="success" size="sm" dot>
                          Claimed
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Unclaimed
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {frag.discoveredByTeam || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {frag.discoveredAt || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
