/**
 * 找出所有缺失的页面
 */

const fs = require('fs');
const path = require('path');

// 从菜单函数中提取的所有页面
const allRequiredPages = [
    // 设计协同系统
    'pages/my-initiated.html', 'pages/design-task-review.html', 'pages/notification-center.html',
    'pages/tech-task-list.html', 'pages/design-task-list.html',
    'pages/ebom-list.html', 'pages/mbom-list.html', 'pages/sbom-list.html',
    'pages/change-review-list.html', 'pages/change-request-list.html', 'pages/emergency-change-list.html',
    'pages/sync-erp.html', 'pages/sync-mes.html', 'pages/sync-wms.html', 'pages/sync-log.html',
    'pages/material-list.html', 'pages/product-structure.html', 'pages/organization-list.html',
    'pages/user-list.html', 'pages/role-permission.html',
    'pages/kpi-dashboard.html', 'pages/performance-stats.html', 'pages/improvement-plan.html',
    'pages/alert-list.html', 'pages/alert-rule-config.html', 'pages/alert-handle.html',
    'pages/report-dashboard.html', 'pages/report-bom-stats.html', 'pages/report-change-stats.html',
    'pages/report-custom.html',
    'pages/config-coding-rule.html', 'pages/config-workflow.html', 'pages/config-dictionary.html',
    'pages/config-kpi-indicator.html', 'pages/operation-log.html', 'pages/system-setting.html',
    
    // 采购协同系统
    'pages/procurement-dashboard.html', 'pages/procurement-todo.html',
    'pages/procurement-supplier-info.html', 'pages/procurement-material-info.html',
    'pages/procurement-demand-list.html', 'pages/procurement-plan-list.html',
    'pages/procurement-order-list.html', 'pages/procurement-quote-list.html',
    'pages/procurement-receipt-list.html', 'pages/procurement-return-list.html',
    'pages/procurement-contract-list.html', 'pages/procurement-contract-template.html',
    'pages/procurement-invoice-list.html', 'pages/procurement-payment-list.html', 'pages/procurement-settlement.html',
    'pages/procurement-supplier-evaluation.html', 'pages/procurement-supplier-performance.html', 'pages/procurement-supplier-ranking.html',
    'pages/procurement-sync-erp.html', 'pages/procurement-sync-wms.html', 'pages/procurement-sync-log.html',
    'pages/procurement-alert-list.html', 'pages/procurement-emergency.html',
    'pages/procurement-stat-purchase.html', 'pages/procurement-stat-supplier.html', 'pages/procurement-stat-cost.html',
    'pages/procurement-config-workflow.html', 'pages/procurement-config-dictionary.html',
    'pages/procurement-config-permission.html', 'pages/procurement-operation-log.html',
    
    // 供应链协同
    'pages/supply-chain-dashboard.html', 'pages/supply-chain-todo.html',
    'pages/supply-chain-supplier-info.html', 'pages/supply-chain-supplier-archive.html', 'pages/supply-chain-material-info.html',
    'pages/supply-chain-demand-list.html', 'pages/supply-chain-demand-plan.html',
    'pages/supply-chain-demand-forecast.html', 'pages/supply-chain-demand-collaboration.html',
    'pages/supply-chain-contract-list.html', 'pages/supply-chain-contract-execution.html', 'pages/supply-chain-contract-review.html',
    'pages/supply-chain-order-list.html', 'pages/supply-chain-order-execution.html',
    'pages/supply-chain-order-tracking.html', 'pages/supply-chain-order-delivery.html',
    'pages/supply-chain-return-order-list.html', 'pages/supply-chain-exchange-order-list.html', 'pages/supply-chain-concession-order-list.html',
    'pages/supply-chain-settlement-list.html', 'pages/supply-chain-invoice-list.html', 'pages/supply-chain-payment-list.html',
    'pages/supply-chain-monitor-dashboard.html', 'pages/supply-chain-analysis.html', 'pages/supply-chain-trend.html',
    'pages/supply-chain-supplier-evaluation.html', 'pages/supply-chain-supplier-performance.html', 'pages/supply-chain-supplier-improvement.html',
    'pages/supply-chain-report-dashboard.html', 'pages/supply-chain-report-order.html',
    'pages/supply-chain-report-inventory.html', 'pages/supply-chain-report-supplier.html',
    'pages/supply-chain-config-workflow.html', 'pages/supply-chain-config-dictionary.html',
    'pages/supply-chain-config-permission.html', 'pages/supply-chain-operation-log.html',
    
    // 设备管理协同
    'pages/equipment-dashboard.html', 'pages/equipment-todo.html',
    'pages/equipment-list.html', 'pages/equipment-info.html', 'pages/equipment-lifecycle.html',
    'pages/equipment-transfer.html', 'pages/equipment-archive.html',
    'pages/equipment-monitor-realtime.html', 'pages/equipment-monitor-data.html',
    'pages/equipment-monitor-oee.html', 'pages/equipment-monitor-threshold.html',
    'pages/equipment-monitor-diagnosis.html', 'pages/equipment-monitor-3d.html',
    'pages/equipment-maintenance-plan.html', 'pages/equipment-inspection.html',
    'pages/equipment-maintenance.html', 'pages/equipment-repair.html',
    'pages/equipment-maintenance-resource.html', 'pages/equipment-maintenance-record.html',
    'pages/equipment-maintenance-statistics.html',
    'pages/equipment-alert-list.html', 'pages/equipment-alert-handle.html',
    'pages/equipment-alert-statistics.html', 'pages/equipment-alert-shield.html', 'pages/equipment-alert-linkage.html',
    'pages/equipment-health-assessment.html', 'pages/equipment-predictive-maintenance.html',
    'pages/equipment-oee-analysis.html', 'pages/equipment-maintenance-efficiency.html',
    'pages/equipment-energy-analysis.html', 'pages/equipment-decision-report.html', 'pages/equipment-suggestion-track.html',
    'pages/equipment-fault-report.html', 'pages/equipment-fault-review.html',
    'pages/equipment-fault-track.html', 'pages/equipment-fault-statistics.html', 'pages/equipment-fault-satisfaction.html',
    'pages/equipment-rca-task.html', 'pages/equipment-rca-case.html',
    'pages/equipment-rca-knowledge.html', 'pages/equipment-rca-recommend.html',
    'pages/equipment-config-item.html', 'pages/equipment-config-version.html',
    'pages/equipment-config-approval.html', 'pages/equipment-config-push.html',
    'pages/equipment-system-performance.html', 'pages/equipment-system-business.html',
    'pages/equipment-system-log.html', 'pages/equipment-system-security.html',
    
    // 能源管理协同
    'pages/energy-dashboard.html', 'pages/energy-todo.html',
    'pages/energy-data-interface.html', 'pages/energy-data-sync.html',
    'pages/energy-data-log.html', 'pages/energy-data-quality.html',
    'pages/energy-monitor-realtime.html', 'pages/energy-monitor-ecc.html',
    'pages/energy-monitor-flow.html', 'pages/energy-monitor-alert.html',
    'pages/energy-statistics-period.html', 'pages/energy-statistics-compare.html',
    'pages/energy-statistics-correlation.html', 'pages/energy-statistics-ledger.html',
    'pages/energy-efficiency-indicator.html', 'pages/energy-efficiency-benchmark.html',
    'pages/energy-optimization-suggestion.html', 'pages/energy-optimization-strategy.html',
    'pages/energy-plan-list.html', 'pages/energy-plan-track.html',
    'pages/energy-unit-consumption.html', 'pages/energy-ecc-management.html',
    'pages/energy-alert-list.html', 'pages/energy-alert-handle.html', 'pages/energy-alert-statistics.html',
    'pages/energy-budget-list.html', 'pages/energy-budget-monitor.html',
    'pages/energy-budget-cost.html', 'pages/energy-capacity-optimization.html',
    'pages/energy-carbon-accounting.html', 'pages/energy-carbon-monitor.html',
    'pages/energy-carbon-quota.html', 'pages/energy-carbon-footprint.html',
    'pages/energy-benchmark-internal.html', 'pages/energy-benchmark-external.html',
    'pages/energy-benchmark-gap.html', 'pages/energy-benchmark-potential.html',
    'pages/energy-3d-scene.html', 'pages/energy-3d-monitor.html', 'pages/energy-3d-config.html',
    'pages/energy-report-dashboard.html', 'pages/energy-report-custom.html', 'pages/energy-report-push.html',
    'pages/energy-config-dictionary.html', 'pages/energy-config-workflow.html',
    'pages/energy-config-permission.html', 'pages/energy-operation-log.html'
];

