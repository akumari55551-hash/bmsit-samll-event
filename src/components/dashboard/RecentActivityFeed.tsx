import { Clock, QrCode, UserCheck, Shield, Award, Terminal } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge, BadgeVariant } from '../ui/Badge';
import { ActivityLogItem, ActivityCategory } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';

interface RecentActivityFeedProps {
  activities: ActivityLogItem[];
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  const getCategoryIcon = (cat: ActivityCategory) => {
    switch (cat) {
      case 'clue':
        return QrCode;
      case 'checkin':
        return UserCheck;
      case 'agent':
        return Shield;
      case 'qualification':
        return Award;
      default:
        return Terminal;
    }
  };

  const mapBadgeVariant = (type: ActivityLogItem['badgeType']): BadgeVariant => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'danger';
      case 'info':
        return 'primary';
      default:
        return 'neutral';
    }
  };

  return (
    <Card className="border-slate-200/80">
      <CardHeader
        title="Live Operations Activity Log"
        subtitle="Recent checkpoint triggers, registration check-ins, and system notices"
        action={
          <Badge variant="neutral" size="sm">
            Mock Event Stream
          </Badge>
        }
      />
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {activities.map((item) => {
            const Icon = getCategoryIcon(item.category);
            return (
              <div
                key={item.id}
                className="p-4 flex items-start gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        {item.title}
                      </span>
                      {item.teamTag && (
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.teamTag}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Badge variant={mapBadgeVariant(item.badgeType)} size="sm">
                    {item.category}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
