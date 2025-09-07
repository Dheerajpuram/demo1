import React, { useState, useEffect } from 'react';
import { Device } from '../types';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Plus, Edit, Trash2, Filter, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ApiService } from '../lib/api-service';

// Status mapping utilities
const DB_TO_FRONTEND_STATUS: { [key: string]: string } = {
  'Active': 'available',
  'Inactive': 'in_use',
  'Maintenance': 'maintenance',
  'Decommissioned': 'decommissioned'
};

const FRONTEND_TO_DB_STATUS: { [key: string]: string } = {
  'available': 'Active',
  'in_use': 'Inactive',
  'maintenance': 'Maintenance',
  'decommissioned': 'Decommissioned'
};

export function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });

  const canEdit = user?.role === 'admin' || user?.role === 'manager';
  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    filterDevices();
  }, [devices, filters]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const devices = await ApiService.getDevices();
      // Transform database data to match Device interface
      const transformedDevices: Device[] = devices.map((device: any) => ({
        id: device.id.toString(),
        name: device.device_name,
        type: device.type,
        status: DB_TO_FRONTEND_STATUS[device.status] || 'available',
        serial_number: device.serial_number,
        model: device.model,
        purchase_date: device.purchase_date,
        warranty_expiry: device.warranty_expiry || null,
        created_at: device.created_at,
        updated_at: device.updated_at,
        location: device.location_name ? {
          id: device.location_id?.toString(),
          name: device.location_name,
          city: device.city,
          country: device.country
        } : null
      }));
      setDevices(transformedDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const filterDevices = () => {
    let filtered = devices;

    if (filters.status !== 'all') {
      filtered = filtered.filter(device => device.status === filters.status);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(device => device.type === filters.type);
    }

    if (filters.search) {
      filtered = filtered.filter(device => 
        device.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        device.serial_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        device.model.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredDevices(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      available: 'success',
      in_use: 'info',
      maintenance: 'warning',
      decommissioned: 'error'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const handleEdit = (device: Device) => {
    setSelectedDevice(device);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    try {
      await ApiService.deleteDevice(parseInt(deviceId));
      setDevices(prev => prev.filter(device => device.id !== deviceId));
      toast.success('Device deleted successfully');
    } catch (error) {
      console.error('Failed to delete device:', error);
      toast.error('Failed to delete device');
    }
  };

  const columns = [
    { key: 'name', header: 'Device Name' },
    { 
      key: 'type', 
      header: 'Type',
      render: (device: Device) => (
        <span className="capitalize">{device.type}</span>
      )
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (device: Device) => getStatusBadge(device.status)
    },
    { key: 'serial_number', header: 'Serial Number' },
    { key: 'model', header: 'Model' },
    {
      key: 'purchase_date',
      header: 'Purchase Date',
      render: (device: Device) => format(new Date(device.purchase_date), 'MMM dd, yyyy')
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (device: Device) => (
        <div className="flex space-x-2">
          {canEdit && (
            <button
              onClick={() => handleEdit(device)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors hover:scale-105 transform transition-transform duration-200"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => handleDelete(device.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors hover:scale-105 transform transition-transform duration-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Devices</h1>
          <p className="text-gray-600">Manage your telecom device inventory</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors hover:scale-105 transform transition-transform duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Device
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search devices..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="decommissioned">Decommissioned</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="router">Router</option>
              <option value="switch">Switch</option>
              <option value="modem">Modem</option>
              <option value="cable">Cable</option>
            </select>
          </div>
        </div>
      </div>

      <Table columns={columns} data={filteredDevices} loading={loading} />

      {/* Add Device Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Device"
        size="lg"
      >
        <DeviceForm
          onSubmit={async (data) => {
            try {
              const newDevice = await ApiService.createDevice({
                device_name: data.name,
                type: data.type,
                status: FRONTEND_TO_DB_STATUS[data.status] || 'Active',
                serial_number: data.serial_number,
                model: data.model,
                purchase_date: data.purchase_date,
                location_id: data.location?.id ? parseInt(data.location.id) : null
              });
              
              // Transform the response to match Device interface
              const transformedDevice: Device = {
                id: newDevice.id.toString(),
                name: newDevice.device_name,
                type: newDevice.type,
                status: DB_TO_FRONTEND_STATUS[newDevice.status] || 'available',
                serial_number: newDevice.serial_number,
                model: newDevice.model,
                purchase_date: newDevice.purchase_date,
                warranty_expiry: newDevice.warranty_expiry || null,
                created_at: newDevice.created_at,
                updated_at: newDevice.updated_at,
                location: data.location
              };
              
              setDevices(prev => [...prev, transformedDevice]);
              setIsAddModalOpen(false);
              toast.success('Device added successfully');
            } catch (error) {
              console.error('Failed to add device:', error);
              toast.error('Failed to add device');
            }
          }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Device Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Device"
        size="lg"
      >
        <DeviceForm
          device={selectedDevice}
          onSubmit={async (data) => {
            try {
              const updatedDevice = await ApiService.updateDevice(parseInt(selectedDevice!.id), {
                device_name: data.name,
                type: data.type,
                status: FRONTEND_TO_DB_STATUS[data.status] || 'Active',
                serial_number: data.serial_number,
                model: data.model,
                purchase_date: data.purchase_date,
                location_id: data.location?.id ? parseInt(data.location.id) : null
              });
              
              // Transform the response to match Device interface
              const transformedDevice: Device = {
                id: updatedDevice.id.toString(),
                name: updatedDevice.device_name,
                type: updatedDevice.type,
                status: DB_TO_FRONTEND_STATUS[updatedDevice.status] || 'available',
                serial_number: updatedDevice.serial_number,
                model: updatedDevice.model,
                purchase_date: updatedDevice.purchase_date,
                warranty_expiry: updatedDevice.warranty_expiry || null,
                created_at: updatedDevice.created_at,
                updated_at: updatedDevice.updated_at,
                location: data.location
              };
              
              setDevices(prev => prev.map(device => 
                device.id === selectedDevice?.id ? transformedDevice : device
              ));
              setIsEditModalOpen(false);
              setSelectedDevice(null);
              toast.success('Device updated successfully');
            } catch (error) {
              console.error('Failed to update device:', error);
              toast.error('Failed to update device');
            }
          }}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedDevice(null);
          }}
        />
      </Modal>
    </div>
  );
}

interface DeviceFormProps {
  device?: Device | null;
  onSubmit: (data: Partial<Device>) => Promise<void>;
  onCancel: () => void;
}

function DeviceForm({ device, onSubmit, onCancel }: DeviceFormProps) {
  const [formData, setFormData] = useState({
    name: device?.name || '',
    type: device?.type || 'router',
    status: device?.status || 'available',
    serial_number: device?.serial_number || '',
    model: device?.model || '',
    purchase_date: device?.purchase_date || '',
    warranty_expiry: device?.warranty_expiry || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Device Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="router">Router</option>
            <option value="switch">Switch</option>
            <option value="modem">Modem</option>
            <option value="cable">Cable</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
            <option value="decommissioned">Decommissioned</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Serial Number
          </label>
          <input
            type="text"
            required
            value={formData.serial_number}
            onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model
          </label>
          <input
            type="text"
            required
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purchase Date
          </label>
          <input
            type="date"
            required
            value={formData.purchase_date}
            onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warranty Expiry
          </label>
          <input
            type="date"
            value={formData.warranty_expiry}
            onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
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
          {device ? 'Update Device' : 'Add Device'}
        </button>
      </div>
    </form>
  );
}