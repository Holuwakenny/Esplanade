import React from "react";
import { SitePlans, PlanItem } from "../types";

interface SitePlansReportSectionProps {
  sitePlansData: { siteName: string; plans: SitePlans }[];
  isPdfStyle?: boolean;
}

export const SitePlansReportSection: React.FC<SitePlansReportSectionProps> = ({
  sitePlansData,
  isPdfStyle = false,
}) => {
  const containerStyle = isPdfStyle
    ? { paddingTop: "16px", borderTop: "2px solid #000000", marginTop: "20px" }
    : undefined;

  const headerStyle = isPdfStyle
    ? { fontSize: "14px", fontWeight: "bold", color: "#000000", marginBottom: "12px", textTransform: "uppercase" as const, letterSpacing: "0.5px" }
    : undefined;

  const tableStyle = isPdfStyle
    ? { width: "100%", borderCollapse: "collapse" as const, fontSize: "12px", lineHeight: "1.5", border: "1px solid #000000", marginBottom: "16px" }
    : undefined;

  const thStyle = isPdfStyle
    ? { backgroundColor: "#000000", color: "#ffffff", fontWeight: "bold", padding: "8px 10px", border: "1px solid #000000" }
    : undefined;

  const tdStyle = isPdfStyle
    ? { padding: "8px 10px", border: "1px solid #000000", color: "#000000" }
    : undefined;

  return (
    <div className="space-y-6 pt-6 border-t border-slate-300 print:pt-4 print:border-slate-800" style={containerStyle}>
      <div className="flex items-center justify-between">
        <h3
          className="text-base font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2 print:text-sm"
          style={headerStyle}
        >
          <span>📋 Site Action Plans, Issues & Challenges</span>
        </h3>
        <span className="text-xs font-bold text-slate-500 print:text-black">
          Official Plan Log
        </span>
      </div>

      {sitePlansData.map(({ siteName, plans }) => {
        const PRIORITY_RANK: Record<string, number> = {
          Critical: 1,
          High: 2,
          Medium: 3,
          Low: 4,
        };

        const issues = [...(plans.issuesAndChallenges || [])].sort((a, b) => {
          const rA = PRIORITY_RANK[a.priority || "High"] || 2;
          const rB = PRIORITY_RANK[b.priority || "High"] || 2;
          return rA - rB;
        });

        const daily = [...(plans.nextDayPlan || [])].sort((a, b) => {
          const rA = PRIORITY_RANK[a.priority || "Medium"] || 3;
          const rB = PRIORITY_RANK[b.priority || "Medium"] || 3;
          return rA - rB;
        });

        const weekly = plans.weeklyPlan || [];
        const monthly = plans.monthlyPlan || [];

        return (
          <div key={siteName} className="space-y-4">
            {sitePlansData.length > 1 && (
              <div className="font-bold text-sm text-indigo-900 border-b border-slate-200 pb-1 print:text-black print:border-black">
                Construction Site: {siteName}
              </div>
            )}

            {/* 1. Issues & Challenges */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5 print:text-black">
                <span>⚠️ Issues & Critical Site Challenges ({issues.length})</span>
              </h4>
              {issues.length === 0 ? (
                <p className="text-xs text-slate-400 italic print:text-slate-600">No open site issues recorded.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs print:border-black print:shadow-none">
                  <table className="w-full text-left text-xs border-collapse" style={tableStyle}>
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold print:bg-black" style={isPdfStyle ? {} : undefined}>
                        <th className="p-2 border border-slate-700 w-8 text-center" style={thStyle}>#</th>
                        <th className="p-2 border border-slate-700" style={thStyle}>Issue / Challenge</th>
                        <th className="p-2 border border-slate-700" style={thStyle}>Priority</th>
                        <th className="p-2 border border-slate-700" style={thStyle}>Assigned To</th>
                        <th className="p-2 border border-slate-700 text-right" style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {issues.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50">
                          <td className="p-2 border border-slate-200 text-center font-bold text-slate-700" style={tdStyle}>
                            {idx + 1}
                          </td>
                          <td className="p-2 border border-slate-200 font-semibold text-slate-900" style={tdStyle}>
                            {item.title}
                            {item.notes && <div className="text-[11px] text-slate-500 italic mt-0.5">Note: {item.notes}</div>}
                          </td>
                          <td className="p-2 border border-slate-200 font-bold text-rose-700" style={tdStyle}>
                            {item.priority || "High"}
                          </td>
                          <td className="p-2 border border-slate-200 text-slate-700" style={tdStyle}>
                            {item.assignedTo || "-"}
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-bold" style={tdStyle}>
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              item.status === "Resolved" || item.status === "Completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.status === "In Progress"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 2. Next-Day Plan */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 print:text-black">
                <span>⚡ Next-Day Action Plan / Daily Targets ({daily.length})</span>
              </h4>
              {daily.length === 0 ? (
                <p className="text-xs text-slate-400 italic print:text-slate-600">No daily plan items logged.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs print:border-black print:shadow-none">
                  <table className="w-full text-left text-xs border-collapse" style={tableStyle}>
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold print:bg-black">
                        <th className="p-2 border border-slate-700 w-8 text-center" style={thStyle}>#</th>
                        <th className="p-2 border border-slate-700" style={thStyle}>Target Action Item</th>
                        <th className="p-2 border border-slate-700" style={thStyle}>Priority</th>
                        <th className="p-2 border border-slate-700" style={thStyle}>Assigned To</th>
                        <th className="p-2 border border-slate-700 text-right" style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {daily.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50">
                          <td className="p-2 border border-slate-200 text-center font-bold text-slate-700" style={tdStyle}>
                            {idx + 1}
                          </td>
                          <td className="p-2 border border-slate-200 font-semibold text-slate-900" style={tdStyle}>
                            {item.title}
                          </td>
                          <td className="p-2 border border-slate-200 font-bold text-amber-700" style={tdStyle}>
                            {item.priority || "Medium"}
                          </td>
                          <td className="p-2 border border-slate-200 text-slate-700" style={tdStyle}>
                            {item.assignedTo || "-"}
                          </td>
                          <td className="p-2 border border-slate-200 text-right font-bold" style={tdStyle}>
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              item.status === "Completed" || item.status === "Resolved"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.status === "In Progress"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 3. Weekly & Monthly Plans */}
            {(weekly.length > 0 || monthly.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weekly.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5 print:text-black">
                      <span>📅 Weekly Milestones ({weekly.length})</span>
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs print:border-black print:shadow-none">
                      <table className="w-full text-left text-xs border-collapse" style={tableStyle}>
                        <thead>
                          <tr className="bg-slate-800 text-white font-bold print:bg-black">
                            <th className="p-2 border border-slate-700" style={thStyle}>Milestone Action</th>
                            <th className="p-2 border border-slate-700" style={thStyle}>Target Date</th>
                            <th className="p-2 border border-slate-700 text-right" style={thStyle}>Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {weekly.map((item, idx) => (
                            <tr key={item.id || idx}>
                              <td className="p-2 border border-slate-200 font-semibold text-slate-900" style={tdStyle}>
                                {item.title}
                              </td>
                              <td className="p-2 border border-slate-200 text-slate-700" style={tdStyle}>
                                {item.targetDate || item.assignedTo || "-"}
                              </td>
                              <td className="p-2 border border-slate-200 text-right font-bold" style={tdStyle}>
                                {item.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {monthly.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5 print:text-black">
                      <span>🎯 Monthly Objectives ({monthly.length})</span>
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs print:border-black print:shadow-none">
                      <table className="w-full text-left text-xs border-collapse" style={tableStyle}>
                        <thead>
                          <tr className="bg-slate-800 text-white font-bold print:bg-black">
                            <th className="p-2 border border-slate-700" style={thStyle}>Monthly Goal</th>
                            <th className="p-2 border border-slate-700" style={thStyle}>Target Date</th>
                            <th className="p-2 border border-slate-700 text-right" style={thStyle}>Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {monthly.map((item, idx) => (
                            <tr key={item.id || idx}>
                              <td className="p-2 border border-slate-200 font-semibold text-slate-900" style={tdStyle}>
                                {item.title}
                              </td>
                              <td className="p-2 border border-slate-200 text-slate-700" style={tdStyle}>
                                {item.targetDate || "-"}
                              </td>
                              <td className="p-2 border border-slate-200 text-right font-bold" style={tdStyle}>
                                {item.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
