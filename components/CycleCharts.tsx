import React, { useMemo } from 'react';
import { RoscaCycle, RoscaMonth, PaymentStatus } from '../types';
import { CheckCircleIcon, ClockIcon, AlertTriangleIcon } from './Icons';

interface CycleChartsProps {
  roscaCycle: RoscaCycle;
  currentMonthData: RoscaMonth;
}

const DonutChart: React.FC<{ data: { status: PaymentStatus; count: number }[] }> = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.count, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400">
        No contribution data for this month.
      </div>
    );
  }

  const radius = 60;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  const statusColors: Record<PaymentStatus, string> = {
    [PaymentStatus.PAID]: 'stroke-green-500',
    [PaymentStatus.PENDING]: 'stroke-yellow-500',
    [PaymentStatus.OVERDUE]: 'stroke-red-500',
  };

  const statusIcons: Record<PaymentStatus, React.FC<{ className?: string }>> = {
    [PaymentStatus.PAID]: CheckCircleIcon,
    [PaymentStatus.PENDING]: ClockIcon,
    [PaymentStatus.OVERDUE]: AlertTriangleIcon,
  };
  
  const statusLabels: Record<PaymentStatus, string> = {
    [PaymentStatus.PAID]: 'Paid',
    [PaymentStatus.PENDING]: 'Pending',
    [PaymentStatus.OVERDUE]: 'Overdue',
  };

  let accumulatedOffset = 0;

  return (
    <div>
        <div className="relative flex items-center justify-center">
            <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
                <circle
                    className="stroke-slate-200 dark:stroke-slate-700"
                    cx="80"
                    cy="80"
                    r={radius}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {data.map(({ status, count }) => {
                    const percentage = count / total;
                    const strokeDashoffset = circumference * (1 - percentage);
                    const rotation = (accumulatedOffset / total) * 360;
                    accumulatedOffset += count;

                    return (
                        <circle
                            key={status}
                            className={`${statusColors[status]} transition-all duration-500 ease-in-out`}
                            cx="80"
                            cy="80"
                            r={radius}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 50%' }}
                        />
                    );
                })}
            </svg>
            <div className="absolute text-center">
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{total}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Members</p>
            </div>
        </div>
        <div className="mt-4 flex justify-center gap-4 flex-wrap">
            {data.map(({ status, count }) => {
                const Icon = statusIcons[status];
                return (
                    <div key={status} className="flex items-center gap-2 text-sm">
                        <Icon className={`w-4 h-4 ${statusColors[status].replace('stroke-', 'text-')}`} />
                        <span className="text-slate-600 dark:text-slate-300">{statusLabels[status]}:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{count}</span>
                    </div>
                );
            })}
        </div>
    </div>
  );
};

const ContributionChart: React.FC<{ months: RoscaMonth[], currentMonth: number }> = ({ months, currentMonth }) => {
  const chartData = useMemo(() => {
    return months
      .filter(m => m.month < currentMonth)
      .map(month => ({
        month: `M${month.month}`,
        total: month.contributions.reduce((sum, c) => sum + (c.status === PaymentStatus.PAID ? (c.amountPaid ?? 0) : 0), 0),
      }));
  }, [months, currentMonth]);

  if (chartData.length === 0) {
    return (
        <div className="flex items-center justify-center h-64 text-slate-400">
            Contribution history will appear here as months are completed.
        </div>
    );
  }
  
  const maxValue = Math.max(...chartData.map(d => d.total), 1); // Avoid division by zero
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const width = 500;
  const height = 250;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = chartWidth / chartData.length * 0.6;
  const barSpacing = chartWidth / chartData.length * 0.4;
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Y-Axis Grid Lines */}
        {[0.25, 0.5, 0.75, 1].map(tick => (
            <line
                key={tick}
                x1={padding.left}
                y1={padding.top + chartHeight * (1 - tick)}
                x2={width - padding.right}
                y2={padding.top + chartHeight * (1 - tick)}
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="1"
            />
        ))}
        {/* Y-Axis Labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(tick => (
            <text
                key={tick}
                x={padding.left - 8}
                y={padding.top + chartHeight * (1 - tick) + 4}
                textAnchor="end"
                className="text-xs fill-slate-500 dark:fill-slate-400"
            >
                {(maxValue * tick / 1000).toFixed(0)}k
            </text>
        ))}
        
        {/* Bars and X-Axis Labels */}
        {chartData.map((d, i) => {
            const barHeight = (d.total / maxValue) * chartHeight;
            const x = padding.left + i * (barWidth + barSpacing) + barSpacing / 2;
            const y = padding.top + chartHeight - barHeight;
            return (
                <g key={d.month}>
                    <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        className="fill-primary-500 hover:fill-primary-600 transition-colors"
                        rx="2"
                    >
                      <title>{d.month}: {d.total.toLocaleString()} BDT</title>
                    </rect>
                     <text
                        x={x + barWidth / 2}
                        y={height - padding.bottom + 15}
                        textAnchor="middle"
                        className="text-xs fill-slate-500 dark:fill-slate-400"
                    >
                        {d.month}
                    </text>
                </g>
            );
        })}
    </svg>
  );
};

export const CycleCharts: React.FC<CycleChartsProps> = ({ roscaCycle, currentMonthData }) => {
    const { months, currentMonth } = roscaCycle;

    const donutChartData = useMemo(() => {
        const statuses = new Map<string, PaymentStatus>();

        // Initial statuses from current month
        currentMonthData.contributions.forEach(c => {
            statuses.set(c.memberId, c.status);
        });

        // Check for overdue payments from previous months and override if current is PENDING
        const overdueMemberIds = new Set<string>();
        months.forEach(month => {
            if (month.month < currentMonth) {
                month.contributions.forEach(c => {
                    if (c.status === PaymentStatus.OVERDUE) {
                        overdueMemberIds.add(c.memberId);
                    }
                });
            }
        });

        overdueMemberIds.forEach(memberId => {
            if (statuses.get(memberId) === PaymentStatus.PENDING) {
                statuses.set(memberId, PaymentStatus.OVERDUE);
            }
        });

        const counts = {
            [PaymentStatus.PAID]: 0,
            [PaymentStatus.PENDING]: 0,
            [PaymentStatus.OVERDUE]: 0,
        };
        
        statuses.forEach(status => {
            counts[status]++;
        });

        return [
            { status: PaymentStatus.PAID, count: counts[PaymentStatus.PAID] },
            { status: PaymentStatus.PENDING, count: counts[PaymentStatus.PENDING] },
            { status: PaymentStatus.OVERDUE, count: counts[PaymentStatus.OVERDUE] },
        ].filter(d => d.count > 0);
    }, [currentMonthData, months, currentMonth]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
            <div className="lg:col-span-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Total Contributions by Month</h3>
                <ContributionChart months={months} currentMonth={currentMonth} />
            </div>
            <div className="lg:col-span-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 dark:border-slate-700/50">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 text-center">Current Month Status</h3>
                 <DonutChart data={donutChartData} />
            </div>
        </div>
    );
};
