'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useAppDispatch } from '../../../store/hooks';
import { addToast } from '../../../store/slices/toastSlice';
import { DataTable } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { ShieldCheck, Calendar, Search } from 'lucide-react';
import { RoleGuard } from '../../../components/auth/RoleGuard';

const getModuleBadgeColor = (entity: string): 'blue' | 'emerald' | 'amber' | 'red' | 'gray' | 'violet' => {
  const colors: Record<string, 'blue' | 'emerald' | 'amber' | 'red' | 'gray' | 'violet'> = {
    Product: 'emerald',
    Category: 'emerald',
    Warehouse: 'blue',
    Inventory: 'amber',
    PurchaseOrder: 'violet',
    SalesOrder: 'violet',
    Invoice: 'blue',
    Payment: 'emerald',
    User: 'violet',
  };
  return colors[entity] || 'gray';
};

const formatMeta = (details: any) => {
  if (!details) return <span className="text-gray-500 text-[10px]">No meta data</span>;
  
  let parsed = details;
  if (typeof details === 'string') {
    try {
      parsed = JSON.parse(details);
    } catch {
      return <span className="text-xs font-mono text-gray-400">{details}</span>;
    }
  }
  
  const method = parsed.method;
  const url = parsed.url;
  const body = parsed.body;
  const error = parsed.error;
  
  return (
    <div className="space-y-1.5 max-w-sm text-[11px] leading-relaxed">
      {method && url && (
        <div className="flex items-center space-x-1.5 bg-[#0d0e15] border border-[#22263f] px-2 py-0.5 rounded-lg w-max font-mono">
          <span className={`font-extrabold text-[9px] ${
            method === 'POST' ? 'text-emerald-400' :
            method === 'PATCH' || method === 'PUT' ? 'text-amber-400' :
            method === 'DELETE' ? 'text-red-400' : 'text-blue-400'
          }`}>{method}</span>
          <span className="text-gray-400 text-[10px] truncate max-w-[150px]">{url}</span>
        </div>
      )}
      
      {error && (
        <div className="text-red-400 font-semibold bg-red-950/20 border border-red-900/30 px-2 py-1 rounded-lg">
          Error: {error}
        </div>
      )}
      
      {body && typeof body === 'object' && Object.keys(body).length > 0 && (
        <div className="bg-[#0f111a] border border-[#20243b] rounded-xl p-2 font-mono space-y-1 text-gray-300">
          <div className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold border-b border-[#20243b] pb-0.5 mb-1 flex items-center justify-between">
            <span>Payload Data</span>
            <span className="text-[8px] text-gray-600">{Object.keys(body).length} fields</span>
          </div>
          <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-0.5">
            {Object.entries(body).map(([k, v]) => {
              let valStr = '';
              if (v === null) valStr = 'null';
              else if (typeof v === 'object') valStr = Array.isArray(v) ? `[${v.length} items]` : '{...}';
              else valStr = String(v);

              if (valStr.length > 30) valStr = valStr.substring(0, 27) + '...';

              return (
                <div key={k} className="flex items-start justify-between text-[10px] leading-4 hover:bg-[#151928]/40 px-1 rounded transition-colors">
                  <span className="text-gray-400 mr-2 select-all font-semibold">{k}:</span>
                  <span className="text-blue-300 truncate max-w-[140px] select-all">{valStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {!method && !url && !body && (
        <div className="bg-[#0d0e15] border border-[#22263f] rounded-xl p-2 max-h-24 overflow-y-auto custom-scrollbar font-mono text-gray-400 text-[10px] whitespace-pre-wrap">
          {JSON.stringify(parsed, null, 2)}
        </div>
      )}
    </div>
  );
};

export default function AuditLogsPage() {
  const dispatch = useAppDispatch();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit-logs', {
        params: {
          page,
          limit: 15,
          entity: entityFilter || undefined,
          action: actionFilter || undefined,
        },
      });

      setLogs(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch (err: any) {
      dispatch(
        addToast({
          message: 'Failed to fetch security audit logs.',
          type: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, entityFilter, actionFilter]);

  const columns = [
    {
      header: 'Timestamp',
      accessor: (row: any) => (
        <div>
          <span className="text-white font-medium">{new Date(row.timestamp).toLocaleDateString()}</span>
          <span className="block text-[10px] text-gray-500">
            {new Date(row.timestamp).toLocaleTimeString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Operator / Staff',
      accessor: (row: any) => (
        <div>
          <span className="font-semibold text-white">{row.user?.name || 'System / Auto'}</span>
          {row.user?.email && <span className="block text-[10px] text-gray-500">{row.user.email}</span>}
        </div>
      ),
    },
    {
      header: 'Action Performed',
      accessor: (row: any) => (
        <span className="text-xs font-semibold text-indigo-400 font-mono">{row.action}</span>
      ),
    },
    {
      header: 'Module Entity',
      accessor: (row: any) => (
        <div className="space-y-1">
          <Badge color={getModuleBadgeColor(row.entity)}>
            {row.entity}
          </Badge>
          {row.entityId && (
            <div className="text-[9px] text-gray-500 font-mono">
              <span className="bg-[#1b1c2b] px-1.5 py-0.5 rounded border border-[#2b2e4a] inline-block select-all">
                ID: {row.entityId.slice(0, 8)}...
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'IP Address',
      accessor: (row: any) => {
        const ip = row.ipAddress || '127.0.0.1';
        const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
        return (
          <div className="flex items-center space-x-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${isLocal ? 'bg-blue-400' : 'bg-emerald-400'}`}></span>
            <span className="font-mono text-xs text-gray-400">{isLocal ? `Localhost (${ip})` : ip}</span>
          </div>
        );
      },
    },
    {
      header: 'Details Meta',
      accessor: (row: any) => formatMeta(row.details),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <ShieldCheck className="h-6 w-6 mr-2 text-blue-500" />
          Security Audit Logs
        </h1>
        <p className="text-sm text-gray-400">
          Immutable tracking ledgers recording all database mutation and administration activities
        </p>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-[#11131e] border border-[#22263f] p-4 rounded-2xl flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Filter Module:</span>
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-[#0d0e15] border border-[#22263f] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Modules</option>
            <option value="Product">Product Catalog</option>
            <option value="Category">Category</option>
            <option value="Warehouse">Warehouse</option>
            <option value="Inventory">Inventory Adjustments</option>
            <option value="PurchaseOrder">Purchase Orders</option>
            <option value="SalesOrder">Sales Orders</option>
            <option value="Invoice">GST Invoices</option>
            <option value="Payment">Payments</option>
            <option value="User">User Profile</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Filter Action:</span>
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-[#0d0e15] border border-[#22263f] focus:border-blue-500 rounded-xl text-xs text-white focus:outline-none"
            placeholder="e.g. CREATE, CONFIRM..."
          />
        </div>
      </div>

      {/* Grid container */}
      <div className="h-[calc(100vh-270px)]">
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          pagination={{
            page,
            totalPages,
            limit: 15,
            total,
            onPageChange: (p) => setPage(p),
          }}
        />
      </div>
    </div>
  );
}
