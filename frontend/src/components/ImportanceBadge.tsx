import React from 'react';
import { Flame, Sparkles, TrendingUp, Info } from 'lucide-react';

interface Props {
  score: number;
  reason?: string | null;
  compact?: boolean;
}

export const ImportanceBadge: React.FC<Props> = ({ score, reason, compact = false }) => {
  let color = 'bg-slate-50 text-slate-700 border-slate-200';
  let Icon = Info;
  let label = 'Standard';

  if (score >= 8.5) {
    color = 'bg-red-50 text-red-700 border-red-200';
    Icon = Flame;
    label = 'Critical';
  } else if (score >= 7.0) {
    color = 'bg-blue-50 text-blue-700 border-blue-200';
    Icon = Sparkles;
    label = 'High Impact';
  } else if (score >= 5.5) {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = TrendingUp;
    label = 'Notable';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${color}`}
      title={reason || `Importance rating: ${score}/10`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="font-semibold">{score.toFixed(1)}</span>
      {!compact && <span className="opacity-80">({label})</span>}
    </div>
  );
};
