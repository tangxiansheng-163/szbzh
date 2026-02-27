/**
 * 批量生成缺失页面的工具
 */

const fs = require('fs');
const path = require('path');

// 页面模板生成函数
function generateListPage(config) {
    const {
        title,
        appName,
        breadcrumb,
        description,
        filterFields = [],
        tableColumns = [],
        sampleData = [],
        createButtonText = '+ 新建',
        createModalId = 'create-modal',
        createPageUrl = null
    } = config;

    const filterHtml = filterFields.map(field => {
        if (field.type === 'text') {
            return `
                <div class="filter-item">
                    <label>${field.label}</label>
                    <input type="text" class="form-input" placeholder="${field.placeholder || ''}">
                </div>`;
        } else if (field.type === 'select') {
            const options = field.options.map(opt => 
                `<option value="${opt.value}">${opt.label}</option>`
            ).join('');
            return `
                <div class="filter-item">
                    <label>${field.label}</label>
                    <select class="form-select">
                        <option value="">全部</option>
                        ${options}
                    </select>
                </div>`;
        } else if (field.type === 'date') {
            return `
                <div class="filter-item">
                    <label>${field.label}</label>
                    <input type="date" class="form-input">
                </div>`;
        }
        return '';
    }).join('');

    const tableHeaderHtml = tableColumns.map(col => 
        `<th width="${col.width || 100}">${col.label}</th>`
    ).join('');

    const tableBodyHtml = sampleData.map(row => {
        const cells = tableColumns.map(col => {
            const value = row[col.key] || '';
            if (col.type === 'status') {
                const statusClass = value === '待审批' || value === '待确认' ? 'status-warning' :
                                  value === '处理中' || value === '执行中' ? 'status-processing' :
                                  value === '已完成' || value === '已生效' ? 'status-success' :
                                  value === '已取消' ? 'status-error' : 'status-default';
                return `<td><span class="status-badge ${statusClass}">${value}</span></td>`;
            }
            return `<td>${value}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    const createButtonHtml = createPageUrl ? 
        `<button class="btn btn-primary btn-create-modal"
                data-modal="${createModalId}"
                data-title="${createButtonText.replace('+ ', '')}"
                data-url="${createPageUrl}">
            ${createButtonText}
        </button>` :
        `<button class="btn btn-primary">${createButtonText}</button>`;

    const breadcrumbHtml = breadcrumb.map((item, index) => {
        if (index === breadcrumb.length - 1) {
            return `<span class="breadcrumb-item active">${item}</span>`;
        }
        return `<a href="${item.url || '#'}" class="breadcrumb-item">${item.text}</a>
                <span class="breadcrumb-separator">/</span>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${appName}</title>
</head>
<body>
    <div class="content-wrapper">
        <div class="breadcrumb">
            ${breadcrumbHtml}
        </div>

        <div class="page-header">
            <p class="page-description">${description}</p>
        </div>

        <div class="filter-bar">
            <div class="filter-row">
                ${filterHtml}
                <div class="filter-item" style="flex-direction: row; align-items: center;">
                    <button class="btn btn-primary">查询</button>
                    <button class="btn btn-default">重置</button>
                </div>
            </div>
        </div>

        <div class="action-bar">
            <div class="action-left">
                ${createButtonHtml}
                <button class="btn btn-default">导出</button>
            </div>
        </div>

        <div class="card">
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th width="40"><input type="checkbox" class="select-all-checkbox"></th>
                            ${tableHeaderHtml}
                            <th width="150">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableBodyHtml || '<tr><td colspan="' + (tableColumns.length + 2) + '" style="text-align: center; padding: 40px; color: #999;">暂无数据</td></tr>'}
                    </tbody>
                </table>
            </div>
            <div class="pagination">
                <span class="pagination-info">共 0 条记录</span>
                <div class="pagination-controls">
                    <button class="btn btn-sm btn-default" disabled>上一页</button>
                    <span class="pagination-page">第 1 页 / 共 1 页</span>
                    <button class="btn btn-sm btn-default" disabled>下一页</button>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// 页面配置
const pageConfigs = {
    // 采购协同系统
    'procurement-todo.html': {
        title: '待办事项',
        appName: '采购协同系统',
        breadcrumb: [
            { text: '工作台', url: 'pages/procurement-dashboard.html' },
            '待办事项'
        ],
        description: '查看和处理采购相关的待办事项，包括订单确认、合同执行等。',
        filterFields: [
            { type: 'text', label: '关键词', placeholder: '单据编号、标题' },
            { type: 'select', label: '事项类型', options: [
                { value: 'order-confirm', label: '订单确认' },
                { value: 'contract-execution', label: '合同执行' },
                { value: 'invoice-review', label: '发票审核' }
            ]},
            { type: 'select', label: '状态', options: [
                { value: 'pending', label: '待处理' },
                { value: 'processing', label: '处理中' },
                { value: 'completed', label: '已完成' }
            ]}
        ],
        tableColumns: [
            { label: '事项类型', key: 'type', width: 120 },
            { label: '标题', key: 'title', width: 200 },
            { label: '关联单据', key: 'related', width: 150 },
            { label: '状态', key: 'status', width: 100, type: 'status' },
            { label: '创建时间', key: 'createTime', width: 150 },
            { label: '截止时间', key: 'deadline', width: 150 }
        ],
        sampleData: [
            { type: '订单确认', title: 'PO-2025-001 电子元器件采购', related: 'PO-2025-001', status: '处理中', createTime: '2025-01-16', deadline: '2025-01-18' }
        ]
    },
    'procurement-material-info.html': {
        title: '物料档案',
        appName: '采购协同系统',
        breadcrumb: [
            { text: '工作台', url: 'pages/procurement-dashboard.html' },
            { text: '系统配置', url: '#' },
            '物料档案'
        ],
        description: '管理采购相关的物料档案，包括物料编码、名称、规格、供应商等。',
        filterFields: [
            { type: 'text', label: '关键词', placeholder: '物料编码、物料名称' },
            { type: 'select', label: '物料类型', options: [
                { value: 'raw', label: '原材料' },
                { value: 'semi', label: '半成品' },
                { value: 'finished', label: '成品' }
            ]}
        ],
        tableColumns: [
            { label: '物料编码', key: 'code', width: 120 },
            { label: '物料名称', key: 'name', width: 200 },
            { label: '规格型号', key: 'spec', width: 150 },
            { label: '物料类型', key: 'type', width: 100 },
            { label: '计量单位', key: 'unit', width: 100 },
            { label: '参考价格', key: 'price', width: 120 },
            { label: '主要供应商', key: 'supplier', width: 150 }
        ],
        sampleData: [
            { code: 'MAT-001', name: '电子元器件A', spec: '10KΩ', type: '原材料', unit: '个', price: '¥2.50', supplier: '深圳市电子科技' },
            { code: 'MAT-002', name: 'PCB板', spec: '100x80mm', type: '半成品', unit: '片', price: '¥15.00', supplier: '东莞电路板厂' }
        ]
    }
};

// 生成页面
const pagesDir = path.join(__dirname, 'pages');
if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
}

Object.keys(pageConfigs).forEach(filename => {
    const config = pageConfigs[filename];
    const html = generateListPage(config);
    const filePath = path.join(pagesDir, filename);
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`✅ 已创建: ${filename}`);
});

console.log(`\n✅ 共创建 ${Object.keys(pageConfigs).length} 个页面`);
