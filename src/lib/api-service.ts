// API service for backend communication
export class ApiService {
  private static baseURL = 'http://localhost:3001/api';

  // Generic method to make API calls
  private static async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Devices API
  static async getDevices() {
    return this.request('/devices');
  }

  static async createDevice(device: any) {
    return this.request('/devices', {
      method: 'POST',
      body: JSON.stringify(device),
    });
  }

  static async updateDevice(id: number, device: any) {
    return this.request(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(device),
    });
  }

  static async deleteDevice(id: number) {
    return this.request(`/devices/${id}`, {
      method: 'DELETE',
    });
  }

  // Locations API
  static async getLocations() {
    return this.request('/locations');
  }

  static async createLocation(location: any) {
    return this.request('/locations', {
      method: 'POST',
      body: JSON.stringify(location),
    });
  }

  static async updateLocation(id: number, location: any) {
    return this.request(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(location),
    });
  }

  static async deleteLocation(id: number) {
    return this.request(`/locations/${id}`, {
      method: 'DELETE',
    });
  }

  // Utilization Logs API
  static async getUtilizationLogs() {
    return this.request('/utilization-logs');
  }

  static async createUtilizationLog(log: any) {
    return this.request('/utilization-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  // System Alerts API
  static async getAlerts() {
    return this.request('/alerts');
  }

  static async createAlert(alert: any) {
    return this.request('/alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  }

  static async updateAlert(id: number, alert: any) {
    return this.request(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(alert),
    });
  }

  // Dashboard Stats API
  static async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Device Type Stats API
  static async getDeviceTypeStats() {
    return this.request('/dashboard/device-types');
  }

  // Monthly Usage API
  static async getMonthlyUsage() {
    return this.request('/dashboard/monthly-usage');
  }
}
