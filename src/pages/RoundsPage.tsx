import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, MapPin, Users, ArrowRight, Compass, ShieldAlert, Sparkles, Scale, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { eventService } from '../services/eventService';
import { RoundInfo } from '../types';

export function RoundsPage() {
  const [rounds, setRounds] = useState<RoundInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    eventService.getRounds().then((res) => {
      setRounds(res.data);
      setIsLoading(false);
    });
  }, []);

  const getRoundIcon = (r: number) => {
    switch (r) {
      case 1:
        return Compass;
      case 2:
        return Layers;
      case 3:
        return ShieldAlert;
      case 4:
        return Scale;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              Tournament Elimination Structure
            </h2>
            <Badge variant="primary" size="sm">
              5 Competitive Stages
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict multi-tier elimination from 32 down to final Top 3 podium
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-36 bg-white rounded-xl border animate-pulse" />
          <div className="h-36 bg-white rounded-xl border animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rounds.map((round) => {
            const Icon = getRoundIcon(round.roundNumber);
            const isLive = round.status === 'Live';

            return (
              <Card
                key={round.roundNumber}
                className={isLive ? 'border-blue-300 ring-1 ring-blue-500/20' : 'border-slate-200/80'}
              >
                <CardHeader
                  title={
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                          isLive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-slate-900">
                        Round {round.roundNumber}: {round.name}
                      </span>
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {round.codename}
                      </span>
                    </div>
                  }
                  action={
                    <div className="flex items-center gap-2">
                      {round.roundNumber === 1 && (
                        <Link to="/round-1">
                          <Button size="sm" variant="primary" rightIcon={<ExternalLink className="w-3 h-3" />}>
                            Open Console
                          </Button>
                        </Link>
                      )}
                      {round.roundNumber === 2 && (
                        <Link to="/round-2">
                          <Button size="sm" variant="primary" rightIcon={<ExternalLink className="w-3 h-3" />}>
                            Open Console
                          </Button>
                        </Link>
                      )}
                      {round.roundNumber === 3 && (
                        <Link to="/round-3">
                          <Button size="sm" variant="primary" rightIcon={<ExternalLink className="w-3 h-3" />}>
                            Open Console
                          </Button>
                        </Link>
                      )}
                      {round.roundNumber === 4 && (
                        <Link to="/round-4">
                          <Button size="sm" variant="primary" rightIcon={<ExternalLink className="w-3 h-3" />}>
                            Open Console
                          </Button>
                        </Link>
                      )}
                      {round.roundNumber === 5 && (
                        <Link to="/finale">
                          <Button size="sm" variant="primary" rightIcon={<ExternalLink className="w-3 h-3" />}>
                            Open Console
                          </Button>
                        </Link>
                      )}
                      {isLive ? (
                        <Badge variant="warning" size="sm" dot>
                          LIVE NOW
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          {round.status}
                        </Badge>
                      )}
                    </div>
                  }
                />
                <CardContent className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {round.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Field Progression</span>
                        <span className="font-semibold text-slate-800">
                          {round.initialTeamsCount} Teams &rarr; Top {round.qualifyingTeamsCount} Qualify
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Designated Venue</span>
                        <span className="font-medium text-slate-700 truncate block max-w-[200px]" title={round.location}>
                          {round.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Next Elimination Phase</span>
                        <span className="font-medium text-blue-600 flex items-center gap-1">
                          {round.roundNumber === 5 ? 'Grand Trophy Ceremony' : `Round ${round.roundNumber + 1}`}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
