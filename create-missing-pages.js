/**
 * 批量创建缺失页面的脚本
 * 基于现有页面模板结构
 */

const fs = require('fs');
const path = require('path');

// 通用列表页面模板
function createListPageTemplate(config) {
    const {
        title,
        appName,
        breadcrumbPath,
        description,
        filters = [],
        columns = [],
        sampleRows = [],
        createButton = null
    } = config;

    const breadcrumbItems = breadcrumbPath.map((item, idx) => {
        if (idx === breadcrumbPath.length - 1) {
            return `<span class="breadcrumb-item active">${item.text}</span>`;
        }
        return `<a href="${item.url || '#'}" class="breadcrumb-item">${item.text}</a>
            <span class="breadcrumb-separator">/</span>`;
    }).join('');

    const filterHtml = filters.map(f => {
        if (f.type === 'text') {
            return `<div class="filter-item">
                <label>${f.label}</label>
                <input type="text" class="form-input" placeholder="${f.placeholder || ''}">
            </div>`;
        } else if (f.type === 'select') {
            const options = f.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
            return `<div class="filter-item">
                <label>${f.label}</label>
                <select class="form-select">
                    <option value="">全部</option>
                    ${options}
                </select>
            </div>`;
        } else if (f.type === 'date') {
            return `<div class="filter-item">
                <label>${f.label}</label>
                <input type="date" class="form-input">
            </div>`;
        }
        return '';
    }).join('');

    const tableHeader = columns.map(c => `<th width="${c.width || 100}">${c.label}</th>`).join('');
    
    const tableBody = sampleRows.length > 0 ? sampleRows.map(row => {
        const cells = columns.map(col => {
            const val = row[col.key] || '';
            if (col.type === 'status') {
                const statusClass = val.includes('待') ? 'status-warning' :
                                  val.includes('处理') || val.includes('执行') ? 'status-processing' :
                                  val.includes('完成') || val.includes('生效') ? 'status-success' :
                                  val.includes('取消') ? 'status-error' : 'status-default';
                return `<td><span class="status-badge ${statusClass}">${val}</span></td>`;
            }
            return `<td>${val}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    }).join('') : `<tr><td colspan="${columns.length + 2}" style="text-align: center; padding: 40px; color: #999;">暂无数据</td></tr>`;

    const createBtnHtml = createButton ? 
        `<button class="btn btn-primary btn-create-modal"
                data-modal="${createButton.modalId || 'create-modal'}"
                data-title="${createButton.title || '新建'}"
                data-url="${createButton.url || '#'}">
            + ${createButton.text || '新建'}
        </button>` : '';

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
            ${breadcrumbItems}
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
                ${createBtnHtml}
                <button class="btn btn-default">导出</button>
            </div>
        </div>

        <div class="card">
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th width="40"><input type="checkbox" class="select-all-checkbox"></th>
                            ${tableHeader}
                            <th width="150">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableBody}
                    </tbody>
                </table>
            </div>
            <div class="pagination">
                <span class="pagination-info">共 ${sampleRows.length} 条记录</span>
                <div class="pagination-controls">
                    <button class="btn btn-sm btn-default" disabled>上一页</button>
                    <span class="pagination-page">第 1 页 / 共 1 页</span>
                    <button class="btn btn-sm btn-default" disabled>下一页</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        console.log('${title} 页面已加载');
        if (typeof PageInteractions !== 'undefined') {
            PageInteractions.initButtons();
        }
    </script>
</body>
</html>`;
}

// 页面配置 - 采购协同系统
const procurementPages = {
    'procurement-todo.html': {
        title: '待办事项',
        appName: '采购协同系统',
        breadcrumbPath: [
            { text: '工作台', url: 'pages/procurement-dashboard.html' },
            { text: '待办事项' }
        ],
        description: '查看和处理采购相关的待办事项，包括订单确认、合同执行、发票审核等。',
        filters: [
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
        columns: [
            { label: '事项类型', key: 'type', width: 120 },
            { label: '标题', key: 'title', width: 200 },
            { label: '关联单据', key: 'related', width: 150 },
            { label: '状态', key: 'status', width: 100, type: 'status' },
            { label: '创建时间', key: 'createTime', width: 150 },
            { label: '截止时间', key: 'deadline', width: 150 }
        ],
        sampleRows: [
            { type: '订单确认', title: 'PO-2025-001 电子元器件采购', related: 'PO-2025-001', status: '处理中', createTime: '2025-01-16', deadline: '2025-01-18' }
        ]
    },
    'procurement-material-info.html': {
        title: '物料档案',
        appName: '采购协同系统',
        breadcrumbPath: [
            { text: '工作台', url: 'pages/procurement-dashboard.html' },
            { text: '系统配置', url: '#' },
            { text: '物料档案' }
        ],
        description: '管理采购相关的物料档案，包括物料编码、名称、规格、供应商、价格等。',
        filters: [
            { type: 'text', label: '关键词', placeholder: '物料编码、物料名称' },
            { type: 'select', label: '物料类型', options: [
                { value: 'raw', label: '原材料' },
                { value: 'semi', label: '半成品' },
                { value: 'finished', label: '成品' }
            ]}
        ],
        columns: [
            { label: '物料编码', key: 'code', width: 120 },
            { label: '物料名称', key: 'name', width: 200 },
            { label: '规格型号', key: 'spec', width: 150 },
            { label: '物料类型', key: 'type', width: 100 },
            { label: '计量单位', key: 'unit', width: 100 },
            { label: '参考价格', key: 'price', width: 120 },
            { label: '主要供应商', key: 'supplier', width: 150 }
        ],
        sampleRows: [
            { code: 'MAT-001', name: '电子元器件A', spec: '10KΩ', type: '原材料', unit: '个', price: '¥2.50', supplier: '深圳市电子科技' },
            { code: 'MAT-002', name: 'PCB板', spec: '100x80mm', type: '半成品', unit: '片', price: '¥15.00', supplier: '东莞电路板厂' }
        ],
        createButton: { text: '新建物料', modalId: 'material-create-modal', url: 'pages/procurement-material-create.html' }
    }
};

// 生成页面
const pagesDir = path.join(__dirname, 'pages');
if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
}

let created = 0;
Object.keys(procurementPages).forEach(filename => {
    const config = procurementPages[filename];
    const filePath = path.join(pagesDir, filename);
    
    // 检查文件是否已存在
    if (!fs.existsSync(filePath)) {
        const html = createListPageTemplate(config);
        fs.writeFileSync(filePath, html, 'utf-8');
        console.log(`✅ 已创建: ${filename}`);
        created++;
    } else {
        console.log(`⏭️  已存在: ${filename}`);
    }
});

console.log(`\n✅ 共创建 ${created} 个新页面`);