// 检查现有文件
const pagesDir = path.join(__dirname, 'pages');
const existingFiles = fs.existsSync(pagesDir) 
    ? fs.readdirSync(pagesDir).map(f => `pages/${f}`)
    : [];

// 找出缺失的页面
const missingPages = allRequiredPages.filter(page => !existingFiles.includes(page));

console.log(`总页面数: ${allRequiredPages.length}`);
console.log(`已存在: ${existingFiles.length}`);
console.log(`缺失: ${missingPages.length}\n`);

// 按优先级分类
const priorityPages = {
    high: [], // 最常用：待办、基础信息、主要列表
    medium: [], // 常用：执行、监控、报表
    low: [] // 其他：配置、分析、高级功能
};

missingPages.forEach(page => {
    if (page.includes('todo') || page.includes('dashboard') || 
        page.includes('supplier-info') || page.includes('material-info') || 
        page.includes('organization') || page.includes('list') ||
        page.includes('order-list') || page.includes('plan-list') ||
        page.includes('contract-list') || page.includes('alert-list')) {
        priorityPages.high.push(page);
    } else if (page.includes('execution') || page.includes('monitor') || 
               page.includes('report') || page.includes('track') ||
               page.includes('handle') || page.includes('statistics')) {
        priorityPages.medium.push(page);
    } else {
        priorityPages.low.push(page);
    }
});

console.log('优先级分类:');
console.log(`高优先级（最常用）: ${priorityPages.high.length} 个`);
console.log(`中优先级（常用）: ${priorityPages.medium.length} 个`);
console.log(`低优先级（其他）: ${priorityPages.low.length} 个\n`);

console.log('高优先级页面（建议优先创建）:');
priorityPages.high.forEach(page => console.log(`  - ${page}`));

// 保存到文件
fs.writeFileSync(
    path.join(__dirname, 'missing-pages-priority.json'),
    JSON.stringify(priorityPages, null, 2),
    'utf-8'
);

console.log('\n✅ 优先级分类已保存到 missing-pages-priority.json');
