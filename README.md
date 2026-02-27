# 设计协同系统 - 完整原型

## 系统概述

这是一个**PLM（产品生命周期管理）系统**的BOM全生命周期管理平台，采用单页应用（SPA）架构，涵盖：

### 核心模块（14个，共55个页面）

1. **技术任务管理**（3个页面）
   - 技术任务列表、详情、创建

2. **设计任务管理**（5个页面）
   - 设计任务列表、详情、分配、执行、审核

3. **EBOM管理**（4个页面）
   - EBOM列表、详情、创建、评审

4. **MBOM管理**（4个页面）
   - MBOM列表、详情、创建、评审

5. **SBOM管理**（4个页面）
   - SBOM列表、详情、创建、评审

6. **变更管理**（10个页面）
   - 变更申请：列表、详情、创建
   - 变更会审：列表、详情、创建
   - 变更单：列表、详情、创建、执行
   - 紧急变更：列表

7. **系统联动**（4个页面）
   - ERP/MES/WMS集成、同步日志

8. **基础信息管理**（6个页面）
    - 物料档案、产品档案、组织架构、人员、角色权限

9. **考核与改进**（3个页面）
    - KPI仪表盘、绩效统计、改进计划

10. **通知管理**（3个页面）
    - 通知中心、待办事项、预警配置

11. **预警管理**（3个页面）
    - 预警列表、预警规则配置、预警处理

12. **报表管理**（4个页面）
    - 报表仪表盘、BOM统计、变更统计、自定义报表

13. **系统配置**（4个页面）
    - 编码规则、工作流、数据字典、系统设置

---

## 快速开始

### 1. 启动本地服务

**Windows**（推荐）:
- 双击 **`start-server.bat`** 或 **`启动服务器.vbs`**（后者会自动打开浏览器）
- 或在该目录下执行：`python start_server.py`

**Mac/Linux**:
```bash
cd 原型
python3 start_server.py
```

默认端口 **8080**。如需更换，可设置环境变量 `SERVER_PORT`（如 `SERVER_PORT=8888`）。详见 **`本地服务说明.md`**。

### 2. 访问系统

打开浏览器访问：
```
http://localhost:8080/main.html
```
或直接：
```
http://localhost:8080/main.html
```

### 3. 强制刷新浏览器

**Windows**: `Ctrl + Shift + R` 或 `Ctrl + F5`
**Mac**: `Cmd + Shift + R`

---

## 文件结构

```
design-collaboration/
├── main.html              # 主框架（单页应用入口）
├── index.html             # 欢迎页（自动跳转）
├── start_server.py        # 本地服务（Python）
├── start-server.bat       # 服务启动脚本
├── 启动服务器.vbs         # 一键启动并打开浏览器
├── 本地服务说明.md        # 本地服务配置说明
├── favicon.ico            # 网站图标
├── assets/
│   ├── system.css         # 系统全局样式
│   ├── page-loader.js     # 页面加载器（SPA核心）
│   └── page-interactions.js
└── pages/                 # 页面内容目录
    ├── tech-task-list.html
    ├── tech-task-detail.html
    ├── tech-task-create.html
    ├── design-task-list.html
    ├── design-task-detail.html
    ├── design-task-assign.html
    ├── design-task-execute.html
    ├── design-task-review.html
    ├── ebom-list.html
    ├── ebom-detail.html
    ├── ebom-create.html
    ├── ebom-review.html
    ├── mbom-list.html
    ├── mbom-detail.html
    ├── mbom-create.html
    ├── mbom-review.html
    ├── sbom-list.html
    ├── sbom-detail.html
    ├── sbom-create.html
    ├── sbom-review.html
    ├── change-request-list.html
    ├── change-request-detail.html
    ├── change-request-create.html
    ├── change-review-list.html
    ├── change-review-detail.html
    ├── change-review-create.html
    ├── change-order-list.html
    ├── change-order-detail.html
    ├── change-order-create.html
    ├── change-order-execute.html
    ├── emergency-change-list.html
    ├── operation-log.html
    ├── sync-erp.html
    ├── sync-mes.html
    ├── sync-wms.html
    ├── sync-log.html
    ├── material-list.html
    ├── material-detail.html
    ├── product-structure.html
    ├── organization-list.html
    ├── user-list.html
    ├── role-permission.html
    ├── kpi-dashboard.html
    ├── performance-stats.html
    ├── improvement-plan.html
    ├── notification-center.html
    ├── todo-list.html
    ├── dashboard.html     # 工作台
    ├── alert-list.html
    ├── alert-rule-config.html
    ├── alert-handle.html
    ├── report-dashboard.html
    ├── report-bom-stats.html
    ├── report-change-stats.html
    ├── report-custom.html
    ├── config-coding-rule.html
    ├── config-workflow.html
    ├── config-dictionary.html
    └── system-setting.html
```

