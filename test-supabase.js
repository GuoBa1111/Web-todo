// 导入Supabase客户端
const supabase = require('./config/supabase');
const { v4: uuidv4 } = require('uuid');

// 检查网络连接
async function checkNetwork() {
  try {
    console.log('开始检查网络连接...');
    const response = await fetch('https://www.google.com', {
      method: 'GET',
      timeout: 5000
    });
    console.log('网络连接检查成功, 状态码:', response.status);
    return true;
  } catch (err) {
    console.error('网络连接检查失败:', err);
    return false;
  }
}

// 尝试向表插入数据
async function insertIntoTable() {
  try {
    // 打印出生成的UUID
    const id = uuidv4();
    console.log('生成的UUID:', id);
    
    // 尝试插入数据
    console.log('开始尝试插入数据...');
    const { data, error } = await supabase
      .from('test_users')
      .insert([
        {
          id: id,
          name: '测试用户',
          email: 'test@example.com',
          password: 'hashedpassword123'
        }
      ]);
      // 注意：移除了.select()方法

    if (error) {
      console.error('向表插入数据出错:', error);
      console.error('错误详情:', error?.details || '无');
      console.error('错误提示:', error?.hint || '无');
      console.error('错误代码:', error?.code || '无');
    } else {
      console.log('向表插入数据成功');
      console.log('插入的数据ID:', id);
    }
  } catch (err) {
    console.error('向表插入数据时出错:', err);
    console.error('错误堆栈:', err.stack);
  }
}

// 执行测试
async function runTests() {
  console.log('开始测试...');
  const isNetworkAvailable = await checkNetwork();
  if (isNetworkAvailable) {
    console.log('开始向表插入数据...');
    await insertIntoTable();
  } else {
    console.log('网络连接不可用，跳过插入数据测试');
  }
  console.log('测试完成');
}

runTests();