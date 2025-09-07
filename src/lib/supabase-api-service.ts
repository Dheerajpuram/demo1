// Supabase API Service
// This file provides API service methods using Supabase
// Currently not used - the app uses PostgreSQL with Express.js

import { SupabaseService } from './supabase'
import { SupabaseDatabase } from './supabase'

// Type definitions for API responses
export interface Device {
  id: string
  device_name: string
  type: string
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Decommissioned'
  serial_number: string
  model: string
  purchase_date: string
  location_id: string
  location?: {
    id: string
    location_name: string
    address: string
    city: string
    country: string
  }
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  location_name: string
  address: string
  city: string
  country: string
  created_at: string
  updated_at: string
}

export interface UtilizationLog {
  id: string
  device_id: string
  device?: {
    id: string
    device_name: string
    type: string
  }
  hours_used: number
  date: string
  notes: string
  logged_by: string
  user?: {
    id: string
    email: string
  }
  created_at: string
}

export interface SystemAlert {
  id: string
  alert: string
  description: string
  type: 'maintenance' | 'low_stock' | 'end_of_life' | 'system'
  severity: 'high' | 'medium' | 'low' | 'critical'
  status: 'Active' | 'Resolved'
  created_at: string
}

export interface DashboardStats {
  totalDevices: number
  totalLocations: number
  totalLogs: number
  activeAlerts: number
}

export interface DeviceTypeStat {
  type: string
  count: number
}

export interface MonthlyUsage {
  month: string
  hours: number
}

// Supabase API Service Class
export class SupabaseApiService {
  // Device Management
  static async getDevices(): Promise<Device[]> {
    try {
      const data = await SupabaseService.getDevices()
      return data.map(device => ({
        id: device.id,
        device_name: device.device_name,
        type: device.type,
        status: device.status,
        serial_number: device.serial_number,
        model: device.model || '',
        purchase_date: device.purchase_date,
        location_id: device.location_id,
        location: device.locations ? {
          id: device.locations.id,
          location_name: device.locations.location_name,
          address: device.locations.address,
          city: device.locations.city,
          country: device.locations.country
        } : undefined,
        created_at: device.created_at,
        updated_at: device.updated_at
      }))
    } catch (error) {
      console.error('Error fetching devices:', error)
      throw new Error('Failed to fetch devices')
    }
  }

