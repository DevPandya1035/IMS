'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  Database,
  Search
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

// Static seed data
const rawDemand = [38, 42, 35, 52, 58, 44, 39, 48, 55, 41, 36, 62, 68, 45, 38, 72, 65, 50, 44, 78, 82, 58, 46, 88, 75, 52, 40, 90, 84, 60, 48, 95, 88, 62, 50, 100, 92, 65, 52, 105, 98, 68, 55, 110, 102, 70, 58];

const anomBase = [
  45, 48, 42, 49, 52, 41, 39, 46, 50, 44, 43, 55, 92, 48, 42, 38, 43, 49, 52, 48, 55, 50,
  46, 39, 42, 48, 41, 36, 8, 45, 52, 49, 41, 46, 50, 55, 58, 52, 88, 49, 42, 39, 46, 52, 48
];

const modelComparisonActual = [72, 68, 75, 80, 77, 82, 86, 84, 88, 92, 90, 95, 98, 100];
const modelComparisonHW = [70, 66, 74, 79, 75, 80, 85, 83, 86, 91, 89, 93, 96, 99];
const modelComparisonArima = [68, 64, 71, 77, 72, 78, 82, 80, 84, 88, 86, 90, 93, 96];
const modelComparisonMA = [65, 63, 68, 74, 70, 74, 79, 77, 80, 84, 82, 87, 90, 92];

const zScores: Record<number, number> = {
  80: 1.28,
  85: 1.44,
  90: 1.28,
  92: 1.41,
  95: 1.65,
  96: 1.75,
  97: 1.88,
  98: 2.05,
  99: 2.33
};

// Holt-Winters Mathematical Model
function runHoltWintersModel(data: number[], alpha: number, beta: number, gamma: number, m: number, horizon: number) {
  let l = data.slice(0, m).reduce((a, b) => a + b, 0) / m;
  let b = (data.slice(m, 2 * m).reduce((a, b) => a + b, 0) / m - l) / m;
  let s = data.slice(0, m).map((v) => v - l);
  const fitted: number[] = [];

  for (let t = 0; t < data.length; t++) {
    const si = t >= m ? s[t - m]! : s[((t % m) + m) % m]!;
    const l_prev = l, b_prev = b;
    l = alpha * (data[t]! - si) + (1 - alpha) * (l_prev + b_prev);
    b = beta * (l - l_prev) + (1 - beta) * b_prev;
    const si_idx = t - m < 0 ? t : t - m;
    const new_s = gamma * (data[t]! - l_prev - b_prev) + (1 - gamma) * (s[si_idx % m] || 0);
    s.push(new_s);
    fitted.push(l_prev + b_prev + si);
  }

  const fcst: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    fcst.push(l + h * b + s[s.length - m + ((h - 1) % m)]!);
  }

  return { fitted, fcst, level: l, trend: b };
}

