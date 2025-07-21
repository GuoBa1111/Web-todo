require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  console.error('VITE_SUPABASE_URL should look like: https://your-project-ref.supabase.co');
  console.error('Get these values from your Supabase project dashboard under Settings > API');
  process.exit(1);
}

// Check for placeholder values that would cause DNS errors
if (supabaseUrl.includes('your-project-id') || supabaseUrl.includes('placeholder')) {
  console.error('Invalid Supabase URL detected. Please replace placeholder values with actual Supabase credentials.');
  console.error('Current URL:', supabaseUrl);
  console.error('Get your actual project URL from your Supabase dashboard under Settings > API');
  process.exit(1);
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid VITE_SUPABASE_URL format. URL should start with https:// and be a valid Supabase URL');
  console.error('Current value:', supabaseUrl);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;