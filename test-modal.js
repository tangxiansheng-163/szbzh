const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/pages/equipment-category.html',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    // 检查弹窗元素是否存在
    const hasAddModal = data.includes('id="category-add-modal"');
    const hasEditModal = data.includes('id="category-edit-modal"');
    const hasDeleteModal = data.includes('id="category-delete-modal"');
    
    // 检查按钮 onclick 事件
    const hasAddButton = data.includes("document.getElementById('category-add-modal')");
    const hasEditButton = data.includes("document.getElementById('category-edit-modal')");
    const hasDeleteButton = data.includes("document.getElementById('category-delete-modal')");
    
    console.log('=== 页面验证结果 ===');
    console.log('弹窗元素存在:');
    console.log('  - 新增分类弹窗:', hasAddModal ? '✅' : '❌');
    console.log('  - 编辑分类弹窗:', hasEditModal ? '✅' : '❌');
    console.log('  - 删除分类弹窗:', hasDeleteModal ? '✅' : '❌');
    console.log('');
    console.log('按钮事件绑定:');
    console.log('  - 新增分类按钮:', hasAddButton ? '✅' : '❌');
    console.log('  - 编辑分类按钮:', hasEditButton ? '✅' : '❌');
    console.log('  - 删除分类按钮:', hasDeleteButton ? '✅' : '❌');
    console.log('');
    console.log('=== 验证完成 ===');
  });
});

req.on('error', (e) => {
  console.error('请求失败:', e.message);
});

req.end();
