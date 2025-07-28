// 确保环境变量已加载
require('dotenv').config();

// 添加Supabase客户端导入
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ykfjlczganrkjqmjzvsd.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'default-fallback-key';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;