---

## 技术架构

### 单页应用（SPA）

采用**单页应用架构**，具有以下优势：

✅ **代码复用**：Header和Sidebar只维护一份
✅ **快速加载**：页面切换无需刷新
✅ **统一体验**：所有页面共享同一框架
✅ **易于维护**：修改框架一次生效

### 核心技术

- **纯HTML/CSS/JavaScript**：无框架依赖
- **Fetch API**：动态加载页面内容
- **History API**：支持浏览器前进后退
- **DOMParser**：解析并提取页面内容

### 页面加载流程

1. 用户点击菜单链接
2. `page-loader.js` 拦截点击事件
3. Fetch目标页面内容
4. 提取 `.content-wrapper` 内容
5. 更新到 `#content-container`
6. 更新浏览器URL（不刷新页面）
7. 滚动到顶部

---

## 业务流程

### 技术任务管理 → 设计任务管理 → EBOM创建

1. **技术任务**：创建产品研发任务
2. **设计任务**：拆解为具体设计任务（电气、结构等）
3. **EBOM生成**：设计任务完成后自动生成EBOM

### EBOM → MBOM → SBOM 转化

1. **EBOM**：工程BOM（设计BOM）
2. **MBOM**：制造BOM（从EBOM转化，添加工序信息）
3. **SBOM**：服务BOM（从MBOM筛选，添加维修要求）

### 变更全流程

1. **变更申请**：发起变更需求
2. **变更会审**：跨部门评审（一票否决制）
3. **变更单**：落实具体变更操作
4. **变更执行**：执行变更并验证

---

## 页面导航

### 左侧菜单结构

```
设计协同系统
├─ 任务管理
│  ├─ 技术任务
│  └─ 设计任务
├─ BOM管理
│  ├─ EBOM管理
│  │  ├─ EBOM列表
│  │  └─ 创建EBOM
│  ├─ MBOM管理
│  │  ├─ MBOM列表
│  │  └─ 创建MBOM
│  ├─ SBOM管理
│  │  ├─ SBOM列表
│  │  └─ 创建SBOM
├─ 变更管理
│  ├─ 变更申请
│  ├─ 变更会审
│  ├─ 变更单
│  └─ 紧急变更
├─ 系统联动
│  ├─ ERP集成
│  ├─ MES集成
│  └─ WMS集成
├─ 基础信息
│  ├─ 物料档案
│  ├─ 产品档案
│  ├─ 组织架构
│  └─ 人员管理
├─ 统计报表
│  ├─ KPI仪表盘
│  └─ 报表中心
└─ 系统配置
   ├─ 通知中心
   ├─ 待办事项
   ├─ 预警管理
   └─ 系统设置
```

---

## 设计规范

### 颜色方案

- **主色**：#1890ff（蓝色）
- **成功**：#52c41a（绿色）
- **警告**：#faad14（橙色）
- **错误**：##ff4d4f（红色）
- **背景**：#f0f2f5（浅灰）
- **侧边栏**：#001529（深蓝）

### 状态颜色

| 状态 | 颜色 | 背景色 |
|------|------|--------|
| 草稿 | #666 | #f5f5f5 |
| 进行中 | #fa8c16 | #fff7e6 |
| 已完成 | #52c41a | #f6ffed |
| 已驳回 | #ff4d4f | #fff2f0 |
| 已发布 | #1890ff | #e6f7ff |

### 组件规范

