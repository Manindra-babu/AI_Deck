import React from 'react';
import { CheckCircle2, FlaskConical, Building2, Radio, AlertCircle } from 'lucide-react';

interface Props {
  status: string;
}

export const VerificationBadge: React.FC<Props> = ({ status }) => {
  let style = 'bg-slate-50 text-slate-700 border-slate-200';
  let Icon = Radio;

  if (status === 'Confirmed announcement') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = CheckCircle2;
  } else if (status === 'Research finding') {
    style = 'bg-blue-50 text-blue-700 border-blue-200';
    Icon = FlaskConical;
  } else if (status === 'Company claim') {
    style = 'bg-amber-50 text-amber-800 border-amber-200';
    Icon = Building2;
  } else if (status === 'Reported development') {
    style = 'bg-slate-50 text-slate-700 border-slate-200';
    Icon = Radio;
  } else if (status === 'Unverified claim') {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
    Icon = AlertCircle;
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      <Icon className="w-3 h-3" />
      <span>{status}</span>
    </span>
  );
};
