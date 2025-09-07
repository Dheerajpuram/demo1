import React, { useState, useEffect } from 'react';
import { UtilizationLog } from '../types';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Plus, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ApiService } from '../lib/api-service';

export function UtilizationPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<UtilizationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const canAdd = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'technician';

  useEffect(() => {
    fetchUtilizationLogs();
  }, []);

  const fetchUtilizationLogs = async () => {
    try {
      setLoading(true);
      // Fetch real utilization logs from database
      const apiLogs = await ApiService.getUtilizationLogs();
      
      // Also fetch devices to create sample logs for devices without logs
      const devices = await ApiService.getDevices();
      
      // Transform API data to match frontend expectations
      const transformedLogs: UtilizationLog[] = apiLogs.map(log => ({
        id: log.id,
        device_id: log.device_id,
        device: {
          id: log.device_id,
          name: log.device_name || 'Unknown Device',
          type: log.device_type || 'unknown',
          status: 'available', // Default status
          serial_number: '',
          model: '',
          purchase_date: '',
          created_at: log.created_at,
          updated_at: log.created_at
        },
        hours_used: log.hours_used,
        log_date: log.date, // Map 'date' to 'log_date'
        notes: log.notes || '',
        created_by: log.logged_by_email || 'Unknown',
        created_at: log.created_at
      }));
      
      // Add sample logs for devices that don't have any logs yet
      const devicesWithLogs = new Set(transformedLogs.map(log => log.device_id));
      const sampleLogs: UtilizationLog[] = devices
        .filter(device => !devicesWithLogs.has(device.id))
        .map((device, index) => ({
          id: `sample-${device.id}`,
          device_id: device.id,
          device: {
            id: device.id,
            name: device.device_name,
            type: device.type,
            status: device.status,
            serial_number: device.serial_number || '',
            model: device.model || '',
            purchase_date: device.purchase_date || '',
            created_at: device.created_at,
            updated_at: device.updated_at
          },
          hours_used: Math.floor(Math.random() * 20) + 5, // Random hours between 5-25
          log_date: new Date(Date.now() - ((index + 1) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // Different dates, starting from yesterday
          notes: 'Sample data for demonstration',
          created_by: 'system@telecom.demo',
          created_at: new Date().toISOString()
        }));
      
      const allLogs = [...transformedLogs, ...sampleLogs].sort((a, b) => 
        new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
      );
      
      console.log('All logs (real + sample):', allLogs); // Debug log
      setLogs(allLogs);
    } catch (error) {
      console.error('Failed to load utilization logs:', error);
      toast.error('Failed to load utilization logs');
    } finally {
      setLoading(false);
    }
  };

  const chartData = logs
    .map(log => {
      try {
        const logDate = new Date(log.log_date);
        return {
          date: format(logDate, 'MMM dd'),
          hours: log.hours_used,
          device: log.device?.name || 'Unknown Device',
          fullDate: format(logDate, 'MMM dd, yyyy'),
          notes: log.notes || '',
          sortDate: logDate,
          originalDate: log.log_date // Keep original for debugging
        };
      } catch (error) {
        console.error('Error formatting chart data for log:', log, error);
        return {
          date: 'Invalid Date',
          hours: log.hours_used || 0,
          device: log.device?.name || 'Unknown Device',
          fullDate: 'Invalid Date',
          notes: log.notes || '',
          sortDate: new Date(0),
          originalDate: log.log_date
        };
      }
    })
    .sort((a, b) => {
      // More robust sorting - handle invalid dates
      const dateA = a.sortDate.getTime();
      const dateB = b.sortDate.getTime();
      
      // If both dates are valid, sort normally
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateA - dateB;
      }
      
      // If one is invalid, put it at the end
      if (isNaN(dateA) && !isNaN(dateB)) return 1;
      if (!isNaN(dateA) && isNaN(dateB)) return -1;
      
      // If both are invalid, maintain original order
      return 0;
    });

  // Debug log to see the sorted chart data
  console.log('Chart data after sorting:', chartData.map(item => ({
    date: item.date,
    fullDate: item.fullDate,
    originalDate: item.originalDate,
    hours: item.hours
  })));

  const columns = [
    { 
      key: 'device_name', 
      header: 'Device',
      render: (log: UtilizationLog) => (
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{log.device?.name || 'Unknown Device'}</span>
        </div>
      )
    },
    { 
      key: 'hours_used', 
      header: 'Hours Used',
      render: (log: UtilizationLog) => (
        <span className="font-medium text-blue-600">{log.hours_used}h</span>
      )
    },
    { 
      key: 'log_date', 
      header: 'Date',
      render: (log: UtilizationLog) => format(new Date(log.log_date), 'MMM dd, yyyy')
    },
    { key: 'notes', header: 'Notes' },
    { key: 'created_by', header: 'Logged By' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Utilization Logs</h1>
          <p className="text-gray-600">Track and analyze device usage patterns</p>
        </div>
        {canAdd && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors hover:scale-105 transform transition-transform duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Usage
          </button>
        )}
      </div>

      {/* Usage Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value, name, props) => [
                `${value} hours`,
                props.payload.device
              ]}
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  return `${payload[0].payload.fullDate} - ${payload[0].payload.device}`;
                }
                return label;
              }}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                padding: '12px'
              }}
            />
            <Line type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Table columns={columns} data={logs} loading={loading} />

      {/* Add Log Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Log Device Utilization"
      >
        <UtilizationForm
          onSubmit={async (data) => {
            try {
              // Create utilization log via API
              await ApiService.createUtilizationLog({
                device_id: data.device_id,
                hours_used: data.hours_used,
                date: data.log_date, // Map log_date to date for API
                notes: data.notes || '',
                logged_by: user?.email || 'admin@telecom.demo'
              });
              
              // Refresh the logs list
              await fetchUtilizationLogs();
              setIsAddModalOpen(false);
              toast.success('Utilization logged successfully');
            } catch (error) {
              console.error('Failed to add utilization log:', error);
              toast.error('Failed to add utilization log');
            }
          }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

interface UtilizationFormProps {
  onSubmit: (data: Partial<UtilizationLog>) => Promise<void>;
  onCancel: () => void;
}

function UtilizationForm({ onSubmit, onCancel }: UtilizationFormProps) {
  const [formData, setFormData] = useState({
    device_id: '',
    hours_used: 0,
    log_date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const deviceList = await ApiService.getDevices();
        console.log('Fetched devices:', deviceList); // Debug log
        setDevices(deviceList);
      } catch (error) {
        console.error('Failed to load devices:', error);
        toast.error('Failed to load devices');
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Device
        </label>
        <select
          required
          value={formData.device_id}
          onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        >
          <option value="">{loading ? 'Loading devices...' : 'Select a device'}</option>
          {devices.map(device => (
            <option key={device.id} value={device.id}>{device.device_name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hours Used
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.5"
            value={formData.hours_used}
            onChange={(e) => setFormData({ ...formData, hours_used: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            required
            value={formData.log_date}
            onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add any relevant notes about the usage..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors hover:scale-105 transform transition-transform duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors hover:scale-105 transform transition-transform duration-200"
        >
          Log Usage
        </button>
      </div>
    </form>
  );
}