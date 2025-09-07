import React, { useEffect, useState } from 'react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { DeviceChart } from '../components/dashboard/DeviceChart';
import { UsageChart } from '../components/dashboard/UsageChart';
import { RecentAlerts } from '../components/dashboard/RecentAlerts';
import {
  Smartphone,
  CheckCircle,
  Play,
  Settings,
  XCircle,
  AlertTriangle,
  MapPin
} from 'lucide-react';
import { DashboardStats, DeviceTypeStats, MonthlyUsage, Alert } from '../types';
import api from '../lib/api';
import toast from 'react-hot-toast';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deviceTypeStats, setDeviceTypeStats] = useState<DeviceTypeStats[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyUsage[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration since we don't have a real backend
      const mockStats: DashboardStats = {
        total_devices: 147,
        available_devices: 89,
        in_use_devices: 42,
        maintenance_devices: 12,
        decommissioned_devices: 4,
        active_alerts: 8,
        locations: 12
      };

      const mockDeviceTypeStats: DeviceTypeStats[] = [
        { type: 'Router', count: 45 },
        { type: 'Switch', count: 38 },
        { type: 'Modem', count: 32 },
        { type: 'Cable', count: 32 }
      ];

      const mockMonthlyUsage: MonthlyUsage[] = [
        { month: 'Jan', usage_hours: 2840 },
        { month: 'Feb', usage_hours: 3120 },
        { month: 'Mar', usage_hours: 2960 },
        { month: 'Apr', usage_hours: 3340 },
        { month: 'May', usage_hours: 3780 },
        { month: 'Jun', usage_hours: 4120 }
      ];

      const mockAlerts: Alert[] = [
        {
          id: '1',
          title: 'Router maintenance due',
          description: 'Cisco Router #RT-001 requires scheduled maintenance',
          type: 'maintenance',
          severity: 'medium',
          status: 'active',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          title: 'Low cable inventory',
          description: 'Ethernet cables running low in warehouse',
          type: 'low_stock',
          severity: 'high',
          status: 'active',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          title: 'Device warranty expiring',
          description: 'Switch #SW-012 warranty expires in 30 days',
          type: 'end_of_life',
          severity: 'low',
          status: 'active',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setStats(mockStats);
      setDeviceTypeStats(mockDeviceTypeStats);
      setMonthlyUsage(mockMonthlyUsage);
      setRecentAlerts(mockAlerts);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor your telecom device infrastructure at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Devices"
          value={stats?.total_devices || 0}
          icon={Smartphone}
          color="blue"
        />
        <StatsCard
          title="Available"
          value={stats?.available_devices || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="In Use"
          value={stats?.in_use_devices || 0}
          icon={Play}
          color="blue"
        />
        <StatsCard
          title="Maintenance"
          value={stats?.maintenance_devices || 0}
          icon={Settings}
          color="yellow"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Decommissioned"
          value={stats?.decommissioned_devices || 0}
          icon={XCircle}
          color="gray"
        />
        <StatsCard
          title="Active Alerts"
          value={stats?.active_alerts || 0}
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="Locations"
          value={stats?.locations || 0}
          icon={MapPin}
          color="blue"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DeviceChart data={deviceTypeStats} />
        <UsageChart data={monthlyUsage} />
      </div>

      {/* Recent Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentAlerts alerts={recentAlerts} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors hover:scale-105 transform transition-transform duration-200">
              <span className="text-sm font-medium text-gray-900">Add New Device</span>
              <p className="text-xs text-gray-500 mt-1">Register a new telecom device</p>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors hover:scale-105 transform transition-transform duration-200">
              <span className="text-sm font-medium text-gray-900">Log Utilization</span>
              <p className="text-xs text-gray-500 mt-1">Record device usage hours</p>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors hover:scale-105 transform transition-transform duration-200">
              <span className="text-sm font-medium text-gray-900">Create Alert</span>
              <p className="text-xs text-gray-500 mt-1">Report a system issue</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}