// Supabase Edge Function for Device Utilization Analytics
// This function provides advanced analytics for device utilization
// Deploy this to Supabase Edge Functions when you switch to Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { method } = req
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'utilization-trends':
        return await getUtilizationTrends(supabaseClient, req)
      
      case 'device-efficiency':
        return await getDeviceEfficiency(supabaseClient, req)
      
      case 'peak-usage':
        return await getPeakUsage(supabaseClient, req)
      
      case 'utilization-summary':
        return await getUtilizationSummary(supabaseClient, req)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Error in device-utilization function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Get utilization trends over time
async function getUtilizationTrends(supabaseClient: any, req: Request) {
  const { data, error } = await supabaseClient
    .from('utilization_logs')
    .select(`
      date,
      hours_used,
      devices!inner (
        device_name,
        type
      )
    `)
    .order('date', { ascending: true })

  if (error) {
    throw error
  }

  // Group by date and calculate totals
  const trends = data.reduce((acc: any, log: any) => {
    const date = log.date
    if (!acc[date]) {
      acc[date] = {
        date,
        total_hours: 0,
        device_count: 0,
        devices: []
      }
    }
    acc[date].total_hours += log.hours_used
    acc[date].device_count += 1
    acc[date].devices.push({
      name: log.devices.device_name,
      type: log.devices.type,
      hours: log.hours_used
    })
    return acc
  }, {})

  const result = Object.values(trends).map((trend: any) => ({
    ...trend,
    average_hours: trend.total_hours / trend.device_count
  }))

  return new Response(
    JSON.stringify({ trends: result }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// Get device efficiency metrics
async function getDeviceEfficiency(supabaseClient: any, req: Request) {
  const { data, error } = await supabaseClient
    .from('utilization_logs')
    .select(`
      device_id,
      hours_used,
      date,
      devices!inner (
        device_name,
        type,
        status
      )
    `)
    .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

  if (error) {
    throw error
  }

  // Calculate efficiency metrics per device
  const deviceMetrics = data.reduce((acc: any, log: any) => {
    const deviceId = log.device_id
    if (!acc[deviceId]) {
      acc[deviceId] = {
        device_id: deviceId,
        device_name: log.devices.device_name,
        type: log.devices.type,
        status: log.devices.status,
        total_hours: 0,
        log_count: 0,
        days_active: new Set()
      }
    }
    acc[deviceId].total_hours += log.hours_used
    acc[deviceId].log_count += 1
    acc[deviceId].days_active.add(log.date)
    return acc
  }, {})

  const result = Object.values(deviceMetrics).map((device: any) => ({
    device_id: device.device_id,
    device_name: device.device_name,
    type: device.type,
    status: device.status,
    total_hours: device.total_hours,
    average_daily_hours: device.total_hours / device.days_active.size,
    utilization_rate: Math.min(device.total_hours / (device.days_active.size * 24), 1) * 100,
    efficiency_score: Math.min(device.total_hours / (device.days_active.size * 8), 1) * 100
  }))

  return new Response(
    JSON.stringify({ devices: result }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// Get peak usage patterns
async function getPeakUsage(supabaseClient: any, req: Request) {
  const { data, error } = await supabaseClient
    .from('utilization_logs')
    .select(`
      date,
      hours_used,
      devices!inner (
        device_name,
        type
      )
    `)
    .order('hours_used', { ascending: false })
    .limit(50)

  if (error) {
    throw error
  }

  // Group by device type for peak usage analysis
  const peakUsage = data.reduce((acc: any, log: any) => {
    const type = log.devices.type
    if (!acc[type]) {
      acc[type] = {
        type,
        peak_hours: 0,
        peak_date: '',
        total_usage: 0,
        usage_count: 0
      }
    }
    
    if (log.hours_used > acc[type].peak_hours) {
      acc[type].peak_hours = log.hours_used
      acc[type].peak_date = log.date
    }
    
    acc[type].total_usage += log.hours_used
    acc[type].usage_count += 1
    return acc
  }, {})

  const result = Object.values(peakUsage).map((usage: any) => ({
    ...usage,
    average_usage: usage.total_usage / usage.usage_count
  }))

  return new Response(
    JSON.stringify({ peak_usage: result }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// Get utilization summary
async function getUtilizationSummary(supabaseClient: any, req: Request) {
  const { data: logs, error: logsError } = await supabaseClient
    .from('utilization_logs')
    .select('hours_used, date')
    .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

  if (logsError) {
    throw logsError
  }

  const { data: devices, error: devicesError } = await supabaseClient
    .from('devices')
    .select('id, status')

  if (devicesError) {
    throw devicesError
  }

  const totalHours = logs.reduce((sum: number, log: any) => sum + log.hours_used, 0)
  const totalDays = new Set(logs.map((log: any) => log.date)).size
  const activeDevices = devices.filter((device: any) => device.status === 'Active').length
  const averageDailyUsage = totalHours / totalDays
  const averageDeviceUsage = totalHours / activeDevices

  const summary = {
    total_hours: totalHours,
    total_days: totalDays,
    active_devices: activeDevices,
    average_daily_usage: Math.round(averageDailyUsage * 100) / 100,
    average_device_usage: Math.round(averageDeviceUsage * 100) / 100,
    utilization_rate: Math.round((totalHours / (activeDevices * totalDays * 24)) * 100 * 100) / 100
  }

  return new Response(
    JSON.stringify({ summary }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}
