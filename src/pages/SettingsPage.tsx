import { Server, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { API_CONFIG } from '../services/apiConfig';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              System Settings & Service Connectivity
            </h2>
            <Badge variant="primary" size="sm">
              Configuration
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Backend API endpoints, environment parameters, and system operational flags
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend Connectivity Status */}
        <Card className="border-slate-200/80">
          <CardHeader
            title={
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Server className="w-4 h-4 text-blue-600" />
                Backend Connection Point
              </div>
            }
          />
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Configured Base URL</span>
              <span className="font-mono font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {API_CONFIG.baseUrl}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">API Prefix</span>
              <span className="font-mono font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {API_CONFIG.apiPrefix}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Data Source Mode</span>
              <Badge variant="warning" size="sm">
                Mock / Demo Provider Active
              </Badge>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Target Framework</span>
              <span className="font-semibold text-slate-700">
                Python FastAPI + SQLAlchemy
              </span>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => alert('FastAPI backend health-check will be tested in backend implementation phase.')}
              >
                Ping Backend Health Endpoint
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Event Rules & Configuration */}
        <Card className="border-slate-200/80">
          <CardHeader
            title={
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Event Master Parameters
              </div>
            }
          />
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Designated College</span>
              <span className="font-semibold text-slate-800">
                BMSIT &amp; Management
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Participating Teams</span>
              <span className="font-mono font-medium text-slate-800">
                32 Teams (160 Students)
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Members Per Squad</span>
              <span className="font-mono font-medium text-slate-800">
                5 Members Exactly
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Elimination Cutoffs</span>
              <span className="font-mono font-medium text-slate-800">
                32 &rarr; 24 &rarr; 12 &rarr; 8 &rarr; 3
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Secret Agent Quota</span>
              <span className="font-mono font-medium text-purple-700">
                1 per Squad (32 Total)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
