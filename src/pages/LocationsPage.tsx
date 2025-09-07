import React, { useState, useEffect } from 'react';
import { Location } from '../types';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { ApiService } from '../lib/api-service';

export function LocationsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const locations = await ApiService.getLocations();
      // Transform database data to match Location interface
      const transformedLocations: Location[] = locations.map((location: any) => ({
        id: location.id.toString(),
        name: location.location_name,
        address: location.address,
        city: location.city,
        country: location.country,
        device_count: 0, // This would need a separate query to count devices per location
        created_at: location.created_at,
        updated_at: location.updated_at
      }));
      setLocations(transformedLocations);
    } catch (error) {
      console.error('Failed to load locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      await ApiService.deleteLocation(parseInt(locationId));
      setLocations(prev => prev.filter(location => location.id !== locationId));
      toast.success('Location deleted successfully');
    } catch (error) {
      console.error('Failed to delete location:', error);
      toast.error('Failed to delete location');
    }
  };

  const columns = [
    { 
      key: 'name', 
      header: 'Location Name',
      render: (location: Location) => (
        <div className="flex items-center space-x-3">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{location.name}</span>
        </div>
      )
    },
    { key: 'address', header: 'Address' },
    { key: 'city', header: 'City' },
    { key: 'country', header: 'Country' },
    { 
      key: 'device_count', 
      header: 'Devices',
      render: (location: Location) => (
        <span className="font-medium text-blue-600">{location.device_count || 0}</span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (location: Location) => (
        <div className="flex space-x-2">
          {canEdit && (
            <button
              onClick={() => handleEdit(location)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors hover:scale-105 transform transition-transform duration-200"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => handleDelete(location.id)}
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Locations</h1>
          <p className="text-gray-600">Manage telecom site locations</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors hover:scale-105 transform transition-transform duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </button>
        )}
      </div>

      <Table columns={columns} data={locations} loading={loading} />

      {/* Add Location Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Location"
      >
        <LocationForm
          onSubmit={async (data) => {
            try {
              const newLocation = await ApiService.createLocation({
                location_name: data.name,
                address: data.address,
                city: data.city,
                country: data.country
              });
              
              // Transform the response to match Location interface
              const transformedLocation: Location = {
                id: newLocation.id.toString(),
                name: newLocation.location_name,
                address: newLocation.address,
                city: newLocation.city,
                country: newLocation.country,
                device_count: 0,
                created_at: newLocation.created_at,
                updated_at: newLocation.updated_at
              };
              
              setLocations(prev => [...prev, transformedLocation]);
              setIsAddModalOpen(false);
              toast.success('Location added successfully');
            } catch (error) {
              console.error('Failed to add location:', error);
              toast.error('Failed to add location');
            }
          }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Location Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Location"
      >
        <LocationForm
          location={selectedLocation}
          onSubmit={async (data) => {
            try {
              const updatedLocation = await ApiService.updateLocation(parseInt(selectedLocation!.id), {
                location_name: data.name,
                address: data.address,
                city: data.city,
                country: data.country
              });
              
              // Transform the response to match Location interface
              const transformedLocation: Location = {
                id: updatedLocation.id.toString(),
                name: updatedLocation.location_name,
                address: updatedLocation.address,
                city: updatedLocation.city,
                country: updatedLocation.country,
                device_count: selectedLocation?.device_count || 0,
                created_at: updatedLocation.created_at,
                updated_at: updatedLocation.updated_at
              };
              
              setLocations(prev => prev.map(location => 
                location.id === selectedLocation?.id ? transformedLocation : location
              ));
              setIsEditModalOpen(false);
              setSelectedLocation(null);
              toast.success('Location updated successfully');
            } catch (error) {
              console.error('Failed to update location:', error);
              toast.error('Failed to update location');
            }
          }}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedLocation(null);
          }}
        />
      </Modal>
    </div>
  );
}

interface LocationFormProps {
  location?: Location | null;
  onSubmit: (data: Partial<Location>) => Promise<void>;
  onCancel: () => void;
}

function LocationForm({ location, onSubmit, onCancel }: LocationFormProps) {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    address: location?.address || '',
    city: location?.city || '',
    country: location?.country || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location Name
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
          Address
        </label>
        <input
          type="text"
          required
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <input
            type="text"
            required
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
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
          {location ? 'Update Location' : 'Add Location'}
        </button>
      </div>
    </form>
  );
}