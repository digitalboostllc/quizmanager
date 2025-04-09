"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
    {
        name: "Jan",
        views: 2400,
        completions: 1400,
    },
    {
        name: "Feb",
        views: 1398,
        completions: 980,
    },
    {
        name: "Mar",
        views: 9800,
        completions: 6800,
    },
    {
        name: "Apr",
        views: 3908,
        completions: 2908,
    },
    {
        name: "May",
        views: 4800,
        completions: 3800,
    },
    {
        name: "Jun",
        views: 3800,
        completions: 2800,
    },
    {
        name: "Jul",
        views: 4300,
        completions: 2300,
    },
];

export function Overview() {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                <Tooltip
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    formatter={(value) => [`${value}`, '']}
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #eaeaea',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                />
                <Legend />
                <Bar
                    dataKey="views"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="Views"
                    barSize={30}
                />
                <Bar
                    dataKey="completions"
                    fill="hsl(var(--primary) / 0.4)"
                    radius={[4, 4, 0, 0]}
                    name="Completions"
                    barSize={30}
                />
            </BarChart>
        </ResponsiveContainer>
    );
} 