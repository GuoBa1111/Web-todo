const { createClient } = require('@supabase/supabase-js');

// 确保环境变量已加载
require('dotenv').config();

const supabaseUrl = 'https://ykfjlczganrkjqmjzvsd.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'default-fallback-key';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;