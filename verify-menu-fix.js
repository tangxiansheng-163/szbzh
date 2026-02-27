/**
 * 菜单功能验证脚本
 * 检查CSS和JS修复是否正确
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证菜单修复...\n');

const cssPath = path.join(__dirname, 'assets', 'system.css');
const jsPath = path.join(__dirname, 'assets', 'page-interactions.js');

let hasErrors = false;

// 1. 检查CSS文件
console.log('1. 检查CSS文件...');
if (!fs.existsSync(cssPath)) {
    console.error('❌ CSS文件不存在:', cssPath);
    hasErrors = true;
} else {
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // 检查.submenu.open样式
    if (cssContent.includes('.submenu.open') && 
        cssContent.includes('max-height: 1200px !important') &&
        cssContent.includes('opacity: 1 !important') &&
        cssContent.includes('visibility: visible !important') &&
        cssContent.includes('display: block !important')) {
        console.log('✅ .submenu.open样式正确');
    } else {
        console.error('❌ .submenu.open样式不完整');
        hasErrors = true;
    }
    
    // 检查.submenu基础样式
    if (cssContent.includes('.submenu {') && 
        cssContent.includes('max-height: 0') &&
        cssContent.includes('opacity: 0') &&
        cssContent.includes('visibility: hidden')) {
        console.log('✅ .submenu基础样式正确');
    } else {
        console.error('❌ .submenu基础样式不完整');
        hasErrors = true;
    }
    
    // 检查响应式样式
    const mediaQueryMatch = cssContent.match(/@media[^{]*\{[\s\S]*?\.submenu\.open[\s\S]*?display:\s*block\s*!important/);
    if (mediaQueryMatch) {
        console.log('✅ 响应式样式正确');
    } else {
        console.warn('⚠️  响应式样式可能不完整');
    }
}

// 2. 检查JS文件
console.log('\n2. 检查JS文件...');
if (!fs.existsSync(jsPath)) {
    console.error('❌ JS文件不存在:', jsPath);
    hasErrors = true;
} else {
    const jsContent = fs.readFileSync(jsPath, 'utf-8');
    
    // 检查内联样式设置
    if (jsContent.includes('submenu.style.maxHeight = \'1200px\'') &&
        jsContent.includes('submenu.style.opacity = \'1\'') &&
        jsContent.includes('submenu.style.visibility = \'visible\'') &&
        jsContent.includes('submenu.style.display = \'block\'')) {
        console.log('✅ 内联样式设置代码存在');
    } else {
        console.error('❌ 内联样式设置代码不完整');
        hasErrors = true;
    }
    
    // 检查强制重排
    if (jsContent.includes('submenu.offsetHeight')) {
        console.log('✅ 强制重排代码存在');
    } else {
        console.warn('⚠️  强制重排代码可能缺失');
    }
    
    // 检查延迟检查逻辑
    if (jsContent.includes('setTimeout') && jsContent.includes('computedStyle.maxHeight')) {
        console.log('✅ 延迟检查逻辑存在');
    } else {
        console.warn('⚠️  延迟检查逻辑可能缺失');
    }
    
    // 检查折叠时清除内联样式
    if (jsContent.includes('submenu.style.maxHeight = \'\'') &&
        jsContent.includes('submenu.style.opacity = \'\'') &&
        jsContent.includes('submenu.style.visibility = \'\'')) {
        console.log('✅ 折叠时清除内联样式代码存在');
    } else {
        console.warn('⚠️  折叠时清除内联样式代码可能缺失');
    }
}

// 3. 检查HTML文件
console.log('\n3. 检查HTML文件...');
const htmlPath = path.join(__dirname, 'main.html');
if (fs.existsSync(htmlPath)) {
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    
    // 检查是否有默认展开的工作台菜单
    if (htmlContent.includes('id="submenu-home"') && 
        htmlContent.includes('class="submenu open"')) {
        console.log('✅ 默认展开的工作台菜单配置正确');
    } else {
        console.warn('⚠️  默认展开的工作台菜单可能未配置');
    }
} else {
    console.warn('⚠️  main.html文件不存在');
}

// 总结
console.log('\n' + '='.repeat(50));
if (hasErrors) {
    console.error('❌ 验证失败: 发现错误，请检查上述问题');
    process.exit(1);
} else {
    console.log('✅ 验证通过: 所有关键修复都已正确应用');
    console.log('\n📝 建议:');
    console.log('   1. 在浏览器中打开 http://localhost:8080/main.html');
    console.log('   2. 打开开发者工具控制台');
    console.log('   3. 点击"基础信息管理"菜单项');
    console.log('   4. 检查二级菜单是否正常显示');
    console.log('   5. 查看控制台日志确认max-height值');
    process.exit(0);
}
