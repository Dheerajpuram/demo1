import { Pool, PoolClient } from 'pg';

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'telecom_device_management',
  user: 'postgres',
  password: '111111',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create a connection pool
export const pool = new Pool(dbConfig);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Initialize database schema
export const initializeDatabase = async (): Promise<boolean> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    
    // Create database if it doesn't exist
    await client.query(`
      CREATE DATABASE IF NOT EXISTS telecom_device_management;
    `);
    
    // Use the database
    await client.query('USE telecom_device_management;');
    
    // Create tables
    await createTables(client);
    
    console.log('Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Create all required tables
const createTables = async (client: PoolClient): Promise<void> => {
  // Create Users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'manager', 'technician')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Locations table
  await client.query(`
    CREATE TABLE IF NOT EXISTS locations (
      id SERIAL PRIMARY KEY,
      location_name VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      city VARCHAR(100) NOT NULL,
      country VARCHAR(100) NOT NULL DEFAULT 'USA',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Devices table
  await client.query(`
    CREATE TABLE IF NOT EXISTS devices (
      id SERIAL PRIMARY KEY,
      device_name VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Maintenance')),
      serial_number VARCHAR(255) UNIQUE NOT NULL,
      model VARCHAR(255) NOT NULL,
      purchase_date DATE NOT NULL,
      location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Utilization Logs table
  await client.query(`
    CREATE TABLE IF NOT EXISTS utilization_logs (
      id SERIAL PRIMARY KEY,
      device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
      hours_used INTEGER NOT NULL CHECK (hours_used >= 0),
      date TIMESTAMP NOT NULL,
      notes TEXT,
      logged_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create System Alerts table
  await client.query(`
    CREATE TABLE IF NOT EXISTS system_alerts (
      id SERIAL PRIMARY KEY,
      alert VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('maintenance', 'low_stock', 'end_of_life', 'system')),
      severity VARCHAR(20) NOT NULL CHECK (severity IN ('high', 'medium', 'low', 'critical')),
      status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Resolved')),
      device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes for better performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_devices_location_id ON devices(location_id);
    CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
    CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
    CREATE INDEX IF NOT EXISTS idx_utilization_logs_device_id ON utilization_logs(device_id);
    CREATE INDEX IF NOT EXISTS idx_utilization_logs_date ON utilization_logs(date);
    CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
    CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(type);
  `);

  // Create trigger function for updating updated_at timestamp
  await client.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  // Create triggers for updated_at
  await client.query(`
    DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
    CREATE TRIGGER update_locations_updated_at
      BEFORE UPDATE ON locations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);

  await client.query(`
    DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
    CREATE TRIGGER update_devices_updated_at
      BEFORE UPDATE ON devices
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);

  await client.query(`
    DROP TRIGGER IF EXISTS update_system_alerts_updated_at ON system_alerts;
    CREATE TRIGGER update_system_alerts_updated_at
      BEFORE UPDATE ON system_alerts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
};

// Insert sample data
export const insertSampleData = async (): Promise<boolean> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    
    // Insert sample users
    await client.query(`
      INSERT INTO users (email, role) VALUES 
      ('admin@telecom.demo', 'admin'),
      ('manager@telecom.demo', 'manager'),
      ('tech1@telecom.demo', 'technician'),
      ('tech2@telecom.demo', 'technician')
      ON CONFLICT (email) DO NOTHING;
    `);

    // Insert sample locations
    await client.query(`
      INSERT INTO locations (location_name, address, city, country) VALUES 
      ('Main Office', '123 Business St', 'New York', 'USA'),
      ('Branch Office', '456 Corporate Ave', 'Los Angeles', 'USA'),
      ('Data Center', '789 Tech Blvd', 'San Francisco', 'USA'),
      ('Warehouse', '321 Storage Rd', 'Chicago', 'USA')
      ON CONFLICT DO NOTHING;
    `);

    // Insert sample devices
    await client.query(`
      INSERT INTO devices (device_name, type, status, serial_number, model, purchase_date, location_id) VALUES 
      ('Router-001', 'router', 'Active', 'RT001-2024', 'Cisco ISR4331', '2024-01-15', 1),
      ('Switch-001', 'switch', 'Active', 'SW001-2024', 'Cisco Catalyst 2960', '2024-02-20', 1),
      ('Modem-001', 'modem', 'Active', 'MD001-2024', 'Netgear CM1000', '2024-03-10', 2),
      ('Server-001', 'server', 'Maintenance', 'SRV001-2024', 'Dell PowerEdge R740', '2024-01-05', 3),
      ('Router-002', 'router', 'Inactive', 'RT002-2023', 'Cisco ISR4321', '2023-12-01', 4)
      ON CONFLICT (serial_number) DO NOTHING;
    `);

    // Insert sample utilization logs
    await client.query(`
      INSERT INTO utilization_logs (device_id, hours_used, date, notes, logged_by) VALUES 
      (1, 24, '2024-09-01 00:00:00', 'Daily operation', 3),
      (2, 20, '2024-09-01 00:00:00', 'Network switch usage', 3),
      (1, 22, '2024-09-02 00:00:00', 'Weekend operation', 4),
      (3, 18, '2024-09-02 00:00:00', 'Modem connectivity', 4)
      ON CONFLICT DO NOTHING;
    `);

    // Insert sample alerts
    await client.query(`
      INSERT INTO system_alerts (alert, description, type, severity, status, device_id) VALUES 
      ('Router maintenance due', 'Cisco Router #RT-001 requires scheduled maintenance', 'maintenance', 'medium', 'Active', 1),
      ('Low cable inventory', 'Ethernet cables running low in warehouse', 'low_stock', 'high', 'Active', NULL),
      ('Device warranty expiring', 'Switch #SW-001 warranty expires in 30 days', 'end_of_life', 'low', 'Active', 2),
      ('Server maintenance required', 'Dell Server #SRV001 needs immediate attention', 'maintenance', 'critical', 'Active', 4)
      ON CONFLICT DO NOTHING;
    `);

    console.log('Sample data inserted successfully');
    return true;
  } catch (error) {
    console.error('Failed to insert sample data:', error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Close the pool when the application shuts down
process.on('SIGINT', async () => {
  await pool.end();
  console.log('Database pool closed');
});

process.on('SIGTERM', async () => {
  await pool.end();
  console.log('Database pool closed');
});
