// Supabase configuration file
// This file is ready for future Supabase integration
// Currently not used - the app uses PostgreSQL directly

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types for Supabase (when you connect in the future)
export interface SupabaseDatabase {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'manager' | 'technician'
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'admin' | 'manager' | 'technician'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'manager' | 'technician'
          created_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          device_name: string
          type: string
          status: 'Active' | 'Inactive' | 'Maintenance' | 'Decommissioned'
          serial_number: string
          model: string
          purchase_date: string
          location_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          device_name: string
          type: string
          status: 'Active' | 'Inactive' | 'Maintenance' | 'Decommissioned'
          serial_number: string
          model: string
          purchase_date: string
          location_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          device_name?: string
          type?: string
          status?: 'Active' | 'Inactive' | 'Maintenance' | 'Decommissioned'
          serial_number?: string
          model?: string
          purchase_date?: string
          location_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          location_name: string
          address: string
          city: string
          country: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          location_name: string
          address: string
          city: string
          country: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location_name?: string
          address?: string
          city?: string
          country?: string
          created_at?: string
          updated_at?: string
        }
      }
      utilization_logs: {
        Row: {
          id: string
          device_id: string
          hours_used: number
          date: string
          notes: string
          logged_by: string
          created_at: string
        }
        Insert: {
          id?: string
          device_id: string
          hours_used: number
          date: string
          notes?: string
          logged_by: string
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          hours_used?: number
          date?: string
          notes?: string
          logged_by?: string
          created_at?: string
        }
      }
      system_alerts: {
        Row: {
          id: string
          alert: string
          description: string
          type: 'maintenance' | 'low_stock' | 'end_of_life' | 'system'
          severity: 'high' | 'medium' | 'low' | 'critical'
          status: 'Active' | 'Resolved'
          created_at: string
        }
        Insert: {
          id?: string
          alert: string
          description: string
          type: 'maintenance' | 'low_stock' | 'end_of_life' | 'system'
          severity: 'high' | 'medium' | 'low' | 'critical'
          status: 'Active' | 'Resolved'
          created_at?: string
        }
        Update: {
          id?: string
          alert?: string
          description?: string
          type?: 'maintenance' | 'low_stock' | 'end_of_life' | 'system'
          severity?: 'high' | 'medium' | 'low' | 'critical'
          status?: 'Active' | 'Resolved'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Supabase service functions (ready for future use)
export class SupabaseService {
  // User management
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Device management
  static async getDevices() {
    const { data, error } = await supabase
      .from('devices')
      .select(`
        *,
        locations:location_id (
          id,
          location_name,
          address,
          city,
          country
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createDevice(device: SupabaseDatabase['public']['Tables']['devices']['Insert']) {
    const { data, error } = await supabase
      .from('devices')
      .insert(device)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateDevice(id: string, updates: SupabaseDatabase['public']['Tables']['devices']['Update']) {
    const { data, error } = await supabase
      .from('devices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteDevice(id: string) {
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Location management
  static async getLocations() {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createLocation(location: SupabaseDatabase['public']['Tables']['locations']['Insert']) {
    const { data, error } = await supabase
      .from('locations')
      .insert(location)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateLocation(id: string, updates: SupabaseDatabase['public']['Tables']['locations']['Update']) {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteLocation(id: string) {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Utilization logs
  static async getUtilizationLogs() {
    const { data, error } = await supabase
      .from('utilization_logs')
      .select(`
        *,
        devices:device_id (
          id,
          device_name,
          type
        ),
        users:logged_by (
          id,
          email
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createUtilizationLog(log: SupabaseDatabase['public']['Tables']['utilization_logs']['Insert']) {
    const { data, error } = await supabase
      .from('utilization_logs')
      .insert(log)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateUtilizationLog(id: string, updates: SupabaseDatabase['public']['Tables']['utilization_logs']['Update']) {
    const { data, error } = await supabase
      .from('utilization_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteUtilizationLog(id: string) {
    const { error } = await supabase
      .from('utilization_logs')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Alerts
  static async getAlerts() {
    const { data, error } = await supabase
      .from('system_alerts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createAlert(alert: SupabaseDatabase['public']['Tables']['system_alerts']['Insert']) {
    const { data, error } = await supabase
      .from('system_alerts')
      .insert(alert)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateAlert(id: string, updates: SupabaseDatabase['public']['Tables']['system_alerts']['Update']) {
    const { data, error } = await supabase
      .from('system_alerts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Dashboard statistics
  static async getDashboardStats() {
    const [devicesResult, locationsResult, logsResult, alertsResult] = await Promise.all([
      supabase.from('devices').select('id', { count: 'exact' }),
      supabase.from('locations').select('id', { count: 'exact' }),
      supabase.from('utilization_logs').select('id', { count: 'exact' }),
      supabase.from('system_alerts').select('id', { count: 'exact' }).eq('status', 'Active')
    ])

    if (devicesResult.error) throw devicesResult.error
    if (locationsResult.error) throw locationsResult.error
    if (logsResult.error) throw logsResult.error
    if (alertsResult.error) throw alertsResult.error

    return {
      totalDevices: devicesResult.count || 0,
      totalLocations: locationsResult.count || 0,
      totalLogs: logsResult.count || 0,
      activeAlerts: alertsResult.count || 0
    }
  }

  static async getDeviceTypeStats() {
    const { data, error } = await supabase
      .from('devices')
      .select('type')
    
    if (error) throw error

    const stats = data.reduce((acc, device) => {
      acc[device.type] = (acc[device.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(stats).map(([type, count]) => ({ type, count }))
  }

  static async getMonthlyUsage() {
    const { data, error } = await supabase
      .from('utilization_logs')
      .select('date, hours_used')
      .gte('date', new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).toISOString().split('T')[0])
      .order('date', { ascending: true })
    
    if (error) throw error

    const monthlyData = data.reduce((acc, log) => {
      const month = new Date(log.date).toISOString().slice(0, 7) // YYYY-MM
      acc[month] = (acc[month] || 0) + log.hours_used
      return acc
    }, {} as Record<string, number>)

    return Object.entries(monthlyData).map(([month, hours]) => ({ month, hours }))
  }
}

// Real-time subscriptions (for future use)
export const subscribeToDevices = (callback: (payload: any) => void) => {
  return supabase
    .channel('devices')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'devices' }, 
      callback
    )
    .subscribe()
}

export const subscribeToUtilizationLogs = (callback: (payload: any) => void) => {
  return supabase
    .channel('utilization_logs')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'utilization_logs' }, 
      callback
    )
    .subscribe()
}

export const subscribeToAlerts = (callback: (payload: any) => void) => {
  return supabase
    .channel('alerts')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'system_alerts' }, 
      callback
    )
    .subscribe()
}
