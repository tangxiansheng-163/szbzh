/**
 * 页面加载器
 * 实现单页应用（SPA）的动态页面加载
 */

const PageLoader = (function() {
    let contentContainer = null;
    // 当前页面的清理函数
    let __currentPageCleanups = [];
    // 初始 window 对象的属性集合
    let __initialWindowProps = new Set();
    // 当前页面前的 window 属性集合
    let __prePageWindowProps = new Set();
    // 当前页面的唯一 ID
    let __currentPageId = null;
    // 性能优化：页面缓存（避免同一页面反复 fetch + DOMParser）
    // key: url -> { wrapperHtml, scriptCodes, ts }
    const __pageCache = new Map();
    const __cacheTtlMs = 5 * 60 * 1000; // 5分钟（原型场景足够）

    /**
     * 生成唯一的页面 ID
     */
    function generatePageId() {
        return 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 初始化
     */
    function init() {
        contentContainer = document.getElementById('content-container');
        if (!contentContainer) {
            console.error('Content container not found!');
            return false;
        }
        
        // 记录初始 window 对象的所有属性
        for (let prop in window) {
            __initialWindowProps.add(prop);
        }
        __prePageWindowProps = new Set(__initialWindowProps);
        
        // 暴露注册清理函数的API
        window.registerPageCleanup = function(cleanupFn) {
            if (typeof cleanupFn === 'function') {
                __currentPageCleanups.push(cleanupFn);
                console.log('✅ 已注册页面清理函数');
            }
        };
        
        // 暴露获取当前页面 ID 的 API
        window.getCurrentPageId = function() {
            return __currentPageId;
        };
        
        // 暴露检查页面是否有效的 API
        window.isCurrentPageValid = function(pageId) {
            return __currentPageId === pageId;
        };
        
        return true;
    }
    
    /**
     * 记录执行脚本前的 window 状态
     */
    function recordPreScriptState() {
        __prePageWindowProps = new Set();
        for (let prop in window) {
            __prePageWindowProps.add(prop);
        }
    }
    
    /**
     * 记录执行脚本后的 window 状态，找出新增的属性
     */
    function recordPostScriptState() {
        const newProps = [];
        for (let prop in window) {
            if (!__prePageWindowProps.has(prop)) {
                newProps.push(prop);
            }
        }
        console.log('📝 当前页面新增的全局变量/函数:', newProps);
        return newProps;
    }
    
    /**
     * 清理当前页面
     */
    function cleanupCurrentPage() {
        // 执行页面注册的清理函数
        if (__currentPageCleanups.length > 0) {
            console.log('🧹 执行页面清理函数，数量:', __currentPageCleanups.length);
            __currentPageCleanups.forEach((cleanup, index) => {
                try {
                    cleanup();
                    console.log('   清理函数', index + 1, '执行完成');
                } catch (e) {
                    console.warn('   清理函数', index + 1, '执行失败:', e);
                }
            });
            __currentPageCleanups = [];
        }
        
        // 清理所有定时器
        let maxId = setTimeout(function(){});
        for (let i = 1; i <= maxId; i++) {
            clearTimeout(i);
            clearInterval(i);
        }
        console.log('🧹 已清理所有定时器');
        
        // 清理页面新增的全局变量和函数
        const propsToClean = [];
        for (let prop in window) {
            if (!__initialWindowProps.has(prop)) {
                propsToClean.push(prop);
            }
        }
        
        if (propsToClean.length > 0) {
            console.log('🧹 清理页面新增的全局变量/函数:', propsToClean);
            propsToClean.forEach(prop => {
                try {
                    // 跳过我们自己的 API
                    if (prop === 'registerPageCleanup' || 
                        prop === 'getCurrentPageId' || 
                        prop === 'isCurrentPageValid') return;
                    
                    // 尝试删除属性
                    delete window[prop];
                    
                    // 如果删除失败，设置为 undefined
                    if (window[prop] !== undefined) {
                        window[prop] = undefined;
                    }
                } catch (e) {
                    console.warn('   无法清理属性:', prop, e);
                }
            });
        }
    }

    /**
     * 加载页面
     */
    async function loadPage(url, updateUrl = true) {
        // 确保已初始化
        if (!contentContainer && !init()) {
            return;
        }

        try {
            console.log('🔄 开始加载页面:', url);
            // 先清理当前页面
            cleanupCurrentPage();
            showLoading();

            // 优先使用缓存（开发环境禁用缓存）
            let cached = __pageCache.get(url);
            let wrapperHtml = null;
            let scriptCodes = null;
            let externalScripts = [];
            let externalStylesheets = [];
            let pageStyles = [];
            // 强制刷新，不使用缓存
            cached = null;
            if (false && cached && (Date.now() - cached.ts) < __cacheTtlMs) {
                wrapperHtml = cached.wrapperHtml;
                scriptCodes = cached.scriptCodes;
                externalScripts = cached.externalScripts || [];
                externalStylesheets = cached.externalStylesheets || [];
                pageStyles = cached.pageStyles || [];
            } else {
                // 获取页面内容
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();

            // 解析HTML并提取 content-wrapper
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // 解析页面 URL 作为资源路径的基准（用于 ../assets/ 等相对路径）
            const pageBaseUrl = new URL(url, window.location.href);

            // 提取页面样式：<style> 标签 + <link rel="stylesheet"> 外部样式
            const styleTags = doc.querySelectorAll('style');
            pageStyles = [];
            styleTags.forEach(style => {
                if (style.innerHTML) {
                    pageStyles.push(style.innerHTML);
                }
            });
            const linkTags = doc.querySelectorAll('link[rel="stylesheet"][href]');
            linkTags.forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    externalStylesheets.push(new URL(href, pageBaseUrl).href);
                }
            });

            // 尝试查找内容包装器（支持多种选择器）
            let contentWrapper = doc.querySelector('.content-wrapper');
            if (!contentWrapper) {
                console.warn('.content-wrapper 未找到，尝试查找 body 内容');
                contentWrapper = doc.body;
            }

            if (!contentWrapper) {
                console.error('HTML内容为空');
                throw new Error('页面内容为空');
            }

            // 提取页面脚本（inline + 外部脚本）
            // 先从 contentWrapper 中查找，如果没有，则从整个 doc 中查找
            let scripts = contentWrapper.querySelectorAll('script');
            console.log('在 contentWrapper 中找到脚本:', scripts.length, '个');
            
            if (scripts.length === 0) {
                // 从整个文档中查找脚本
                scripts = doc.querySelectorAll('script');
                console.log('在整个文档中找到脚本:', scripts.length, '个');
            }
            
            scriptCodes = [];
            externalScripts = [];
            scripts.forEach(script => {
                if (script.src) {
                    // 外部脚本，解析为绝对 URL（基于页面 URL）避免 SPA 下相对路径 404
                    const absoluteSrc = new URL(script.src, pageBaseUrl).href;
                    externalScripts.push(absoluteSrc);
                    console.log('提取外部脚本:', script.src, '->', absoluteSrc);
                } else {
                    // inline 脚本 - 使用 textContent 获取内容
                    const code = script.textContent || script.innerHTML;
                    if (code && code.trim()) {
                        scriptCodes.push(code);
                        console.log('提取 inline 脚本，长度:', code.length);
                    }
                }
                // 从 DOM 中移除脚本，避免重复执行
                script.remove();
            });
            console.log('共提取 inline 脚本:', scriptCodes.length, '个，外部脚本:', externalScripts.length, '个');

            wrapperHtml = contentWrapper.outerHTML;
            
            // 调试：检查 wrapperHtml 是否包含弹窗
            console.log('wrapperHtml 包含 category-add-modal:', wrapperHtml.includes('category-add-modal'));
            
            __pageCache.set(url, { wrapperHtml, scriptCodes, externalScripts, externalStylesheets, pageStyles, ts: Date.now() });
            }

            // 更新内容 - 先生成新的页面 ID，标记旧页面无效
            const newPageId = generatePageId();
            __currentPageId = newPageId;
            console.log('🆕 新页面 ID:', newPageId);
            
            // 清理上一次注入的动态脚本和样式，避免越切越慢
            try {
                contentContainer.querySelectorAll('script[data-dynamic-script]').forEach(function (s) { s.remove(); });
            } catch (e) {}
            // 清理上一次注入的页面样式和外部样式链接
            try {
                document.querySelectorAll('style[data-page-style]').forEach(function (s) { s.remove(); });
                document.querySelectorAll('link[data-page-style-link]').forEach(function (l) { l.remove(); });
            } catch (e) {}

            // 注入页面样式
            if (pageStyles && pageStyles.length > 0) {
                var styleElement = document.createElement('style');
                styleElement.setAttribute('data-page-style', 'true');
                styleElement.textContent = pageStyles.join('\n');
                document.head.appendChild(styleElement);
            }
            // 注入外部样式表
            if (externalStylesheets && externalStylesheets.length > 0) {
                externalStylesheets.forEach(function (href) {
                    var link = document.createElement('link');
                    link.setAttribute('rel', 'stylesheet');
                    link.setAttribute('href', href);
                    link.setAttribute('data-page-style-link', 'true');
                    document.head.appendChild(link);
                });
            }

            contentContainer.innerHTML = wrapperHtml;
            
            // 调试：检查弹窗元素是否存在（避免使用可选链，兼容老浏览器）
            console.log('contentContainer 子元素数量:', contentContainer.children.length);
            var firstChild = contentContainer.children.length > 0 ? contentContainer.children[0] : null;
            console.log('contentContainer 第一个子元素:', firstChild ? firstChild.tagName : null);
            console.log('contentContainer 第一个子元素 ID:', firstChild ? firstChild.id : null);
            
            // 在 contentContainer 内查找弹窗
            var modalInContainer = contentContainer.querySelector('#category-add-modal');
            console.log('在 contentContainer 内查找弹窗:', modalInContainer ? '找到' : '未找到');
            
            // 在整个文档中查找弹窗
            var modalInDocument = document.getElementById('category-add-modal');
            console.log('在整个文档中查找弹窗:', modalInDocument ? '找到' : '未找到');

            // 先更新 URL，确保页面脚本读取到正确的 location（含 type、product 等参数）
            if (updateUrl) {
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('page', url);
                window.history.pushState({ page: url }, '', newUrl);
            }

            // 先更新活动菜单（四应用用 AppSidebarMenu，设计协同用内置逻辑）
            if (window.AppSidebarMenu && AppSidebarMenu.setActiveForPage) {
                AppSidebarMenu.setActiveForPage(url);
            } else {
                updateActiveMenu(url);
            }

            // 延后一帧执行页面脚本，确保 SPA 切换后 contentContainer.innerHTML 已完全生效，
            // 避免「从其他页面再切回」时 getElementById 取不到节点导致绑定未执行、按钮点击失效
            var runScripts = async function() {
                // 记录执行脚本前的 window 状态
                recordPreScriptState();
                
                // 先加载外部脚本
                if (externalScripts && externalScripts.length > 0) {
                    console.log('加载外部脚本:', externalScripts);
                    for (const src of externalScripts) {
                        try {
                            const response = await fetch(src, { cache: 'no-store' });
                            let code = await response.text();
                            
                            // 对于 ECharts 这类库，不使用 IIFE 包装，因为它们需要暴露到 window
                            // 对于其他脚本，使用 IIFE 包装避免变量污染
                            if (!src.includes('echarts')) {
                                code = `(function() { ${code} })();`;
                            }
                            
                            eval(code);
                            console.log('外部脚本加载完成:', src);
                        } catch (e) {
                            console.warn('外部脚本加载失败:', src, e);
                        }
                    }
                }
                
                // 执行 inline 脚本
                console.log('开始执行 inline 脚本，数量:', scriptCodes.length);
                scriptCodes.forEach((code, index) => {
                    try {
                        console.log('执行第', index + 1, '个 inline 脚本');
                        // 使用 IIFE 包装脚本，避免变量污染全局作用域
                        // 这样 let/const 声明的变量不会污染全局，避免重复声明错误
                        const wrappedCode = `(function() { ${code} })();`;
                        eval(wrappedCode);
                        console.log('第', index + 1, '个 inline 脚本执行完成');
                    } catch (e) {
                        console.warn('脚本执行失败:', e);
                    }
                });
                
                // 记录执行脚本后的 window 状态
                recordPostScriptState();
                
                console.log('✅ 页面内容已加载');
                window.dispatchEvent(new CustomEvent('page-loaded',{detail:{url:url}}));
                window.scrollTo(0, 0);
            };
            setTimeout(runScripts, 0);

        } catch (error) {
            console.error('页面加载失败:', error);
            showError(error.message, url);
        } finally {
            hideLoading();
        }
    }

    /**
     * 显示加载状态
     */
    function showLoading() {
        if (!contentContainer) return;

        // 移除已存在的加载器
        const existingLoader = document.getElementById('page-loader');
        if (existingLoader) existingLoader.remove();

        const loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.className = 'loading-wrapper';
        loader.innerHTML = `
            <div class="loading-spinner"></div>
            <span class="loading-text">加载中...</span>
        `;
        contentContainer.insertBefore(loader, contentContainer.firstChild);
    }

    /**
     * 隐藏加载状态
     */
    function hideLoading() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.remove();
        }
    }

    /**
     * 更新活动菜单状态
     * 只更新活动链接状态，不折叠任何已展开的菜单
     */
    function updateActiveMenu(url) {
        console.log('🔄 updateActiveMenu 被调用，url:', url);
        
        // 标准化URL路径（移除查询参数，处理相对路径）
        var urlPath = url.split('?')[0];
        // 如果URL是绝对路径，提取相对路径部分
        if (urlPath.includes('/')) {
            var parts = urlPath.split('/');
            urlPath = parts[parts.length - 1]; // 取最后一部分作为文件名
        }
        
        console.log('🔄 标准化后的urlPath:', urlPath);
        
        const menuLinks = document.querySelectorAll('.sidebar-menu a[href]');
        
        // 移除所有菜单项的active状态
        document.querySelectorAll('.menu-item, .submenu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 找到当前活动链接并设置active状态，同时确保其父菜单展开
        var activeLink = null;
        var activeSubmenu = null;
        var activeParent = null;
        
        menuLinks.forEach(link => {
            var href = link.getAttribute('href') || '';
            // 标准化href路径
            var hrefPath = href.split('?')[0];
            if (hrefPath.includes('/')) {
                var parts = hrefPath.split('/');
                hrefPath = parts[parts.length - 1];
            }
            
            if (hrefPath === urlPath) {
                activeLink = link;
                link.classList.add('active');
                activeSubmenu = link.closest('.submenu');
                if (activeSubmenu) {
                    activeParent = activeSubmenu.previousElementSibling;
                    // 确保包含活动链接的菜单展开
                    if (!activeSubmenu.classList.contains('open')) {
                        activeSubmenu.style.display = 'block';
                        activeSubmenu.style.maxHeight = '1200px';
                        activeSubmenu.style.opacity = '1';
                        activeSubmenu.style.visibility = 'visible';
                        activeSubmenu.offsetHeight; // 触发重排
                        activeSubmenu.classList.add('open');
                    }
                    if (activeParent && activeParent.classList.contains('menu-item-parent')) {
                        activeParent.classList.add('expanded');
                    }
                    // 兼容不支持可选链的环境，安全获取菜单文本
                    var activeText = '未知';
                    if (activeParent) {
                        var textNode = activeParent.querySelector('.menu-text');
                        if (textNode && typeof textNode.textContent === 'string') {
                            activeText = textNode.textContent;
                        }
                    }
                    console.log('✅ 已设置活动链接并展开菜单:', activeText);
                }
            }
        });
        
        // 如果当前页面不在任何菜单项中，确保"工作台"菜单展开
        if (!activeLink) {
            var homeMenu = document.querySelector('#submenu-home');
            var homeParent = homeMenu ? homeMenu.previousElementSibling : null;
            if (homeMenu && homeParent && !homeMenu.classList.contains('open')) {
                homeMenu.style.display = 'block';
                homeMenu.style.maxHeight = '1200px';
                homeMenu.style.opacity = '1';
                homeMenu.style.visibility = 'visible';
                homeMenu.offsetHeight; // 触发重排
                homeMenu.classList.add('open');
                homeParent.classList.add('expanded');
                console.log('✅ 当前页面不在菜单中，已展开工作台菜单');
            }
        }
        
        console.log('✅ updateActiveMenu 完成');
    }

    /**
     * 显示错误信息
     */
    function showError(message, url) {
        if (!contentContainer) return;

        contentContainer.innerHTML = `
            <div class="content-wrapper">
                <div class="page-header">
                    <h1 class="page-title">页面加载失败</h1>
                </div>
                <div class="card">
                    <div class="card-body">
                        <div class="empty-state">
                            <div class="empty-icon">❌</div>
                            <div class="empty-text">无法加载页面</div>
                            <div class="empty-description">
                                ${message}<br>
                                <small style="color: #999;">请求URL: ${url}</small>
                            </div>
                            <button class="btn btn-primary" onclick="PageLoader.loadPage('${url}')">重新加载</button>
                            <button class="btn btn-default" onclick="PageLoader.reloadDefault()">返回工作台</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 加载工作台（仪表盘）
     */
    async function loadDefaultDashboard() {
        if (!contentContainer) return;
        await loadPage('pages/dashboard.html', false);
        const u = new URL(window.location);
        u.searchParams.delete('page');
        window.history.replaceState({}, '', u);
    }

    /**
     * 刷新当前页面
     */
    async function reload() {
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = urlParams.get('page');
        if (currentPage) {
            await loadPage(currentPage, false);
        } else {
            await loadDefaultDashboard();
        }
    }

    /**
     * 返回工作台
     */
    async function reloadDefault() {
        await loadDefaultDashboard();
    }

    // 公开API（暴露 updateActiveMenu 供 loadPage 完成后强制恢复菜单状态）
    return {
        loadPage: loadPage,
        reload: reload,
        reloadDefault: reloadDefault,
        init: init,
        updateActiveMenu: updateActiveMenu,
        // 暴露缓存控制，便于排查/手动刷新
        clearCache: function() { __pageCache.clear(); }
    };
})();

// 统一处理：侧栏菜单点击（展开/折叠 + 链接导航），使用捕获阶段确保最先执行
document.addEventListener('click', function(event) {
    var target = event.target;
    var sidebar = document.querySelector('.sidebar-menu');
    var inSidebar = sidebar && sidebar.contains(target);

    if (inSidebar) {
        var link = target.closest('a.submenu-item');
        if (link && link.href) {
            // 二级菜单链接：导航，不折叠
            var href = link.getAttribute('href') || '';
            if (href && !link.target && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('javascript:')) {
                event.preventDefault();
                event.stopPropagation();
                var pathOnly = href.split('?')[0];
                if (pathOnly.endsWith('.html')) {
                    var normalized = (href.startsWith('pages/') || href.startsWith('/') ? href.replace(/^\//, '') : 'pages/' + href).split('?')[0];
                    if (!normalized.startsWith('pages/')) normalized = 'pages/' + normalized;
                    PageLoader.loadPage(normalized);
                }
                return;
            }
        }
        var parent = target.closest('.menu-item-parent');
        if (parent && !target.closest('a')) {
            // 一级菜单：展开/折叠
            event.preventDefault();
            event.stopPropagation();
            var sub = parent.nextElementSibling;
            if (!sub || !sub.classList.contains('submenu')) {
                var sec = parent.closest('.menu-section');
                sub = sec ? sec.querySelector('.submenu') : null;
            }
            if (sub) {
                if (sub.classList.contains('open')) {
                    sub.style.cssText = '';
                    sub.classList.remove('open');
                    parent.classList.remove('expanded');
                } else {
                    sub.style.cssText = 'display:block;max-height:1200px;opacity:1;visibility:visible;';
                    sub.classList.add('open');
                    parent.classList.add('expanded');
                }
            }
            return;
        }
    }

    var link = target.closest('a');
    if (!link || !link.href) return;
    var href = link.getAttribute('href');
    if (!href || link.target === '_blank' || link.hasAttribute('download') ||
        href.startsWith('http://') || href.startsWith('https://') ||
        href.startsWith('mailto:') || href.startsWith('#') || href.startsWith('javascript:')) return;
    var pathOnly = href.split('?')[0];
    if (pathOnly.endsWith('.html')) {
        event.preventDefault();
        event.stopPropagation();
        var targetUrl = href.startsWith('pages/') || href.startsWith('/') ? href.replace(/^\//, '') : 'pages/' + href;
        var base = targetUrl.split('?')[0];
        var normalized = base.startsWith('pages/') ? targetUrl : 'pages/' + targetUrl;
        PageLoader.loadPage(normalized);
    }
}, true);

window.addEventListener('popstate', async function(event) {
    if (event.state && event.state.page) {
        PageLoader.loadPage(event.state.page, false);
    } else {
        await PageLoader.reloadDefault();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    PageLoader.init();

    // 菜单展开/收起由 page-interactions.js 的 initMenu 统一处理，避免重复绑定导致 toggle 互相抵消

    const urlParams = new URLSearchParams(window.location.search);
    const initialPage = urlParams.get('page');

    if (initialPage) {
        console.log('🚀 从URL加载页面:', initialPage);
        PageLoader.loadPage(initialPage);
    } else {
        console.log('🏠 加载工作台');
        PageLoader.loadPage('pages/dashboard.html');
    }

    console.log('✅ 页面加载器已就绪');
});

console.log('Page loader initialized');