export default function ForecastingPage() {
  const [activeTab, setActiveTab] = useState<'hw' | 'models' | 'anomaly' | 'reorder' | 'accuracy' | 'pipeline'>('hw');

  // 1. Holt-Winters State
  const [hwAlpha, setHwAlpha] = useState(0.3);
  const [hwBeta, setHwBeta] = useState(0.1);
  const [hwGamma, setHwGamma] = useState(0.2);
  const [hwHorizon, setHwHorizon] = useState(14);

  // 2. Anomaly Detection State
  const [anomK, setAnomK] = useState(2.5);
  const [anomW, setAnomW] = useState(14);

  // 3. Smart Reorder State
  const [reorderAvgSales, setReorderAvgSales] = useState(12);
  const [reorderMaxSales, setReorderMaxSales] = useState(20);
  const [reorderAvgLead, setReorderAvgLead] = useState(7);
  const [reorderMaxLead, setReorderMaxLead] = useState(10);
  const [reorderServiceLevel, setReorderServiceLevel] = useState(95);

  // References to Chart canvasses
  const hwChartRef = useRef<HTMLCanvasElement>(null);
  const hwChartInstance = useRef<any>(null);

  const modelCompChartRef = useRef<HTMLCanvasElement>(null);
  const mapeCategoryChartRef = useRef<HTMLCanvasElement>(null);

  const anomChartRef = useRef<HTMLCanvasElement>(null);
  const anomChartInstance = useRef<any>(null);

  const reorderUrgencyChartRef = useRef<HTMLCanvasElement>(null);
  const leadTimeChartRef = useRef<HTMLCanvasElement>(null);

  const rollingMapeChartRef = useRef<HTMLCanvasElement>(null);
  const residualChartRef = useRef<HTMLCanvasElement>(null);

  // ─── Holt-Winters Math Execution ─────────────────────────
  const { fitted: hwFitted, fcst: hwFcst, trend: hwTrend } = runHoltWintersModel(rawDemand, hwAlpha, hwBeta, hwGamma, 7, hwHorizon);
  const hwMape = (rawDemand.reduce((sum, v, i) => sum + Math.abs(v - hwFitted[i]!) / v, 0) / rawDemand.length) * 100;
  const hwRmse = Math.sqrt(rawDemand.reduce((sum, v, i) => sum + (v - hwFitted[i]!) ** 2, 0) / rawDemand.length);
  const hwFcstTotal = Math.round(hwFcst.reduce((sum, v) => sum + v, 0));

  // ─── Anomaly Detection Math Execution ────────────────────
  const anomalies: Array<{ date: string; demand: number; mean: number; sd: number; zScore: number; type: string }> = [];
  const anomMeanArr: number[] = [];
  const anomUbArr: number[] = [];
  const anomLbArr: number[] = [];
  const anomScatterArr: Array<{ x: string; y: number } | null> = [];

  for (let i = 0; i < anomBase.length; i++) {
    if (i < anomW) {
      anomMeanArr.push(Math.round(anomBase.slice(0, anomW).reduce((a, b) => a + b, 0) / anomW));
      anomUbArr.push(45);
      anomLbArr.push(35);
      anomScatterArr.push(null);
    } else {
      const windowSlice = anomBase.slice(i - anomW, i);
      const mean = windowSlice.reduce((a, b) => a + b, 0) / anomW;
      const sd = Math.sqrt(windowSlice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / anomW) || 1;
      const ub = mean + anomK * sd;
      const lb = mean - anomK * sd;

      anomMeanArr.push(Math.round(mean));
      anomUbArr.push(Math.round(ub));
      anomLbArr.push(Math.round(lb));

      const observed = anomBase[i]!;
      const diff = observed - mean;
      const zScore = Math.round((diff / sd) * 10) / 10;

      if (Math.abs(diff) > anomK * sd) {
        anomScatterArr.push({ x: `D${i + 1}`, y: observed });
        anomalies.push({
          date: `Day ${i + 1}`,
          demand: observed,
          mean: Math.round(mean),
          sd: Math.round(sd * 10) / 10,
          zScore,
          type: diff > 0 ? 'Spike' : 'Drop'
        });
      } else {
        anomScatterArr.push(null);
      }
    }
  }

  // ─── Smart Reorder Calculation ───────────────────────────
  const reorderZ = zScores[reorderServiceLevel] || 1.65;
  const reorderStdDev = Math.max(1, (reorderMaxSales - reorderAvgSales) / 2);
  const reorderSafetyStock = Math.round(reorderZ * reorderStdDev * Math.sqrt(reorderAvgLead));
  const reorderRop = Math.round(reorderAvgSales * reorderAvgLead + reorderSafetyStock);
  const reorderMaxStock = reorderRop + Math.round(Math.sqrt((2 * reorderAvgSales * 365 * 100) / 5));
  const reorderDaysOfCover = (reorderRop / (reorderAvgSales || 1)).toFixed(1);

  // Hook to draw/update Holt-Winters simulator chart
  useEffect(() => {
    if (activeTab !== 'hw') return;

    const allLabels = [...rawDemand.map((_, i) => `D${i + 1}`), ...hwFcst.map((_, i) => `F${i + 1}`)];
    const ci = hwFcst.map((v, i) => v * 0.18 + 2 + i * 0.3);

    const actualData = [...rawDemand, ...Array(hwHorizon).fill(null)];
    const fittedData = [...hwFitted, ...hwFcst];
    const ciUpper = [...Array(rawDemand.length).fill(null), ...hwFcst.map((v, i) => Math.round(v + (ci[i] || 0)))];
    const ciLower = [...Array(rawDemand.length).fill(null), ...hwFcst.map((v, i) => Math.round(v - (ci[i] || 0)))];

    if (hwChartInstance.current) {
      hwChartInstance.current.data.labels = allLabels;
      hwChartInstance.current.data.datasets[0].data = actualData;
      hwChartInstance.current.data.datasets[1].data = fittedData;
      hwChartInstance.current.data.datasets[2].data = ciUpper;
      hwChartInstance.current.data.datasets[3].data = ciLower;
      hwChartInstance.current.update();
    } else if (hwChartRef.current) {
      const gridColor = 'rgba(255, 255, 255, 0.07)';
      const tickColor = '#9c9a92';

      hwChartInstance.current = new Chart(hwChartRef.current, {
        type: 'line',
        data: {
          labels: allLabels,
          datasets: [
            { label: 'Actual', data: actualData, borderColor: '#3b82f6', borderWidth: 2, pointRadius: 0, tension: 0.3, fill: false },
            { label: 'Forecast', data: fittedData, borderColor: '#f59e0b', borderWidth: 2, pointRadius: 0, tension: 0.3, borderDash: [6, 3], fill: false },
            { label: 'CI upper', data: ciUpper, borderColor: 'transparent', backgroundColor: 'rgba(59, 130, 246, 0.10)', fill: '-1', tension: 0.3, pointRadius: 0 },
            { label: 'CI lower', data: ciLower, borderColor: 'transparent', backgroundColor: 'transparent', fill: false, tension: 0.3, pointRadius: 0 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 }, maxTicksLimit: 12 } },
            y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } }
          }
        }
      });
    }
  }, [hwAlpha, hwBeta, hwGamma, hwHorizon, activeTab, hwFitted, hwFcst]);

  // Hook to draw/update Anomaly Detector simulator chart
  useEffect(() => {
    if (activeTab !== 'anomaly') return;

    const labels = anomBase.map((_, i) => `D${i + 1}`);

    if (anomChartInstance.current) {
      anomChartInstance.current.data.datasets[1].data = anomMeanArr;
      anomChartInstance.current.data.datasets[2].data = anomUbArr;
      anomChartInstance.current.data.datasets[3].data = anomLbArr;
      anomChartInstance.current.data.datasets[4].data = anomScatterArr;
      anomChartInstance.current.update();
    } else if (anomChartRef.current) {
      const gridColor = 'rgba(255, 255, 255, 0.07)';
      const tickColor = '#9c9a92';

      anomChartInstance.current = new Chart(anomChartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Demand', data: anomBase, borderColor: '#3b82f6', borderWidth: 1.8, pointRadius: 0, tension: 0.3, fill: false },
            { label: 'Mean', data: anomMeanArr, borderColor: '#6b7280', borderWidth: 1, borderDash: [5, 3], pointRadius: 0, fill: false },
            { label: 'Upper', data: anomUbArr, borderColor: 'rgba(59, 130, 246, 0.25)', backgroundColor: 'rgba(59, 130, 246, 0.08)', fill: '-1', pointRadius: 0 },
            { label: 'Lower', data: anomLbArr, borderColor: 'rgba(59, 130, 246, 0.25)', backgroundColor: 'transparent', fill: false, pointRadius: 0 },
            { label: 'Anomaly', data: anomScatterArr as any, borderColor: 'transparent', backgroundColor: '#ef4444', pointRadius: 6, pointStyle: 'circle', type: 'scatter' as any, showLine: false }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 }, maxTicksLimit: 12 } },
            y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } }
          }
        }
      });
    }
  }, [anomK, anomW, activeTab]);

  // Clean up chart references
  useEffect(() => {
    return () => {
      if (hwChartInstance.current) hwChartInstance.current.destroy();
      if (anomChartInstance.current) anomChartInstance.current.destroy();
    };
  }, []);

  // Static tab charts draw
  useEffect(() => {
    const gridColor = 'rgba(255, 255, 255, 0.07)';
    const tickColor = '#9c9a92';
    const chartInstances: any[] = [];

    const createChart = (canvas: HTMLCanvasElement | null, config: any) => {
      if (!canvas) return;
      const chart = new Chart(canvas, config);
      chartInstances.push(chart);
    };

    if (activeTab === 'models') {
      createChart(modelCompChartRef.current, {
        type: 'line',
        data: {
          labels: Array.from({ length: 14 }, (_, i) => `D${i + 1}`),
          datasets: [
            { label: 'Actual', data: modelComparisonActual, borderColor: '#3b82f6', borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: false },
            { label: 'Holt-Winters', data: modelComparisonHW, borderColor: '#10b981', borderWidth: 2, pointRadius: 0, tension: 0.3, fill: false, borderDash: [4, 2] },
            { label: 'ARIMA', data: modelComparisonArima, borderColor: '#f59e0b', borderWidth: 2, pointRadius: 0, tension: 0.3, fill: false, borderDash: [6, 3] },
            { label: 'Moving Avg', data: modelComparisonMA, borderColor: '#6b7280', borderWidth: 1.5, pointRadius: 0, tension: 0.3, fill: false, borderDash: [2, 3] }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } },
            y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } }
          }
        }
      });

      createChart(mapeCategoryChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Laptops', 'Monitors', 'Keyboards', 'Mice', 'Cables', 'New SKUs'],
          datasets: [
            {
              label: 'MAPE %',
              data: [11.2, 13.8, 15.4, 12.6, 18.9, 24.1],
              backgroundColor: (ctx: any) => (ctx.raw < 13 ? '#10b981' : ctx.raw < 17 ? '#f59e0b' : '#ef4444'),
              borderRadius: 4,
              barPercentage: 0.75
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { display: false }, ticks: { color: tickColor, font: { size: 10 } } },
            x: { grid: { color: gridColor }, min: 0, max: 30, ticks: { color: tickColor, font: { size: 10 }, callback: (v: any) => v + '%' } }
          }
        }
      });
    }

    if (activeTab === 'reorder') {
      createChart(reorderUrgencyChartRef.current, {
        type: 'bar',
        data: {
          labels: ['LAPTOP-DEL', 'MOUSE-WL', 'KEYBD-MX', 'MONIT-24', 'HDSET-BT', 'USB-HUB'],
          datasets: [
            {
              label: 'Current stock',
              data: [28, 145, 62, 18, 80, 4],
              backgroundColor: ['#3b82f6', '#10b981', '#3b82f6', '#ef4444', '#10b981', '#ef4444'],
              borderRadius: 4,
              barPercentage: 0.8,
              categoryPercentage: 0.65
            },
            {
              label: 'ROP',
              data: [15, 50, 30, 20, 40, 10],
              backgroundColor: 'rgba(245, 158, 11, 0.5)',
              borderRadius: 4,
              barPercentage: 0.8,
              categoryPercentage: 0.65
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { display: false }, ticks: { color: tickColor, font: { size: 10 } } },
            x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } }
          }
        }
      });

      createChart(leadTimeChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Dell India', 'Samsung', 'Sony', 'Logitech', 'LG Elec'],
          datasets: [
            { label: 'Avg LT', data: [7, 9, 6, 12, 8], backgroundColor: '#3b82f6', borderRadius: 4, barPercentage: 0.7 },
            { label: 'Max LT', data: [10, 14, 9, 18, 12], backgroundColor: 'rgba(59, 130, 246, 0.28)', borderRadius: 4, barPercentage: 0.7 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } },
            y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 }, callback: (v: any) => v + 'd' } }
          }
        }
      });
    }

    if (activeTab === 'accuracy') {
      createChart(rollingMapeChartRef.current, {
        type: 'line',
        data: {
          labels: Array.from({ length: 12 }, (_, i) => `W${i + 1}`),
          datasets: [
            {
              label: 'MAPE %',
              data: [22, 20, 19, 18, 17, 16, 15, 14, 13, 13, 12, 11],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } },
            y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 }, callback: (v: any) => v + '%' }, min: 8, max: 25 }
          }
        }
      });

      const resid = [-8, -5, -3, -6, -2, 0, 1, 3, 2, 4, 5, 6, 7, 8, 6, 5, 4, 3, 2, 1, 0, -1, -2, -1, 0, 1, 2, 1, 0, -1];
      createChart(residualChartRef.current, {
        type: 'bar',
        data: {
          labels: resid.map((_, i) => `${i + 1}`),
          datasets: [
            {
              label: 'Residual',
              data: resid,
              backgroundColor: resid.map((v) => (v > 0 ? 'rgba(59, 130, 246, 0.7)' : 'rgba(239, 68, 68, 0.7)')),
              borderRadius: 2,
              barPercentage: 0.9
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } }
          }
        }
      });
    }

    return () => {
      chartInstances.forEach((chart) => chart.destroy());
    };
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <Brain className="h-6 w-6 mr-2.5 text-indigo-400" />
            AI Forecasting Engine
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Triple exponential smoothing forecasting pipelines, anomaly thresholds, and safety cover metrics.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#22263f] overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 'hw', label: 'Holt-Winters' },
          { id: 'models', label: 'Model Comparison' },
          { id: 'anomaly', label: 'Anomaly Detection' },
          { id: 'reorder', label: 'Reorder Intelligence' },
          { id: 'accuracy', label: 'Accuracy Metrics' },
          { id: 'pipeline', label: 'Pipeline' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-500/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: HOLT-WINTERS */}
      {activeTab === 'hw' && (
        <div className="space-y-6">
          <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-[#22263f] pb-3">
              <h4 className="text-sm font-semibold text-white">Live Holt-Winters Simulator</h4>
              <span className="text-[10px] text-gray-500 uppercase">Season Length (m) = 7d</span>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex-1 min-w-[200px] text-xs font-semibold uppercase tracking-wider text-gray-400">
                Alpha (α) — level: <span className="font-bold text-white font-mono">{hwAlpha.toFixed(2)}</span>
                <input
                  type="range"
                  min="0.01"
                  max="0.99"
                  step="0.01"
                  value={hwAlpha}
                  onChange={(e) => setHwAlpha(parseFloat(e.target.value))}
                  className="w-full mt-2 h-1 bg-[#0d0e15] border-none rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </label>
              <label className="flex-1 min-w-[200px] text-xs font-semibold uppercase tracking-wider text-gray-400">
                Beta (β) — trend: <span className="font-bold text-white font-mono">{hwBeta.toFixed(2)}</span>
                <input
                  type="range"
                  min="0.01"
                  max="0.99"
                  step="0.01"
                  value={hwBeta}
                  onChange={(e) => setHwBeta(parseFloat(e.target.value))}
                  className="w-full mt-2 h-1 bg-[#0d0e15] border-none rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </label>
              <label className="flex-1 min-w-[200px] text-xs font-semibold uppercase tracking-wider text-gray-400">
                Gamma (γ) — season: <span className="font-bold text-white font-mono">{hwGamma.toFixed(2)}</span>
                <input
                  type="range"
                  min="0.01"
                  max="0.99"
                  step="0.01"
                  value={hwGamma}
                  onChange={(e) => setHwGamma(parseFloat(e.target.value))}
                  className="w-full mt-2 h-1 bg-[#0d0e15] border-none rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </label>
              <label className="flex-1 min-w-[200px] text-xs font-semibold uppercase tracking-wider text-gray-400">
                Horizon (days): <span className="font-bold text-white font-mono">{hwHorizon}</span>
                <input
                  type="range"
                  min="7"
                  max="30"
                  step="1"
                  value={hwHorizon}
                  onChange={(e) => setHwHorizon(parseInt(e.target.value))}
                  className="w-full mt-2 h-1 bg-[#0d0e15] border-none rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">MAPE</span>
                <span className="text-xl font-extrabold text-white font-mono">{hwMape.toFixed(1)}%</span>
              </div>
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">RMSE</span>
                <span className="text-xl font-extrabold text-white font-mono">{hwRmse.toFixed(1)}</span>
              </div>
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Forecast ({hwHorizon}d)</span>
                <span className="text-xl font-extrabold text-white font-mono">{hwFcstTotal} units</span>
              </div>
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Trend Factor</span>
                <span className="text-xl font-extrabold text-white font-mono">{hwTrend >= 0 ? '+' : ''}{hwTrend.toFixed(2)}/d</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <span className="flex items-center"><span className="h-2.5 w-2.5 rounded bg-blue-500 mr-1.5"></span> Actual Demand</span>
              <span className="flex items-center"><span className="h-2.5 w-2.5 rounded bg-amber-500 mr-1.5"></span> Predicted HW</span>
              <span className="flex items-center"><span className="h-2.5 w-2.5 rounded bg-blue-500/10 border border-blue-500/20 mr-1.5"></span> 80% CI Bounds</span>
            </div>

            <div className="h-56 w-full relative"><canvas ref={hwChartRef}></canvas></div>
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">Formula Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white">Forecast equation</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3 py-2 rounded-xl font-mono text-xs text-white">ŷ(t+h) = ℓ(t) + h·b(t) + s(t+h-m)</div>
              <p className="text-xs text-gray-400">Combines level, trend, and seasonal components to project h steps. m = 7 days.</p>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white">Level update ℓ(t)</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3 py-2 rounded-xl font-mono text-xs text-white">ℓ(t) = α(y(t)−s(t−m)) + (1−α)(ℓ(t−1)+b(t−1))</div>
              <p className="text-xs text-gray-400">High α reacts fast to recent data; low α yields a smoother, less reactive baseline.</p>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white">Trend update b(t)</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3 py-2 rounded-xl font-mono text-xs text-white">b(t) = β(ℓ(t)−ℓ(t−1)) + (1−β)·b(t−1)</div>
              <p className="text-xs text-gray-400">High β updates trend direction quickly; low β yields a more stable trend.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MODEL COMPARISON */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Best Model</span>
              <span className="text-lg font-bold text-white">Holt-Winters</span>
              <span className="text-xs text-emerald-400 block mt-1">MAPE: 11.2%</span>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Runner Up</span>
              <span className="text-lg font-bold text-white">ARIMA</span>
              <span className="text-xs text-amber-400 block mt-1">MAPE: 14.1%</span>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Baseline</span>
              <span className="text-lg font-bold text-white">Moving Average</span>
              <span className="text-xs text-red-400 block mt-1">MAPE: 18.6%</span>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Ensemble (Weighted)</span>
              <span className="text-lg font-bold text-white">Weighted Avg</span>
              <span className="text-xs text-emerald-400 block mt-1">MAPE: 9.8%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">Forecast vs Actual (All Models)</h4>
              <p className="text-xs text-gray-500 mb-2">14-day holdout evaluation period comparison</p>
              <div className="flex flex-wrap gap-3 text-[10px] text-gray-400 mb-4">
                <span className="flex items-center"><span className="h-2 w-2 rounded bg-blue-500 mr-1.5"></span> Actual</span>
                <span className="flex items-center"><span className="h-2 w-2 rounded bg-emerald-500 mr-1.5"></span> Holt-Winters</span>
                <span className="flex items-center"><span className="h-2 w-2 rounded bg-amber-500 mr-1.5"></span> ARIMA</span>
                <span className="flex items-center"><span className="h-2 w-2 rounded bg-gray-500 mr-1.5"></span> Moving Avg</span>
              </div>
              <div className="h-52 w-full relative"><canvas ref={modelCompChartRef}></canvas></div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">MAPE by SKU Category</h4>
              <p className="text-xs text-gray-500 mb-4">Mean absolute % error across product types (lower is better)</p>
              <div className="h-52 w-full relative"><canvas ref={mapeCategoryChartRef}></canvas></div>
            </div>
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">Model Selection Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] border-t-4 border-t-blue-500 rounded-2xl p-5 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white">Moving Average</h4>
              <p className="text-xs text-gray-400">New products, history &lt; 30 days. No trend or seasonality.</p>
              <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-semibold inline-block">History &lt; 30d</span>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] border-t-4 border-t-emerald-500 rounded-2xl p-5 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white">Holt-Winters (Triple ETS)</h4>
              <p className="text-xs text-gray-400">Seasonal goods, $\ge$ 2 cycles of history. Best for spices & herbs.</p>
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold inline-block">Strong Seasonality</span>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] border-t-4 border-t-indigo-500 rounded-2xl p-5 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white">Ensemble (Weighted)</h4>
              <p className="text-xs text-gray-400">Inversely weighted by validation MAPE. Smooths single model errors.</p>
              <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-semibold inline-block">Best Accuracy</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ANOMALY DETECTION */}
      {activeTab === 'anomaly' && (
        <div className="space-y-6">
          <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-[#22263f] pb-3">
              <h4 className="text-sm font-semibold text-white">Live Anomaly Detector</h4>
              <span className="text-[10px] text-gray-500 uppercase">Z-Score Deviation Multiplier</span>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex-1 min-w-[200px] text-xs font-semibold uppercase tracking-wider text-gray-400">
                K threshold (σ multiplier): <span className="font-bold text-white font-mono">{anomK.toFixed(1)}</span>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.1"
                  value={anomK}
                  onChange={(e) => setAnomK(parseFloat(e.target.value))}
                  className="w-full mt-2 h-1 bg-[#0d0e15] border-none rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </label>
              <label className="flex-1 min-w-[200px] text-xs font-semibold uppercase tracking-wider text-gray-400">
                Rolling window (days): <span className="font-bold text-white font-mono">{anomW}</span>
                <input
                  type="range"
                  min="7"
                  max="30"
                  step="1"
                  value={anomW}
                  onChange={(e) => setAnomW(parseInt(e.target.value))}
                  className="w-full mt-2 h-1 bg-[#0d0e15] border-none rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Anomalies Found</span>
                <span className="text-xl font-extrabold text-red-500 font-mono">{anomalies.length} outliers</span>
              </div>
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Rolling Mean</span>
                <span className="text-xl font-extrabold text-white font-mono">{Math.round(anomBase.reduce((a, b) => a + b, 0) / anomBase.length)} units</span>
              </div>
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Standard Dev (σ)</span>
                <span className="text-xl font-extrabold text-white font-mono">
                  {(Math.sqrt(anomBase.reduce((s, v) => s + (v - 45) ** 2, 0) / anomBase.length)).toFixed(1)}
                </span>
              </div>
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Upper Limit</span>
                <span className="text-xl font-extrabold text-white font-mono">{anomUbArr[anomUbArr.length - 1]} units</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <span className="flex items-center"><span className="h-2.5 w-2.5 rounded bg-blue-500 mr-1.5"></span> Daily Sales</span>
              <span className="flex items-center"><span className="h-2.5 w-2.5 rounded bg-gray-500 mr-1.5"></span> Rolling Mean</span>
              <span className="flex items-center"><span className="h-2.5 w-2.5 rounded bg-blue-500/10 border border-blue-500/20 mr-1.5"></span> ±K·σ confidence band</span>
              <span className="flex items-center"><span className="h-2.5 w-2.5 rounded bg-red-500 mr-1.5"></span> Outlier Point (Anomaly)</span>
            </div>

            <div className="h-56 w-full relative"><canvas ref={anomChartRef}></canvas></div>
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">Anomaly Logs Table</h2>
          <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
            {anomalies.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No anomalies flagged under current threshold.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#22263f] text-gray-500 font-semibold pb-2">
                      <th>Trigger Date</th>
                      <th>Observed Sales</th>
                      <th>Expected Mean</th>
                      <th>Std Dev (σ)</th>
                      <th>Z-Score Deviation</th>
                      <th>Anomaly Type</th>
                      <th className="text-right">Action status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22263f]/60 text-gray-300">
                    {anomalies.map((anom, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5">{anom.date}</td>
                        <td className="py-2.5 font-semibold text-white">{anom.demand} units</td>
                        <td className="py-2.5">{anom.mean} units</td>
                        <td className="py-2.5">{anom.sd}</td>
                        <td className="py-2.5 font-bold font-mono text-red-400">+{anom.zScore}σ</td>
                        <td className="py-2.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${anom.type === 'Spike' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {anom.type}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="text-[10px] bg-gray-800 border border-[#22263f] text-gray-400 px-2 py-0.5 rounded font-semibold inline-block">Reviewing</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: REORDER INTELLIGENCE */}
      {activeTab === 'reorder' && (
        <div className="space-y-6">
          <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-[#22263f] pb-3 flex justify-between items-center">
              <h4 className="text-sm font-semibold text-white">Smart Reorder Calculator</h4>
              <span className="text-[10px] text-gray-500 uppercase">ROP & Safety Cover Parameters</span>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex-1 min-w-[150px] text-xs font-semibold uppercase tracking-wider text-gray-400">
                Avg daily sales: <span className="font-bold text-white font-mono">{reorderAvgSales}</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={reorderAvgSales}
                  onChange={(e) => setReorderAvgSales(parseInt(e.target.value))}
                  className="w-full mt-2 h-1 bg-[#0d0e15] border-none rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </label>
              <label className="flex-1 min-w-[150px] text-xs font-semibold uppercase tracking-wider text-gray-400">
                Max daily sales: <span className="font-bold text-white font-mono">{Math.max(reorderAvgSales, reorderMaxSales)}</span>
                <input
                  type="range"
                  min="1"
                  max="80"
                  value={reorderMaxSales}
                  onChange={(e) => setReorderMaxSales(parseInt(e.target.value))}
                  className="w-full mt-2 h-1 bg-[#0d0e15] border-none rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </label>
              <label className="flex-1 min-w-[150px] text-xs font-semibold uppercase tracking-wider text-gray-400">
                Avg lead time (days): <span className="font-bold text-white font-mono">{reorderAvgLead}</span>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={reorderAvgLead}
                  onChange={(e) => setReorderAvgLead(parseInt(e.target.value))}
                  className="w-full mt-2 h-1 bg-[#0d0e15] border-none rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </label>
              <label className="flex-1 min-w-[150px] text-xs font-semibold uppercase tracking-wider text-gray-400">
                Max lead time (days): <span className="font-bold text-white font-mono">{Math.max(reorderAvgLead, reorderMaxLead)}</span>
                <input
                  type="range"
                  min="1"
                  max="45"
                  value={reorderMaxLead}
                  onChange={(e) => setReorderMaxLead(parseInt(e.target.value))}
                  className="w-full mt-2 h-1 bg-[#0d0e15] border-none rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </label>
              <label className="flex-1 min-w-[150px] text-xs font-semibold uppercase tracking-wider text-gray-400">
                Service level %: <span className="font-bold text-white font-mono">{reorderServiceLevel}%</span>
                <input
                  type="range"
                  min="80"
                  max="99"
                  value={reorderServiceLevel}
                  onChange={(e) => setReorderServiceLevel(parseInt(e.target.value))}
                  className="w-full mt-2 h-1 bg-[#0d0e15] border-none rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Safety Stock Target</span>
                <span className="text-xl font-extrabold text-white font-mono">{reorderSafetyStock} units</span>
              </div>
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Reorder Point (ROP)</span>
                <span className="text-xl font-extrabold text-white font-mono">{reorderRop} units</span>
              </div>
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Max Stock Level</span>
                <span className="text-xl font-extrabold text-white font-mono">{reorderMaxStock} units</span>
              </div>
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Days of Inventory Cover</span>
                <span className="text-xl font-extrabold text-white font-mono">{reorderDaysOfCover} days</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">Reorder Suggestions by Urgency</h4>
              <p className="text-xs text-gray-500 mb-4">Current stock vs ROP comparison — top products</p>
              <div className="h-52 w-full relative"><canvas ref={reorderUrgencyChartRef}></canvas></div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">Lead Time Distribution by Supplier</h4>
              <p className="text-xs text-gray-500 mb-4">Comparison of average and maximum supplier lead times</p>
              <div className="h-52 w-full relative"><canvas ref={leadTimeChartRef}></canvas></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ACCURACY METRICS */}
      {activeTab === 'accuracy' && (
        <div className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">Forecast Error Definitions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white">MAPE — Mean Absolute % Error</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">MAPE = (1/n) Σ |y−ŷ| / y × 100</div>
              <p className="text-xs text-gray-400">Most common. Target &lt; 15% for enterprise inventory.</p>
              <div className="flex gap-2 pt-2"><Badge color="emerald">&lt;10% Excellent</Badge> <Badge color="blue">10-15% Good</Badge></div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white">RMSE — Root Mean Squared Error</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">RMSE = √( (1/n) Σ (y−ŷ)² )</div>
              <p className="text-xs text-gray-400">Penalises large errors heavily. Useful when spikes are costly.</p>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white">Bias — Mean Error</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">Bias = (1/n) Σ (ŷ(t) − y(t))</div>
              <p className="text-xs text-gray-400">Positive: over-forecast (overstock). Negative: under-forecast (stockout).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">MAPE Trend (12-Week Rolling)</h4>
              <p className="text-xs text-gray-500 mb-4">Accuracy improvements over time for top categories</p>
              <div className="h-52 w-full relative"><canvas ref={rollingMapeChartRef}></canvas></div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">Error Distribution (Residuals)</h4>
              <p className="text-xs text-gray-500 mb-4">Errors should be centered at zero; asymmetry reveals model bias</p>
              <div className="h-52 w-full relative"><canvas ref={residualChartRef}></canvas></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">Forecasting Pipeline Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] border-t-4 border-t-blue-500 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-[10px] text-blue-500 font-bold uppercase block">Step 1 — Data Ingestion</span>
              <h4 className="text-sm font-bold text-white">Raw demand extraction</h4>
              <p className="text-xs text-gray-400 leading-relaxed">Extracts <code>STOCK_OUT</code> movements from database. Excludes cancellations, returns, and damages.</p>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] border-t-4 border-t-amber-500 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-[10px] text-amber-500 font-bold uppercase block">Step 2 — Preprocessing</span>
              <h4 className="text-sm font-bold text-white">Clean and aggregate</h4>
              <p className="text-xs text-gray-400 leading-relaxed">Aggregates to daily totals. Fills zero demand. Caps outliers using IQR threshold (1.5× IQR rule).</p>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] border-t-4 border-t-emerald-500 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-[10px] text-emerald-500 font-bold uppercase block">Step 3 — Auto-Fitting</span>
              <h4 className="text-sm font-bold text-white">Model Selection</h4>
              <p className="text-xs text-gray-400 leading-relaxed">Analyzes CoV and ACF. Automatically switches to best fit (MA, Regression, Holt-Winters, or ARIMA).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white mb-4"><Clock className="h-4 w-4 mr-1.5 inline-block text-blue-500" /> Scheduled Jobs (Cron Scheduler)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#22263f] text-gray-500 font-semibold pb-2">
                      <th>Job Process</th>
                      <th>Trigger Frequency</th>
                      <th>Action Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22263f]/60 text-gray-300">
                    <tr>
                      <td className="py-2.5 font-semibold text-white">Full forecast recompute</td>
                      <td className="py-2.5">Daily 2:00 AM</td>
                      <td className="py-2.5">Recompute all active SKUs</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-semibold text-white">Anomaly detection</td>
                      <td className="py-2.5">Every 4 hours</td>
                      <td className="py-2.5">Z-score check on recent demand</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-semibold text-white">Reorder alerts check</td>
                      <td className="py-2.5">Every 6 hours</td>
                      <td className="py-2.5">Verify stock levels vs ROP</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-semibold text-white">Model retraining</td>
                      <td className="py-2.5">Monthly</td>
                      <td className="py-2.5">Re-optimize smoothing parameters</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white mb-4"><Database className="h-4 w-4 mr-1.5 inline-block text-indigo-400" /> Cache Invalidation Strategy</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#22263f] text-gray-500 font-semibold pb-2">
                      <th>Cache Key Pattern</th>
                      <th>Default TTL</th>
                      <th>Invalidation Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22263f]/60 text-gray-300">
                    <tr>
                      <td className="py-2.5 font-mono">forecast:{"{skuId}"}</td>
                      <td className="py-2.5">24 hours</td>
                      <td className="py-2.5">After forecasting run</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-mono">reorder:suggestions</td>
                      <td className="py-2.5">6 hours</td>
                      <td className="py-2.5">On stock-out/in movement</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-mono">kpi:dashboard</td>
                      <td className="py-2.5">5 minutes</td>
                      <td className="py-2.5">Standard time-expiry</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-mono">anomaly:flags</td>
                      <td className="py-2.5">4 hours</td>
                      <td className="py-2.5">After anomaly checks run</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
