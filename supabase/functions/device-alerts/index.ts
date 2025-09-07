// Supabase Edge Function for Device Alerts
// This function handles automated alert generation and management
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
      case 'check-utilization':
        return await checkUtilizationAlerts(supabaseClient, req)
      
      case 'check-maintenance':
        return await checkMaintenanceAlerts(supabaseClient, req)
      
      case 'check-end-of-life':
        return await checkEndOfLifeAlerts(supabaseClient, req)
      
      case 'generate-alerts':
        return await generateAllAlerts(supabaseClient, req)
      
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
    console.error('Error in device-alerts function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Check for utilization-based alerts
async function checkUtilizationAlerts(supabaseClient: any, req: Request) {
  const { data: devices, error: devicesError } = await supabaseClient
    .from('devices')
    .select(`
      id,
      device_name,
      type,
      status,
      utilization_logs (
        hours_used,
        date
      )
    `)
    .eq('status', 'Active')

  if (devicesError) {
    throw devicesError
  }

  const alerts = []
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  for (const device of devices) {
    const recentLogs = device.utilization_logs.filter((log: any) => log.date >= thirtyDaysAgo)
    const totalHours = recentLogs.reduce((sum: number, log: any) => sum + log.hours_used, 0)
    const averageDailyUsage = totalHours / 30

    // Low utilization alert
    if (averageDailyUsage < 2) {
      alerts.push({
        device_id: device.id,
        alert: `Low Utilization - ${device.device_name}`,
        description: `${device.device_name} has been underutilized with an average of ${averageDailyUsage.toFixed(1)} hours per day over the last 30 days.`,
        type: 'maintenance',
        severity: 'low',
        status: 'Active'
      })
    }

    // High utilization alert
    if (averageDailyUsage > 20) {
      alerts.push({
        device_id: device.id,
        alert: `High Utilization - ${device.device_name}`,
        description: `${device.device_name} has been heavily utilized with an average of ${averageDailyUsage.toFixed(1)} hours per day over the last 30 days. Consider maintenance.`,
        type: 'maintenance',
        severity: 'high',
        status: 'Active'
      })
    }
  }

  // Insert alerts into database
  if (alerts.length > 0) {
    const { error: insertError } = await supabaseClient
      .from('system_alerts')
      .insert(alerts)

    if (insertError) {
      throw insertError
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `Generated ${alerts.length} utilization alerts`,
      alerts: alerts.length
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// Check for maintenance alerts
async function checkMaintenanceAlerts(supabaseClient: any, req: Request) {
  const { data: devices, error: devicesError } = await supabaseClient
    .from('devices')
    .select('id, device_name, type, purchase_date, status')
    .eq('status', 'Active')

  if (devicesError) {
    throw devicesError
  }

  const alerts = []
  const currentDate = new Date()
  const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate())

  for (const device of devices) {
    const purchaseDate = new Date(device.purchase_date)
    const monthsSincePurchase = (currentDate.getFullYear() - purchaseDate.getFullYear()) * 12 + 
                               (currentDate.getMonth() - purchaseDate.getMonth())

    // Annual maintenance alert
    if (monthsSincePurchase >= 12) {
      alerts.push({
        device_id: device.id,
        alert: `Annual Maintenance Due - ${device.device_name}`,
        description: `${device.device_name} has been in service for ${monthsSincePurchase} months and is due for annual maintenance.`,
        type: 'maintenance',
        severity: 'medium',
        status: 'Active'
      })
    }

    // End of warranty alert (assuming 3-year warranty)
    if (monthsSincePurchase >= 36) {
      alerts.push({
        device_id: device.id,
        alert: `Warranty Expired - ${device.device_name}`,
        description: `${device.device_name} warranty has expired. Consider replacement or extended support.`,
        type: 'end_of_life',
        severity: 'high',
        status: 'Active'
      })
    }
  }

  // Insert alerts into database
  if (alerts.length > 0) {
    const { error: insertError } = await supabaseClient
      .from('system_alerts')
      .insert(alerts)

    if (insertError) {
      throw insertError
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `Generated ${alerts.length} maintenance alerts`,
      alerts: alerts.length
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// Check for end-of-life alerts
async function checkEndOfLifeAlerts(supabaseClient: any, req: Request) {
  const { data: devices, error: devicesError } = await supabaseClient
    .from('devices')
    .select('id, device_name, type, purchase_date, status, model')
    .eq('status', 'Active')

  if (devicesError) {
    throw devicesError
  }

  const alerts = []
  const currentDate = new Date()
  const fiveYearsAgo = new Date(currentDate.getFullYear() - 5, currentDate.getMonth(), currentDate.getDate())

  for (const device of devices) {
    const purchaseDate = new Date(device.purchase_date)
    const yearsSincePurchase = currentDate.getFullYear() - purchaseDate.getFullYear()

    // End of life alert (5+ years)
    if (yearsSincePurchase >= 5) {
      alerts.push({
        device_id: device.id,
        alert: `End of Life - ${device.device_name}`,
        description: `${device.device_name} (${device.model}) has been in service for ${yearsSincePurchase} years and may be approaching end of life. Consider replacement planning.`,
        type: 'end_of_life',
        severity: 'critical',
        status: 'Active'
      })
    }

    // Critical end of life alert (7+ years)
    if (yearsSincePurchase >= 7) {
      alerts.push({
        device_id: device.id,
        alert: `Critical End of Life - ${device.device_name}`,
        description: `${device.device_name} (${device.model}) has been in service for ${yearsSincePurchase} years and should be replaced immediately.`,
        type: 'end_of_life',
        severity: 'critical',
        status: 'Active'
      })
    }
  }

  // Insert alerts into database
  if (alerts.length > 0) {
    const { error: insertError } = await supabaseClient
      .from('system_alerts')
      .insert(alerts)

    if (insertError) {
      throw insertError
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `Generated ${alerts.length} end-of-life alerts`,
      alerts: alerts.length
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// Generate all types of alerts
async function generateAllAlerts(supabaseClient: any, req: Request) {
  try {
    // Run all alert checks
    const utilizationResult = await checkUtilizationAlerts(supabaseClient, req)
    const maintenanceResult = await checkMaintenanceAlerts(supabaseClient, req)
    const endOfLifeResult = await checkEndOfLifeAlerts(supabaseClient, req)

    const totalAlerts = JSON.parse(await utilizationResult.text()).alerts +
                       JSON.parse(await maintenanceResult.text()).alerts +
                       JSON.parse(await endOfLifeResult.text()).alerts

    return new Response(
      JSON.stringify({ 
        message: `Generated ${totalAlerts} total alerts`,
        utilization_alerts: JSON.parse(await utilizationResult.text()).alerts,
        maintenance_alerts: JSON.parse(await maintenanceResult.text()).alerts,
        end_of_life_alerts: JSON.parse(await endOfLifeResult.text()).alerts,
        total_alerts: totalAlerts
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    throw error
  }
}
