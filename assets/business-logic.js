/**
 * 业务逻辑处理模块
 * 提供统一的业务逻辑处理：状态流转、数据验证、业务规则、数据流转等
 */

const BusinessLogic = {
    // 状态流转配置
    statusFlow: {
        // 采购需求申请状态流转
        'procurement-demand': {
            'draft': ['pending', 'cancelled'],
            'pending': ['approved', 'rejected', 'cancelled'],
            'approved': ['merged', 'cancelled'],
            'rejected': ['draft', 'cancelled'],
            'merged': [],
            'cancelled': []
        },
        // 订单状态流转
        'order': {
            'draft': ['pending', 'cancelled'],
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['executing', 'cancelled'],
            'executing': ['partial', 'completed', 'cancelled'],
            'partial': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': []
        },
        // 待办事项状态流转
        'todo': {
            'pending': ['processing', 'completed', 'cancelled'],
            'processing': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': []
        }
    },

    // 字段验证规则
    validationRules: {
        // 需求申请字段验证
        'demand': {
            'demandNo': { required: true, pattern: /^DEM-\d{4}-\d{3,}$/, message: '需求编号格式：DEM-YYYY-XXX' },
            'applicant': { required: true, minLength: 2, maxLength: 50, message: '申请人姓名2-50个字符' },
            'department': { required: true, message: '请选择申请部门' },
            'demandAmount': { required: true, type: 'number', min: 0, message: '需求金额必须大于0' },
            'requiredDate': { required: true, type: 'date', minDate: 'today', message: '要求到货日期不能早于今天' },
            'materials': { required: true, minItems: 1, message: '至少添加一种物料' }
        },
        // 订单字段验证
        'order': {
            'orderNo': { required: true, pattern: /^SO-\d{4}-\d{3,}$/, message: '订单编号格式：SO-YYYY-XXX' },
            'supplier': { required: true, message: '请选择供应商' },
            'orderAmount': { required: true, type: 'number', min: 0, message: '订单金额必须大于0' },
            'deliveryDate': { required: true, type: 'date', minDate: 'today', message: '要求交期不能早于今天' },
            'orderItems': { required: true, minItems: 1, message: '至少添加一个订单明细' }
        }
    },

    // 状态流转处理
    changeStatus: function(entityType, currentStatus, newStatus, data) {
        console.log(`🔄 状态流转: ${entityType} ${currentStatus} -> ${newStatus}`);
        
        const flow = this.statusFlow[entityType];
        if (!flow || !flow[currentStatus]) {
            console.error(`未找到状态流转配置: ${entityType}.${currentStatus}`);
            return { success: false, message: '无效的状态流转配置' };
        }

        const allowedStatuses = flow[currentStatus];
        if (!allowedStatuses.includes(newStatus)) {
            return { 
                success: false, 
                message: `状态不能从"${this.getStatusLabel(currentStatus)}"流转到"${this.getStatusLabel(newStatus)}"` 
            };
        }

        // 执行状态流转前的业务校验
        const validation = this.validateStatusChange(entityType, currentStatus, newStatus, data);
        if (!validation.success) {
            return validation;
        }

        // 执行状态流转
        return {
            success: true,
            message: `状态已从"${this.getStatusLabel(currentStatus)}"流转到"${this.getStatusLabel(newStatus)}"`,
            data: {
                entityType: entityType,
                oldStatus: currentStatus,
                newStatus: newStatus,
                changeTime: new Date().toISOString()
            }
        };
    },

    // 状态流转前的业务校验
    validateStatusChange: function(entityType, currentStatus, newStatus, data) {
        // 需求申请：从待审核到已通过，需要检查是否有审核人
        if (entityType === 'procurement-demand' && currentStatus === 'pending' && newStatus === 'approved') {
            if (!data || !data.approver) {
                return { success: false, message: '请指定审核人' };
            }
            if (!data.approvalComment) {
                return { success: false, message: '请填写审核意见' };
            }
        }

        // 订单：从待确认到已确认，需要检查供应商是否已确认
        if (entityType === 'order' && currentStatus === 'pending' && newStatus === 'confirmed') {
            if (!data || !data.supplierConfirmed) {
                return { success: false, message: '供应商尚未确认订单' };
            }
        }

        // 订单：从执行中到已完成，需要检查是否全部交付
        if (entityType === 'order' && currentStatus === 'executing' && newStatus === 'completed') {
            if (!data || data.deliveryProgress < 100) {
                return { success: false, message: '订单尚未全部交付，无法完成' };
            }
        }

        return { success: true };
    },

    // 获取状态标签
    getStatusLabel: function(status) {
        const labels = {
            'draft': '草稿',
            'pending': '待审核',
            'approved': '已通过',
            'rejected': '已驳回',
            'merged': '已合并',
            'cancelled': '已取消',
            'confirmed': '已确认',
            'executing': '执行中',
            'partial': '部分交付',
            'completed': '已完成',
            'processing': '处理中'
        };
        return labels[status] || status;
    },

    // 表单字段验证
    validateField: function(fieldName, value, rules) {
        const rule = rules[fieldName];
        if (!rule) return { valid: true };

        // 必填验证
        if (rule.required && (!value || value.toString().trim() === '')) {
            return { valid: false, message: rule.message || `${fieldName}不能为空` };
        }

        // 类型验证
        if (rule.type === 'number' && value) {
            const num = parseFloat(value);
            if (isNaN(num)) {
                return { valid: false, message: rule.message || `${fieldName}必须是数字` };
            }
            if (rule.min !== undefined && num < rule.min) {
                return { valid: false, message: rule.message || `${fieldName}不能小于${rule.min}` };
            }
            if (rule.max !== undefined && num > rule.max) {
                return { valid: false, message: rule.message || `${fieldName}不能大于${rule.max}` };
            }
        }

        // 日期验证
        if (rule.type === 'date' && value) {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return { valid: false, message: rule.message || `${fieldName}日期格式不正确` };
            }
            if (rule.minDate === 'today') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (date < today) {
                    return { valid: false, message: rule.message || `${fieldName}不能早于今天` };
                }
            }
        }

        // 长度验证
        if (rule.minLength && value && value.length < rule.minLength) {
            return { valid: false, message: rule.message || `${fieldName}长度不能少于${rule.minLength}个字符` };
        }
        if (rule.maxLength && value && value.length > rule.maxLength) {
            return { valid: false, message: rule.message || `${fieldName}长度不能超过${rule.maxLength}个字符` };
        }

        // 正则验证
        if (rule.pattern && value && !rule.pattern.test(value)) {
            return { valid: false, message: rule.message || `${fieldName}格式不正确` };
        }

        // 数组/对象验证
        if (rule.minItems && Array.isArray(value) && value.length < rule.minItems) {
            return { valid: false, message: rule.message || `至少需要${rule.minItems}项` };
        }

        return { valid: true };
    },

    // 表单整体验证
    validateForm: function(formSelector, entityType) {
        const form = document.querySelector(formSelector);
        if (!form) {
            return { valid: false, message: '表单不存在' };
        }

        const rules = this.validationRules[entityType];
        if (!rules) {
            console.warn(`未找到验证规则: ${entityType}`);
            return { valid: true };
        }

        const errors = [];
        const formData = {};

        // 遍历所有字段进行验证
        Object.keys(rules).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                const value = field.type === 'checkbox' ? field.checked : field.value;
                const validation = this.validateField(fieldName, value, rules);
                
                if (!validation.valid) {
                    errors.push({ field: fieldName, message: validation.message });
                    // 添加错误样式
                    field.classList.add('field-error');
                    // 显示错误提示
                    this.showFieldError(field, validation.message);
                } else {
                    field.classList.remove('field-error');
                    this.hideFieldError(field);
                }
                
                formData[fieldName] = value;
            }
        });

        if (errors.length > 0) {
            return { 
                valid: false, 
                errors: errors,
                message: `表单验证失败，共${errors.length}个错误`
            };
        }

        return { valid: true, data: formData };
    },

    // 显示字段错误
    showFieldError: function(field, message) {
        // 移除旧的错误提示
        const oldError = field.parentElement.querySelector('.field-error-message');
        if (oldError) oldError.remove();

        // 创建错误提示元素
        const errorEl = document.createElement('div');
        errorEl.className = 'field-error-message';
        errorEl.style.color = '#ff4d4f';
        errorEl.style.fontSize = '12px';
        errorEl.style.marginTop = '4px';
        errorEl.textContent = message;
        
        field.parentElement.appendChild(errorEl);
    },

    // 隐藏字段错误
    hideFieldError: function(field) {
        const errorEl = field.parentElement.querySelector('.field-error-message');
        if (errorEl) errorEl.remove();
    },

    // 批量操作处理
    batchOperation: function(operation, selectedIds, entityType) {
        if (!selectedIds || selectedIds.length === 0) {
            return { success: false, message: '请至少选择一项进行操作' };
        }

        console.log(`📦 批量操作: ${operation}`, selectedIds);

        // 批量操作前的业务校验
        const validation = this.validateBatchOperation(operation, selectedIds, entityType);
        if (!validation.success) {
            return validation;
        }

        // 执行批量操作
        return {
            success: true,
            message: `已成功${this.getOperationLabel(operation)}${selectedIds.length}项`,
            data: {
                operation: operation,
                count: selectedIds.length,
                ids: selectedIds
            }
        };
    },

    // 批量操作业务校验
    validateBatchOperation: function(operation, selectedIds, entityType) {
        // 批量删除：检查是否有已执行或已完成的数据
        if (operation === 'delete') {
            // 这里可以添加具体的业务校验逻辑
            // 例如：不能删除已执行的订单
            return { success: true };
        }

        // 批量审核：检查是否都是待审核状态
        if (operation === 'approve') {
            // 这里可以添加具体的业务校验逻辑
            return { success: true };
        }

        return { success: true };
    },

    // 获取操作标签
    getOperationLabel: function(operation) {
        const labels = {
            'delete': '删除',
            'approve': '审核通过',
            'reject': '驳回',
            'export': '导出',
            'merge': '合并',
            'cancel': '取消'
        };
        return labels[operation] || operation;
    },

    // 数据流转处理（创建->审核->执行->完成）
    processDataFlow: function(flowType, currentStep, action, data) {
        console.log(`🔄 数据流转: ${flowType} ${currentStep} -> ${action}`);

        const flowConfig = {
            'procurement-demand': {
                steps: ['create', 'submit', 'review', 'approve', 'merge'],
                actions: {
                    'submit': { nextStep: 'review', requiredFields: ['demandNo', 'applicant', 'materials'] },
                    'approve': { nextStep: 'approve', requiredFields: ['approver', 'approvalComment'] },
                    'reject': { nextStep: 'rejected', requiredFields: ['rejectReason'] },
                    'merge': { nextStep: 'merged', requiredFields: ['planNo'] }
                }
            },
            'order': {
                steps: ['create', 'submit', 'confirm', 'execute', 'deliver', 'complete'],
                actions: {
                    'submit': { nextStep: 'confirm', requiredFields: ['orderNo', 'supplier', 'orderItems'] },
                    'confirm': { nextStep: 'execute', requiredFields: ['supplierConfirmed'] },
                    'execute': { nextStep: 'deliver', requiredFields: [] },
                    'complete': { nextStep: 'complete', requiredFields: ['deliveryProgress'] }
                }
            }
        };

        const config = flowConfig[flowType];
        if (!config) {
            return { success: false, message: '未找到数据流转配置' };
        }

        const actionConfig = config.actions[action];
        if (!actionConfig) {
            return { success: false, message: `无效的操作: ${action}` };
        }

        // 检查必填字段
        if (actionConfig.requiredFields && actionConfig.requiredFields.length > 0) {
            const missingFields = actionConfig.requiredFields.filter(field => !data || !data[field]);
            if (missingFields.length > 0) {
                return { 
                    success: false, 
                    message: `缺少必填字段: ${missingFields.join(', ')}` 
                };
            }
        }

        return {
            success: true,
            message: `操作成功，流程已流转到"${actionConfig.nextStep}"`,
            data: {
                flowType: flowType,
                currentStep: currentStep,
                nextStep: actionConfig.nextStep,
                action: action,
                timestamp: new Date().toISOString()
            }
        };
    },

    // 计算金额（含税、不含税）
    calculateAmount: function(items, taxRate) {
        let subtotal = 0;
        items.forEach(item => {
            const quantity = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.price) || 0;
            subtotal += quantity * price;
        });

        const tax = taxRate ? subtotal * parseFloat(taxRate) / 100 : 0;
        const total = subtotal + tax;

        return {
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2),
            taxRate: taxRate || 0
        };
    },

    // 格式化金额显示
    formatAmount: function(amount) {
        if (!amount) return '¥0.00';
        const num = parseFloat(amount);
        if (isNaN(num)) return '¥0.00';
        return '¥' + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    // 格式化日期显示
    formatDate: function(date, format) {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        format = format || 'YYYY-MM-DD';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        const second = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hour)
            .replace('mm', minute)
            .replace('ss', second);
    }
};

// 暴露到全局
window.BusinessLogic = BusinessLogic;
