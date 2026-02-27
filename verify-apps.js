/**
 * 应用切换和菜单验证脚本
 * 验证所有应用是否能正常切换，菜单是否能正常加载，页面是否存在
 */

const fs = require('fs');
const path = require('path');

// 读取page-interactions.js文件
const pageInteractionsPath = path.join(__dirname, 'assets', 'page-interactions.js');
const content = fs.readFileSync(pageInteractionsPath, 'utf8');

// 提取所有菜单中引用的页面
const pageMatches = content.matchAll(/href="pages\/([^"]+)"/g);
const menuPages = Array.from(pageMatches).map(m => m[1]);
const uniqueMenuPages = [...new Set(menuPages)];

// 应用配置
const appConfigs = {
    'design-collab': {
        name: '设计协同系统',
        defaultPage: 'pages/dashboard.html',
        menu: 'design-collab-menu'
    },
    'procurement': {
        name: '采购协同系统',
        defaultPage: 'pages/procurement-dashboard.html',
        menu: 'procurement-menu'
    },
    'supply-chain': {
        name: '供应链协同',
        defaultPage: 'pages/supply-chain-dashboard.html',
        menu: 'supply-chain-menu'
    },
    'equipment': {
        name: '设备管理协同',
        defaultPage: 'pages/equipment-dashboard.html',
        menu: 'equipment-menu'
    },
    'energy': {
        name: '能源管理协同',
        defaultPage: 'pages/energy-dashboard.html',
        menu: 'energy-menu'
    }
};

// 检查页面是否存在
function checkPageExists(pagePath) {
    const fullPath = path.join(__dirname, pagePath);
    return fs.existsSync(fullPath);
}

// 验证结果
const results = {
    apps: {},
    menuPages: {
        total: uniqueMenuPages.length,
        exists: 0,
        missing: []
    },
    errors: []
};

console.log('='.repeat(80));
console.log('应用切换和菜单验证报告');
console.log('='.repeat(80));
console.log('');

// 1. 验证应用配置
console.log('1. 验证应用配置');
console.log('-'.repeat(80));
Object.keys(appConfigs).forEach(appId => {
    const config = appConfigs[appId];
    const defaultPageExists = checkPageExists(config.defaultPage);
    
    results.apps[appId] = {
        name: config.name,
        defaultPage: config.defaultPage,
        defaultPageExists: defaultPageExists,
        menu: config.menu
    };
    
    console.log(`✓ ${config.name} (${appId})`);
    console.log(`  默认页面: ${config.defaultPage} ${defaultPageExists ? '✓' : '✗ 不存在'}`);
    console.log(`  菜单类型: ${config.menu}`);
    console.log('');
});

// 2. 验证菜单中引用的页面
console.log('2. 验证菜单中引用的页面');
console.log('-'.repeat(80));
console.log(`总页面数: ${uniqueMenuPages.length}`);
console.log('');

uniqueMenuPages.forEach(page => {
    const exists = checkPageExists(page);
    if (exists) {
        results.menuPages.exists++;
    } else {
        results.menuPages.missing.push(page);
    }
});

console.log(`✓ 存在的页面: ${results.menuPages.exists}`);
console.log(`✗ 缺失的页面: ${results.menuPages.missing.length}`);
console.log('');

if (results.menuPages.missing.length > 0) {
    console.log('缺失的页面列表:');
    results.menuPages.missing.forEach(page => {
        console.log(`  ✗ ${page}`);
    });
    console.log('');
}

// 3. 验证菜单函数是否存在
console.log('3. 验证菜单函数');
console.log('-'.repeat(80));
const menuFunctions = [
    'getDesignCollabMenu',
    'getProcurementMenu',
    'getSupplyChainMenu',
    'getEquipmentMenu',
    'getEnergyMenu'
];

menuFunctions.forEach(funcName => {
    const exists = content.includes(`function ${funcName}()`);
    console.log(`${exists ? '✓' : '✗'} ${funcName}(): ${exists ? '存在' : '不存在'}`);
    if (!exists) {
        results.errors.push(`菜单函数 ${funcName} 不存在`);
    }
});
console.log('');

// 4. 验证switchApp函数
console.log('4. 验证应用切换函数');
console.log('-'.repeat(80));
const hasSwitchApp = content.includes('function switchApp(');
const hasUpdateMenu = content.includes('function updateMenu(');
console.log(`${hasSwitchApp ? '✓' : '✗'} switchApp函数: ${hasSwitchApp ? '存在' : '不存在'}`);
console.log(`${hasUpdateMenu ? '✓' : '✗'} updateMenu函数: ${hasUpdateMenu ? '存在' : '不存在'}`);
if (!hasSwitchApp) results.errors.push('switchApp函数不存在');
if (!hasUpdateMenu) results.errors.push('updateMenu函数不存在');
console.log('');

// 5. 统计信息
console.log('5. 统计信息');
console.log('-'.repeat(80));
console.log(`应用总数: ${Object.keys(appConfigs).length}`);
console.log(`菜单页面总数: ${results.menuPages.total}`);
console.log(`存在的页面: ${results.menuPages.exists} (${(results.menuPages.exists / results.menuPages.total * 100).toFixed(1)}%)`);
console.log(`缺失的页面: ${results.menuPages.missing.length} (${(results.menuPages.missing.length / results.menuPages.total * 100).toFixed(1)}%)`);
console.log(`错误数: ${results.errors.length}`);
console.log('');

// 6. 总结
console.log('='.repeat(80));
console.log('验证总结');
console.log('='.repeat(80));

if (results.errors.length === 0 && results.menuPages.missing.length === 0) {
    console.log('✓ 所有验证通过！');
    console.log('  - 所有应用配置正确');
    console.log('  - 所有菜单函数存在');
    console.log('  - 所有菜单页面都存在');
} else {
    console.log('✗ 发现以下问题:');
    if (results.errors.length > 0) {
        console.log('  代码问题:');
        results.errors.forEach(err => console.log(`    - ${err}`));
    }
    if (results.menuPages.missing.length > 0) {
        console.log(`  缺失页面: ${results.menuPages.missing.length} 个`);
    }
}

console.log('='.repeat(80));

// 导出结果供其他脚本使用
module.exports = results;
