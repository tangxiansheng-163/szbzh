/**
 * 页面交互处理模块
 * 提供统一的交互功能：按钮跳转、删除确认、表单提交、Modal弹窗等
 */

const PageInteractions = {
    // 性能优化：弹窗内容缓存（避免同一弹窗反复 fetch）
    __modalCache: new Map(),
    // 打开Modal弹窗
    openModal: function(modalId, title, contentUrl, onOpenCallback) {
        console.log('📂 打开Modal:', modalId, '标题:', title, 'URL:', contentUrl);

        const overlay = document.getElementById(modalId);
        if (!overlay) {
            console.error('Modal not found:', modalId);
            return;
        }

        function cleanupDynamicAssets(modalBody) {
            if (!modalBody) return;
            modalBody.querySelectorAll('style[data-modal-dynamic], script[data-modal-dynamic]').forEach(function (el) {
                try { el.remove(); } catch (e) {}
            });
        }

        function injectStyles(modalBody, doc) {
            if (!modalBody || !doc) return;
            // 复制页面内样式（主要在 head 里），保证弹窗展示一致
            var styles = doc.querySelectorAll('style');
            if (!styles || !styles.length) return;
            styles.forEach(function (styleEl) {
                try {
                    var s = document.createElement('style');
                    s.setAttribute('data-modal-dynamic', '1');
                    s.textContent = styleEl.textContent || '';
                    modalBody.appendChild(s);
                } catch (e) {}
            });
        }

        function runInlineScripts(modalBody, doc) {
            if (!modalBody || !doc) return;
            // 仅执行 inline script（原型页面主要是 inline）。
            // 关键：用 Function 在独立作用域执行，避免污染全局/重复声明（切换/重复打开弹窗时常见）
            var scripts = doc.querySelectorAll('script');
            if (!scripts || !scripts.length) return;
            scripts.forEach(function (scriptEl) {
                var src = scriptEl.getAttribute('src');
                var code = scriptEl.textContent || scriptEl.innerHTML || '';
                if (src) {
                    // 目前不重复加载外链脚本（避免多次注入引发副作用）
                    return;
                }
                if (!code || !code.trim()) return;
                try {
                    // 使用 Function 构造函数：顶层 const/let 变为函数作用域内变量，不会“已声明”
                    // 传入 window/document，保证脚本能访问常用全局对象
                    var fn = new Function('window', 'document', 'PageInteractions', 'PageLoader', 'BusinessLogic', code);
                    fn(window, document, window.PageInteractions, window.PageLoader, window.BusinessLogic);
                } catch (e) {
                    console.warn('弹窗脚本执行失败:', e);
                }
            });
        }

        // 设置标题
        if (title) {
            const titleEl = overlay.querySelector('.modal-title');
            if (titleEl) titleEl.textContent = title;
        }

        // 如果提供了内容URL，加载内容
        if (contentUrl) {
            const modalBody = overlay.querySelector('.modal-body');
            cleanupDynamicAssets(modalBody);
            modalBody.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading-spinner"></div><div style="margin-top: 16px;">加载中...</div></div>';

            // 先尝试使用缓存（短期内重复打开同一弹窗很常见）
            const cached = PageInteractions.__modalCache.get(contentUrl);
            const useCached = cached && cached.html && (Date.now() - cached.ts) < (5 * 60 * 1000);
            const fetchPromise = useCached ? Promise.resolve(cached.html) : fetch(contentUrl, { cache: 'no-store' })
                .then(resp => {
                    if (useCached) return resp; // cached html string
                    if (!resp.ok) {
                        var err = new Error(resp.status === 404 ? 'PAGE_NOT_FOUND' : `HTTP ${resp.status}: ${resp.statusText}`);
                        err.status = resp.status;
                        err.url = contentUrl;
                        throw err;
                    }
                    return resp.text();
                })
                .then(function(html) {
                    if (!useCached) {
                        try { PageInteractions.__modalCache.set(contentUrl, { html: html, ts: Date.now() }); } catch (e) {}
                    }
                    return html;
                });

            fetchPromise
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const scriptsInDoc = doc.querySelectorAll('script');

                    // 尝试多种选择器来找到表单
                    let formContent = doc.querySelector('.content-wrapper form');
                    if (!formContent) {
                        formContent = doc.querySelector('.card-body form');
                    }
                    if (!formContent) {
                        formContent = doc.querySelector('form');
                    }

                    if (formContent) {
                        modalBody.innerHTML = '';
                        modalBody.appendChild(formContent);

                        // 隐藏表单中的操作按钮，避免与 Modal footer 重复
                        const formActions = formContent.querySelector('.form-actions');
                        if (formActions) formActions.style.display = 'none';
                        const actionBar = formContent.querySelector('.action-bar');
                        if (actionBar) actionBar.style.display = 'none';

                        // 新建/编辑等需要更宽内容的弹窗：加载后为弹窗容器加宽（与基本信息 4 列排版一致）
                        // 注意：某些页面（如采购计划编辑）.plan-edit-form 在 content-wrapper 上，但此处只 append form，
                        // 因此需要基于 doc 判断，而非仅看 modalBody 内部结构。
                        var needWide =
                            !!doc.querySelector('.demand-create-form') ||
                            !!doc.querySelector('.plan-create-form') ||
                            !!doc.querySelector('.plan-edit-form') ||
                            (contentUrl && (contentUrl.indexOf('procurement-plan-create') !== -1 || contentUrl.indexOf('procurement-plan-edit') !== -1));
                        if (needWide) {
                            const modalBox = overlay.querySelector('.modal') || overlay.querySelector('.modal-content');
                            if (modalBox) modalBox.classList.add('modal--wide');
                        }

                        // 注入样式并执行脚本（详情/编辑页依赖脚本渲染时必须执行）
                        injectStyles(modalBody, doc);
                        runInlineScripts(modalBody, doc);

                        // 刷新按钮事件（仅初始化弹窗内容范围，避免全局扫 DOM）
                        PageInteractions.initButtons(modalBody);
                    } else {
                        // 无表单时尝试用 .content-wrapper 内容（详情页等），排除 script
                        const contentWrapper = doc.querySelector('.content-wrapper');
                        if (contentWrapper) {
                            modalBody.innerHTML = '';
                            [].slice.call(contentWrapper.children).forEach(function (node) {
                                if (node.tagName !== 'SCRIPT') {
                                    modalBody.appendChild(node.cloneNode(true));
                                }
                            });
                            // 查看详情弹窗内隐藏「返回列表」等操作栏，仅保留弹窗底部的「关闭」
                            if (modalId === 'list-view-modal') {
                                const actionBar = modalBody.querySelector('.action-bar');
                                if (actionBar) actionBar.style.display = 'none';
                            }
                            var needWide2 =
                                !!doc.querySelector('.demand-create-form') ||
                                !!doc.querySelector('.plan-create-form') ||
                                !!doc.querySelector('.plan-edit-form') ||
                                (contentUrl && (contentUrl.indexOf('procurement-plan-create') !== -1 || contentUrl.indexOf('procurement-plan-edit') !== -1));
                            if (needWide2) {
                                const modalBox = overlay.querySelector('.modal') || overlay.querySelector('.modal-content');
                                if (modalBox) modalBox.classList.add('modal--wide');
                            }

                            // 注入样式并执行脚本（详情页通常依赖脚本填充数据）
                            injectStyles(modalBody, doc);
                            runInlineScripts(modalBody, doc);

                            PageInteractions.initButtons(modalBody);
                        } else {
                            modalBody.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">未找到可展示内容</div>';
                        }
                    }
                })
                .catch(err => {
                    console.error('Modal加载失败:', err);
                    var is404 = err.status === 404 || (err.message && (err.message.indexOf('404') !== -1 || err.message === 'PAGE_NOT_FOUND'));
                    var isNetworkFail = err.message && (err.message.indexOf('Failed to fetch') !== -1 || err.message.indexOf('NetworkError') !== -1);
                    var tip;
                    if (is404) {
                        tip = '该详情/编辑页尚未创建（原型占位）。<br>实际开发时请创建对应页面或对接真实接口。';
                    } else if (isNetworkFail) {
                        tip = '无法加载页面（可能为本地 file:// 打开或该页面不存在）。<br>请使用本地服务器运行（如 npm run dev），或先创建对应的详情/编辑页。';
                    } else {
                        tip = '加载失败: ' + (err.message || '').replace('PAGE_NOT_FOUND', '');
                    }
                    var urlTip = contentUrl ? '<div style="margin-top:12px;font-size:12px;color:#999;word-break:break-all;">请求地址：' + contentUrl + '</div>' : '';
                    modalBody.innerHTML = '<div style="text-align: center; padding: 40px; color: #666; line-height: 1.6;">' + tip + urlTip + '</div>';
                });
        }

        // 显示Modal
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (onOpenCallback) onOpenCallback();
    },

    // 关闭Modal弹窗
    closeModal: function(modalId) {
        console.log('❌ 关闭Modal:', modalId);

        const overlay = document.getElementById(modalId);
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            const modalBox = overlay.querySelector('.modal') || overlay.querySelector('.modal-content');
            if (modalBox) modalBox.classList.remove('modal--wide');

            // 延迟清空表单内容
            const modalBody = overlay.querySelector('.modal-body');
            if (modalBody) {
                setTimeout(() => {
                    const form = modalBody.querySelector('form');
                    if (form) form.reset();
                }, 300);
            }
        }
    },

    // 关闭所有Modal
    closeAllModals: function() {
        document.querySelectorAll('.modal-overlay.active').forEach(overlay => {
            overlay.classList.remove('active');
        });
        document.body.style.overflow = '';
    },

    // 跳转到创建页面
    navigateToCreate: function(createPageUrl) {
        console.log('➕ 跳转到创建页面:', createPageUrl);
        if (typeof PageLoader !== 'undefined') {
            PageLoader.loadPage(createPageUrl);
        } else {
            console.error('PageLoader未定义');
            window.location.href = createPageUrl;
        }
    },

    // 跳转到详情页面
    navigateToDetail: function(detailPageUrl, id) {
        const url = id ? `${detailPageUrl}?id=${id}` : detailPageUrl;
        console.log('👁️ 跳转到详情页面:', url);
        if (typeof PageLoader !== 'undefined') {
            PageLoader.loadPage(url);
        } else {
            window.location.href = url;
        }
    },

    // 跳转到编辑页面
    navigateToEdit: function(editPageUrl, id) {
        const url = id ? `${editPageUrl}?id=${id}` : editPageUrl;
        console.log('✏️ 跳转到编辑页面:', url);
        if (typeof PageLoader !== 'undefined') {
            PageLoader.loadPage(url);
        } else {
            window.location.href = url;
        }
    },

    // 返回列表页
    navigateToList: function(listPageUrl) {
        console.log('← 返回列表页:', listPageUrl);
        if (typeof PageLoader !== 'undefined') {
            PageLoader.loadPage(listPageUrl);
        } else {
            window.location.href = listPageUrl;
        }
    },

    // 删除确认
    confirmDelete: function(itemName, callback) {
        const confirmed = confirm(`确定要删除"${itemName}"吗？\n\n此操作不可恢复，请谨慎操作！`);
        if (confirmed && callback) {
            callback();
        }
    },

    // 表单提交
    submitForm: function(formSelector, listPageUrl) {
        const form = document.querySelector(formSelector);
        if (!form) {
            alert('表单不存在！');
            return false;
        }

        // 基本验证
        const requiredFields = form.querySelectorAll('[required]');
        for (let field of requiredFields) {
            if (!field.value.trim()) {
                const labelEl = field.previousElementSibling;
                let label = '该字段';
                if (labelEl && typeof labelEl.textContent === 'string') {
                    label = labelEl.textContent;
                }
                alert(`请填写"${label.replace('*','').trim()}"`);
                field.focus();
                return false;
            }
        }

        // 模拟保存
        alert('✅ 保存成功！');

        // 跳转回列表页
        if (listPageUrl) {
            this.navigateToList(listPageUrl);
        }

        return true;
    },

    // 批量操作
    batchDelete: function(checkboxSelector, itemName) {
        const checkboxes = document.querySelectorAll(checkboxSelector + ':checked');
        if (checkboxes.length === 0) {
            alert('请先选择要删除的项！');
            return;
        }

        const confirmed = confirm(`确定要删除选中的 ${checkboxes.length} 个${itemName}吗？\n\n此操作不可恢复，请谨慎操作！`);
        if (confirmed) {
            alert(`✅ 已删除 ${checkboxes.length} 个${itemName}`);
        }
    },

    // 全选/取消全选
    toggleSelectAll: function(checkboxSelector) {
        const selectAllCheckbox = document.querySelector('.select-all-checkbox');
        if (!selectAllCheckbox) return;

        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll(checkboxSelector);
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    },

    // 状态筛选
    filterByStatus: function(status) {
        console.log('🔍 筛选状态:', status);
        alert(`筛选状态: ${status}`);
    },

    // 初始化页面按钮事件
    initButtons: function(root) {
        // 性能优化：默认只初始化传入容器内的按钮事件，避免每次切页都全局扫一遍 DOM
        // 不传则退化为全局 document
        root = root || document;
        // 新建按钮（跳转方式）
        root.querySelectorAll('.btn-create').forEach(btn => {
            if (!btn.hasAttribute('data-initialized')) {
                btn.addEventListener('click', function() {
                    const createUrl = this.dataset.url || 'create.html';
                    PageInteractions.navigateToCreate(createUrl);
                });
                btn.setAttribute('data-initialized', 'true');
            }
        });

        // 新建按钮（Modal方式）
        root.querySelectorAll('.btn-create-modal').forEach(btn => {
            if (!btn.hasAttribute('data-initialized')) {
                btn.addEventListener('click', function() {
                    const modalId = this.dataset.modal || 'create-modal';
                    const title = this.dataset.title || '新建';
                    const contentUrl = this.dataset.url;
                    PageInteractions.openModal(modalId, title, contentUrl);
                });
                btn.setAttribute('data-initialized', 'true');
            }
        });

        // 打开Modal按钮（data-open-modal="modalId"）
        root.querySelectorAll('[data-open-modal]').forEach(btn => {
            if (!btn.hasAttribute('data-init-open')) {
                btn.addEventListener('click', function() {
                    const modalId = this.getAttribute('data-open-modal');
                    if (modalId) {
                        const overlay = document.getElementById(modalId);
                        if (overlay) {
                            overlay.classList.add('active');
                            document.body.style.overflow = 'hidden';
                        }
                    }
                });
                btn.setAttribute('data-init-open', 'true');
            }
        });

        // 通用关闭：data-close-modal="modalId"（每次在 root 内绑定，支持 PageLoader 动态加载的弹窗按钮）
        root.querySelectorAll('[data-close-modal]').forEach(btn => {
            if (!btn.hasAttribute('data-init-close')) {
                btn.addEventListener('click', function() {
                    const id = this.getAttribute('data-close-modal');
                    if (id) {
                        const el = document.getElementById(id);
                        if (el) { el.classList.remove('active'); document.body.style.overflow = ''; }
                    }
                });
                btn.setAttribute('data-init-close', 'true');
            }
        });

        // root 内的 modal-overlay：点击遮罩关闭（支持动态加载的弹窗）
        root.querySelectorAll('.modal-overlay').forEach(overlay => {
            if (!overlay.hasAttribute('data-init-overlay-close')) {
                overlay.addEventListener('click', function(e) {
                    if (e.target === this) {
                        this.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                });
                overlay.setAttribute('data-init-overlay-close', 'true');
            }
        });

        // Modal 关闭/遮罩关闭 这类全局逻辑只需初始化一次（仅针对初始文档中已有的 overlay）
        if (!document.body.hasAttribute('data-pi-modal-global-init')) {
            document.body.setAttribute('data-pi-modal-global-init', '1');

            // Modal关闭按钮（无 data-close-modal 时用 dataset.modal 或 closest .modal-overlay）
            document.querySelectorAll('.modal-close, .btn-modal-cancel, .btn-modal-close').forEach(btn => {
                if (!btn.hasAttribute('data-initialized')) {
                    btn.addEventListener('click', function() {
                        const modalId = this.getAttribute('data-close-modal') || this.dataset.modal;
                        if (modalId) {
                            PageInteractions.closeModal(modalId);
                        } else {
                            const overlay = this.closest('.modal-overlay');
                            if (overlay) {
                                PageInteractions.closeModal(overlay.id);
                            }
                        }
                    });
                    btn.setAttribute('data-initialized', 'true');
                }
            });

            // 点击遮罩层关闭Modal
            document.querySelectorAll('.modal-overlay').forEach(overlay => {
                if (!overlay.hasAttribute('data-initialized')) {
                    overlay.addEventListener('click', function(e) {
                        if (e.target === this) {
                            this.classList.remove('active');
                            document.body.style.overflow = '';
                        }
                    });
                    overlay.setAttribute('data-initialized', 'true');
                }
            });
        }

        // data-open-modal 事件委托（支持 SPA 动态加载的页面，页面脚本未执行时也能打开弹窗，与「查看」弹窗一致）
        if (!document.body.hasAttribute('data-init-open-modal-delegate')) {
            document.body.setAttribute('data-init-open-modal-delegate', '1');
            document.addEventListener('click', function(e) {
                var openBtn = e.target && e.target.closest ? e.target.closest('[data-open-modal]') : null;
                if (openBtn) {
                    var modalId = openBtn.getAttribute('data-open-modal');
                    if (!modalId) return;
                    var overlay = document.getElementById(modalId);
                    if (!overlay) return;
                    if (modalId === 'ship-order-modal') {
                        var tr = openBtn.closest('tr');
                        if (tr) {
                            var tds = tr.querySelectorAll('td');
                            if (tds.length >= 9) {
                                var set = function(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
                                var setHtml = function(id, v) { var el = document.getElementById(id); if (el) el.innerHTML = v; };
                                set('ship-order-no', tds[1].textContent.trim());
                                set('ship-demand-party', tds[4].textContent.trim());
                                set('ship-order-amount', tds[5].textContent.trim());
                                set('ship-order-date', tds[7].textContent.trim());
                                set('ship-delivery-date', tds[8].textContent.trim());
                                setHtml('ship-order-status', tds[6].querySelector('.status-badge') ? tds[6].innerHTML : tds[6].textContent.trim());
                                var tbody = document.getElementById('ship-detail-tbody');
                                if (tbody) {
                                    var rows = [{ code: 'MAT-001', name: '电子元器件A', spec: '10KΩ ±5%', qty: 500, unit: '个' }, { code: 'MAT-002', name: 'PCB板', spec: '100x80mm 4层', qty: 200, unit: '片' }, { code: 'MAT-003', name: '电阻B', spec: '20KΩ', qty: 100, unit: '个' }];
                                    tbody.innerHTML = '';
                                    for (var i = 0; i < rows.length; i++) {
                                        var r = rows[i];
                                        var tr2 = document.createElement('tr');
                                        tr2.setAttribute('data-order-qty', String(r.qty));
                                        tr2.innerHTML = '<td class="ship-seq">' + (i + 1) + '</td><td>' + r.code + '</td><td>' + r.name + '</td><td>' + r.spec + '</td><td class="ship-order-qty">' + r.qty + '</td><td><input type="number" class="form-input form-input-sm ship-qty-input" min="0" max="' + r.qty + '" value="' + r.qty + '" data-max-qty="' + r.qty + '" style="width:80px;"></td><td>' + r.unit + '</td><td><button type="button" class="btn btn-sm btn-link btn-remove-ship-row">删除</button></td>';
                                        tbody.appendChild(tr2);
                                    }
                                }
                                overlay.dataset.shipTrIndex = Array.prototype.indexOf.call(tr.parentNode.children, tr);
                            }
                        }
                    }
                    if (modalId === 'ship-detail-modal') {
                        var shipRow = openBtn.closest('tr.ship-list-row');
                        if (shipRow) {
                            var tds = shipRow.querySelectorAll('td');
                            var set = function(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
                            var setHtml = function(id, v) { var el = document.getElementById(id); if (el) el.innerHTML = v; };
                            if (tds.length >= 5) {
                                set('ship-detail-ship-no', tds[0].textContent.trim());
                                set('ship-detail-order-no', tds[1].textContent.trim());
                                set('ship-detail-demand-party', tds[2].textContent.trim());
                                setHtml('ship-detail-status', tds[3].innerHTML && tds[3].querySelector('.status-badge') ? tds[3].innerHTML : tds[3].textContent.trim());
                                set('ship-detail-date', tds[4].textContent.trim());
                            }
                            var shipNo = shipRow.getAttribute('data-ship-no') || tds[0].textContent.trim();
                            var linesMap = {
                                'SH-2025-001': [{ code: 'MAT-001', name: '电子元器件A', spec: '10KΩ ±5%', qty: 200, unit: '个' }, { code: 'MAT-002', name: 'PCB板', spec: '100x80mm 4层', qty: 80, unit: '片' }],
                                'SH-2025-002': [{ code: 'MAT-001', name: '电子元器件A', spec: '10KΩ ±5%', qty: 300, unit: '个' }, { code: 'MAT-003', name: '电阻B', spec: '20KΩ', qty: 100, unit: '个' }],
                                'SH-2025-003': [{ code: 'MAT-002', name: 'PCB板', spec: '100x80mm 4层', qty: 150, unit: '片' }, { code: 'MAT-003', name: '电阻B', spec: '20KΩ', qty: 50, unit: '个' }],
                                'SH-2025-004': [{ code: 'MAT-001', name: '电子元器件A', spec: '10KΩ ±5%', qty: 500, unit: '个' }, { code: 'MAT-002', name: 'PCB板', spec: '100x80mm 4层', qty: 200, unit: '片' }, { code: 'MAT-003', name: '电阻B', spec: '20KΩ', qty: 100, unit: '个' }]
                            };
                            var lines = linesMap[shipNo] || [];
                            var linesTbody = document.getElementById('ship-detail-lines-tbody');
                            if (linesTbody) {
                                linesTbody.innerHTML = '';
                                for (var i = 0; i < lines.length; i++) {
                                    var ln = lines[i];
                                    var tr = document.createElement('tr');
                                    tr.innerHTML = '<td>' + (i + 1) + '</td><td>' + ln.code + '</td><td>' + ln.name + '</td><td>' + ln.spec + '</td><td>' + ln.qty + '</td><td>' + ln.unit + '</td>';
                                    linesTbody.appendChild(tr);
                                }
                                if (lines.length === 0) {
                                    var empty = document.createElement('tr');
                                    empty.innerHTML = '<td colspan="6" class="ship-list-placeholder">暂无明细</td>';
                                    linesTbody.appendChild(empty);
                                }
                            }
                        }
                    }
                    overlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, true);
        }

        // 订单列表：根据选中行更新下方发货单列表（内部共用）
        function applyOrderRowShipList(row) {
            if (!row || !row.getAttribute('data-order-no')) return;
            var orderNo = row.getAttribute('data-order-no');
            row.parentNode.querySelectorAll('tr.order-list-row').forEach(function(r) { r.classList.remove('selected'); });
            row.classList.add('selected');
            var shipTbody = document.getElementById('ship-list-tbody');
            if (!shipTbody) return;
            var placeholder = shipTbody.querySelector('.ship-list-placeholder-row');
            var shipRows = shipTbody.querySelectorAll('tr.ship-list-row');
            if (placeholder) placeholder.style.display = 'none';
            shipRows.forEach(function(r) {
                r.style.display = r.getAttribute('data-order-no') === orderNo ? '' : 'none';
            });
            var hasVisible = false;
            shipRows.forEach(function(r) { if (r.getAttribute('data-order-no') === orderNo) hasVisible = true; });
            if (placeholder && !hasVisible) { placeholder.style.display = ''; placeholder.querySelector('td').textContent = '该订单暂无发货单'; }
        }
        // 默认选中主表第一行并加载其发货单（首次加载或 SPA 注入后）
        function initOrderListDefaultSelection() {
            var shipTbody = document.getElementById('ship-list-tbody');
            var firstRow = document.querySelector('.order-list-table tbody tr.order-list-row');
            if (!shipTbody || !firstRow) return;
            if (document.querySelector('.order-list-table tbody tr.order-list-row.selected')) return;
            applyOrderRowShipList(firstRow);
        }

        // 订单列表行点击：选中行并更新下方发货单列表（只显示该订单的发货单）
        if (!document.body.hasAttribute('data-init-order-row-ship-list')) {
            document.body.setAttribute('data-init-order-row-ship-list', '1');
            document.addEventListener('click', function(e) {
                var row = e.target && e.target.closest ? e.target.closest('.order-list-table tbody tr.order-list-row') : null;
                if (!row) return;
                if (e.target.closest('button, input, a[href], [data-open-modal]')) return;
                var orderNo = row.getAttribute('data-order-no');
                if (!orderNo) return;
                applyOrderRowShipList(row);
            }, true);
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() { initOrderListDefaultSelection(); });
            } else {
                initOrderListDefaultSelection();
            }
            // SPA 注入订单列表后再次尝试默认选中第一行
            var initOrderListDebounce = null;
            var orderListObserver = new MutationObserver(function() {
                if (initOrderListDebounce) clearTimeout(initOrderListDebounce);
                initOrderListDebounce = setTimeout(function() {
                    initOrderListDebounce = null;
                    initOrderListDefaultSelection();
                }, 80);
            });
            orderListObserver.observe(document.body, { childList: true, subtree: true });
        }

        // 发货弹窗内：关闭按钮、删除行、生成发货单（事件委托，不依赖页面脚本）
        if (!document.body.hasAttribute('data-init-ship-modal-delegate')) {
            document.body.setAttribute('data-init-ship-modal-delegate', '1');
            document.addEventListener('click', function(e) {
                var target = e.target;
                if (target && target.getAttribute && target.getAttribute('data-close-modal') === 'ship-order-modal') {
                    var overlay = document.getElementById('ship-order-modal');
                    if (overlay) { overlay.classList.remove('active'); document.body.style.overflow = ''; }
                    return;
                }
                if (target && target.classList && target.classList.contains('btn-remove-ship-row')) {
                    var row = target.closest('tr');
                    var tbody = document.getElementById('ship-detail-tbody');
                    if (row && tbody && row.parentNode === tbody && tbody.querySelectorAll('tr').length > 1) {
                        row.remove();
                        tbody.querySelectorAll('tr').forEach(function(r, i) { var seq = r.querySelector('.ship-seq'); if (seq) seq.textContent = i + 1; });
                    } else if (tbody && tbody.querySelectorAll('tr').length <= 1) alert('至少保留一行明细');
                    return;
                }
                if (target && target.id === 'ship-order-modal' && target.classList && target.classList.contains('modal-overlay')) {
                    document.body.style.overflow = '';
                    target.classList.remove('active');
                    return;
                }
                if (target && target.id === 'ship-detail-modal' && target.classList && target.classList.contains('modal-overlay')) {
                    document.body.style.overflow = '';
                    target.classList.remove('active');
                    return;
                }
                if (target && target.getAttribute && target.getAttribute('data-close-modal') === 'ship-detail-modal') {
                    var overlay = document.getElementById('ship-detail-modal');
                    if (overlay) { overlay.classList.remove('active'); document.body.style.overflow = ''; }
                    return;
                }
                if (target && target.id === 'btn-generate-ship') {
                    var tbody = document.getElementById('ship-detail-tbody');
                    if (!tbody) return;
                    var rows = tbody.querySelectorAll('tr');
                    var allFull = true, hasZero = false, overQty = false;
                    for (var i = 0; i < rows.length; i++) {
                        var r = rows[i];
                        var orderQty = parseInt(r.getAttribute('data-order-qty'), 10) || 0;
                        var input = r.querySelector('.ship-qty-input');
                        var qty = input ? (parseInt(input.value, 10) || 0) : 0;
                        if (qty > orderQty) overQty = true;
                        if (qty < orderQty) allFull = false;
                        if (qty <= 0) hasZero = true;
                    }
                    if (overQty) { alert('本次发货数量不能大于订单数量'); return; }
                    if (rows.length === 0) { alert('请保留至少一行发货明细'); return; }
                    var newStatus = (allFull && !hasZero && rows.length === 3) ? '发货中' : '部分发货';
                    var overlay = document.getElementById('ship-order-modal');
                    var trIndex = overlay && overlay.dataset.shipTrIndex !== undefined ? overlay.dataset.shipTrIndex : '';
                    if (trIndex !== '') {
                        var listTr = document.querySelector('.card tbody tr:nth-child(' + (parseInt(trIndex, 10) + 1) + ')');
                        if (listTr) {
                            var statusTd = listTr.querySelector('td:nth-child(7)');
                            if (statusTd) statusTd.innerHTML = newStatus === '发货中' ? '<span class="status-badge status-processing">发货中</span>' : '<span class="status-badge status-warning">部分发货</span>';
                        }
                    }
                    if (overlay) { overlay.classList.remove('active'); document.body.style.overflow = ''; }
                    alert('已生成发货单。' + (newStatus === '部分发货' ? '订单状态为「部分发货」，可再次发货（订单与发货单一对多）。' : '订单状态为「发货中」。'));
                }
            }, true);
        }

        // 详情页“编辑”按钮：跳转列表并打开编辑弹窗（事件委托，支持 PageLoader 动态加载的详情页）
        if (!document.body.hasAttribute('data-init-edit-config-from-detail')) {
            document.body.setAttribute('data-init-edit-config-from-detail', '1');
            document.addEventListener('click', function(e) {
                const el = e.target && e.target.closest ? e.target.closest('[data-open-edit-config-from-detail]') : null;
                if (!el) return;
                e.preventDefault();
                let id = el.getAttribute('data-config-id');
                if (!id) {
                    const pageParam = new URLSearchParams(window.location.search).get('page') || '';
                    if (pageParam.indexOf('?') !== -1) {
                        const qs = pageParam.split('?')[1] || '';
                        id = new URLSearchParams(qs).get('id') || '';
                    }
                    if (!id) id = new URLSearchParams(window.location.search).get('id') || '';
                    if (!id) id = '1';
                }
                const listUrl = (el.getAttribute('href') || 'pages/procurement-supplier-performance-config.html').split('?')[0];
                if (typeof window.openPerformanceConfigEditModal === 'function') {
                    window.openPerformanceConfigEditModal(String(id));
                    return;
                }
                try { sessionStorage.setItem('performance-config-open-edit-id', String(id)); } catch (err) {}
                if (typeof PageLoader !== 'undefined' && PageLoader.loadPage) {
                    PageLoader.loadPage(listUrl).then(function() {
                        document.dispatchEvent(new CustomEvent('performance-config-open-edit', { detail: { id: String(id) } }));
                    });
                } else {
                    window.location.href = listUrl + (listUrl.indexOf('?') !== -1 ? '&' : '?') + 'openEdit=1&id=' + encodeURIComponent(id);
                }
            });
        }

        // 查看按钮：就地弹窗（在哪儿点就在哪儿弹），传递 id 供详情页读取
        root.querySelectorAll('.btn-view').forEach(btn => {
            if (!btn.hasAttribute('data-initialized')) {
                btn.addEventListener('click', function() {
                    const detailUrl = this.dataset.url || 'detail.html';
                    const id = this.dataset.id;
                    if (id) window.__modalContentId = id;
                    const url = id ? (detailUrl + (detailUrl.indexOf('?') !== -1 ? '&' : '?') + 'id=' + id) : detailUrl;
                    PageInteractions.openModal('list-view-modal', '查看详情', url);
                });
                btn.setAttribute('data-initialized', 'true');
            }
        });

        // 填写会审意见按钮：跳转到会审意见填写页面
        root.querySelectorAll('.btn-review-opinion').forEach(btn => {
            if (!btn.hasAttribute('data-initialized')) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const todoId = this.getAttribute('data-todo-id');
                    const handleNo = this.getAttribute('data-handle-no');
                    const handleId = this.getAttribute('data-handle-id');
                    const materialCode = this.getAttribute('data-material-code');
                    
                    var url = 'pages/procurement-unqualified-review-opinion.html?todoId=' + todoId + '&handleNo=' + handleNo + '&handleId=' + handleId;
                    if (materialCode) {
                        url += '&materialCode=' + materialCode;
                    }
                    
                    if (typeof PageLoader !== 'undefined' && PageLoader.loadPage) {
                        PageLoader.loadPage(url);
                    } else {
                        window.location.href = url;
                    }
                });
                btn.setAttribute('data-initialized', 'true');
            }
        });
        
        // 查看会审意见按钮：带 data-view-in-modal 的用弹窗展示详情（事件委托，SPA 动态加载时也能生效），其余跳转至会审意见查看页
        root.addEventListener('click', function(e) {
            var viewInModalBtn = e.target.closest && e.target.closest('.btn-review-opinion-view[data-view-in-modal="true"]');
            if (viewInModalBtn) {
                e.preventDefault();
                e.stopPropagation();
                var btn = viewInModalBtn;
                var row = btn.closest('tr');
                var modal = document.getElementById('todo-unqualified-review-detail-modal');
                var body = document.getElementById('todo-unqualified-modal-body');
                if (!modal || !body) return;
                var handleNo = btn.getAttribute('data-handle-no') || '';
                var title = btn.getAttribute('data-title') || '不合格处理会审';
                var summary = btn.getAttribute('data-summary') || '';
                var typeCell = row ? row.querySelector('td:nth-child(2)') : null;
                var linkCell = row ? row.querySelector('td:nth-child(4)') : null;
                var statusCell = row ? row.querySelector('td:nth-child(5)') : null;
                var createCell = row ? row.querySelector('td:nth-child(6)') : null;
                var deadlineCell = row ? row.querySelector('td:nth-child(7)') : null;
                var priorityCell = row ? row.querySelector('td:nth-child(8)') : null;
                var statusText = statusCell ? statusCell.textContent.trim() : '';
                var isPending = statusText === '待处理';
                var materialCode = btn.getAttribute('data-material-code') || '';
                var materialName = '';
                var materialSpec = '规格A';
                var totalQty = 0;
                var allocRows = [];
                if (summary) {
                    var parts = summary.split(/\s*\|\s*/);
                    if (parts[0]) {
                        var m = parts[0].replace(/^物料[：:]\s*/, '').trim();
                        var firstSpace = m.indexOf(' ');
                        materialName = firstSpace > 0 ? m.substring(firstSpace + 1).trim() : m;
                        if (!materialCode && m) materialCode = firstSpace > 0 ? m.substring(0, firstSpace) : m;
                    }
                    var allocStr = summary.indexOf('初步处理') !== -1 ? (summary.split('初步处理')[1] || '').replace(/^[：:]\s*/, '').trim() : '';
                    if (allocStr) {
                        allocStr.split(/[、,，]/).forEach(function(s) {
                            s = s.trim();
                            var match = s.match(/^(退货|换货|让步接收)\s*(\d+)\s*(个|件|块|台|套)?/);
                            if (match) {
                                var q = parseInt(match[2], 10) || 0;
                                totalQty += q;
                                allocRows.push({ type: match[1], qty: match[2], unit: match[3] || '个' });
                            }
                        });
                    }
                }
                var typeColor = { '退货': '#fff1f0', '换货': '#fff7e6', '让步接收': '#f6ffed' };
                var typeTextColor = { '退货': '#cf1322', '换货': '#d46b08', '让步接收': '#52c41a' };
                var detailTableRows = '';
                var unit = allocRows[0] ? allocRows[0].unit : '个';
                allocRows.forEach(function(r, i) {
                    var bg = typeColor[r.type] || '#fafafa';
                    var tc = typeTextColor[r.type] || '#595959';
                    var badge = '<span class="status-badge" style="background:' + bg + ';color:' + tc + ';">' + r.type + ' ' + r.qty + r.unit + '</span>';
                    var concessionCols = r.type === '让步接收' ? '<td>-</td><td>-</td><td>-</td>' : '<td>-</td><td>-</td><td>-</td>';
                    detailTableRows += '<tr><td style="text-align:center;">' + (i + 1) + '</td><td>' + (materialCode || '-') + '</td><td>' + (materialName || '-') + '</td><td>' + (materialSpec || '-') + '</td><td style="text-align:right;">' + (totalQty || r.qty) + '</td><td>' + unit + '</td><td>' + badge + '</td>' + concessionCols + '</tr>';
                });
                var basicInfo = '<div class="card" style="margin-bottom:16px;"><div class="card-header"><h3 class="card-title">基本信息</h3></div><div class="card-body"><div class="form-row" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;">' +
                    '<div class="form-item"><label class="form-label">处理单号</label><div class="form-value">' + (handleNo || '-') + '</div></div>' +
                    '<div class="form-item"><label class="form-label">关联采购订单</label><div class="form-value"><a href="pages/procurement-order-detail.html?id=1" style="color:#1890ff;">PO-2025-001</a></div></div>' +
                    '<div class="form-item"><label class="form-label">供应商</label><div class="form-value">深圳市电子科技有限公司</div></div>' +
                    '<div class="form-item"><label class="form-label">会审发起时间</label><div class="form-value">' + (createCell ? createCell.textContent.trim() : '2025-01-22 14:00') + '</div></div>' +
                    '<div class="form-item"><label class="form-label">会审发起人</label><div class="form-value">采购-张采购</div></div>' +
                    '<div class="form-item"><label class="form-label">当前处理人</label><div class="form-value">质量-李质检</div></div>' +
                    '</div></div></div>';
                var detailTable = '<div class="card"><div class="card-header"><h3 class="card-title">不合格物料明细</h3></div><div class="card-body"><div class="table-wrapper"><table class="list-table-nowrap">' +
                    '<thead><tr><th width="60">序号</th><th width="120">物料编码</th><th width="200">物料名称</th><th width="100">规格型号</th><th width="100">不合格数量</th><th width="80">单位</th><th width="200">初步处理方式分配</th><th width="100">处理方案</th><th width="90">原等级</th><th width="90">降级后等级</th></tr></thead><tbody>' +
                    (detailTableRows || '<tr><td colspan="10" style="text-align:center;color:#8c8c8c;">' + (summary || '暂无明细') + '</td></tr>') +
                    '</tbody></table></div></div></div>';
                body.innerHTML = basicInfo + detailTable;
                var handleBtn = document.getElementById('todo-unqualified-modal-btn-handle');
                if (handleBtn) {
                    if (isPending) {
                        handleBtn.style.display = 'inline-block';
                        handleBtn.onclick = function() {
                            modal.classList.remove('active');
                            if (typeof window.openTodoFillOpinionModal === 'function') {
                                window.openTodoFillOpinionModal(btn);
                            } else if (PageInteractions.openTodoFillOpinionModal) {
                                PageInteractions.openTodoFillOpinionModal(btn);
                            }
                        };
                    } else {
                        handleBtn.style.display = 'none';
                    }
                }
                modal.classList.add('active');
                return;
            }
        });
        root.querySelectorAll('.btn-review-opinion-view').forEach(btn => {
            if (btn.getAttribute('data-view-in-modal') === 'true') return;
            if (!btn.hasAttribute('data-initialized')) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var todoId = this.getAttribute('data-todo-id');
                    var handleNo = this.getAttribute('data-handle-no');
                    var handleId = this.getAttribute('data-handle-id');
                    var materialCode = this.getAttribute('data-material-code');
                    var url = 'pages/procurement-unqualified-review-opinion.html?todoId=' + todoId + '&handleNo=' + handleNo + '&handleId=' + handleId + '&view=true';
                    if (materialCode) url += '&materialCode=' + materialCode;
                    if (typeof PageLoader !== 'undefined' && PageLoader.loadPage) PageLoader.loadPage(url);
                    else window.location.href = url;
                });
                btn.setAttribute('data-initialized', 'true');
            }
        });

        // 待办详情弹窗关闭：事件委托（root 内点击，详情弹窗在 main 里）
        root.addEventListener('click', function(e) {
            if (e.target.id === 'todo-unqualified-modal-close' || e.target.id === 'todo-unqualified-modal-btn-close') {
                var m = document.getElementById('todo-unqualified-review-detail-modal');
                if (m) m.classList.remove('active');
            }
            if (e.target.id === 'todo-unqualified-review-detail-modal') {
                e.target.classList.remove('active');
            }
        });
        // 填写意见弹窗关闭/提交：弹窗在 body 下，必须用 document 委托
        if (!document._todoFillOpinionModalBound) {
            document._todoFillOpinionModalBound = true;
            document.addEventListener('click', function(e) {
                if (e.target.id === 'todo-fill-opinion-modal-close' || e.target.id === 'todo-fill-opinion-modal-cancel') {
                    var fm = document.getElementById('todo-fill-opinion-modal');
                    if (fm) fm.classList.remove('active');
                }
                if (e.target.id === 'todo-fill-opinion-modal') {
                    e.target.classList.remove('active');
                }
                if (e.target.id === 'todo-fill-opinion-modal-submit') {
                    e.preventDefault();
                    var agreeSelect = document.getElementById('todo-opinion-agree');
                    var contentEl = document.getElementById('todo-opinion-content');
                    if (!agreeSelect || !agreeSelect.value) {
                        alert('请选择是否同意');
                        return;
                    }
                    var isAgree = agreeSelect.value === 'agree';
                    if (!isAgree && (!contentEl || !contentEl.value.trim())) {
                        alert('不同意时请填写处理意见');
                        return;
                    }
                    var btn = PageInteractions._currentTodoFillOpinionBtn;
                    var summary = btn ? (btn.getAttribute('data-summary') || '') : '';
                    var isConcession = summary.indexOf('让步接收') !== -1;
                    var suggestionSelect = document.getElementById('todo-opinion-suggestion');
                    var suggestConcession = suggestionSelect && suggestionSelect.value === 'concession';
                    if ((isConcession && isAgree) || suggestConcession) {
                        var planSelect = document.getElementById('todo-opinion-plan');
                        var downgradeGrade = document.getElementById('todo-opinion-downgrade-grade');
                        if (!planSelect || !planSelect.value) {
                            alert('让步接收需选择处理方案');
                            return;
                        }
                        if (!downgradeGrade || !downgradeGrade.value.trim()) {
                            alert('让步接收需填写降级后等级');
                            return;
                        }
                    }
                    var fm = document.getElementById('todo-fill-opinion-modal');
                    if (fm) fm.classList.remove('active');
                    alert('意见已提交');
                }
            });
        }

        // 推送按钮：推送订单到供应商端
        root.querySelectorAll('.btn-push-order').forEach(btn => {
            if (!btn.hasAttribute('data-initialized')) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const orderId = this.getAttribute('data-order-id');
                    const orderNo = this.getAttribute('data-order-no');
                    const row = this.closest('tr');
                    
                    if (!row || !orderId || !orderNo) {
                        // 尝试从行中获取
                        const orderNoCell = row ? row.querySelector('td:nth-child(2)') : null;
                        const orderIdInput = row ? row.querySelector('input[name="order-id"]') : null;
                        if (orderNoCell) orderNo = orderNoCell.textContent.trim();
                        if (orderIdInput) orderId = orderIdInput.value;
                    }
                    
                    if (!row || !orderId || !orderNo) {
                        alert('订单信息不完整，无法推送');
                        return;
                    }
                    
                    // 获取订单信息
                    const cells = row.querySelectorAll('td');
                    const supplier = cells[5] ? cells[5].textContent.trim() : '';
                    
                    if (confirm('确定将订单 ' + orderNo + ' 推送给供应商 ' + supplier + '？\n推送后，订单将在供应商端的订单管理中显示为"待确认"状态。')) {
                        try {
                            // 存储推送的订单信息到sessionStorage
                            const pushData = {
                                orderId: orderId,
                                orderNo: orderNo,
                                supplier: supplier,
                                pushTime: new Date().toISOString(),
                                status: 'pending'
                            };
                            let pushedOrders = JSON.parse(sessionStorage.getItem('pushedOrders') || '[]');
                            pushedOrders.push(pushData);
                            sessionStorage.setItem('pushedOrders', JSON.stringify(pushedOrders));
                            
                            // 更新当前行的订单状态为"已推送"
                            const statusCell = cells[8];
                            if (statusCell) {
                                statusCell.innerHTML = '<span class="status-badge status-info">已推送</span>';
                            }
                            
                            // 更新操作列：移除推送按钮，添加跟踪按钮
                            const actionCell = cells[17];
                            if (actionCell) {
                                actionCell.innerHTML = '<button class="btn btn-sm btn-default btn-view" data-url="pages/procurement-order-detail.html" data-id="' + orderId + '">查看</button> <button class="btn btn-sm btn-default">跟踪</button>';
                                // 重新初始化按钮事件
                                PageInteractions.initButtons(actionCell);
                            }
                            
                            alert('订单已成功推送给供应商 ' + supplier + '。\n供应商可在订单管理中查看并确认订单。');
                        } catch (err) {
                            alert('推送失败：' + (err.message || '未知错误'));
                            console.error('推送订单失败:', err);
                        }
                    }
                });
                btn.setAttribute('data-initialized', 'true');
            }
        });

        // 编辑按钮：就地弹窗（在哪儿点就在哪儿弹），传递 id 供编辑页读取
        root.querySelectorAll('.btn-edit').forEach(btn => {
            if (!btn.hasAttribute('data-initialized')) {
                btn.addEventListener('click', function() {
                    const editUrl = this.dataset.url || 'edit.html';
                    const id = this.dataset.id;
                    if (id) window.__modalContentId = id;
                    const url = id ? (editUrl + (editUrl.indexOf('?') !== -1 ? '&' : '?') + 'id=' + id) : editUrl;
                    PageInteractions.openModal('edit-modal', '编辑', url);
                });
                btn.setAttribute('data-initialized', 'true');
            }
        });

        // 删除按钮
        root.querySelectorAll('.btn-delete').forEach(btn => {
            if (!btn.hasAttribute('data-initialized')) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const itemName = this.dataset.name || '该项';
                    const row = this.closest('tr');
                    
                    PageInteractions.confirmDelete(itemName, function() {
                        // 删除成功后，从表格中移除该行
                        if (row && row.parentNode) {
                            row.remove();
                            // 更新总数
                            const tbody = document.querySelector('#order-table-body');
                            if (tbody) {
                                const count = tbody.querySelectorAll('tr').length;
                                const countEl = document.getElementById('order-total-count');
                                if (countEl) {
                                    countEl.textContent = count;
                                }
                            }
                        }
                        alert('✅ 删除成功！');
                    });
                });
                btn.setAttribute('data-initialized', 'true');
            }
        });

        // 提交审批按钮（用于提交草稿状态的订单进行审批）
        root.querySelectorAll('.btn-submit-approval').forEach(btn => {
            if (!btn.hasAttribute('data-initialized')) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const row = this.closest('tr');
                    if (!row) return;
                    
                    // 获取订单信息
                    const cells = row.querySelectorAll('td');
                    const orderNoCell = cells[1]; // 订单编号在第2列
                    const orderNo = orderNoCell ? orderNoCell.textContent.trim() : '';
                    
                    if (confirm('确定要提交订单 ' + orderNo + ' 进行审批吗？\n\n提交后，订单状态将变更为"审批中"。')) {
                        try {
                            // 更新订单状态为"审批中"
                            const statusCell = cells[8]; // 订单状态在第9列（索引8）
                            if (statusCell) {
                                statusCell.innerHTML = '<span class="status-badge status-warning">审批中</span>';
                            }
                            
                            // 更新操作列：移除编辑、提交审批、删除按钮，添加取消审核按钮
                            const actionCell = cells[17]; // 操作列在第18列（索引17）
                            if (actionCell) {
                                const orderIdInput = row.querySelector('input[name="order-id"]');
                                const orderId = orderIdInput ? orderIdInput.value : '';
                                actionCell.innerHTML = '<button class="btn btn-sm btn-default btn-view" data-url="pages/procurement-order-detail.html" data-id="' + orderId + '">查看</button> <button class="btn btn-sm btn-danger btn-cancel-approval">取消审核</button>';
                                // 重新初始化按钮事件
                                PageInteractions.initButtons(actionCell);
                            }
                            
                            alert('✅ 订单已提交审批！');
                        } catch (err) {
                            alert('提交审批失败：' + (err.message || '未知错误'));
                            console.error('提交审批失败:', err);
                        }
                    }
                });
                btn.setAttribute('data-initialized', 'true');
            }
        });

        // 取消审核按钮（用于撤回审批中的订单，状态回到草稿）
        root.querySelectorAll('.btn-cancel-approval').forEach(btn => {
            if (!btn.hasAttribute('data-initialized')) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const row = this.closest('tr');
                    if (!row) return;
                    
                    // 获取订单信息
                    const cells = row.querySelectorAll('td');
                    const orderNoCell = cells[1]; // 订单编号在第2列
                    const orderNo = orderNoCell ? orderNoCell.textContent.trim() : '';
                    
                    if (confirm('确定要取消审核订单 ' + orderNo + ' 吗？\n\n取消审核后，订单状态将回到"草稿"状态，可以重新编辑和提交审批。')) {
                        try {
                            // 更新订单状态为"草稿"
                            const statusCell = cells[8]; // 订单状态在第9列（索引8）
                            if (statusCell) {
                                statusCell.innerHTML = '<span class="status-badge status-draft">草稿</span>';
                            }
                            
                            // 更新操作列：添加编辑、提交审批、删除按钮（草稿状态的按钮）
                            const actionCell = cells[17]; // 操作列在第18列（索引17）
                            if (actionCell) {
                                const orderIdInput = row.querySelector('input[name="order-id"]');
                                const orderId = orderIdInput ? orderIdInput.value : '';
                                actionCell.innerHTML = '<button class="btn btn-sm btn-default btn-view" data-url="pages/procurement-order-detail.html" data-id="' + orderId + '">查看</button> <button class="btn btn-sm btn-default btn-edit" data-url="pages/procurement-order-edit.html" data-id="' + orderId + '">编辑</button> <button class="btn btn-sm btn-primary btn-submit-approval">提交审批</button> <button class="btn btn-sm btn-danger btn-delete" data-name="采购订单">删除</button>';
                                // 重新初始化按钮事件
                                PageInteractions.initButtons(actionCell);
                            }
                            
                            alert('✅ 已取消审核，订单状态已回到"草稿"，可以重新编辑和提交审批。');
                        } catch (err) {
                            alert('取消审核失败：' + (err.message || '未知错误'));
                            console.error('取消审核失败:', err);
                        }
                    }
                });
                btn.setAttribute('data-initialized', 'true');
            }
        });

        // 应用切换等“全局一次性逻辑”不要在每次 initButtons 重复构造/执行
        if (!window.__PI_APP_SWITCH_INIT__) {
            window.__PI_APP_SWITCH_INIT__ = true;

            // 应用配置
            var appConfigs = {
                'design-collab': {
                    name: '设计协同系统',
                    icon: '设',
                    logoIcon: 'P',
                    defaultPage: 'pages/dashboard.html',
                    menu: 'design-collab-menu'
                },
                'procurement': {
                    name: '采购协同系统',
                    icon: '采',
                    logoIcon: '采',
                    defaultPage: 'pages/procurement-dashboard.html',
                    menu: 'procurement-menu'
                },
                'supply-chain': {
                    name: '供应链协同',
                    icon: '供',
                    logoIcon: '供',
                    defaultPage: 'pages/supply-chain-dashboard.html',
                    menu: 'supply-chain-menu'
                },
                'equipment': {
                    name: '设备管理协同',
                    icon: '备',
                    logoIcon: '备',
                    defaultPage: 'pages/equipment-dashboard.html',
                    menu: 'equipment-menu'
                },
                'energy': {
                    name: '能源管理协同',
                    icon: '能',
                    logoIcon: '能',
                    defaultPage: 'pages/energy-dashboard.html',
                    menu: 'energy-menu'
                }
            };
            // 当前应用 - 初始化为默认值，页面加载时会从localStorage恢复
            var currentApp = 'design-collab';
            
            // 切换应用
            function switchApp(appId) {
            console.log('🔄 switchApp 被调用，appId:', appId);
            
            if (!appConfigs[appId]) {
                console.error('❌ 应用配置未找到:', appId);
                alert('应用配置未找到: ' + appId);
                return;
            }
            
            var config = appConfigs[appId];
            var oldApp = currentApp;
            
            // 如果切换的是当前应用，不执行切换，但需要关闭弹窗
            if (appId === currentApp) {
                console.log('ℹ️ 当前已是该应用，无需切换');
                // 确保弹窗关闭
                var appPopover = document.getElementById('app-switcher-popover');
                if (appPopover) {
                    appPopover.classList.remove('show');
                    var appTrigger = document.getElementById('app-switcher-trigger');
                    if (appTrigger) {
                        appTrigger.setAttribute('aria-expanded', 'false');
                    }
                    appPopover.setAttribute('aria-hidden', 'true');
                }
                return;
            }
            
            console.log('🔄 开始切换应用:', appId, '原应用:', oldApp);
            currentApp = appId;
            
            // 保存当前应用到localStorage，实现状态持久化
            try {
                localStorage.setItem('currentApp', appId);
                console.log('✅ 已保存到localStorage:', appId);
            } catch (e) {
                console.warn('⚠️ localStorage保存失败:', e);
            }
            
            // 更新logo
            var logoIcon = document.querySelector('.logo-icon');
            var logoText = document.querySelector('.logo-text');
            if (logoIcon) {
                logoIcon.textContent = config.logoIcon;
                console.log('✅ Logo图标已更新:', config.logoIcon);
            } else {
                console.warn('⚠️ Logo图标元素未找到');
            }
            if (logoText) {
                logoText.textContent = config.name;
                console.log('✅ Logo文字已更新:', config.name);
            } else {
                console.warn('⚠️ Logo文字元素未找到');
            }
            
            // 更新菜单
            console.log('🔄 准备更新菜单:', config.menu);
            try {
                updateMenu(config.menu);
                console.log('✅ 菜单已更新');
            } catch (e) {
                console.error('❌ 菜单更新失败:', e);
            }
            
            // 更新应用切换弹窗中的active状态
            try {
                document.querySelectorAll('.app-switcher-item').forEach(function(item) {
                    item.classList.remove('active');
                    var check = item.querySelector('.app-switcher-check');
                    if (check) check.remove();
                });
                var activeItem = document.querySelector('.app-switcher-item[data-app="' + appId + '"]');
                if (activeItem) {
                    activeItem.classList.add('active');
                    if (!activeItem.querySelector('.app-switcher-check')) {
                        var check = document.createElement('span');
                        check.className = 'app-switcher-check';
                        check.textContent = '✓';
                        activeItem.appendChild(check);
                    }
                    console.log('✅ 应用切换弹窗active状态已更新');
                } else {
                    console.warn('⚠️ 未找到对应的应用切换项:', appId);
                }
            } catch (e) {
                console.error('❌ 更新应用切换弹窗状态失败:', e);
            }
            
            // 关闭应用切换弹窗并修复aria-hidden警告
            var appPopover = document.getElementById('app-switcher-popover');
            if (appPopover) {
                appPopover.classList.remove('show');
                var appTrigger = document.getElementById('app-switcher-trigger');
                if (appTrigger) {
                    appTrigger.setAttribute('aria-expanded', 'false');
                }
                // 延迟设置aria-hidden，确保焦点已移除
                setTimeout(function() {
                    appPopover.setAttribute('aria-hidden', 'true');
                }, 100);
            }
            
            // 加载默认页面
            console.log('🔄 准备加载默认页面:', config.defaultPage);
            if (typeof PageLoader !== 'undefined' && PageLoader.loadPage) {
                // 直接加载页面，不先检查（避免CORS问题）
                PageLoader.loadPage(config.defaultPage)
                    .then(function() {
                        console.log('✅ 页面加载成功:', config.defaultPage);
                    })
                    .catch(function(loadErr) {
                        console.error('❌ 页面加载失败:', loadErr);
                        console.log('🔄 尝试显示占位页面');
                        showAppPlaceholder(config);
                    });
            } else {
                console.warn('⚠️ PageLoader未定义，使用window.location跳转');
                window.location.href = config.defaultPage;
            }
        }
        // 显示应用占位页面
        function showAppPlaceholder(config) {
            var container = document.getElementById('content-container');
            if (container) {
                container.innerHTML = '<div class="content-wrapper"><div class="page-header"><h1 class="page-title">' + config.name + '</h1><p style="color:#595959;font-size:14px;margin-top:8px;">欢迎使用 ' + config.name + '</p></div><div class="card"><div class="card-body"><div class="empty-state" style="padding:60px 20px;text-align:center;"><div class="empty-icon" style="font-size:64px;margin-bottom:16px;">🚀</div><div class="empty-text" style="font-size:18px;font-weight:600;color:#262626;margin-bottom:8px;">欢迎使用 ' + config.name + '</div><div class="empty-description" style="font-size:14px;color:#8c8c8c;line-height:1.6;max-width:400px;margin:0 auto;">该应用的功能页面正在开发中，敬请期待...</div></div></div></div></div>';
            }
        }
        // 更新菜单
        function updateMenu(menuType) {
            if (window.AppSidebarMenu && AppSidebarMenu.MENU_TYPES.indexOf(menuType) >= 0) {
                AppSidebarMenu.render(menuType);
                console.log('✅ 菜单已渲染:', menuType);
                return;
            }
            var menuContainer = document.querySelector('.sidebar-menu');
            if (!menuContainer) {
                console.warn('菜单容器未找到');
                return;
            }
            if (menuType === 'design-collab-menu') {
                menuContainer.innerHTML = getDesignCollabMenu();
                setTimeout(function() {
                    PageInteractions.initMenu(true);
                    console.log('✅ 设计协同菜单初始化完成');
                }, 0);
            } else {
                console.warn('未找到菜单类型:', menuType);
            }
        }
        function getDesignCollabMenu() {
            return '<div class="menu-section"><div class="menu-item menu-item-parent"><span class="menu-icon">🏠</span><span class="menu-text">工作台</span><span class="menu-arrow">▶</span></div><div class="submenu" id="submenu-home"><a href="pages/my-initiated.html" class="submenu-item">我发起的</a><a href="pages/design-task-review.html" class="submenu-item">待我审核</a><a href="pages/notification-center.html" class="submenu-item">消息列表</a></div></div><div class="menu-section"><div class="menu-item menu-item-parent"><span class="menu-icon">📋</span><span class="menu-text">任务管理</span><span class="menu-arrow">▶</span></div><div class="submenu" id="submenu-task"><a href="pages/tech-task-list.html" class="submenu-item">技术任务</a><a href="pages/design-task-list.html" class="submenu-item">设计任务</a></div></div><div class="menu-section"><div class="menu-item menu-item-parent"><span class="menu-icon">📊</span><span class="menu-text">BOM管理</span><span class="menu-arrow">▶</span></div><div class="submenu" id="submenu-bom"><a href="pages/ebom-list.html" class="submenu-item">EBOM列表</a><a href="pages/mbom-list.html" class="submenu-item">MBOM列表</a><a href="pages/sbom-list.html" class="submenu-item">SBOM列表</a></div></div><div class="menu-section"><div class="menu-item menu-item-parent"><span class="menu-icon">📝</span><span class="menu-text">变更管理</span><span class="menu-arrow">▶</span></div><div class="submenu" id="submenu-change"><a href="pages/change-review-list.html" class="submenu-item">变更会审单</a><a href="pages/change-request-list.html" class="submenu-item">变更申请单</a><a href="pages/emergency-change-list.html" class="submenu-item">紧急变更</a></div></div><div class="menu-section"><div class="menu-item menu-item-parent"><span class="menu-icon">🔗</span><span class="menu-text">系统联动</span><span class="menu-arrow">▶</span></div><div class="submenu" id="submenu-sync"><a href="pages/sync-erp.html" class="submenu-item">ERP 集成</a><a href="pages/sync-mes.html" class="submenu-item">MES 集成</a><a href="pages/sync-wms.html" class="submenu-item">WMS 集成</a><a href="pages/sync-log.html" class="submenu-item">同步日志</a></div></div><div class="menu-section"><div class="menu-item menu-item-parent"><span class="menu-icon">📁</span><span class="menu-text">基础信息</span><span class="menu-arrow">▶</span></div><div class="submenu" id="submenu-base"><a href="pages/material-list.html" class="submenu-item">物料档案</a><a href="pages/product-structure.html" class="submenu-item">产品档案</a><a href="pages/organization-list.html" class="submenu-item">组织架构</a><a href="pages/user-list.html" class="submenu-item">人员管理</a><a href="pages/role-permission.html" class="submenu-item">角色与权限</a></div></div><div class="menu-section"><div class="menu-item menu-item-parent"><span class="menu-icon">📈</span><span class="menu-text">考核与改进</span><span class="menu-arrow">▶</span></div><div class="submenu" id="submenu-kpi"><a href="pages/kpi-dashboard.html" class="submenu-item">KPI 仪表盘</a><a href="pages/performance-stats.html" class="submenu-item">绩效统计</a><a href="pages/improvement-plan.html" class="submenu-item">改进计划</a></div></div><div class="menu-section"><div class="menu-item menu-item-parent"><span class="menu-icon">⚠️</span><span class="menu-text">预警管理</span><span class="menu-arrow">▶</span></div><div class="submenu" id="submenu-alert"><a href="pages/alert-list.html" class="submenu-item">预警列表</a><a href="pages/alert-rule-config.html" class="submenu-item">预警规则配置</a><a href="pages/alert-handle.html" class="submenu-item">预警处理</a></div></div><div class="menu-section"><div class="menu-item menu-item-parent"><span class="menu-icon">📑</span><span class="menu-text">报表管理</span><span class="menu-arrow">▶</span></div><div class="submenu" id="submenu-report"><a href="pages/report-dashboard.html" class="submenu-item">报表中心</a><a href="pages/report-bom-stats.html" class="submenu-item">BOM 统计</a><a href="pages/report-change-stats.html" class="submenu-item">变更统计</a><a href="pages/report-custom.html" class="submenu-item">自定义报表</a></div></div><div class="menu-section"><div class="menu-item menu-item-parent"><span class="menu-icon">⚙️</span><span class="menu-text">系统配置</span><span class="menu-arrow">▶</span></div><div class="submenu" id="submenu-config"><a href="pages/config-coding-rule.html" class="submenu-item">编码规则</a><a href="pages/config-workflow.html" class="submenu-item">工作流配置</a><a href="pages/config-dictionary.html" class="submenu-item">数据字典</a><a href="pages/config-kpi-indicator.html" class="submenu-item">考核指标配置</a><a href="pages/operation-log.html" class="submenu-item">操作日志</a><a href="pages/system-setting.html" class="submenu-item">系统设置</a></div></div>';
        }
            // 切换应用弹窗
            var appTrigger = document.getElementById('app-switcher-trigger');
            var appPopover = document.getElementById('app-switcher-popover');
            if (appTrigger && appPopover && !appTrigger.hasAttribute('data-initialized')) {
            appTrigger.setAttribute('data-initialized', 'true');
            appTrigger.addEventListener('click', function(e) {
                e.stopPropagation();
                var isOpen = appPopover.classList.toggle('show');
                appTrigger.setAttribute('aria-expanded', isOpen);
                appPopover.setAttribute('aria-hidden', !isOpen);
            });
            // 点击外部关闭弹窗
            document.addEventListener('click', function(e) {
                if (!appTrigger.contains(e.target) && !appPopover.contains(e.target)) {
                    appPopover.classList.remove('show');
                    appTrigger.setAttribute('aria-expanded', 'false');
                    appPopover.setAttribute('aria-hidden', 'true');
                }
            });
            appPopover.addEventListener('click', function(e) {
                // 查找被点击的应用切换项（支持点击链接本身或其子元素）
                var item = e.target.closest('.app-switcher-item');
                if (!item) {
                    // 如果没找到，可能是点击了其他区域，不处理
                    return;
                }
                
                var appId = item.getAttribute('data-app');
                if (!appId) {
                    console.warn('⚠️ 应用切换项缺少data-app属性');
                    return;
                }
                
                // 阻止默认行为（防止链接跳转）
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🔄 点击应用切换项:', appId, '当前应用:', currentApp);
                
                // 先移除焦点，避免aria-hidden警告
                if (document.activeElement) {
                    document.activeElement.blur();
                }
                
                // 统一调用 switchApp，确保菜单和内容都会更新
                // switchApp函数内部会检查是否为当前应用
                try {
                    switchApp(appId);
                } catch (err) {
                    console.error('❌ 切换应用失败:', err);
                    alert('切换应用失败: ' + (err.message || err));
                }
                
                // 关闭弹窗（switchApp中已处理aria-hidden）
                setTimeout(function() {
                    appPopover.classList.remove('show');
                    appTrigger.setAttribute('aria-expanded', 'false');
                }, 50);
            });
            appTrigger.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    appTrigger.click();
                }
            });
        }
            // 暴露切换应用函数供全局使用
            window.switchApp = switchApp;

        // 页面加载时恢复之前选择的应用（只执行一次，避免重复初始化）
        (function() {
            var appStateInitialized = false;
            
            function restoreAppState() {
                // 防止重复执行
                if (appStateInitialized) {
                    return;
                }
                appStateInitialized = true;
                
                // 只在main.html页面时才恢复应用状态
                var currentUrl = window.location.href;
                var isMainPage = currentUrl.includes('main.html') || currentUrl.endsWith('/') || currentUrl.match(/\/原型\/?$/);
                if (!isMainPage) {
                    // 不是main.html页面，不需要恢复应用状态，但需要初始化currentApp
                    var savedApp = localStorage.getItem('currentApp');
                    if (savedApp && appConfigs[savedApp]) {
                        currentApp = savedApp;
                    }
                    return;
                }
                
                // 从localStorage读取保存的应用ID
                var savedApp = localStorage.getItem('currentApp');
                if (!savedApp || !appConfigs[savedApp]) {
                    // 如果没有保存的应用或应用配置不存在，使用默认应用
                    savedApp = 'design-collab';
                    localStorage.setItem('currentApp', savedApp);
                }
                
                // 更新currentApp变量（无论是否为默认应用都要更新，确保变量正确）
                currentApp = savedApp;
                
                // 如果保存的应用就是当前默认应用（设计协同系统），且HTML中已经是正确的，则不需要恢复UI
                if (savedApp === 'design-collab') {
                    console.log('ℹ️ 当前是默认应用，无需恢复UI');
                    return;
                }
                
                console.log('🔄 恢复应用状态:', savedApp);
                var config = appConfigs[savedApp];
                
                // 更新logo
                var logoIcon = document.querySelector('.logo-icon');
                var logoText = document.querySelector('.logo-text');
                if (logoIcon) logoIcon.textContent = config.logoIcon;
                if (logoText) logoText.textContent = config.name;
                
                // 更新菜单
                updateMenu(config.menu);
                
                // 关键：四应用菜单被 render 后只展开工作台，必须根据当前 URL 恢复激活项和展开状态
                var pageParam = new URLSearchParams(window.location.search).get('page');
                if (pageParam) {
                    if (window.AppSidebarMenu && AppSidebarMenu.setActiveForPage) {
                        AppSidebarMenu.setActiveForPage(pageParam);
                    } else if (typeof PageLoader !== 'undefined' && PageLoader.updateActiveMenu) {
                        PageLoader.updateActiveMenu(pageParam);
                    }
                }
                
                // 更新应用切换弹窗中的active状态
                document.querySelectorAll('.app-switcher-item').forEach(function(item) {
                    item.classList.remove('active');
                    var check = item.querySelector('.app-switcher-check');
                    if (check) check.remove();
                });
                var activeItem = document.querySelector('.app-switcher-item[data-app="' + savedApp + '"]');
                if (activeItem) {
                    activeItem.classList.add('active');
                    if (!activeItem.querySelector('.app-switcher-check')) {
                        var check = document.createElement('span');
                        check.className = 'app-switcher-check';
                        check.textContent = '✓';
                        activeItem.appendChild(check);
                    }
                }
                
                // 如果内容区域为空，加载对应应用的默认页面
                var container = document.getElementById('content-container');
                if (container && (!container.innerHTML || container.innerHTML.trim() === '')) {
                    if (typeof PageLoader !== 'undefined' && PageLoader.loadPage) {
                        // 延迟加载，确保菜单已更新
                        setTimeout(function() {
                            PageLoader.loadPage(config.defaultPage).catch(function(err) {
                                console.warn('加载默认页面失败:', err);
                                showAppPlaceholder(config);
                            });
                        }, 300);
                    }
                }
            }
            
            // 等待DOM和脚本加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(restoreAppState, 100);
                });
            } else {
                // DOM已加载，延迟执行确保其他脚本已初始化
                setTimeout(restoreAppState, 100);
            }
        })();

            // Tab 切换（全局委托只需初始化一次）
            var container = document.getElementById('content-container');
            if (container && !container.hasAttribute('data-tabs-global-init')) {
                container.setAttribute('data-tabs-global-init', '1');
                container.addEventListener('click', function(e) {
                    var tabsEl = e.target && e.target.closest ? e.target.closest('.tabs') : null;
                    if (tabsEl) {
                        var tab = e.target.closest ? e.target.closest('.tab-item') : null;
                        if (!tab) return;
                        var idx = tab.getAttribute('data-tab');
                        if (idx == null) return;
                        var allTabs = tabsEl.querySelectorAll('.tab-item');
                        var panes = container.querySelectorAll('.tab-pane');
                        for (var i = 0; i < allTabs.length; i++) allTabs[i].classList.remove('active');
                        for (var j = 0; j < panes.length; j++) panes[j].classList.remove('active');
                        tab.classList.add('active');
                        var pane = document.getElementById('tab-pane-' + idx);
                        if (pane) pane.classList.add('active');
                        return;
                    }
                    var designerTabs = e.target && e.target.closest ? e.target.closest('.designer-tabs') : null;
                    if (designerTabs) {
                        var dtab = e.target.closest('.designer-tab');
                        if (!dtab) return;
                        var id = dtab.getAttribute('data-tab');
                        if (!id) return;
                        var allTabs2 = designerTabs.querySelectorAll('.designer-tab');
                        var allContents2 = container.querySelectorAll('.designer-tab-content');
                        allTabs2.forEach(function(t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
                        allContents2.forEach(function(c) { c.classList.remove('active'); });
                        dtab.classList.add('active');
                        dtab.setAttribute('aria-selected', 'true');
                        var pane2 = document.getElementById('tab-' + id);
                        if (pane2) pane2.classList.add('active');
                    }
                });
            }
        } // end app switch global init

        // 返回按钮
        root.querySelectorAll('.btn-back').forEach(btn => {
            if (!btn.hasAttribute('data-initialized')) {
                btn.addEventListener('click', function() {
                    const listUrl = this.dataset.url || 'list.html';
                    PageInteractions.navigateToList(listUrl);
                });
                btn.setAttribute('data-initialized', 'true');
            }
        });

        // 提交按钮
        root.querySelectorAll('.btn-submit').forEach(btn => {
            if (!btn.hasAttribute('data-initialized')) {
                btn.addEventListener('click', function() {
                    const formSelector = this.dataset.form || 'form';
                    const listUrl = this.dataset.list || 'list.html';
                    PageInteractions.submitForm(formSelector, listUrl);
                });
                btn.setAttribute('data-initialized', 'true');
            }
        });

        // Modal提交按钮
        root.querySelectorAll('.btn-modal-submit').forEach(btn => {
            if (!btn.hasAttribute('data-initialized')) {
                btn.addEventListener('click', function() {
                    const modalId = this.dataset.modal || 'create-modal';
                    const overlay = document.getElementById(modalId);
                    if (!overlay) {
                        alert('Modal未找到！');
                        return;
                    }

                    const form = overlay.querySelector('form');
                    if (!form) {
                        alert('表单不存在！');
                        return;
                    }

                    // 基本验证
                    const requiredFields = form.querySelectorAll('[required]');
                    for (let field of requiredFields) {
                        if (!field.value.trim()) {
                            const labelEl = field.previousElementSibling;
                            let label = '该字段';
                            if (labelEl && typeof labelEl.textContent === 'string') {
                                label = labelEl.textContent;
                            }
                            alert(`请填写"${label.replace('*','').trim()}"`);
                            field.focus();
                            return;
                        }
                    }

                    // 模拟保存
                    alert('✅ 保存成功！');

                    // 关闭Modal
                    PageInteractions.closeModal(modalId);
                });
                btn.setAttribute('data-initialized', 'true');
            }
        });

        // 取消按钮
        root.querySelectorAll('.btn-cancel').forEach(btn => {
            if (!btn.hasAttribute('data-initialized')) {
                btn.addEventListener('click', function() {
                    const listUrl = this.dataset.url || 'list.html';
                    PageInteractions.navigateToList(listUrl);
                });
                btn.setAttribute('data-initialized', 'true');
            }
        });

        // 首次加载时默认展开工作台（菜单点击由 page-loader 统一处理）
        if (!PageInteractions._menuInitialized) {
            PageInteractions.initMenu(true);
            PageInteractions._menuInitialized = true;
        }

        console.log('✅ 页面按钮事件已初始化');
    },
    // 初始化菜单默认展开（仅设计协同切换时调用；四应用由 AppSidebarMenu 处理）
    initMenu: function(fromMenuReplace) {
        if (!fromMenuReplace) return;
        var menuContainer = document.querySelector('.sidebar-menu');
        if (!menuContainer) return;

        // 设计协同：默认展开工作台、有活动项的菜单
        document.querySelectorAll('.menu-item-parent').forEach(function(parent) {
            var submenu = parent.nextElementSibling;
            if (!submenu || !submenu.classList.contains('submenu')) {
                var sec = parent.closest('.menu-section');
                submenu = sec ? sec.querySelector('.submenu') : null;
            }
            if (!submenu) return;
            var hasActive = submenu.querySelector('.submenu-item.active');
            var isHome = submenu.id === 'submenu-home';
            if (hasActive || isHome) {
                submenu.style.cssText = 'display:block;max-height:1200px;opacity:1;visibility:visible;';
                submenu.offsetHeight;
                submenu.classList.add('open');
                parent.classList.add('expanded');
            }
        });
        console.log('✅ 菜单已初始化');
    },
    _currentTodoFillOpinionBtn: null,
    openTodoFillOpinionModal: function(btn) {
        PageInteractions._currentTodoFillOpinionBtn = btn;
        var handleNo = btn.getAttribute('data-handle-no') || '';
        var summary = btn.getAttribute('data-summary') || '';
        var isConcession = summary.indexOf('让步接收') !== -1;
        var body = document.getElementById('todo-fill-opinion-modal-body');
        var modal = document.getElementById('todo-fill-opinion-modal');
        if (!body || !modal) return;
        var bodyHtml = '<div style="font-size:13px;color:#262626;">' +
            '<div style="margin-bottom:16px;padding:12px;background:#fafafa;border-radius:4px;">' +
            '<div style="margin-bottom:8px;"><strong>处理单号：</strong>' + handleNo + '</div>' +
            '<div style="margin-bottom:8px;"><strong>物料与初步处理：</strong><br><span style="color:#595959;">' + (summary || '') + '</span></div></div>' +
            '<div style="margin-bottom:12px;"><strong>是否同意</strong> <span style="color:#ff4d4f;">*</span></div>' +
            '<select id="todo-opinion-agree" class="form-select" style="width:100%;max-width:200px;margin-bottom:16px;">' +
            '<option value="">请选择</option><option value="agree">同意</option><option value="disagree">不同意</option></select>' +
            '<div style="margin-bottom:8px;"><strong>处理意见</strong>（不同意时必填）</div>' +
            '<textarea id="todo-opinion-content" class="form-input" rows="3" placeholder="不同意时请填写处理意见" style="width:100%;margin-bottom:16px;resize:vertical;"></textarea>' +
            '<div style="margin-bottom:8px;"><strong>建议处理方式</strong></div>' +
            '<select id="todo-opinion-suggestion" class="form-select" style="width:100%;max-width:200px;margin-bottom:16px;">' +
            '<option value="">无建议</option><option value="return">建议退货</option><option value="exchange">建议换货</option><option value="concession">建议让步接收</option></select>' +
            (isConcession ? '<div id="todo-opinion-concession-wrap" style="margin-top:16px;padding-top:16px;border-top:1px dashed #e8e8e8;">' +
            '<div style="font-size:12px;color:#595959;margin-bottom:12px;">让步接收需填写：</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:12px 20px;margin-bottom:12px;">' +
            '<div><label style="font-size:12px;color:#8c8c8c;">处理方案</label><select id="todo-opinion-plan" class="form-select" style="width:140px;margin-left:4px;"><option value="">请选择</option><option value="downgrade">降级接收</option><option value="discount">让步使用(折价)</option><option value="as-is">让步使用(原价)</option></select></div>' +
            '<div><label style="font-size:12px;color:#8c8c8c;">原等级</label><input type="text" id="todo-opinion-orig-grade" class="form-input" placeholder="如一级品" style="width:90px;margin-left:4px;"></div>' +
            '<div><label style="font-size:12px;color:#8c8c8c;">降级后等级</label><input type="text" id="todo-opinion-downgrade-grade" class="form-input" placeholder="如二级品" style="width:90px;margin-left:4px;"></div></div></div>' : '') +
            '</div>';
        body.innerHTML = bodyHtml;
        modal.classList.add('active');
    }
};