- **按钮**：圆角4px，高度32/36/40px
- **输入框**：边框#d9d9d9，聚焦时#40a9ff
- **卡片**：白色背景，阴影0 1px 2px rgba(0,0,0,0.03)
- **表格**：表头#fafafa背景，行悬停#fafafa
- **分页**：按钮间距8px，当前页蓝色背景

---

## 功能特性

### ✅ 已实现

1. **单页应用架构**
   - 动态加载页面内容
   - 无刷新页面切换
   - 浏览器前进后退支持

2. **左侧菜单**
   - 两级菜单展开/收起
   - 活动状态高亮
   - 自动展开对应子菜单

3. **响应式布局**
   - 适配桌面端和移动端
   - 移动端菜单自动收起

4. **统一组件**
   - 筛选栏、操作栏、表格、分页
   - 统一的样式和交互

### 🚀 扩展性

当前原型为基础框架，可进一步扩展：

1. **真实数据对接**
   - 替换Mock数据为API调用
   - 添加Loading状态
   - 错误处理

2. **交互增强**
   - 表单验证
   - 数据校验
   - 提交确认

3. **高级功能**
   - 批量操作
   - 数据导入导出
   - 图表可视化

---

## 使用说明

### 查看页面

1. 启动本地服务
2. 访问 `http://localhost:8080/main.html`
3. 点击左侧菜单查看不同页面
4. 点击页面内链接跳转

### 修改页面

编辑 `pages/` 目录下的对应HTML文件即可。

### 修改样式

编辑 `assets/system.css` 全局样式文件。

### 修改菜单

编辑 `main.html` 中的侧边栏菜单配置。

---

## 常见问题

### Q: 页面无法加载？
**A**:
1. 确保本地服务已启动（`python start_server.py` 或 双击 `start-server.bat`）
2. 强制刷新浏览器（`Ctrl+Shift+R`）
3. 检查浏览器控制台错误（F12）

### Q: 点击菜单无反应？
**A**:
1. 打开浏览器控制台（F12）查看错误
2. 确认 `pages/` 目录下对应文件存在
3. 检查 `assets/page-loader.js` 是否加载

### Q: 样式显示异常？
**A**:
1. 强制刷新浏览器清除缓存
2. 检查 `assets/system.css` 是否存在
3. 检查网络标签确认资源加载成功

---

## 基于设计文档

本系统基于以下设计文档创建：

- **设计协同详细设计文档**：完整业务逻辑和数据结构
- **设计协同功能清单**：全部功能项和优先级

### 核心业务对象

- **技术任务**：任务拆解、分配、跟踪、审核
- **设计任务**：任务分配、执行、提交、审核
- **EBOM**：工程BOM（设计BOM/技术BOM）
- **MBOM**：制造BOM（生产BOM）
- **SBOM**：服务BOM（维修BOM）
- **变更会审单**：变更评审协调
- **变更单**：变更执行落实

---

## 后续开发建议

### 短期（1-2周）

1. **完善页面交互**
   - 表单验证和提交
   - Modal弹窗交互
   - 删除确认对话框

2. **添加Mock数据**
   - 列表页添加示例数据
   - 详情页添加详细信息
   - 模拟真实业务场景

3. **完善导航流程**
   - 面包屑导航点击
   - 返回按钮功能
   - 首页推荐页面

### 中期（1-2个月）

1. **对接后端API**
   - 替换Mock数据
   - 实现CRUD操作
   - 添加Loading状态

2. **表单验证**
   - 前端校验
   - 后端校验
   - 错误提示

3. **高级功能**
   - 批量操作
   - 数据导入导出
   - 权限控制

### 长期（3-6个月）

1. **完整功能实现**
   - 所有56个页面的完整功能
   - 业务流程打通
   - 数据联动实现

2. **系统优化**
   - 性能优化
   - 用户体验优化
   - 移动端适配

3. **测试和上线**
   - 功能测试
   - 集成测试
   - 用户验收测试
   - 生产环境部署

---

## 版本信息

- **版本号**：v1.0.0
- **创建时间**：2026-01-28
- **页面数量**：56个页面
- **代码行数**：约10,000+ 行
- **架构类型**：单页应用（SPA）

---

## 技术支持

如有问题或建议，请反馈给开发团队。

---

**祝使用愉快！** 🎉
