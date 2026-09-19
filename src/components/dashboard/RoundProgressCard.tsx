import { Check, ChevronRight, Compass, ShieldAlert, Sparkles, Scale, Layers as CardsIcon } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { RoundProgressionStep } from '../../types';

interface RoundProgressCardProps {
  steps: RoundProgressionStep[];
}

export function RoundProgressCard({ steps }: RoundProgressCardProps) {
  const getRoundIcon = (roundNumber: number) => {
    switch (roundNumber) {
      case 1:
        return Compass;
      case 2:
        return CardsIcon || Sparkles;
      case 3:
        return ShieldAlert;
      case 4:
        return Scale;
      case 5:
        return Sparkles;
      default:
        return Compass;
    }
  };

  return (
    <Card className="border-slate-200/80">
      <CardHeader
        title="Tournament Progression & Qualification Pipeline"
        subtitle="32 Teams competing across 4 progressive elimination rounds into the Grand Finale"
        action={
          <Badge variant="primary" size="sm">
            Stage 1 of 5
          </Badge>
        }
      />
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {steps.map((step, idx) => {
            const Icon = getRoundIcon(step.roundNumber);
            const isLive = step.status === 'Live';
            const isCompleted = step.status === 'Completed';

            return (
              <div
                key={step.roundNumber}
                className={`relative rounded-xl p-4 border transition-all ${
                  isLive
                    ? 'bg-blue-50/50 border-blue-300 shadow-sm ring-1 ring-blue-500/20'
                    : isCompleted
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Step Header */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Round {step.roundNumber}
                  </span>
                  {isLive && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      ACTIVE
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-emerald-600">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* Round Title & Icon */}
                <div className="flex items-start gap-2 mb-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                      isLive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate" title={step.name}>
                      {step.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {step.roundNumber === 5 ? 'Top 3 Ceremony' : `Qualify ${step.qualifyingCount}`}
                    </p>
                  </div>
                </div>

                {/* Cutoff Ratio */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Field Size</span>
                  <span className="font-semibold text-slate-700 font-mono">
                    {step.totalPool} &rarr; {step.qualifyingCount}
                  </span>
                </div>

                {/* Desktop Arrow Connector */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