  static async createDevice(deviceData: Omit<Device, 'id' | 'created_at' | 'updated_at'>): Promise<Device> {
    try {
      const data = await SupabaseService.createDevice({
        device_name: deviceData.device_name,
        type: deviceData.type,
        status: deviceData.status,
        serial_number: deviceData.serial_number,
        model: deviceData.model,
        purchase_date: deviceData.purchase_date,
        location_id: deviceData.location_id
      })

      return {
        id: data.id,
        device_name: data.device_name,
        type: data.type,
        status: data.status,
        serial_number: data.serial_number,
        model: data.model || '',
        purchase_date: data.purchase_date,
        location_id: data.location_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    } catch (error) {
      console.error('Error creating device:', error)
      throw new Error('Failed to create device')
    }
  }

  static async updateDevice(id: string, updates: Partial<Omit<Device, 'id' | 'created_at' | 'updated_at'>>): Promise<Device> {
    try {
      const data = await SupabaseService.updateDevice(id, updates)

      return {
        id: data.id,
        device_name: data.device_name,
        type: data.type,
        status: data.status,
        serial_number: data.serial_number,
        model: data.model || '',
        purchase_date: data.purchase_date,
        location_id: data.location_id,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    } catch (error) {
      console.error('Error updating device:', error)
      throw new Error('Failed to update device')
    }
  }

  static async deleteDevice(id: string): Promise<void> {
    try {
      await SupabaseService.deleteDevice(id)
    } catch (error) {
      console.error('Error deleting device:', error)
      throw new Error('Failed to delete device')
    }
  }

  // Location Management
  static async getLocations(): Promise<Location[]> {
    try {
      const data = await SupabaseService.getLocations()
      return data.map(location => ({
        id: location.id,
        location_name: location.location_name,
        address: location.address,
        city: location.city,
        country: location.country,
        created_at: location.created_at,
        updated_at: location.updated_at
      }))
    } catch (error) {
      console.error('Error fetching locations:', error)
      throw new Error('Failed to fetch locations')
    }
  }

  static async createLocation(locationData: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Promise<Location> {
    try {
      const data = await SupabaseService.createLocation(locationData)

      return {
        id: data.id,
        location_name: data.location_name,
        address: data.address,
        city: data.city,
        country: data.country,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    } catch (error) {
      console.error('Error creating location:', error)
      throw new Error('Failed to create location')
    }
  }

  static async updateLocation(id: string, updates: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at'>>): Promise<Location> {
    try {
      const data = await SupabaseService.updateLocation(id, updates)

      return {
        id: data.id,
        location_name: data.location_name,
        address: data.address,
        city: data.city,
        country: data.country,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    } catch (error) {
      console.error('Error updating location:', error)
      throw new Error('Failed to update location')
    }
  }

  static async deleteLocation(id: string): Promise<void> {
    try {
      await SupabaseService.deleteLocation(id)
    } catch (error) {
      console.error('Error deleting location:', error)
      throw new Error('Failed to delete location')
    }
  }

  // Utilization Logs
  static async getUtilizationLogs(): Promise<UtilizationLog[]> {
    try {
      const data = await SupabaseService.getUtilizationLogs()
      return data.map(log => ({
        id: log.id,
        device_id: log.device_id,
        device: log.devices ? {
          id: log.devices.id,
          device_name: log.devices.device_name,
          type: log.devices.type
        } : undefined,
        hours_used: log.hours_used,
        date: log.date,
        notes: log.notes || '',
        logged_by: log.logged_by,
        user: log.users ? {
          id: log.users.id,
          email: log.users.email
        } : undefined,
        created_at: log.created_at
      }))
    } catch (error) {
      console.error('Error fetching utilization logs:', error)
      throw new Error('Failed to fetch utilization logs')
    }
  }

  static async createUtilizationLog(logData: Omit<UtilizationLog, 'id' | 'created_at' | 'device' | 'user'>): Promise<UtilizationLog> {
    try {
      const data = await SupabaseService.createUtilizationLog({
        device_id: logData.device_id,
        hours_used: logData.hours_used,
        date: logData.date,
        notes: logData.notes,
        logged_by: logData.logged_by
      })

      return {
        id: data.id,
        device_id: data.device_id,
        hours_used: data.hours_used,
        date: data.date,
        notes: data.notes || '',
        logged_by: data.logged_by,
        created_at: data.created_at
      }
    } catch (error) {
      console.error('Error creating utilization log:', error)
      throw new Error('Failed to create utilization log')
    }
  }

  static async updateUtilizationLog(id: string, updates: Partial<Omit<UtilizationLog, 'id' | 'created_at' | 'device' | 'user'>>): Promise<UtilizationLog> {
    try {
      const data = await SupabaseService.updateUtilizationLog(id, updates)

      return {
        id: data.id,
        device_id: data.device_id,
        hours_used: data.hours_used,
        date: data.date,
        notes: data.notes || '',
        logged_by: data.logged_by,
        created_at: data.created_at
      }
    } catch (error) {
      console.error('Error updating utilization log:', error)
      throw new Error('Failed to update utilization log')
    }
  }

  static async deleteUtilizationLog(id: string): Promise<void> {
    try {
      await SupabaseService.deleteUtilizationLog(id)
    } catch (error) {
      console.error('Error deleting utilization log:', error)
      throw new Error('Failed to delete utilization log')
    }
  }

  // System Alerts
  static async getAlerts(): Promise<SystemAlert[]> {
    try {
      const data = await SupabaseService.getAlerts()
      return data.map(alert => ({
        id: alert.id,
        alert: alert.alert,
        description: alert.description || '',
        type: alert.type,
        severity: alert.severity,
        status: alert.status,
        created_at: alert.created_at
      }))
    } catch (error) {
      console.error('Error fetching alerts:', error)
      throw new Error('Failed to fetch alerts')
    }
  }

  static async createAlert(alertData: Omit<SystemAlert, 'id' | 'created_at'>): Promise<SystemAlert> {
    try {
      const data = await SupabaseService.createAlert(alertData)

      return {
        id: data.id,
        alert: data.alert,
        description: data.description || '',
        type: data.type,
        severity: data.severity,
        status: data.status,
        created_at: data.created_at
      }
    } catch (error) {
      console.error('Error creating alert:', error)
      throw new Error('Failed to create alert')
    }
  }

  static async updateAlert(id: string, updates: Partial<Omit<SystemAlert, 'id' | 'created_at'>>): Promise<SystemAlert> {
    try {
      const data = await SupabaseService.updateAlert(id, updates)

      return {
        id: data.id,
        alert: data.alert,
        description: data.description || '',
        type: data.type,
        severity: data.severity,
        status: data.status,
        created_at: data.created_at
      }
    } catch (error) {
      console.error('Error updating alert:', error)
      throw new Error('Failed to update alert')
    }
  }

  // Dashboard Statistics
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      return await SupabaseService.getDashboardStats()
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw new Error('Failed to fetch dashboard statistics')
    }
  }

  static async getDeviceTypeStats(): Promise<DeviceTypeStat[]> {
    try {
      return await SupabaseService.getDeviceTypeStats()
    } catch (error) {
      console.error('Error fetching device type stats:', error)
      throw new Error('Failed to fetch device type statistics')
    }
  }

  static async getMonthlyUsage(): Promise<MonthlyUsage[]> {
    try {
      return await SupabaseService.getMonthlyUsage()
    } catch (error) {
      console.error('Error fetching monthly usage:', error)
      throw new Error('Failed to fetch monthly usage data')
    }
  }
}
