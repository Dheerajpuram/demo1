-- Initial Supabase schema migration
-- This file contains the complete database schema for Supabase
-- Run this migration when you decide to switch to Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'technician')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'Inactive', 'Maintenance', 'Decommissioned')),
    serial_number VARCHAR(255) UNIQUE NOT NULL,
    model VARCHAR(255),
    purchase_date DATE,
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create utilization_logs table
CREATE TABLE IF NOT EXISTS utilization_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    hours_used INTEGER NOT NULL CHECK (hours_used >= 0),
    date DATE NOT NULL,
    notes TEXT,
    logged_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alert VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('maintenance', 'low_stock', 'end_of_life', 'system')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('high', 'medium', 'low', 'critical')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_location_id ON devices(location_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
CREATE INDEX IF NOT EXISTS idx_utilization_logs_device_id ON utilization_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_utilization_logs_date ON utilization_logs(date);
CREATE INDEX IF NOT EXISTS idx_utilization_logs_logged_by ON utilization_logs(logged_by);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (email, role) VALUES 
    ('admin@telecom.demo', 'admin'),
    ('manager@telecom.demo', 'manager'),
    ('tech1@telecom.demo', 'technician'),
    ('tech2@telecom.demo', 'technician')
ON CONFLICT (email) DO NOTHING;

INSERT INTO locations (location_name, address, city, country) VALUES 
    ('Main Office', '123 Telecom Street', 'New York', 'USA'),
    ('Branch Office', '456 Network Avenue', 'Los Angeles', 'USA'),
    ('Data Center', '789 Server Road', 'Chicago', 'USA'),
    ('Remote Site', '321 Wireless Lane', 'Miami', 'USA')
ON CONFLICT DO NOTHING;

INSERT INTO devices (device_name, type, status, serial_number, model, purchase_date, location_id) VALUES 
    ('Core Router 1', 'router', 'Active', 'RT001', 'Cisco ASR1000', '2023-01-15', (SELECT id FROM locations WHERE location_name = 'Main Office' LIMIT 1)),
    ('Switch Stack 1', 'switch', 'Active', 'SW001', 'Cisco Catalyst 9300', '2023-02-20', (SELECT id FROM locations WHERE location_name = 'Main Office' LIMIT 1)),
    ('Server Rack 1', 'server', 'Active', 'SR001', 'Dell PowerEdge R750', '2023-03-10', (SELECT id FROM locations WHERE location_name = 'Data Center' LIMIT 1)),
    ('Backup Router', 'router', 'Inactive', 'RT002', 'Juniper MX204', '2022-11-05', (SELECT id FROM locations WHERE location_name = 'Branch Office' LIMIT 1)),
    ('Access Point 1', 'access_point', 'Maintenance', 'AP001', 'Ubiquiti UniFi 6', '2023-04-12', (SELECT id FROM locations WHERE location_name = 'Remote Site' LIMIT 1))
ON CONFLICT (serial_number) DO NOTHING;

INSERT INTO utilization_logs (device_id, hours_used, date, notes, logged_by) VALUES 
    ((SELECT id FROM devices WHERE device_name = 'Core Router 1' LIMIT 1), 8, '2024-01-15', 'Normal operation', (SELECT id FROM users WHERE email = 'tech1@telecom.demo' LIMIT 1)),
    ((SELECT id FROM devices WHERE device_name = 'Switch Stack 1' LIMIT 1), 6, '2024-01-15', 'Peak usage', (SELECT id FROM users WHERE email = 'tech2@telecom.demo' LIMIT 1)),
    ((SELECT id FROM devices WHERE device_name = 'Server Rack 1' LIMIT 1), 12, '2024-01-14', 'Extended maintenance window', (SELECT id FROM users WHERE email = 'tech1@telecom.demo' LIMIT 1)),
    ((SELECT id FROM devices WHERE device_name = 'Core Router 1' LIMIT 1), 7, '2024-01-14', 'Routine monitoring', (SELECT id FROM users WHERE email = 'tech2@telecom.demo' LIMIT 1)),
    ((SELECT id FROM devices WHERE device_name = 'Access Point 1' LIMIT 1), 4, '2024-01-13', 'Testing phase', (SELECT id FROM users WHERE email = 'tech1@telecom.demo' LIMIT 1))
ON CONFLICT DO NOTHING;

INSERT INTO system_alerts (alert, description, type, severity, status) VALUES 
    ('High CPU Usage', 'Core Router 1 showing 95% CPU utilization', 'system', 'high', 'Active'),
    ('Low Disk Space', 'Server Rack 1 disk usage at 90%', 'maintenance', 'medium', 'Active'),
    ('End of Life Warning', 'Backup Router approaching end of support', 'end_of_life', 'low', 'Active'),
    ('Network Latency', 'Increased latency detected on Switch Stack 1', 'system', 'medium', 'Resolved'),
    ('Maintenance Required', 'Access Point 1 firmware update needed', 'maintenance', 'low', 'Active')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your authentication needs)
-- These are basic policies - customize based on your requirements

-- Users can read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- All authenticated users can read locations
CREATE POLICY "Authenticated users can read locations" ON locations
    FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can read devices
CREATE POLICY "Authenticated users can read devices" ON devices
    FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can read utilization logs
CREATE POLICY "Authenticated users can read utilization logs" ON utilization_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can read alerts
CREATE POLICY "Authenticated users can read alerts" ON system_alerts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admin users can insert/update/delete all data
CREATE POLICY "Admins can manage users" ON users
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage locations" ON locations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage devices" ON devices
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage utilization logs" ON utilization_logs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage alerts" ON system_alerts
    FOR ALL USING (auth.role() = 'authenticated');
