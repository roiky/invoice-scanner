import React from 'react';

export function StatsCard({ title, value, icon: Icon, trend, color = "blue" }) {
    const colorStyles = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        purple: "bg-purple-50 text-purple-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 border border-slate-100 group">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight font-display">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colorStyles[color]} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={22} />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-1 text-xs font-medium">
                    <span className={trend > 0 ? "text-green-600" : "text-red-500"}>
                        {trend > 0 ? "+" : ""}{trend}%
                    </span>
                    <span className="text-slate-400">from last month</span>
                </div>
            )}
        </div>
    );
}
