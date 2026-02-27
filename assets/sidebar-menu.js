/**
 * 应用侧边栏菜单模块
 * 负责：采购协同、供应链协同、设备管理协同、能源管理协同 四个应用的左侧菜单
 * 设计协同的菜单在 main.html 中静态定义，本模块通过 bindExpandCollapse 统一处理展开/折叠
 */
(function() {
    'use strict';

    var CONTAINER_SELECTOR = '.sidebar-menu';

    // 四个应用的菜单配置：{ icon, text, submenuId, items: [{ href, text }] }
    var MENU_CONFIGS = {
        'procurement-menu': [
            { icon: '🏠', text: '工作台', submenuId: 'submenu-home', items: [
                { href: 'pages/procurement-dashboard.html', text: '采购概览' },
                { href: 'pages/procurement-todo.html', text: '待办事项' }
            ]},
            { icon: '📋', text: '采购管理', submenuId: 'submenu-demand', items: [
                { href: 'pages/procurement-demand-list.html', text: '需求申请' },
                { href: 'pages/procurement-plan-list.html', text: '采购计划' },
                { href: 'pages/procurement-quote-list.html', text: '询价单' }
            ]},
            { icon: '📄', text: '合同订单', submenuId: 'submenu-contract', items: [
                { href: 'pages/procurement-contract-list.html', text: '采购合同' }
            ]},
            { icon: '🛒', text: '采购执行', submenuId: 'submenu-execution', items: [
                { href: 'pages/procurement-order-list.html', text: '采购订单' },
                { href: 'pages/procurement-receipt-list.html', text: '到货单' },
                { href: 'pages/procurement-unqualified-handle-list.html', text: '不合格处理单' },
                { href: 'pages/procurement-return-list.html', text: '退货单' },
                { href: 'pages/procurement-exchange-list.html', text: '换货单' },
                { href: 'pages/procurement-concession-list.html', text: '让步接收单' }
            ]},
            { icon: '💰', text: '财务结算', submenuId: 'submenu-finance', items: [
                { href: 'pages/procurement-settlement-new.html', text: '结算管理台' }
            ]},
            { icon: '⭐', text: '供应商绩效', submenuId: 'submenu-performance', items: [
                { href: 'pages/procurement-supplier-evaluation.html', text: '供应商评估' },
                { href: 'pages/procurement-supplier-performance.html', text: '绩效统计' },
                { href: 'pages/procurement-supplier-ranking.html', text: '供应商排名' }
            ]},
            { icon: '🔗', text: '系统协同', submenuId: 'submenu-collab', items: [
                { href: 'pages/procurement-sync-erp.html', text: 'ERP 集成' },
                { href: 'pages/procurement-sync-wms.html', text: 'WMS 集成' },
                { href: 'pages/procurement-sync-log.html', text: '同步日志' }
            ]},
            { icon: '⚠️', text: '预警与应急', submenuId: 'submenu-alert', items: [
                { href: 'pages/procurement-alert-list.html', text: '预警列表' },
                { href: 'pages/procurement-emergency.html', text: '应急处理' }
            ]},
            { icon: '📊', text: '报表统计', submenuId: 'submenu-report-stat', items: [
                { href: 'pages/procurement-stat-purchase.html', text: '采购统计' },
                { href: 'pages/procurement-stat-supplier.html', text: '供应商统计' },
                { href: 'pages/procurement-stat-cost.html', text: '成本统计' }
            ]},
            { icon: '⚙️', text: '系统配置', submenuId: 'submenu-config', items: [
                { href: 'pages/procurement-supplier-performance-config.html', text: '绩效配置' },
                { href: 'pages/procurement-supplier-info.html', text: '供应商档案' },
                { href: 'pages/procurement-material-info.html', text: '物料档案' },
                { href: 'pages/procurement-contract-template.html', text: '合同模板' },
                { href: 'pages/procurement-config-workflow.html', text: '工作流配置' },
                { href: 'pages/procurement-config-dictionary.html', text: '数据字典' },
                { href: 'pages/procurement-config-permission.html', text: '权限配置' },
                { href: 'pages/procurement-operation-log.html', text: '操作日志' }
            ]}
        ],
        'supply-chain-menu': [
            { icon: '🏠', text: '工作台', submenuId: 'submenu-home', items: [
                { href: 'pages/supply-chain-dashboard.html', text: '供应链概览' },
                { href: 'pages/supply-chain-todo.html', text: '待办事项' }
            ]},
            { icon: '📁', text: '基础数据', submenuId: 'submenu-base', items: [
                { href: 'pages/supply-chain-supplier-info.html', text: '客户档案' },
                { href: 'pages/supply-chain-supplier-archive.html', text: '供应商档案' },
                { href: 'pages/supply-chain-material-info.html', text: '物料档案' }
            ]},
            { icon: '📋', text: '需求报价', submenuId: 'submenu-demand', items: [
                { href: 'pages/supply-chain-demand-collaboration.html', text: '需求报价' }
            ]},
            { icon: '🛒', text: '订单协同', submenuId: 'submenu-order', items: [
                { href: 'pages/supply-chain-order-list.html', text: '订单管理' }
            ]},
            { icon: '📄', text: '合同协同', submenuId: 'submenu-contract', items: [
                { href: 'pages/supply-chain-contract-list.html', text: '合同管理' }
            ]},
            { icon: '⚠️', text: '异常处理', submenuId: 'submenu-exception', items: [
                { href: 'pages/supply-chain-return-order-list.html', text: '退货单' },
                { href: 'pages/supply-chain-exchange-order-list.html', text: '换货单' },
                { href: 'pages/supply-chain-concession-order-list.html', text: '让步接收单' }
            ]},
            { icon: '💰', text: '结算协同', submenuId: 'submenu-settlement', items: [
                { href: 'pages/supply-chain-settlement-new.html', text: '结算工作台' }
            ]},
            { icon: '📊', text: '监控与分析', submenuId: 'submenu-monitor', items: [
                { href: 'pages/supply-chain-monitor-dashboard.html', text: '监控大屏' },
                { href: 'pages/supply-chain-analysis.html', text: '数据分析' },
                { href: 'pages/supply-chain-trend.html', text: '趋势分析' }
            ]},
            { icon: '⭐', text: '供应商绩效协同', submenuId: 'submenu-performance', items: [
                { href: 'pages/supply-chain-supplier-evaluation.html', text: '供应商评估' },
                { href: 'pages/supply-chain-supplier-performance.html', text: '绩效统计' },
                { href: 'pages/supply-chain-supplier-improvement.html', text: '改进跟踪' }
            ]},
            { icon: '📑', text: '报表管理', submenuId: 'submenu-report', items: [
                { href: 'pages/supply-chain-report-dashboard.html', text: '报表中心' },
                { href: 'pages/supply-chain-report-order.html', text: '订单报表' },
                { href: 'pages/supply-chain-report-inventory.html', text: '库存报表' },
                { href: 'pages/supply-chain-report-supplier.html', text: '供应商报表' }
            ]},
            { icon: '⚙️', text: '系统配置', submenuId: 'submenu-config', items: [
                { href: 'pages/supply-chain-config-workflow.html', text: '工作流配置' },
                { href: 'pages/supply-chain-config-dictionary.html', text: '数据字典' },
                { href: 'pages/supply-chain-config-permission.html', text: '权限配置' },
                { href: 'pages/supply-chain-operation-log.html', text: '操作日志' }
            ]}
        ],
        'equipment-menu': [
            { icon: '🏠', text: '工作台', submenuId: 'submenu-home', items: [
                { href: 'pages/equipment-dashboard.html', text: '设备概览' },
                { href: 'pages/equipment-todo.html', text: '待办事项' }
            ]},
            { icon: '📁', text: '设备台账', submenuId: 'submenu-ledger', items: [
                { href: 'pages/equipment-list.html', text: '设备档案' },
                { href: 'pages/equipment-category.html', text: '用途分类' },
                { href: 'pages/equipment-transfer.html', text: '调拨管理' }
            ]},
            { icon: '📊', text: '运行监控', submenuId: 'submenu-monitor', items: [
                { href: 'pages/equipment-monitor-realtime.html', text: '实时监控' },
                { href: 'pages/equipment-monitor-data.html', text: '运行数据' },
                { href: 'pages/equipment-monitor-oee.html', text: 'OEE监控' },
                { href: 'pages/equipment-monitor-threshold.html', text: '阈值配置' },
                { href: 'pages/equipment-monitor-diagnosis.html', text: '智能诊断' }
            ]},
            { icon: '🔧', text: '维护管理', submenuId: 'submenu-maintenance', items: [
                { href: 'pages/equipment-maintenance-plan.html', text: '维护计划' },
                { href: 'pages/equipment-inspection.html', text: '巡检管理' },
                { href: 'pages/equipment-maintenance.html', text: '保养管理' },
                { href: 'pages/equipment-repair.html', text: '维修管理' },
                { href: 'pages/equipment-maintenance-resource.html', text: '资源调度' },
                { href: 'pages/equipment-maintenance-record.html', text: '维护记录' },
                { href: 'pages/equipment-maintenance-statistics.html', text: '效率统计' }
            ]},
            { icon: '⚠️', text: '告警管理', submenuId: 'submenu-alert', items: [
                { href: 'pages/equipment-alert-list.html', text: '告警列表' },
                { href: 'pages/equipment-alert-handle.html', text: '告警处理' },
                { href: 'pages/equipment-alert-statistics.html', text: '告警统计' },
                { href: 'pages/equipment-alert-shield.html', text: '告警屏蔽' },
                { href: 'pages/equipment-alert-linkage.html', text: '告警联动' }
            ]},
            { icon: '📝', text: '故障管理', submenuId: 'submenu-fault', items: [
                { href: 'pages/equipment-fault-report.html', text: '故障上报' },
                { href: 'pages/equipment-fault-review.html', text: '上报审核' },
                { href: 'pages/equipment-fault-track.html', text: '进度跟踪' },
                { href: 'pages/equipment-fault-statistics.html', text: '上报统计' },
                { href: 'pages/equipment-fault-satisfaction.html', text: '满意度评价' }
            ]},
            { icon: '⚙️', text: '系统配置', submenuId: 'submenu-config', items: [
                { href: 'pages/config-dictionary.html', text: '数据字典' },
                { href: 'pages/config-workflow.html', text: '工作流配置' },
                { href: 'pages/role-permission.html', text: '权限配置' },
                { href: 'pages/operation-log.html', text: '操作日志' }
            ]}
        ],
        'energy-menu': [
            { icon: '🏠', text: '工作台', submenuId: 'submenu-home', items: [
                { href: 'pages/energy-dashboard.html', text: '能源驾驶舱' },
                { href: 'pages/energy-todo.html', text: '待办事项' }
            ]},
            { icon: '📥', text: '数据接收与整合', submenuId: 'submenu-data', items: [
                { href: 'pages/energy-data-interface.html', text: '接口配置' },
                { href: 'pages/energy-data-sync.html', text: '数据同步' },
                { href: 'pages/energy-data-log.html', text: '同步日志' },
                { href: 'pages/energy-data-quality.html', text: '数据质量' }
            ]},
            { icon: '⚡', text: '能源在线监测', submenuId: 'submenu-monitor', items: [
                { href: 'pages/energy-monitor-realtime.html', text: '实时监测' },
                { href: 'pages/energy-monitor-ecc.html', text: 'ECC层级监测' },
                { href: 'pages/energy-monitor-flow.html', text: '能流图' },
                { href: 'pages/energy-monitor-alert.html', text: '异常预警' }
            ]},
            { icon: '📊', text: '能源统计分析', submenuId: 'submenu-statistics', items: [
                { href: 'pages/energy-statistics-period.html', text: '多周期统计' },
                { href: 'pages/energy-statistics-compare.html', text: '对比分析' },
                { href: 'pages/energy-statistics-correlation.html', text: '关联分析' },
                { href: 'pages/energy-statistics-ledger.html', text: '统计台账' }
            ]},
            { icon: '💡', text: '能效优化分析', submenuId: 'submenu-optimization', items: [
                { href: 'pages/energy-efficiency-indicator.html', text: '能效指标' },
                { href: 'pages/energy-efficiency-benchmark.html', text: '能效对标' },
                { href: 'pages/energy-optimization-suggestion.html', text: '优化建议' },
                { href: 'pages/energy-optimization-strategy.html', text: '优化策略库' }
            ]},
            { icon: '📋', text: '能源计划与单耗管理', submenuId: 'submenu-plan', items: [
                { href: 'pages/energy-plan-list.html', text: '能源计划' },
                { href: 'pages/energy-plan-track.html', text: '计划跟踪' },
                { href: 'pages/energy-unit-consumption.html', text: '产品单耗' },
                { href: 'pages/energy-ecc-management.html', text: 'ECC层级管理' }
            ]},
            { icon: '⚠️', text: '告警协同管理', submenuId: 'submenu-alert', items: [
                { href: 'pages/energy-alert-list.html', text: '告警列表' },
                { href: 'pages/energy-alert-handle.html', text: '告警处理' },
                { href: 'pages/energy-alert-statistics.html', text: '告警统计' }
            ]},
            { icon: '💰', text: '能源预算管理', submenuId: 'submenu-budget', items: [
                { href: 'pages/energy-budget-list.html', text: '预算编制' },
                { href: 'pages/energy-budget-monitor.html', text: '预算监控' },
                { href: 'pages/energy-budget-cost.html', text: '成本分析' },
                { href: 'pages/energy-capacity-optimization.html', text: '容需量优化' }
            ]},
            { icon: '🌱', text: '碳排放管理', submenuId: 'submenu-carbon', items: [
                { href: 'pages/energy-carbon-accounting.html', text: '碳排放核算' },
                { href: 'pages/energy-carbon-monitor.html', text: '碳排放监测' },
                { href: 'pages/energy-carbon-quota.html', text: '碳配额管理' },
                { href: 'pages/energy-carbon-footprint.html', text: '碳足迹' }
            ]},
            { icon: '📈', text: '能源数据对标分析', submenuId: 'submenu-benchmark', items: [
                { href: 'pages/energy-benchmark-internal.html', text: '内部对标' },
                { href: 'pages/energy-benchmark-external.html', text: '外部对标' },
                { href: 'pages/energy-benchmark-gap.html', text: '差距分析' },
                { href: 'pages/energy-benchmark-potential.html', text: '节能潜力' }
            ]},
            { icon: '🎨', text: '3D组态可视化', submenuId: 'submenu-3d', items: [
                { href: 'pages/energy-3d-scene.html', text: '3D场景' },
                { href: 'pages/energy-3d-monitor.html', text: '3D监控' },
                { href: 'pages/energy-3d-config.html', text: '组态配置' }
            ]},
            { icon: '📑', text: '报表管理', submenuId: 'submenu-report', items: [
                { href: 'pages/energy-report-dashboard.html', text: '报表中心' },
                { href: 'pages/energy-report-custom.html', text: '自定义报表' },
                { href: 'pages/energy-report-push.html', text: '报表推送' }
            ]},
            { icon: '⚙️', text: '系统配置', submenuId: 'submenu-config', items: [
                { href: 'pages/energy-config-dictionary.html', text: '数据字典' },
                { href: 'pages/energy-config-workflow.html', text: '工作流引擎' },
                { href: 'pages/energy-config-permission.html', text: '权限配置' },
                { href: 'pages/energy-operation-log.html', text: '操作审计日志' }
            ]}
        ]
    };

    function buildSection(section, isHome) {
        var openClass = isHome ? ' open' : '';
        var expandedClass = isHome ? ' expanded' : '';
        var itemsHtml = section.items.map(function(item) {
            return '<a href="' + item.href + '" class="submenu-item">' + item.text + '</a>';
        }).join('');
        return '<div class="menu-section">' +
            '<div class="menu-item menu-item-parent' + expandedClass + '">' +
                '<span class="menu-icon">' + section.icon + '</span>' +
                '<span class="menu-text">' + section.text + '</span>' +
                '<span class="menu-arrow">▶</span>' +
            '</div>' +
            '<div class="submenu' + openClass + '" id="' + section.submenuId + '">' + itemsHtml + '</div>' +
        '</div>';
    }

    function renderFromConfig(menuType) {
        var config = MENU_CONFIGS[menuType];
        if (!config) return '';
        var html = '';
        config.forEach(function(section, i) {
            html += buildSection(section, section.submenuId === 'submenu-home');
        });
        return html;
    }

    function expandSubmenu(submenu, parent) {
        if (!submenu || !parent) return;
        submenu.style.cssText = 'display:block;max-height:1200px;opacity:1;visibility:visible;';
        submenu.classList.add('open');
        parent.classList.add('expanded');
    }

    function collapseSubmenu(submenu, parent) {
        if (!submenu || !parent) return;
        submenu.style.cssText = '';
        submenu.classList.remove('open');
        parent.classList.remove('expanded');
    }

    function getSubmenuForParent(parent) {
        var submenu = parent.nextElementSibling;
        if (submenu && submenu.classList.contains('submenu')) return submenu;
        var sec = parent.closest('.menu-section');
        return sec ? sec.querySelector('.submenu') : null;
    }

    var _bound = false;

    /**
     * 渲染指定应用的菜单并执行默认展开（仅切换应用时调用）
     */
    function render(menuType) {
        var container = document.querySelector(CONTAINER_SELECTOR);
        if (!container) return false;
        var html = renderFromConfig(menuType);
        if (!html) return false;
        container.innerHTML = html;
        expandDefault();
        return true;
    }

    /**
     * 默认展开「工作台」
     */
    function expandDefault() {
        var home = document.querySelector('#submenu-home');
        var parent = home ? home.previousElementSibling : null;
        if (home && parent && parent.classList.contains('menu-item-parent')) {
            expandSubmenu(home, parent);
        }
    }

    /**
     * 根据当前页面 URL 设置活动项并展开其父菜单（页面加载时由 page-loader 调用）
     */
    function setActiveForPage(url) {
        var urlPath = (url || '').split('?')[0];
        if (urlPath.indexOf('/') >= 0) urlPath = urlPath.split('/').pop();

        var container = document.querySelector(CONTAINER_SELECTOR);
        if (!container) return;

        var links = container.querySelectorAll('a.submenu-item[href]');
        links.forEach(function(link) {
            link.classList.remove('active');
            var href = (link.getAttribute('href') || '').split('?')[0];
            if (href.indexOf('/') >= 0) href = href.split('/').pop();
            if (href === urlPath) {
                link.classList.add('active');
                var submenu = link.closest('.submenu');
                var parent = submenu ? submenu.previousElementSibling : null;
                if (submenu && parent) expandSubmenu(submenu, parent);
            }
        });

        var activeLink = container.querySelector('a.submenu-item.active');
        if (!activeLink) {
            var home = document.querySelector('#submenu-home');
            var homeParent = home ? home.previousElementSibling : null;
            if (home && homeParent) expandSubmenu(home, homeParent);
        }
    }

    /**
     * 绑定展开/折叠（仅响应一级菜单点击，点击二级链接不处理）
     */
    function bindExpandCollapse() {
        var container = document.querySelector(CONTAINER_SELECTOR);
        if (!container || _bound) return;
        _bound = true;

        container.addEventListener('click', function(e) {
            if (e.target.closest('a.submenu-item')) return;
            var parent = e.target.closest('.menu-item-parent');
            if (!parent) return;
            e.preventDefault();
            e.stopPropagation();

            var submenu = getSubmenuForParent(parent);
            if (!submenu) return;

            if (submenu.classList.contains('open')) {
                collapseSubmenu(submenu, parent);
            } else {
                expandSubmenu(submenu, parent);
            }
        });
    }

    window.AppSidebarMenu = {
        render: render,
        setActiveForPage: setActiveForPage,
        bindExpandCollapse: bindExpandCollapse,
        expandDefault: expandDefault,
        MENU_TYPES: Object.keys(MENU_CONFIGS)
    };
})();
