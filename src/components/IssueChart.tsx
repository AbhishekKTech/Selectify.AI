'use client'
import React from 'react'
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Tooltip, CartesianGrid } from 'recharts'
import { Assess, Automated_Assess, Result } from '@prisma/client'

interface Props {
  EveryResolve: Result[];
  EveryAssessment: Assess[];
  EveryAutoAssessment: Automated_Assess[];
}

const IssueChart = ({ EveryResolve, EveryAssessment, EveryAutoAssessment }: Props) => {
  const data = [
    { label: 'Attended', value: EveryResolve.length },
    { label: 'Self Assess', value: EveryAssessment.length },
    { label: 'Hosted', value: EveryAutoAssessment.length },
  ];

  return (
    <div className='w-full h-full min-h-[220px] flex flex-col justify-center py-2'>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-6 px-2">Distribution</h3>
        <ResponsiveContainer width={'100%'} height={200}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/80" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--background)' }}
                  itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey={'value'} 
                  name="Total"
                  fill="#4f46e5" 
                  radius={[6, 6, 0, 0]} 
                  barSize={36} 
                />
            </BarChart>
        </ResponsiveContainer>
    </div>
  )
}

export default IssueChart