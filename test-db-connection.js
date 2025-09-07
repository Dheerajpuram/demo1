// Test database connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

console.log('Testing database connection...');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection by trying to fetch from a table
async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    
    // Try to fetch from user_profiles table (from the migration)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Database connection failed:', error.message);
      console.error('Error details:', error);
      return false;
    }
    
    console.log('Database connection successful!');
    console.log('Sample data:', data);
    return true;
  } catch (err) {
    console.error('Connection test failed:', err.message);
    return false;
  }
}

testConnection();
