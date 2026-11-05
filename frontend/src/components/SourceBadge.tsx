import React from 'react';
import { ShieldCheck, GraduationCap, Newspaper, Users, HelpCircle } from 'lucide-react';

interface Props {
  tier: string;
  sourceName?: string;
  className?: string;
}

export const SourceBadge: React.FC<Props> = ({ tier, sourceName, className = '' }) => {
  let badgeStyle = 'bg-slate-50 text-slate-700 border-slate-200';
  let Icon = Newspaper;

  if (tier === 'Official source') {
    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
    Icon = ShieldCheck;
  } else if (tier === 'Academic source') {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = GraduationCap;
  } else if (tier === 'Established publication') {
    badgeStyle = 'bg-slate-50 text-slate-700 border-slate-200';
    Icon = Newspaper;
  } else if (tier === 'Community source') {
    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
    Icon = Users;
  } else if (tier === 'Unverified source') {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    Icon = HelpCircle;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${badgeStyle} ${className}`}
      title={`Credibility tier: ${tier}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{sourceName || tier}</span>
    </span>
  );
};
