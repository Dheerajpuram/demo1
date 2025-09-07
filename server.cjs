const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'telecom_device_management',
  user: 'postgres',
  password: '111111',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
pool.query('SELECT 1 as test')
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failed:', err));

// API Routes

// Get all devices
app.get('/api/devices', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, l.location_name, l.city, l.country
      FROM devices d
      LEFT JOIN locations l ON d.location_id = l.id
      ORDER BY d.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Create device
app.post('/api/devices', async (req, res) => {
  try {
    const { device_name, type, status, serial_number, model, purchase_date, location_id } = req.body;
    const result = await pool.query(`
      INSERT INTO devices (device_name, type, status, serial_number, model, purchase_date, location_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [device_name, type, status, serial_number, model, purchase_date, location_id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ error: 'Failed to create device' });
  }
});

// Update device
app.put('/api/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { device_name, type, status, serial_number, model, purchase_date, location_id } = req.body;
    const result = await pool.query(`
      UPDATE devices 
      SET device_name = $1, type = $2, status = $3, serial_number = $4, model = $5, purchase_date = $6, location_id = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [device_name, type, status, serial_number, model, purchase_date, location_id, id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// Delete device
app.delete('/api/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM devices WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

// Get all locations
app.get('/api/locations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Create location
app.post('/api/locations', async (req, res) => {
  try {
    const { location_name, address, city, country } = req.body;
    const result = await pool.query(`
      INSERT INTO locations (location_name, address, city, country)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [location_name, address, city, country]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// Update location
app.put('/api/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { location_name, address, city, country } = req.body;
    const result = await pool.query(`
      UPDATE locations 
      SET location_name = $1, address = $2, city = $3, country = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [location_name, address, city, country, id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Delete location
app.delete('/api/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM locations WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

// Get dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [devices, alerts, locations] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) as total_devices,
          COUNT(CASE WHEN status = 'Active' THEN 1 END) as available_devices,
          COUNT(CASE WHEN status = 'Inactive' THEN 1 END) as in_use_devices,
          COUNT(CASE WHEN status = 'Maintenance' THEN 1 END) as maintenance_devices,
          COUNT(CASE WHEN status = 'Decommissioned' THEN 1 END) as decommissioned_devices
        FROM devices
      `),
      pool.query(`
        SELECT COUNT(*) as active_alerts
        FROM system_alerts
        WHERE status = 'Active'
      `),
      pool.query(`
        SELECT COUNT(*) as locations
        FROM locations
      `)
    ]);

    res.json({
      total_devices: parseInt(devices.rows[0]?.total_devices || 0),
      available_devices: parseInt(devices.rows[0]?.available_devices || 0),
      in_use_devices: parseInt(devices.rows[0]?.in_use_devices || 0),
      maintenance_devices: parseInt(devices.rows[0]?.maintenance_devices || 0),
      decommissioned_devices: parseInt(devices.rows[0]?.decommissioned_devices || 0),
      active_alerts: parseInt(alerts.rows[0]?.active_alerts || 0),
      locations: parseInt(locations.rows[0]?.locations || 0)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get device type stats
app.get('/api/dashboard/device-types', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT type, COUNT(*) as count
      FROM devices
      GROUP BY type
      ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching device type stats:', error);
    res.status(500).json({ error: 'Failed to fetch device type stats' });
  }
});

// Get monthly usage
app.get('/api/dashboard/monthly-usage', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(date, 'Mon') as month,
        SUM(hours_used) as usage_hours
      FROM utilization_logs
      WHERE date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(date, 'Mon'), EXTRACT(MONTH FROM date)
      ORDER BY EXTRACT(MONTH FROM date)
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching monthly usage:', error);
    res.status(500).json({ error: 'Failed to fetch monthly usage' });
  }
});

// Get alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sa.*, d.device_name, d.type as device_type
      FROM system_alerts sa
      LEFT JOIN devices d ON sa.device_id = d.id
      ORDER BY sa.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Utilization Logs endpoints
app.get('/api/utilization-logs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ul.*, d.device_name, d.type as device_type, u.email as logged_by_email
      FROM utilization_logs ul
      LEFT JOIN devices d ON ul.device_id = d.id
      LEFT JOIN users u ON ul.logged_by = u.id
      ORDER BY ul.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching utilization logs:', err);
    res.status(500).json({ error: 'Failed to fetch utilization logs' });
  }
});

app.post('/api/utilization-logs', async (req, res) => {
  try {
    const { device_id, hours_used, date, notes, logged_by } = req.body;
    
    // First, let's check if the device exists
    const deviceResult = await pool.query('SELECT id FROM devices WHERE id = $1', [device_id]);
    if (deviceResult.rows.length === 0) {
      return res.status(400).json({ error: 'Device not found' });
    }
    
    // Get a user ID from the users table, or create a default one
    let userId;
    if (logged_by) {
      // Try to find user by email first
      const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [logged_by]);
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      } else {
        // Create a new user if not found
        const newUser = await pool.query(
          'INSERT INTO users (email, role) VALUES ($1, $2) RETURNING id',
          [logged_by, 'technician']
        );
        userId = newUser.rows[0].id;
      }
    } else {
      // Use default user
      const userResult = await pool.query('SELECT id FROM users LIMIT 1');
      if (userResult.rows.length === 0) {
        // Create a default user if none exists
        const newUser = await pool.query(
          'INSERT INTO users (email, role) VALUES ($1, $2) RETURNING id',
          ['admin@telecom.demo', 'admin']
        );
        userId = newUser.rows[0].id;
      } else {
        userId = userResult.rows[0].id;
      }
    }
    
    const result = await pool.query(
      'INSERT INTO utilization_logs (device_id, hours_used, date, notes, logged_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [device_id, hours_used, date, notes, userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating utilization log:', err);
    res.status(500).json({ error: 'Failed to create utilization log' });
  }
});

app.put('/api/utilization-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { device_id, hours_used, date, notes, logged_by } = req.body;
    const result = await pool.query(
      'UPDATE utilization_logs SET device_id = $1, hours_used = $2, date = $3, notes = $4, logged_by = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [device_id, hours_used, date, notes, logged_by, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilization log not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating utilization log:', err);
    res.status(500).json({ error: 'Failed to update utilization log' });
  }
});

app.delete('/api/utilization-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM utilization_logs WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilization log not found' });
    }
    res.json({ message: 'Utilization log deleted successfully' });
  } catch (err) {
    console.error('Error deleting utilization log:', err);
    res.status(500).json({ error: 'Failed to delete utilization log' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});
