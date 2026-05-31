'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Calculator,
  Grid,
  Sparkles,
  PieChart,
  BarChart2,
  DollarSign
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'kpis' | 'demand' | 'abc' | 'reorder' | 'financial' | 'ops'>('kpis');

  // EOQ Calculator State
  const [eoqD, setEoqD] = useState(3000);
  const [eoqS, setEoqS] = useState(800);
  const [eoqH, setEoqH] = useState(80);

  // References to Chart canvasses
  const demandForecastChartRef = useRef<HTMLCanvasElement>(null);
  const seasonalityChartRef = useRef<HTMLCanvasElement>(null);
  const demandHistChartRef = useRef<HTMLCanvasElement>(null);
  const mapeTrendChartRef = useRef<HTMLCanvasElement>(null);

  const abcDistributionChartRef = useRef<HTMLCanvasElement>(null);
  const paretoCurveChartRef = useRef<HTMLCanvasElement>(null);

  const eoqChartRef = useRef<HTMLCanvasElement>(null);
  const eoqChartInstance = useRef<any>(null);

  const valTrendChartRef = useRef<HTMLCanvasElement>(null);
  const cogsRevenueChartRef = useRef<HTMLCanvasElement>(null);
  const carryCostChartRef = useRef<HTMLCanvasElement>(null);

  const supplierOtdChartRef = useRef<HTMLCanvasElement>(null);
  const cycleTimeChartRef = useRef<HTMLCanvasElement>(null);
  const whStockChartRef = useRef<HTMLCanvasElement>(null);
  const stockRopChartRef = useRef<HTMLCanvasElement>(null);

  // Math helper for formatting
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // EOQ calculations
  const eoqVal = Math.round(Math.sqrt((2 * eoqD * eoqS) / eoqH));
  const eoqOrders = Math.round(eoqD / (eoqVal || 1));
  const eoqTotalCost = Math.round(((eoqVal || 1) * eoqH) / 2 + (eoqD / (eoqVal || 1)) * eoqS);

  // Update EOQ cost curves chart
  useEffect(() => {
    if (activeTab !== 'reorder') return;

    const maxQ = eoqVal * 3 || 300;
    const qs = Array.from({ length: 30 }, (_, i) => Math.round(((i + 1) * maxQ) / 30));
    const oC = qs.map((q) => Math.round((eoqD / (q || 1)) * eoqS));
    const hC = qs.map((q) => Math.round((q * eoqH) / 2));
    const tC = qs.map((q, i) => (oC[i] || 0) + (hC[i] || 0));

    if (eoqChartInstance.current) {
      eoqChartInstance.current.data.labels = qs;
      eoqChartInstance.current.data.datasets[0].data = oC;
      eoqChartInstance.current.data.datasets[1].data = hC;
      eoqChartInstance.current.data.datasets[2].data = tC;
      eoqChartInstance.current.update();
    } else if (eoqChartRef.current) {
      const isDark = true;
      const gridColor = 'rgba(255, 255, 255, 0.07)';
      const tickColor = '#9c9a92';

      eoqChartInstance.current = new Chart(eoqChartRef.current, {
        type: 'line',
        data: {
          labels: qs,
          datasets: [
            {
              label: 'Ordering cost',
              data: oC,
              borderColor: '#ef4444',
              borderWidth: 2,
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              borderDash: [5, 3]
            },
            {
              label: 'Holding cost',
              data: hC,
              borderColor: '#10b981',
              borderWidth: 2,
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              borderDash: [3, 3]
            },
            {
              label: 'Total cost',
              data: tC,
              borderColor: '#3b82f6',
              borderWidth: 2,
              fill: false,
              tension: 0.3,
              pointRadius: 0
            }
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
    }
  }, [eoqD, eoqS, eoqH, activeTab, eoqVal]);

  // Clean up EOQ chart instance
  useEffect(() => {
    return () => {
      if (eoqChartInstance.current) {
        eoqChartInstance.current.destroy();
        eoqChartInstance.current = null;
      }
    };
  }, []);

  // Initialize other static charts on tab changes
  useEffect(() => {
    const isDark = true;
    const gridColor = 'rgba(255, 255, 255, 0.07)';
    const tickColor = '#9c9a92';
    const chartInstances: any[] = [];

    const createLineOrBarChart = (canvas: HTMLCanvasElement | null, config: any) => {
      if (!canvas) return;
      const chart = new Chart(canvas, config);
      chartInstances.push(chart);
    };

    if (activeTab === 'demand') {
      // 1. Forecast vs Actuals
      const fcLabels = Array.from({ length: 30 }, (_, i) => `D${i + 1}`);
      const actual = [48, 52, 45, 58, 62, 55, 60, 70, 65, 58, 72, 68, 62, 75, 80, 72, 68, 78, 85, 82, 78, 88, 92, 86, 82, 95, 90, 88, 96, 100];
      const forecast = [50, 54, 47, 60, 64, 57, 62, 72, 67, 60, 74, 70, 64, 77, 82, 74, 70, 80, 87, 84, 80, 90, 94, 88, 84, 97, 92, 90, 98, 102];
      createLineOrBarChart(demandForecastChartRef.current, {
        type: 'line',
        data: {
          labels: fcLabels,
          datasets: [
            { label: 'Actual', data: actual, borderColor: '#3b82f6', borderWidth: 2, pointRadius: 0, tension: 0.3, fill: false },
            { label: 'Forecast', data: forecast, borderColor: '#f59e0b', borderWidth: 2, pointRadius: 0, tension: 0.3, borderDash: [6, 3], fill: false },
            { label: '80% CI', data: forecast.map((v) => v + 14), borderColor: 'transparent', backgroundColor: 'rgba(245, 158, 11, 0.10)', fill: '-1', tension: 0.3, pointRadius: 0 },
            { label: '80% CI low', data: forecast.map((v) => v - 14), borderColor: 'transparent', backgroundColor: 'transparent', fill: false, tension: 0.3, pointRadius: 0 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 }, maxTicksLimit: 8 } },
            y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } }
          }
        }
      });

      // 2. Seasonality
      createLineOrBarChart(seasonalityChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [
            {
              label: 'Index',
              data: [0.72, 0.78, 0.9, 0.95, 1.05, 1.12, 1.18, 1.2, 1.08, 0.95, 1.35, 1.6],
              backgroundColor: '#3b82f6',
              borderRadius: 4,
              barPercentage: 0.7
            }
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

      // 3. Demand Histogram
      const hist = [0, 0, 0, 2, 4, 6, 10, 14, 18, 20, 16, 12, 8, 5, 3, 2, 0, 0, 0, 0];
      createLineOrBarChart(demandHistChartRef.current, {
        type: 'bar',
        data: {
          labels: hist.map((_, i) => `${i * 2}`),
          datasets: [
            {
              label: 'Frequency',
              data: hist,
              backgroundColor: hist.map((v) => (v >= 14 ? '#3b82f6' : '#93c5fd')),
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
            x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } },
            y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } }
          }
        }
      });

      // 4. MAPE accuracy trend
      createLineOrBarChart(mapeTrendChartRef.current, {
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
            y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } }, min: 8, max: 25 }
          }
        }
      });
    }

    if (activeTab === 'abc') {
      // Donut distribution
      createLineOrBarChart(abcDistributionChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['A (20%)', 'B (30%)', 'C (50%)'],
          datasets: [
            {
              data: [70, 20, 10],
              backgroundColor: ['#3b82f6', '#60a5fa', '#93c5fd'],
              borderWidth: 2,
              borderColor: '#11131e'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: { legend: { display: false } }
        }
      });

      // Pareto Curve
      const parX = [0, 5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const parY = [0, 20, 35, 47, 56, 70, 79, 86, 90, 94, 97, 99, 100];
      createLineOrBarChart(paretoCurveChartRef.current, {
        type: 'line',
        data: {
          labels: parX,
          datasets: [
            {
              label: 'Cumulative revenue %',
              data: parY,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 0
            },
            {
              label: 'Perfect equality',
              data: parX,
              borderColor: '#4b5563',
              borderWidth: 1,
              borderDash: [4, 4],
              fill: false,
              pointRadius: 0,
              tension: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } },
            y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } }, min: 0, max: 100 }
          }
        }
      });
    }

    if (activeTab === 'financial') {
      // Valuation Trend
      createLineOrBarChart(valTrendChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [
            {
              label: '₹ Value (Lakhs)',
              data: [420, 445, 438, 460, 482, 510, 498, 520, 535, 528, 580, 620],
              backgroundColor: '#3b82f6',
              borderRadius: 4,
              barPercentage: 0.75
            }
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

      // COGS vs Revenue
      createLineOrBarChart(cogsRevenueChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Electronics', 'Peripherals', 'Accessories', 'Cables', 'Software'],
          datasets: [
            { label: 'Revenue', data: [580, 320, 180, 95, 140], backgroundColor: '#3b82f6', borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.7 },
            { label: 'COGS', data: [360, 190, 105, 55, 62], backgroundColor: '#93c5fd', borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.7 }
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

      // Carrying Cost breakdown
      createLineOrBarChart(carryCostChartRef.current, {
        type: 'pie',
        data: {
          labels: ['Capital cost', 'Storage', 'Insurance', 'Obsolescence'],
          datasets: [
            {
              data: [45, 28, 12, 15],
              backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'],
              borderWidth: 2,
              borderColor: '#11131e'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    if (activeTab === 'ops') {
      // Supplier On-time delivery
      createLineOrBarChart(supplierOtdChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Dell India', 'Samsung Ltd', 'Sony Corp', 'Logitech', 'LG Electronics'],
          datasets: [
            {
              label: 'On-time %',
              data: [96, 88, 92, 78, 84],
              backgroundColor: (ctx: any) => {
                const val = ctx.raw;
                return val >= 90 ? '#10b981' : val >= 80 ? '#f59e0b' : '#ef4444';
              },
              borderRadius: 4,
              barPercentage: 0.7
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
            x: { grid: { color: gridColor }, min: 60, max: 100, ticks: { color: tickColor, font: { size: 10 } } }
          }
        }
      });

      // Sales Order Cycle time
      createLineOrBarChart(cycleTimeChartRef.current, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
          datasets: [
            {
              label: 'Days',
              data: [6.8, 6.2, 5.9, 5.4, 5.0, 4.8, 4.5, 4.2],
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
            y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } }, min: 3, max: 8 }
          }
        }
      });

      // Warehouse stock donut
      createLineOrBarChart(whStockChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Main WH', 'North Hub', 'South WH', 'Transit'],
          datasets: [
            {
              data: [42, 28, 18, 12],
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#6b7280'],
              borderWidth: 2,
              borderColor: '#11131e'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: { legend: { display: false } }
        }
      });

      // Stock levels vs ROP
      createLineOrBarChart(stockRopChartRef.current, {
        type: 'bar',
        data: {
          labels: ['LAPTOP-DEL', 'MOUSE-WL', 'KEYBOARD-M', 'MONITOR-24', 'HEADSET-BT', 'USB-HUB'],
          datasets: [
            { label: 'Current Stock', data: [28, 145, 62, 18, 80, 4], backgroundColor: '#3b82f6', borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.65 },
            { label: 'Reorder Point', data: [15, 50, 30, 20, 40, 10], backgroundColor: 'rgba(245, 158, 11, 0.7)', borderRadius: 4, barPercentage: 0.8, categoryPercentage: 0.65 }
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
    }

    return () => {
      chartInstances.forEach((chart) => chart.destroy());
    };
  }, [activeTab]);

  // Heatmap generation constants
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'];
  const hmData = [
    [2, 4, 9, 12, 14, 16, 8, 3],
    [3, 5, 11, 15, 18, 14, 6, 2],
    [1, 3, 7, 10, 12, 8, 4, 1],
    [4, 6, 13, 18, 20, 16, 9, 3],
    [5, 8, 14, 18, 22, 18, 10, 4],
    [1, 2, 4, 6, 5, 4, 2, 1],
    [0, 1, 2, 3, 3, 2, 1, 0]
  ];
  const hmColors = ['#1e293b', '#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa'];
  const getHmColor = (v: number) => {
    if (v < 3) return hmColors[0];
    if (v < 7) return hmColors[1];
    if (v < 12) return hmColors[2];
    if (v < 17) return hmColors[3];
    return hmColors[4];
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-[#11131e] border border-[#22263f] p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <TrendingUp className="h-6 w-6 mr-2.5 text-blue-500" />
            Inventory Analytics Reference
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Enterprise KPIs, demand seasonality, ABC/XYZ metrics, reorder analytics, and operational performance.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#22263f] overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 'kpis', label: 'Core KPIs' },
          { id: 'demand', label: 'Demand & Forecast' },
          { id: 'abc', label: 'ABC / XYZ Analysis' },
          { id: 'reorder', label: 'Reorder Metrics' },
          { id: 'financial', label: 'Financial Matrices' },
          { id: 'ops', label: 'Operational Charts' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400 font-bold bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: CORE KPIs */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Inventory Turnover</span>
              <span className="text-2xl font-bold text-white">8.4×</span>
              <span className="text-xs text-emerald-400 block mt-2 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> +1.2 vs last period
              </span>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Days Inventory Outstanding</span>
              <span className="text-2xl font-bold text-white">43.4 days</span>
              <span className="text-xs text-emerald-400 block mt-2 flex items-center">
                <Clock className="h-3 w-3 mr-1" /> -3 days (improved)
              </span>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Stockout Rate</span>
              <span className="text-2xl font-bold text-white">1.8%</span>
              <span className="text-xs text-emerald-400 block mt-2 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> -0.4% vs last qtr
              </span>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Fill Rate</span>
              <span className="text-2xl font-bold text-white">97.3%</span>
              <span className="text-xs text-emerald-400 block mt-2 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> +0.8% vs last qtr
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Carrying Cost %</span>
              <span className="text-2xl font-bold text-white">22.4%</span>
              <span className="text-xs text-amber-400 block mt-2 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" /> 2% above target
              </span>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Gross Margin Return (GMROI)</span>
              <span className="text-2xl font-bold text-white">₹3.12</span>
              <span className="text-xs text-gray-400 block mt-2">per ₹1 invested</span>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Order Cycle Time</span>
              <span className="text-2xl font-bold text-white">4.2 days</span>
              <span className="text-xs text-blue-400 block mt-2 flex items-center">
                <Clock className="h-3 w-3 mr-1" /> avg supplier lead time
              </span>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Dead Stock Ratio</span>
              <span className="text-2xl font-bold text-white">3.1%</span>
              <span className="text-xs text-red-400 block mt-2 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" /> +0.6% (worsening)
              </span>
            </div>
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">Formula Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center"><Calculator className="h-4 w-4 mr-2 text-blue-400" /> Inventory Turnover</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">Turnover = COGS / Avg Inventory Value</div>
              <p className="text-xs text-gray-400 leading-relaxed">Higher = faster-moving stock. Benchmark: 6–12× for retail.</p>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center"><Calculator className="h-4 w-4 mr-2 text-blue-400" /> Days Inventory Outstanding (DIO)</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">DIO = (Avg Inventory / COGS) × 365</div>
              <p className="text-xs text-gray-400 leading-relaxed">Days stock sits before being sold. Lower is better.</p>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center"><Calculator className="h-4 w-4 mr-2 text-blue-400" /> GMROI</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">GMROI = Gross Profit / Avg Inventory Cost</div>
              <p className="text-xs text-gray-400 leading-relaxed">Profitability per ₹ of inventory held. Target ≥ 2.</p>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center"><Calculator className="h-4 w-4 mr-2 text-blue-400" /> Service Level / Fill Rate</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">Fill Rate = Orders Filled / Total Orders × 100</div>
              <p className="text-xs text-gray-400 leading-relaxed">Percentage of orders fulfilled without backorder. Target 95–99%.</p>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center"><Calculator className="h-4 w-4 mr-2 text-blue-400" /> Carrying Cost Ratio</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">Carrying Cost % = (Holding Cost / Avg Inv) × 100</div>
              <p className="text-xs text-gray-400 leading-relaxed">Storage, insurance, obsolescence, capital cost. Benchmark: 20–30%.</p>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center"><Calculator className="h-4 w-4 mr-2 text-blue-400" /> Stockout Rate</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">Stockout Rate = Stockouts / Total Events × 100</div>
              <p className="text-xs text-gray-400 leading-relaxed">Percentage of orders with stockout events. Target &lt; 2%.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DEMAND & FORECAST */}
      {activeTab === 'demand' && (
        <div className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">Demand Forecasting Charts</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">Demand Forecast vs Actuals</h4>
              <p className="text-xs text-gray-500 mb-4">30-day rolling window actual vs Holt-Winters prediction</p>
              <div className="h-52 w-full relative"><canvas ref={demandForecastChartRef}></canvas></div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">Seasonal Demand Pattern</h4>
              <p className="text-xs text-gray-500 mb-4">Monthly demand index seasonality multipliers</p>
              <div className="h-52 w-full relative"><canvas ref={seasonalityChartRef}></canvas></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">Demand Distribution Frequency</h4>
              <p className="text-xs text-gray-500 mb-4">Daily demand frequency distribution histogram</p>
              <div className="h-52 w-full relative"><canvas ref={demandHistChartRef}></canvas></div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">Forecast Accuracy (MAPE Trend)</h4>
              <p className="text-xs text-gray-500 mb-4">Mean Absolute Percentage Error over rolling 12 weeks</p>
              <div className="h-52 w-full relative"><canvas ref={mapeTrendChartRef}></canvas></div>
            </div>
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">Forecasting Model Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white">Holt-Winters (Triple ETS)</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">ŷ(t+h) = l(t) + h·b(t) + s(t+h-m)</div>
              <p className="text-xs text-gray-400">Best for seasonal goods, holiday spikes. Needs history.</p>
              <div className="pt-2"><Badge color="emerald">MAPE 11.2%</Badge></div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white">ARIMA / SARIMA</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">ARIMA(p,d,q)(P,D,Q)m</div>
              <p className="text-xs text-gray-400">Best for stable trend items. Needs stationarity.</p>
              <div className="pt-2"><Badge color="blue">MAPE 14.1%</Badge></div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-white">Moving Average</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">MA(n) = Σ(y(t-i)) / n</div>
              <p className="text-xs text-gray-400">Best for new products with short history. Simple.</p>
              <div className="pt-2"><Badge color="amber">MAPE 18.6%</Badge></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ABC / XYZ */}
      {activeTab === 'abc' && (
        <div className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">ABC Analysis (Value Segmentation)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white mb-2">ABC Distribution</h4>
              <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-4">
                <span className="flex items-center"><span className="h-2.5 w-2.5 rounded bg-blue-500 mr-1"></span> A — Top 20% SKUs, 70% rev</span>
                <span className="flex items-center"><span className="h-2.5 w-2.5 rounded bg-blue-400 mr-1"></span> B — Mid 30% SKUs, 20% rev</span>
                <span className="flex items-center"><span className="h-2.5 w-2.5 rounded bg-blue-300 mr-1"></span> C — Bot 50% SKUs, 10% rev</span>
              </div>
              <div className="h-52 w-full relative"><canvas ref={abcDistributionChartRef}></canvas></div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">Pareto Curve (80/20 Rule)</h4>
              <p className="text-xs text-gray-500 mb-4">Cumulative revenue % vs cumulative SKU %</p>
              <div className="h-52 w-full relative"><canvas ref={paretoCurveChartRef}></canvas></div>
            </div>
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">XYZ Analysis (Demand Variability)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-blue-400">X — Low Variability</h4>
              <p className="text-xs text-gray-400">CoV &lt; 0.5 — steady, predictable demand. Standard reorder policy works.</p>
              <div className="font-mono text-xs text-white">CoV = σ / μ</div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] border-l-4 border-l-amber-500 rounded-2xl p-5 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-amber-400">Y — Medium Variability</h4>
              <p className="text-xs text-gray-400">CoV 0.5–1.0 — seasonal or trend-affected. Needs dynamic safety stock.</p>
              <div className="font-mono text-xs text-white">CoV = σ / μ</div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] border-l-4 border-l-red-500 rounded-2xl p-5 shadow-xl space-y-2">
              <h4 className="text-sm font-bold text-red-400">Z — High Variability</h4>
              <p className="text-xs text-gray-400">CoV &gt; 1.0 — erratic, unpredictable. Manual review recommended.</p>
              <div className="font-mono text-xs text-white">CoV = σ / μ</div>
            </div>
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">ABC × XYZ Combined Matrix</h2>
          <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl">
            <p className="text-xs text-gray-500 mb-4">9-cell strategic matrix driving replenishment policy per segment</p>
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div></div>
              <div className="text-center font-semibold text-gray-500 uppercase tracking-wider">X (stable)</div>
              <div className="text-center font-semibold text-gray-500 uppercase tracking-wider">Y (seasonal)</div>
              <div className="text-center font-semibold text-gray-500 uppercase tracking-wider">Z (erratic)</div>

              <div className="font-semibold text-gray-500 flex items-center">A (high val)</div>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center font-medium leading-relaxed">Continuous review<br />Tight ROP</div>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center font-medium leading-relaxed">Forecast-driven<br />Buffer stock</div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-center font-medium leading-relaxed">Manual oversight<br />High safety stock</div>

              <div className="font-semibold text-gray-500 flex items-center">B (mid val)</div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-center font-medium leading-relaxed">Periodic review<br />Standard ROP</div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-center font-medium leading-relaxed">Seasonal plans<br />Moderate buffer</div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-center font-medium leading-relaxed">Case-by-case<br />High safety stock</div>

              <div className="font-semibold text-gray-500 flex items-center">C (low val)</div>
              <div className="p-4 bg-gray-800/40 border border-[#22263f] text-gray-400 rounded-xl text-center font-medium leading-relaxed">Min-max policy<br />Bulk order</div>
              <div className="p-4 bg-gray-800/40 border border-[#22263f] text-gray-400 rounded-xl text-center font-medium leading-relaxed">Periodic bulk<br />Simplified rules</div>
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center font-medium leading-relaxed">Review for<br />elimination</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: REORDER METRICS */}
      {activeTab === 'reorder' && (
        <div className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">Reorder Calculations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center"><Calculator className="h-4 w-4 mr-2 text-blue-400" /> Safety Stock</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">SS = Z × σ_d × √(Lead Time)</div>
              <p className="text-xs text-gray-400">Z = service level Z-score. σ_d = std dev of daily demand.</p>
              <div className="text-[11px] grid grid-cols-2 gap-2 text-gray-400 pt-2 border-t border-[#22263f]">
                <span>90% Service: Z = 1.28</span>
                <span>95% Service: Z = 1.65</span>
                <span>98% Service: Z = 2.05</span>
                <span>99% Service: Z = 2.33</span>
              </div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center"><Calculator className="h-4 w-4 mr-2 text-blue-400" /> Reorder Point (ROP)</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">ROP = (Avg Daily Demand × Lead Time) + Safety Stock</div>
              <p className="text-xs text-gray-400">Stock level that triggers a draft purchase order to avoid stockout.</p>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center"><Calculator className="h-4 w-4 mr-2 text-blue-400" /> Economic Order Quantity (EOQ)</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">EOQ = √( 2 × D × S / H )</div>
              <p className="text-xs text-gray-400">D = annual demand, S = order cost, H = annual holding cost per unit.</p>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center"><Calculator className="h-4 w-4 mr-2 text-blue-400" /> Max Stock Level</h4>
              <div className="bg-[#090a0f] border border-[#1e2235] px-3.5 py-2.5 rounded-xl font-mono text-xs text-white">Max Stock = ROP + EOQ</div>
              <p className="text-xs text-gray-400">Upper bound of inventory. Exceeding this creates costly overstock.</p>
            </div>
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">Interactive EOQ Calculator</h2>
          <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-wrap gap-6">
              <label className="flex-1 min-w-[200px] text-xs font-semibold uppercase tracking-wider text-gray-400">
                Annual demand (units): <span className="font-bold text-white font-mono">{eoqD.toLocaleString('en-IN')}</span>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  value={eoqD}
                  onChange={(e) => setEoqD(parseInt(e.target.value))}
                  className="w-full mt-2 h-1 bg-[#0d0e15] border-none rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </label>
              <label className="flex-1 min-w-[200px] text-xs font-semibold uppercase tracking-wider text-gray-400">
                Order cost (₹/order): <span className="font-bold text-white font-mono">₹{eoqS}</span>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  value={eoqS}
                  onChange={(e) => setEoqS(parseInt(e.target.value))}
                  className="w-full mt-2 h-1 bg-[#0d0e15] border-none rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </label>
              <label className="flex-1 min-w-[200px] text-xs font-semibold uppercase tracking-wider text-gray-400">
                Holding cost (₹/unit/yr): <span className="font-bold text-white font-mono">₹{eoqH}</span>
                <input
                  type="range"
                  min="10"
                  max="500"
                  value={eoqH}
                  onChange={(e) => setEoqH(parseInt(e.target.value))}
                  className="w-full mt-2 h-1 bg-[#0d0e15] border-none rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Optimal Order Qty (EOQ)</span>
                <span className="text-xl font-extrabold text-white font-mono">{eoqVal.toLocaleString('en-IN')} units</span>
              </div>
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Orders Per Year</span>
                <span className="text-xl font-extrabold text-white font-mono">{eoqOrders} runs</span>
              </div>
              <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Min Total Cost / Yr</span>
                <span className="text-xl font-extrabold text-white font-mono">{formatCurrency(eoqTotalCost)}</span>
              </div>
            </div>

            <div className="h-52 w-full relative"><canvas ref={eoqChartRef}></canvas></div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: FINANCIAL MATRICES */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">Financial Valuation Trends</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">Inventory Valuation Trend</h4>
              <p className="text-xs text-gray-500 mb-4">Total stock assets valuation in Lakhs by month</p>
              <div className="h-52 w-full relative"><canvas ref={valTrendChartRef}></canvas></div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">COGS vs Revenue</h4>
              <p className="text-xs text-gray-500 mb-4">Gross margins analysis by category (Lakhs)</p>
              <div className="h-52 w-full relative"><canvas ref={cogsRevenueChartRef}></canvas></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl lg:col-span-1">
              <h4 className="text-sm font-semibold text-white mb-2">Carrying Cost Breakdown</h4>
              <div className="flex flex-col gap-2 text-[10px] text-gray-400 mb-4">
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span> Capital Cost — 45%</span>
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-amber-500 mr-2"></span> Storage Cost — 28%</span>
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-emerald-500 mr-2"></span> Insurance — 12%</span>
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span> Obsolescence — 15%</span>
              </div>
              <div className="h-44 w-full relative"><canvas ref={carryCostChartRef}></canvas></div>
            </div>

            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl lg:col-span-2">
              <h4 className="text-sm font-semibold text-white mb-4">Slow-Mover Detection</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#22263f] text-gray-500 font-semibold pb-2">
                      <th className="pb-2">Product SKU</th>
                      <th className="pb-2">Days In Stock</th>
                      <th className="pb-2">Turnover Rate</th>
                      <th className="pb-2 text-right">Status Badge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22263f]/60 text-gray-300">
                    <tr>
                      <td className="py-2.5 font-mono">USB-HUB-7P</td>
                      <td className="py-2.5">142 days</td>
                      <td className="py-2.5 font-semibold text-white">0.8×</td>
                      <td className="py-2.5 text-right"><Badge color="red">Dead Stock</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-mono">HDMI-CBL-2M</td>
                      <td className="py-2.5">89 days</td>
                      <td className="py-2.5 font-semibold text-white">1.2×</td>
                      <td className="py-2.5 text-right"><Badge color="amber">Slow Mover</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-mono">LAPTOP-DELL15</td>
                      <td className="py-2.5">24 days</td>
                      <td className="py-2.5 font-semibold text-white">8.4×</td>
                      <td className="py-2.5 text-right"><Badge color="emerald">Fast Mover</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-mono">MOUSE-WL-BLK</td>
                      <td className="py-2.5">31 days</td>
                      <td className="py-2.5 font-semibold text-white">6.1×</td>
                      <td className="py-2.5 text-right"><Badge color="emerald">Fast Mover</Badge></td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-mono">PRINTER-INK-C</td>
                      <td className="py-2.5">67 days</td>
                      <td className="py-2.5 font-semibold text-white">2.3×</td>
                      <td className="py-2.5 text-right"><Badge color="blue">Normal</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OPERATIONAL CHARTS */}
      {activeTab === 'ops' && (
        <div className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">Supplier & Order Performance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">Supplier On-Time Delivery %</h4>
              <p className="text-xs text-gray-500 mb-4">% of POs received on or before expected date</p>
              <div className="h-52 w-full relative"><canvas ref={supplierOtdChartRef}></canvas></div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">Sales Order Cycle Time</h4>
              <p className="text-xs text-gray-500 mb-4">Average days from creation to delivery</p>
              <div className="h-52 w-full relative"><canvas ref={cycleTimeChartRef}></canvas></div>
            </div>
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">Warehouse stock distribution</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white mb-2">Stock by Warehouse Location</h4>
              <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-4">
                <span className="flex items-center"><span className="h-2.5 w-2.5 rounded bg-blue-500 mr-1"></span> Main WH — 42%</span>
                <span className="flex items-center"><span className="h-2.5 w-2.5 rounded bg-emerald-500 mr-1"></span> North Hub — 28%</span>
                <span className="flex items-center"><span className="h-2.5 w-2.5 rounded bg-amber-500 mr-1"></span> South WH — 18%</span>
                <span className="flex items-center"><span className="h-2.5 w-2.5 rounded bg-gray-500 mr-1"></span> Transit — 12%</span>
              </div>
              <div className="h-52 w-full relative"><canvas ref={whStockChartRef}></canvas></div>
            </div>
            <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-white">Stock Level vs Reorder Point</h4>
              <p className="text-xs text-gray-500 mb-4">Current quantity vs ROP — top 6 SKUs</p>
              <div className="h-52 w-full relative"><canvas ref={stockRopChartRef}></canvas></div>
            </div>
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 border-b border-[#22263f] pb-2">Stock Movement Heatmap (Day × Hour)</h2>
          <div className="bg-[#11131e] border border-[#22263f] rounded-2xl p-6 shadow-xl space-y-4">
            <p className="text-xs text-gray-500">Volume of transactions by day of week and hour to identify peak activity</p>

            <div className="overflow-x-auto">
              <div className="min-w-[600px] space-y-1">
                {/* Header hours */}
                <div className="grid grid-cols-9 gap-1 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  <div></div>
                  {hours.map((h) => (
                    <div key={h} className="py-1">{h}</div>
                  ))}
                </div>

                {/* Day rows */}
                {days.map((day, di) => (
                  <div key={day} className="grid grid-cols-9 gap-1 items-center">
                    <div className="text-left text-xs font-semibold text-gray-400">{day}</div>
                    {hours.map((_, hi) => {
                      const v = hmData[di]?.[hi] || 0;
                      return (
                        <div
                          key={hi}
                          style={{ backgroundColor: getHmColor(v) }}
                          className="h-8 rounded flex items-center justify-center text-[10px] font-bold text-white font-mono transition-transform hover:scale-105 cursor-default"
                          title={`${day} at ${hours[hi]}: ${v} movements`}
                        >
                          {v}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-bold uppercase pt-2 border-t border-[#22263f]">
              <span>Low Activity</span>
              <div className="flex gap-1">
                {hmColors.map((color) => (
                  <div key={color} style={{ backgroundColor: color }} className="w-4.5 h-4.5 rounded"></div>
                ))}
              </div>
              <span>High Activity</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