// 页面加载完成后自动初始化按钮
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        PageInteractions.initButtons();
    });
} else {
    PageInteractions.initButtons();
}

// 为动态加载的内容初始化按钮（如果PageLoader已加载）
if (typeof PageLoader !== 'undefined' && PageLoader.loadPage) {
    const originalLoadPage = PageLoader.loadPage;
    PageLoader.loadPage = async function(url, updateUrl) {
        await originalLoadPage.call(this, url, updateUrl);
        requestAnimationFrame(function() {
            // 性能优化：只初始化内容区按钮事件
            var container = document.getElementById('content-container');
            PageInteractions.initButtons(container || document);
            requestAnimationFrame(function() {
                if (window.AppSidebarMenu && AppSidebarMenu.setActiveForPage) {
                    AppSidebarMenu.setActiveForPage(url);
                } else if (PageLoader.updateActiveMenu) {
                    PageLoader.updateActiveMenu(url);
                }
            });
        });
    };
}

// 绩效配置弹窗：评估周期变更时联动更新说明、维度、权重、报表生成日等（事件委托，支持 main 动态加载）
(function() {
    var defaults = {
        monthly: { supply: 35, quality: 35, price: 15, service: 15, coop: 0, tip: '月度：侧重交付与质量，用于日常管控；数据可汇总参与季度评估。', summary: '月度，4 维（供货/质量/价格/服务，侧重供货与质量）', namePlaceholder: '如：供应商月度绩效评估配置', reportDay: '次月1日' },
        quarterly: { supply: 25, quality: 30, price: 25, service: 20, coop: 0, tip: '季度：常规绩效，四维均衡；结果可参与年度综合评估。', summary: '季度，4 维（供货/质量/价格/服务）', namePlaceholder: '如：供应商季度绩效评估配置', reportDay: '周期结束后次月1日' },
        annual: { supply: 20, quality: 25, price: 20, service: 20, coop: 15, tip: '年度：综合定级与战略合作，含合作与创新等长期维度。', summary: '年度，5 维（供货/质量/价格/服务 + 合作与创新）', namePlaceholder: '如：供应商年度绩效评估配置', reportDay: '次年1月15日' }
    };
    function updateWeightSum() {
        var cycleSelect = document.getElementById('modal-config-cycle');
        var cycle = cycleSelect ? cycleSelect.value : '';
        var wSupply = document.getElementById('modal-w-supply');
        var wQuality = document.getElementById('modal-w-quality');
        var wPrice = document.getElementById('modal-w-price');
        var wService = document.getElementById('modal-w-service');
        var wCoop = document.getElementById('modal-w-coop');
        var sumEl = document.getElementById('modal-weight-sum');
        var tipEl = document.getElementById('modal-weight-tip');
        var sum = (wSupply ? parseInt(wSupply.value || 0, 10) : 0) + (wQuality ? parseInt(wQuality.value || 0, 10) : 0) + (wPrice ? parseInt(wPrice.value || 0, 10) : 0) + (wService ? parseInt(wService.value || 0, 10) : 0);
        if (cycle === 'annual' && wCoop) sum += parseInt(wCoop.value || 0, 10);
        if (sumEl) sumEl.textContent = sum;
        if (tipEl) { tipEl.textContent = sum === 100 ? '' : (sum < 100 ? '（未满100%）' : '（超过100%）'); }
    }
    function applyPerformanceCycleDefaults(cycle) {
        var d = defaults[cycle];
        if (!d) return;
        var cycleTip = document.getElementById('modal-cycle-tip');
        var dimensionSummary = document.getElementById('modal-dimension-summary');
        var configName = document.getElementById('modal-config-name');
        var reportDay = document.getElementById('modal-config-report-day');
        var wSupply = document.getElementById('modal-w-supply');
        var wQuality = document.getElementById('modal-w-quality');
        var wPrice = document.getElementById('modal-w-price');
        var wService = document.getElementById('modal-w-service');
        var wCoop = document.getElementById('modal-w-coop');
        var dim5th = document.getElementById('modal-dimension-5th');
        if (cycleTip) cycleTip.textContent = d.tip;
        if (dimensionSummary) dimensionSummary.textContent = d.summary;
        if (configName) configName.placeholder = d.namePlaceholder || '';
        if (reportDay) reportDay.value = d.reportDay || '';
        if (wSupply) wSupply.value = d.supply;
        if (wQuality) wQuality.value = d.quality;
        if (wPrice) wPrice.value = d.price;
        if (wService) wService.value = d.service;
        if (wCoop) wCoop.value = d.coop;
        if (dim5th) {
            if (cycle === 'annual') { dim5th.style.display = 'block'; dim5th.style.gridColumn = '1 / -1'; }
            else { dim5th.style.display = 'none'; if (wCoop) wCoop.value = 0; }
        }
        updateWeightSum();
    }
    window.applyPerformanceCycleDefaults = applyPerformanceCycleDefaults;
    document.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'modal-config-cycle') {
            applyPerformanceCycleDefaults(e.target.value);
        }
    });
    window.addEventListener('page-loaded', function(ev) {
        var url = (ev && ev.detail && ev.detail.url) ? ev.detail.url : '';
        if (url.indexOf('procurement-supplier-performance-config') !== -1) {
            var sel = document.getElementById('modal-config-cycle');
            if (sel) applyPerformanceCycleDefaults(sel.value);
        }
    });
})();

console.log('📝 页面交互模块已加载');
