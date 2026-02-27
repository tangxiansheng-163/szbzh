/**
 * 财务结算联动（原型）共享数据仓库
 * - 纯原型：仅用于页面联动演示，不涉及真实业务计算/接口
 * - 数据存放于 localStorage，采购协同（甲方）与供应链协同（乙方）共用同一份 mock 数据
 */
console.log('[FinanceCollabStore] 脚本开始加载...')
;(function () {
  var STORAGE_KEY = 'FINANCE_COLLAB_STORE_V5'
  console.log('[FinanceCollabStore] IIFE 开始执行')

  function nowISO() {
    try { return new Date().toISOString() } catch (e) { return '' }
  }

  function safeParse(json, fallback) {
    try { return JSON.parse(json) } catch (e) { return fallback }
  }

  function readStoreRaw() {
    var raw = null
    try { raw = localStorage.getItem(STORAGE_KEY) } catch (e) {}
    if (!raw) return null
    return safeParse(raw, null)
  }

  function writeStoreRaw(store) {
    if (!store) return
    store.updatedAt = nowISO()
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)) } catch (e) {}
  }

  function computeSettlementState(s) {
    // 以“动作节点”推导当前状态（原型简化）
    var recon = (s && s.reconciliation) ? s.reconciliation.status : 'not_started'
    var inv = (s && s.invoices) ? s.invoices : []
    var pay = (s && s.payments) ? s.payments : []

    var hasInvoiceSent = inv.some(function (x) { return x.status === 'sent' || x.status === 'a_approved' || x.status === 'a_recorded' || x.status === 'a_paid' })
    var hasInvoiceApproved = inv.some(function (x) { return x.status === 'a_approved' || x.status === 'a_recorded' || x.status === 'a_paid' })
    var paidAmount = 0
    pay.forEach(function (p) { if (p.status === 'paid') paidAmount += (p.amount || 0) })
    var total = (s && s.amount && s.amount.settlementAmount) ? s.amount.settlementAmount : 0

    if (paidAmount >= total && total > 0) return '已结算'
    if (paidAmount > 0 && paidAmount < total) return '部分付款'
    if (hasInvoiceApproved) return '待付款'
    if (hasInvoiceSent) return '待审核发票'
    if (recon === 'b_confirmed') return '待开票'
    if (recon === 'sent' || recon === 'disputed') return '对账中'
    return '待对账'
  }

  // 供应商基础数据（甲方视角）
  var SUPPLIERS = [
    { code: 'SUP-001', name: '深圳市电子科技', paymentTerm: '月结30天', contract: { id: 'CT-2025-008', name: '电子元器件年度框架协议' } },
    { code: 'SUP-002', name: '上海精密机械', paymentTerm: '月结45天', contract: { id: 'CT-2025-012', name: '机加件采购合同' } },
    { code: 'SUP-003', name: '北京贸易有限公司', paymentTerm: '月结30天', contract: { id: 'CT-2025-020', name: '贸易采购合同' } },
    { code: 'SUP-004', name: '广州化工原料厂', paymentTerm: '月结60天', contract: { id: 'CT-2025-025', name: '化工原料采购合同' } }
  ]

  // 采购方基础数据（乙方视角）
  var BUYERS = [
    { code: 'BUY-001', name: '某制造企业A', paymentTerm: '月结30天', contract: { id: 'CT-2025-008', name: '电子元器件年度框架协议' } },
    { code: 'BUY-002', name: '某制造企业B', paymentTerm: '月结45天', contract: { id: 'CT-2025-012', name: '机加件采购合同' } },
    { code: 'BUY-003', name: '某制造企业C', paymentTerm: '月结30天', contract: { id: 'CT-2025-020', name: '贸易采购合同' } },
    { code: 'BUY-004', name: '某制造企业D', paymentTerm: '月结60天', contract: { id: 'CT-2025-025', name: '化工原料采购合同' } }
  ]

  // ===== 多级供应链：B企业作为甲方的供应商数据 =====
  // B企业的供应商（C企业等）
  var B_ENTERPRISE_SUPPLIERS = [
    { code: 'SUP-C001', name: 'C企业-原材料供应商', paymentTerm: '月结30天', contract: { id: 'CT-B-001', name: '原材料采购合同' } },
    { code: 'SUP-C002', name: 'D企业-零部件供应商', paymentTerm: '月结45天', contract: { id: 'CT-B-002', name: '零部件采购合同' } },
    { code: 'SUP-C003', name: 'E企业-包装材料供应商', paymentTerm: '月结30天', contract: { id: 'CT-B-003', name: '包装材料采购合同' } }
  ]

  // B企业的采购订单（向C/D/E企业采购）
  var B_ENTERPRISE_ORDERS = {
    'SUP-C001': [
      { id: 'B-PO-2025-001', amount: 35000, delivered: true, date: '2025-02-01', items: [
        { materialCode: 'RAW-001', materialName: '钢材A', specification: 'Q235', quantity: 1000, receivedQuantity: 1000, unitPrice: 25.00 },
        { materialCode: 'RAW-002', materialName: '铝材B', specification: '6061', quantity: 500, receivedQuantity: 500, unitPrice: 20.00 }
      ]},
      { id: 'B-PO-2025-002', amount: 18000, delivered: true, date: '2025-02-05', items: [
        { materialCode: 'RAW-003', materialName: '铜材C', specification: 'T2', quantity: 200, receivedQuantity: 200, unitPrice: 90.00 }
      ]}
    ],
    'SUP-C002': [
      { id: 'B-PO-2025-101', amount: 28000, delivered: true, date: '2025-02-03', items: [
        { materialCode: 'PART-001', materialName: '螺丝套件', specification: 'M6×20', quantity: 5000, receivedQuantity: 5000, unitPrice: 2.50 },
        { materialCode: 'PART-002', materialName: '连接器', specification: 'RJ45', quantity: 2000, receivedQuantity: 2000, unitPrice: 7.50 }
      ]}
    ],
    'SUP-C003': [
      { id: 'B-PO-2025-201', amount: 8500, delivered: true, date: '2025-02-08', items: [
        { materialCode: 'PACK-001', materialName: '纸箱', specification: '60×40×40', quantity: 1000, receivedQuantity: 1000, unitPrice: 5.50 },
        { materialCode: 'PACK-002', materialName: '泡沫垫', specification: 'PE', quantity: 2000, receivedQuantity: 2000, unitPrice: 1.50 }
      ]}
    ]
  }

  // B企业的异常单据（向C/D/E企业的退货/换货/让步）
  var B_ENTERPRISE_EXCEPTIONS = {
    'SUP-C001': {
      returns: [
        { id: 'B-RT-001', amount: 1250, date: '2025-02-02', reason: '质量不合格', items: [
          { materialCode: 'RAW-001', materialName: '钢材A', specification: 'Q235', quantity: 50, unitPrice: 25.00 }
        ], usedInSettlement: false }
      ],
      exchanges: [],
      concessions: [
        { id: 'B-CN-001', amount: 500, date: '2025-02-04', items: [
          { materialCode: 'RAW-002', materialName: '铝材B', specification: '6061', quantity: 25, unitPrice: 20.00, discountAmount: 500, reason: '表面氧化' }
        ], usedInSettlement: false }
      ]
    },
    'SUP-C002': {
      returns: [],
      exchanges: [
        { id: 'B-EX-101', amount: 0, date: '2025-02-06', items: [
          { materialCode: 'PART-001', materialName: '螺丝套件', specification: 'M6×20', quantity: 100, unitPrice: 2.50 }
        ], usedInSettlement: false }
      ],
      concessions: []
    },
    'SUP-C003': {
      returns: [
        { id: 'B-RT-201', amount: 275, date: '2025-02-09', reason: '破损', items: [
          { materialCode: 'PACK-001', materialName: '纸箱', specification: '60×40×40', quantity: 50, unitPrice: 5.50 }
        ], usedInSettlement: false }
      ],
      exchanges: [],
      concessions: []
    }
  }

  // 未结算采购订单数据（按供应商）
  var PENDING_ORDERS = {
    'SUP-001': [
      { id: 'PO-2025-101', amount: 12500, delivered: true, date: '2025-02-01', items: [
        { materialCode: 'MAT-009', materialName: '芯片A', specification: 'QFP-64', quantity: 500, receivedQuantity: 500, unitPrice: 15.00 },
        { materialCode: 'MAT-010', materialName: '芯片B', specification: 'SOP-16', quantity: 1000, receivedQuantity: 1000, unitPrice: 5.00 }
      ]},
      { id: 'PO-2025-102', amount: 8600, delivered: true, date: '2025-02-05', items: [
        { materialCode: 'MAT-011', materialName: '二极管', specification: 'IN4007', quantity: 5000, receivedQuantity: 5000, unitPrice: 0.60 },
        { materialCode: 'MAT-012', materialName: '三极管', specification: '9014', quantity: 2000, receivedQuantity: 2000, unitPrice: 2.80 }
      ]}
    ],
    'SUP-002': [
      { id: 'PO-2025-201', amount: 45000, delivered: true, date: '2025-02-03', items: [
        { materialCode: 'M-003', materialName: '轴承A', specification: '6205', quantity: 300, receivedQuantity: 300, unitPrice: 80.00 },
        { materialCode: 'M-004', materialName: '轴承B', specification: '6206', quantity: 200, receivedQuantity: 200, unitPrice: 105.00 }
      ]}
    ],
    'SUP-003': [
      { id: 'PO-2025-301', amount: 28000, delivered: true, date: '2025-02-08', items: [
        { materialCode: 'T-004', materialName: '纸箱A', specification: '40×30×25', quantity: 2000, receivedQuantity: 2000, unitPrice: 8.00 },
        { materialCode: 'T-005', materialName: '纸箱B', specification: '50×40×30', quantity: 1500, receivedQuantity: 1500, unitPrice: 12.00 }
      ]}
    ],
    'SUP-004': [
      { id: 'PO-2025-401', amount: 56000, delivered: true, date: '2025-02-10', items: [
        { materialCode: 'C-001', materialName: '聚乙烯', specification: 'HDPE-5000S', quantity: 1000, receivedQuantity: 1000, unitPrice: 35.00 },
        { materialCode: 'C-002', materialName: '聚丙烯', specification: 'PP-T30S', quantity: 800, receivedQuantity: 800, unitPrice: 32.50 }
      ]}
    ]
  }

  // 未结算异常单据数据（按供应商）
  var PENDING_EXCEPTIONS = {
    'SUP-001': {
      returns: [
        { id: 'RT-2025-101', amount: 750, date: '2025-02-02', reason: '规格不符', items: [
          { materialCode: 'MAT-009', materialName: '芯片A', specification: 'QFP-64', quantity: 50, unitPrice: 15.00 }
        ], usedInSettlement: false }
      ],
      exchanges: [],
      concessions: [
        { id: 'CN-2025-101', amount: 120, date: '2025-02-03', items: [
          { materialCode: 'MAT-010', materialName: '芯片B', specification: 'SOP-16', quantity: 100, unitPrice: 5.00, discountAmount: 120, reason: '外观划痕' }
        ], usedInSettlement: false }
      ]
    },
    'SUP-002': {
      returns: [],
      exchanges: [
        { id: 'EX-2025-201', amount: 0, date: '2025-02-04', items: [
          { materialCode: 'M-003', materialName: '轴承A', specification: '6205', quantity: 5, unitPrice: 80.00 }
        ], usedInSettlement: false }
      ],
      concessions: []
    },
    'SUP-003': {
      returns: [
        { id: 'RT-2025-301', amount: 480, date: '2025-02-09', reason: '受潮', items: [
          { materialCode: 'T-004', materialName: '纸箱A', specification: '40×30×25', quantity: 60, unitPrice: 8.00 }
        ], usedInSettlement: false }
      ],
      exchanges: [],
      concessions: []
    },
    'SUP-004': {
      returns: [],
      exchanges: [],
      concessions: [
        { id: 'CN-2025-401', amount: 350, date: '2025-02-11', items: [
          { materialCode: 'C-001', materialName: '聚乙烯', specification: 'HDPE-5000S', quantity: 10, unitPrice: 35.00, discountAmount: 350, reason: '颜色偏差' }
        ], usedInSettlement: false }
      ]
    }
  }

  // 未结算销售订单数据（按采购方，乙方视角）
  var PENDING_SALES_ORDERS = {
    'BUY-001': [
      { id: 'SO-2025-101', amount: 12500, delivered: true, date: '2025-02-01', items: [
        { materialCode: 'MAT-009', materialName: '芯片A', specification: 'QFP-64', quantity: 500, receivedQuantity: 500, unitPrice: 15.00 },
        { materialCode: 'MAT-010', materialName: '芯片B', specification: 'SOP-16', quantity: 1000, receivedQuantity: 1000, unitPrice: 5.00 }
      ]},
      { id: 'SO-2025-102', amount: 8600, delivered: true, date: '2025-02-05', items: [
        { materialCode: 'MAT-011', materialName: '二极管', specification: 'IN4007', quantity: 5000, receivedQuantity: 5000, unitPrice: 0.60 },
        { materialCode: 'MAT-012', materialName: '三极管', specification: '9014', quantity: 2000, receivedQuantity: 2000, unitPrice: 2.80 }
      ]}
    ],
    'BUY-002': [
      { id: 'SO-2025-201', amount: 45000, delivered: true, date: '2025-02-03', items: [
        { materialCode: 'M-003', materialName: '轴承A', specification: '6205', quantity: 300, receivedQuantity: 300, unitPrice: 80.00 },
        { materialCode: 'M-004', materialName: '轴承B', specification: '6206', quantity: 200, receivedQuantity: 200, unitPrice: 105.00 }
      ]}
    ],
    'BUY-003': [
      { id: 'SO-2025-301', amount: 28000, delivered: true, date: '2025-02-08', items: [
        { materialCode: 'T-004', materialName: '纸箱A', specification: '40×30×25', quantity: 2000, receivedQuantity: 2000, unitPrice: 8.00 },
        { materialCode: 'T-005', materialName: '纸箱B', specification: '50×40×30', quantity: 1500, receivedQuantity: 1500, unitPrice: 12.00 }
      ]}
    ],
    'BUY-004': [
      { id: 'SO-2025-401', amount: 56000, delivered: true, date: '2025-02-10', items: [
        { materialCode: 'C-001', materialName: '聚乙烯', specification: 'HDPE-5000S', quantity: 1000, receivedQuantity: 1000, unitPrice: 35.00 },
        { materialCode: 'C-002', materialName: '聚丙烯', specification: 'PP-T30S', quantity: 800, receivedQuantity: 800, unitPrice: 32.50 }
      ]}
    ]
  }

  // 未结算异常单据数据（按采购方，乙方视角）
  var PENDING_BUYER_EXCEPTIONS = {
    'BUY-001': {
      returns: [
        { id: 'RT-2025-101', amount: 750, date: '2025-02-02', reason: '规格不符', items: [
          { materialCode: 'MAT-009', materialName: '芯片A', specification: 'QFP-64', quantity: 50, unitPrice: 15.00 }
        ], usedInSettlement: false }
      ],
      exchanges: [],
      concessions: [
        { id: 'CN-2025-101', amount: 120, date: '2025-02-03', items: [
          { materialCode: 'MAT-010', materialName: '芯片B', specification: 'SOP-16', quantity: 100, unitPrice: 5.00, discountAmount: 120, reason: '外观划痕' }
        ], usedInSettlement: false }
      ]
    },
    'BUY-002': {
      returns: [],
      exchanges: [
        { id: 'EX-2025-201', amount: 0, date: '2025-02-04', items: [
          { materialCode: 'M-003', materialName: '轴承A', specification: '6205', quantity: 5, unitPrice: 80.00 }
        ], usedInSettlement: false }
      ],
      concessions: []
    },
    'BUY-003': {
      returns: [
        { id: 'RT-2025-301', amount: 480, date: '2025-02-09', reason: '受潮', items: [
          { materialCode: 'T-004', materialName: '纸箱A', specification: '40×30×25', quantity: 60, unitPrice: 8.00 }
        ], usedInSettlement: false }
      ],
      exchanges: [],
      concessions: []
    },
    'BUY-004': {
      returns: [],
      exchanges: [],
      concessions: [
        { id: 'CN-2025-401', amount: 350, date: '2025-02-11', items: [
          { materialCode: 'C-001', materialName: '聚乙烯', specification: 'HDPE-5000S', quantity: 10, unitPrice: 35.00, discountAmount: 350, reason: '颜色偏差' }
        ], usedInSettlement: false }
      ]
    }
  }

  function seedStore() {
    var store = {
      version: 1,
      updatedAt: nowISO(),
      ui: { activeSettlementId: 'SET-2025-001' },
      settlements: [
        {
          id: 'SET-2025-001',
          period: '2025-01',
          dueDate: '2025-01-25',
          paymentTerm: '月结30天',
          partyA: { org: '某制造企业A', app: 'procurement' },
          partyB: { org: '深圳市电子科技', supplierCode: 'SUP-001', app: 'supply-chain' },
          contract: { id: 'CT-2025-008', name: '电子元器件年度框架协议' },
          basis: {
            orders: [
              { 
                id: 'PO-2025-001', 
                amount: 5000, 
                delivered: true,
                items: [
                  { materialCode: 'MAT-001', materialName: '电子元器件A', specification: 'SMT-2520', quantity: 1000, receivedQuantity: 1000, unitPrice: 2.50 },
                  { materialCode: 'MAT-002', materialName: '电子元器件B', specification: 'SOP-8', quantity: 500, receivedQuantity: 500, unitPrice: 5.00 },
                  { materialCode: 'MAT-005', materialName: '电阻器', specification: '1/4W-10K', quantity: 2000, receivedQuantity: 2000, unitPrice: 0.50 },
                  { materialCode: 'MAT-006', materialName: '电容器', specification: '100uF-16V', quantity: 1500, receivedQuantity: 1500, unitPrice: 0.80 }
                ]
              },
              { 
                id: 'PO-2025-002', 
                amount: 6000, 
                delivered: true,
                items: [
                  { materialCode: 'MAT-003', materialName: 'PCB板A', specification: 'FR4-1.6', quantity: 200, receivedQuantity: 200, unitPrice: 30.00 },
                  { materialCode: 'MAT-007', materialName: 'PCB板B', specification: 'FR4-2.0', quantity: 100, receivedQuantity: 100, unitPrice: 45.00 }
                ]
              },
              { 
                id: 'PO-2025-003', 
                amount: 6400, 
                delivered: true,
                items: [
                  { materialCode: 'MAT-004', materialName: '连接器A', specification: 'XH-2.54', quantity: 800, receivedQuantity: 800, unitPrice: 8.00 },
                  { materialCode: 'MAT-008', materialName: '连接器B', specification: 'PH-2.0', quantity: 600, receivedQuantity: 600, unitPrice: 6.67 }
                ]
              }
            ],
            returns: [{ 
              id: 'RT-2025-001', 
              amount: 1000, 
              reason: '质量问题',
              items: [
                { materialCode: 'MAT-001', materialName: '电子元器件A', specification: 'SMT-2520', quantity: 200, unitPrice: 5.00 }
              ]
            }],
            exchanges: [],
            concessions: [{ 
              id: 'CN-2025-001', 
              amount: 200, 
              items: [
                { materialCode: 'MAT-003', materialName: 'PCB板A', specification: 'FR4-1.6', quantity: 5, unitPrice: 40.00, discountAmount: 200, reason: '外观轻微瑕疵' },
                { materialCode: 'MAT-004', materialName: '连接器A', specification: 'XH-2.54', quantity: 10, unitPrice: 8.00, discountAmount: 80, reason: '包装破损' }
              ]
            }]
          },
          amount: {
            ordersTotal: 485000,
            returnsTotal: 25000,
            exchangeDiffTotal: 0,
            concessionDiscountTotal: 10000,
            settlementAmount: 450000
          },
          reconciliation: { status: 'sent', initiator: 'A', aSentAt: '2025-01-21 14:30:00', bConfirmedAt: '2025-01-22 10:15:00' },
          invoices: [
            { id: 'INV-2025-008', settlementId: 'SET-2025-001', amount: 110619.47, tax: 14380.53, total: 125000, issueDate: '2025-01-20', status: 'sent' }
          ],
          payments: [
            { id: 'PAY-2025-001', settlementId: 'SET-2025-001', amount: 200000, method: '银行转账', status: 'submitted', applyDate: '2025-01-21', payDate: '' }
          ],
          source: 'auto',
          visibility: { toA: true, toB: true },
          createdBy: { role: 'A', org: '某制造企业A', app: 'procurement', time: '2025-01-15 10:30:25' },
          logs: [
            { time: '2025-01-15 10:30:25', role: '系统', action: '生成结算单', detail: '自动生成结算单 SET-2025-001' },
            { time: '2025-01-21 14:30:00', role: '甲方', action: '发起对账', detail: '结算金额 ¥450,000.00，推送乙方确认' },
            { time: '2025-01-22 10:15:00', role: '乙方', action: '确认对账', detail: '确认金额一致，进入开票/付款流程' }
          ]
        },
        {
          id: 'SET-2025-002',
          period: '2025-01',
          dueDate: '2025-01-28',
          paymentTerm: '月结45天',
          partyA: { org: '某制造企业B', app: 'procurement' },
          partyB: { org: '上海精密机械', supplierCode: 'SUP-002', app: 'supply-chain' },
          contract: { id: 'CT-2025-012', name: '机加件采购合同' },
          basis: { 
            orders: [{ 
              id: 'PO-2025-010', 
              amount: 320000, 
              delivered: true,
              items: [
                { materialCode: 'M-001', materialName: '机加件A', specification: 'Φ50×100', quantity: 1000, receivedQuantity: 1000, unitPrice: 200.00 },
                { materialCode: 'M-002', materialName: '机加件B', specification: 'Φ80×150', quantity: 600, receivedQuantity: 600, unitPrice: 200.00 }
              ]
            }], 
            returns: [], 
            exchanges: [{ 
              id: 'EX-2025-001', 
              amount: 0,
              items: [
                { materialCode: 'M-001', materialName: '机加件A', specification: 'Φ50×100', quantity: 10, unitPrice: 200.00 }
              ]
            }], 
            concessions: [] 
          },
          amount: { ordersTotal: 320000, returnsTotal: 0, exchangeDiffTotal: 0, concessionDiscountTotal: 0, settlementAmount: 320000 },
          reconciliation: { status: 'b_confirmed', initiator: 'A', aSentAt: '2025-01-19 11:00:00', bConfirmedAt: '2025-01-19 15:20:00' },
          invoices: [],
          payments: [{ id: 'PAY-2025-002', settlementId: 'SET-2025-002', amount: 245000, method: '银行转账', status: 'paid', applyDate: '2025-01-19', payDate: '2025-01-20' }],
          source: 'manual',
          visibility: { toA: true, toB: true },
          createdBy: { role: 'A', org: '某制造企业B', app: 'procurement', time: '2025-01-18 09:00:00' },
          logs: [
            { time: '2025-01-18 09:00:00', role: '甲方', action: '创建结算单', detail: '手工创建结算单 SET-2025-002' },
            { time: '2025-01-19 11:00:00', role: '甲方', action: '发起对账', detail: '结算金额 ¥320,000.00，推送乙方确认' },
            { time: '2025-01-19 15:20:00', role: '乙方', action: '确认对账', detail: '确认金额一致，进入开票/付款流程' },
            { time: '2025-01-20 16:00:00', role: '甲方', action: '完成付款', detail: 'PAY-2025-002 已付款 ¥245,000.00' }
          ]
        },
        {
          id: 'SET-2025-003',
          period: '2025-02',
          dueDate: '2025-02-05',
          paymentTerm: '月结30天',
          partyA: { org: '某制造企业C', app: 'procurement' },
          partyB: { org: '北京贸易有限公司', supplierCode: 'SUP-003', app: 'supply-chain' },
          contract: { id: 'CT-2025-020', name: '贸易采购合同' },
          basis: { 
            orders: [{ 
              id: 'PO-2025-020', 
              amount: 215500, 
              delivered: true,
              items: [
                { materialCode: 'T-001', materialName: '包装材料A', specification: '20×20×30', quantity: 5000, receivedQuantity: 5000, unitPrice: 8.00 },
                { materialCode: 'T-002', materialName: '包装材料B', specification: '30×30×40', quantity: 3000, receivedQuantity: 3000, unitPrice: 15.00 },
                { materialCode: 'T-003', materialName: '包装材料C', specification: '50×50×60', quantity: 1000, receivedQuantity: 1000, unitPrice: 150.00 }
              ]
            }], 
            returns: [], 
            exchanges: [], 
            concessions: [] 
          },
          amount: { ordersTotal: 215500, returnsTotal: 0, exchangeDiffTotal: 0, concessionDiscountTotal: 0, settlementAmount: 215500 },
          reconciliation: { status: 'not_started', initiator: '', aSentAt: '', bConfirmedAt: '' },
          invoices: [],
          payments: [],
          source: 'manual',
          visibility: { toA: true, toB: false },
          createdBy: { role: 'A', org: '某制造企业C', app: 'procurement', time: '2025-02-01 10:00:00' },
          logs: [
            { time: '2025-02-01 10:00:00', role: '甲方', action: '创建结算单', detail: '手工创建结算单 SET-2025-003，尚未发起对账' }
          ]
        },
        {
          id: 'SET-2025-004',
          period: '2025-02',
          dueDate: '2025-02-10',
          paymentTerm: '月结30天',
          partyA: { org: '某制造企业A', app: 'procurement' },
          partyB: { org: '深圳市电子科技', supplierCode: 'SUP-001', app: 'supply-chain' },
          contract: { id: 'CT-2025-008', name: '电子元器件年度框架协议' },
          basis: { 
            orders: [{ 
              id: 'PO-2025-030', 
              amount: 150000, 
              delivered: true,
              items: [
                { materialCode: 'MAT-001', materialName: '电子元器件A', specification: 'SMT-2520', quantity: 500, receivedQuantity: 500, unitPrice: 2.50 },
                { materialCode: 'MAT-002', materialName: '电子元器件B', specification: 'SOP-8', quantity: 300, receivedQuantity: 300, unitPrice: 5.00 }
              ]
            }], 
            returns: [], 
            exchanges: [], 
            concessions: [] 
          },
          amount: { ordersTotal: 150000, returnsTotal: 0, exchangeDiffTotal: 0, concessionDiscountTotal: 0, settlementAmount: 150000 },
          reconciliation: { status: 'not_started', initiator: '', aSentAt: '', bConfirmedAt: '' },
          invoices: [],
          payments: [],
          source: 'manual',
          visibility: { toA: false, toB: true },
          createdBy: { role: 'B', org: '深圳市电子科技', app: 'supply-chain', time: '2025-02-05 14:00:00' },
          logs: [
            { time: '2025-02-05 14:00:00', role: '乙方', action: '创建结算单', detail: '手工创建结算单 SET-2025-004，尚未发起对账' }
          ]
        }
      ]
    }
    store.settlements.forEach(function (s) { s.state = computeSettlementState(s) })
    writeStoreRaw(store)
    return store
  }

  function ensureStore() {
    var s = readStoreRaw()
    if (!s || !s.settlements || !s.settlements.length) {
      console.log('[FinanceCollabStore] 数据不存在，初始化 seedStore...')
      var newStore = seedStore()
      console.log('[FinanceCollabStore] seedStore 完成，settlements:', newStore ? newStore.settlements.length : 0)
      return newStore
    }
    // 补齐 state 字段
    try {
      s.settlements.forEach(function (x) { x.state = computeSettlementState(x) })
      writeStoreRaw(s)
    } catch (e) {}
    return s
  }

  function getStore() {
    return ensureStore()
  }

  function findSettlement(store, id) {
    if (!store || !store.settlements) return null
    for (var i = 0; i < store.settlements.length; i++) {
      if (store.settlements[i].id === id) return store.settlements[i]
    }
    return null
  }

  function setActiveSettlement(id) {
    var store = ensureStore()
    store.ui = store.ui || {}
    store.ui.activeSettlementId = id
    writeStoreRaw(store)
    return store
  }

  function getActiveSettlementId() {
    var store = ensureStore()
    return (store.ui && store.ui.activeSettlementId) ? store.ui.activeSettlementId : ''
  }

  function addLog(settlement, role, action, detail) {
    if (!settlement) return
    settlement.logs = settlement.logs || []
    settlement.logs.unshift({ time: nowISO().replace('T', ' ').slice(0, 19), role: role, action: action, detail: detail || '' })
  }

  // ===== 创建结算单相关 API =====
  // 获取供应商列表（甲方视角）
  function getSuppliers() {
    return SUPPLIERS
  }

  // 获取采购方列表（乙方视角）
  function getBuyers() {
    return BUYERS
  }

  // 获取供应商未结算的采购订单（甲方视角）
  function getPendingOrders(supplierCode) {
    return PENDING_ORDERS[supplierCode] || []
  }

  // 获取采购方未结算的销售订单（乙方视角）
  function getPendingSalesOrders(buyerCode) {
    return PENDING_SALES_ORDERS[buyerCode] || []
  }

  // 获取供应商未结算的异常单据（退货、换货、让步，甲方视角）
  function getPendingExceptions(supplierCode) {
    return PENDING_EXCEPTIONS[supplierCode] || { returns: [], exchanges: [], concessions: [] }
  }

  // 获取采购方相关的异常单据（乙方视角）
  function getPendingBuyerExceptions(buyerCode) {
    return PENDING_BUYER_EXCEPTIONS[buyerCode] || { returns: [], exchanges: [], concessions: [] }
  }

  // 标记异常单据为已使用
  function markExceptionsAsUsed(supplierCode, usedExceptions) {
    var exceptions = PENDING_EXCEPTIONS[supplierCode]
    if (!exceptions) return
    
    usedExceptions.forEach(function(used) {
      if (used.type === 'return') {
        var item = exceptions.returns.find(function(r) { return r.id === used.id })
        if (item) item.usedInSettlement = true
      } else if (used.type === 'exchange') {
        var item = exceptions.exchanges.find(function(e) { return e.id === used.id })
        if (item) item.usedInSettlement = true
      } else if (used.type === 'concession') {
        var item = exceptions.concessions.find(function(c) { return c.id === used.id })
        if (item) item.usedInSettlement = true
      }
    })
  }

  // 创建结算单
  function createSettlement(params) {
    var store = ensureStore()
    var supplier, buyer
    var creatorRole = params.creatorRole || 'A'
    
    if (creatorRole === 'A') {
      // 甲方创建：选择供应商
      supplier = SUPPLIERS.find(function(s) { return s.code === params.supplierCode })
      if (!supplier) return { ok: false, message: '供应商不存在' }
      buyer = { code: 'BUY-001', name: '某制造企业', paymentTerm: supplier.paymentTerm, contract: supplier.contract }
    } else {
      // 乙方创建：选择采购方
      buyer = BUYERS.find(function(b) { return b.code === params.buyerCode })
      if (!buyer) return { ok: false, message: '采购方不存在' }
      supplier = { code: 'SUP-001', name: '深圳市电子科技', paymentTerm: buyer.paymentTerm, contract: buyer.contract }
    }

    // 生成结算单号
    var year = new Date().getFullYear()
    var seq = store.settlements.length + 1
    var settlementId = 'SET-' + year + '-' + String(seq).padStart(3, '0')

    // 构建结算依据
    var basis = {
      orders: params.selectedOrders || [],
      returns: [],
      exchanges: [],
      concessions: []
    }

    // 添加关联的异常单据
    if (params.selectedExceptions) {
      params.selectedExceptions.forEach(function(exc) {
        if (exc.type === 'return') basis.returns.push(exc.data)
        else if (exc.type === 'exchange') basis.exchanges.push(exc.data)
        else if (exc.type === 'concession') basis.concessions.push(exc.data)
      })
    }

    // 计算金额
    var ordersTotal = basis.orders.reduce(function(sum, o) { return sum + (o.amount || 0) }, 0)
    var returnsTotal = basis.returns.reduce(function(sum, r) { return sum + (r.amount || 0) }, 0)
    var exchangeDiffTotal = 0
    var concessionDiscountTotal = basis.concessions.reduce(function(sum, c) { return sum + (c.amount || 0) }, 0)
    var settlementAmount = ordersTotal - returnsTotal + exchangeDiffTotal - concessionDiscountTotal

    // 确定创建者角色
    var creatorRole = params.creatorRole || 'A' // 'A' 表示甲方(采购), 'B' 表示乙方(供应)
    var creatorOrg = creatorRole === 'A' ? '某制造企业' : supplier.name
    var creatorApp = creatorRole === 'A' ? 'procurement' : 'supply-chain'

    // 确定结算单来源和发起方
    var source = params.source || 'manual' // 'auto' 自动生成, 'manual' 手工创建
    var initiator = creatorRole // 创建者即发起方：'A' 甲方发起, 'B' 乙方发起

    // 确定可见性：
    // - 自动生成的结算单：双方可见
    // - 手工创建的结算单：仅创建者可见，发起对账后对方才可见
    var visibility = {
      toA: true,  // 甲方始终可见自己创建的
      toB: true   // 乙方始终可见自己创建的
    }
    if (source === 'manual') {
      if (creatorRole === 'A') {
        visibility.toB = false // 甲方手工创建，乙方不可见
      } else {
        visibility.toA = false // 乙方手工创建，甲方不可见
      }
    }

    // 创建结算单对象
    var settlement = {
      id: settlementId,
      period: params.period,
      dueDate: params.dueDate,
      paymentTerm: supplier.paymentTerm,
      partyA: { org: '某制造企业', app: 'procurement' },
      partyB: { org: supplier.name, supplierCode: supplier.code, app: 'supply-chain' },
      contract: supplier.contract,
      basis: basis,
      amount: {
        ordersTotal: ordersTotal,
        returnsTotal: returnsTotal,
        exchangeDiffTotal: exchangeDiffTotal,
        concessionDiscountTotal: concessionDiscountTotal,
        settlementAmount: settlementAmount
      },
      reconciliation: { 
        status: 'not_started', 
        initiator: initiator, // 发起方：'A' 或 'B'
        aSentAt: '', 
        bConfirmedAt: '' 
      },
      invoices: [],
      payments: [],
      source: source, // 来源：'auto' 或 'manual'
      visibility: visibility, // 可见性控制
      createdBy: {
        role: creatorRole,
        org: creatorOrg,
        app: creatorApp,
        time: nowISO().replace('T', ' ').slice(0, 19)
      },
      logs: [
        { time: nowISO().replace('T', ' ').slice(0, 19), role: creatorRole === 'A' ? '甲方' : '乙方', action: '创建结算单', detail: (source === 'auto' ? '自动生成' : '手工创建') + '结算单 ' + settlementId + '，供应商：' + supplier.name }
      ]
    }
    settlement.state = computeSettlementState(settlement)

    // 保存到存储
    store.settlements.unshift(settlement)
    writeStoreRaw(store)

    // 标记异常单据为已使用
    if (params.selectedExceptions && params.selectedExceptions.length > 0) {
      markExceptionsAsUsed(params.supplierCode, params.selectedExceptions.map(function(e) { return { type: e.type, id: e.data.id } }))
    }

    return { ok: true, settlement: settlement, store: store }
  }

  function updateSettlement(id, mutator) {
    var store = ensureStore()
    var s = findSettlement(store, id)
    if (!s) return { ok: false, message: '结算单不存在' }
    try { if (typeof mutator === 'function') mutator(s, store) } catch (e) {}
    s.state = computeSettlementState(s)
    writeStoreRaw(store)
    return { ok: true, store: store, settlement: s }
  }

  // 检查是否可以编辑/删除结算单
  function canEditOrDelete(settlement, userRole) {
    if (!settlement || !settlement.createdBy) return false
    // 只有创建者可以编辑/删除
    if (settlement.createdBy.role !== userRole) return false
    // 状态检查：未发起对账 或 对账有异议 时可以编辑
    var status = settlement.reconciliation ? settlement.reconciliation.status : 'not_started'
    return status === 'not_started' || status === 'disputed'
  }

  // 编辑结算单
  function editSettlement(settlementId, params, userRole) {
    var store = ensureStore()
    var settlement = findSettlement(store, settlementId)
    if (!settlement) return { ok: false, message: '结算单不存在' }
    if (!canEditOrDelete(settlement, userRole)) return { ok: false, message: '无权限编辑该结算单' }

    // 重新计算金额
    var basis = {
      orders: params.selectedOrders || [],
      returns: [],
      exchanges: [],
      concessions: []
    }

    if (params.selectedExceptions) {
      params.selectedExceptions.forEach(function(exc) {
        if (exc.type === 'return') basis.returns.push(exc.data)
        else if (exc.type === 'exchange') basis.exchanges.push(exc.data)
        else if (exc.type === 'concession') basis.concessions.push(exc.data)
      })
    }

    var ordersTotal = basis.orders.reduce(function(sum, o) { return sum + (o.amount || 0) }, 0)
    var returnsTotal = basis.returns.reduce(function(sum, r) { return sum + (r.amount || 0) }, 0)
    var exchangeDiffTotal = 0
    var concessionDiscountTotal = basis.concessions.reduce(function(sum, c) { return sum + (c.amount || 0) }, 0)
    var settlementAmount = ordersTotal - returnsTotal + exchangeDiffTotal - concessionDiscountTotal

    // 更新结算单
    settlement.period = params.period
    settlement.dueDate = params.dueDate
    settlement.basis = basis
    settlement.amount = {
      ordersTotal: ordersTotal,
      returnsTotal: returnsTotal,
      exchangeDiffTotal: exchangeDiffTotal,
      concessionDiscountTotal: concessionDiscountTotal,
      settlementAmount: settlementAmount
    }
    settlement.state = computeSettlementState(settlement)

    addLog(settlement, userRole === 'A' ? '甲方' : '乙方', '编辑结算单', '更新了结算依据和金额信息')
    writeStoreRaw(store)

    return { ok: true, settlement: settlement, store: store }
  }

  // 删除结算单
  function deleteSettlement(settlementId, userRole) {
    var store = ensureStore()
    var settlement = findSettlement(store, settlementId)
    if (!settlement) return { ok: false, message: '结算单不存在' }
    if (!canEditOrDelete(settlement, userRole)) return { ok: false, message: '无权限删除该结算单' }

    // 从列表中移除
    var index = store.settlements.findIndex(function(s) { return s.id === settlementId })
    if (index >= 0) {
      store.settlements.splice(index, 1)
    }

    writeStoreRaw(store)
    return { ok: true, store: store }
  }

  // ===== 动作 API（原型） =====
  // 甲方发起对账（适用于甲方创建的结算单）
  function actionA_startReconciliation(settlementId) {
    return updateSettlement(settlementId, function (s) {
      s.reconciliation = s.reconciliation || {}
      s.reconciliation.status = 'sent'
      s.reconciliation.initiator = 'A'
      s.reconciliation.aSentAt = nowISO().replace('T', ' ').slice(0, 19)
      // 发起对账后，对乙方可见
      s.visibility = s.visibility || {}
      s.visibility.toB = true
      addLog(s, '甲方', '发起对账', '将结算单推送乙方确认')
    })
  }

  // 乙方发起对账（适用于乙方创建的结算单）
  function actionB_startReconciliation(settlementId) {
    return updateSettlement(settlementId, function (s) {
      s.reconciliation = s.reconciliation || {}
      s.reconciliation.status = 'sent'
      s.reconciliation.initiator = 'B'
      s.reconciliation.bSentAt = nowISO().replace('T', ' ').slice(0, 19)
      // 发起对账后，对甲方可见
      s.visibility = s.visibility || {}
      s.visibility.toA = true
      addLog(s, '乙方', '发起对账', '将结算单推送甲方确认')
    })
  }

  // 乙方确认对账（适用于甲方发起的对账）
  function actionB_confirmReconciliation(settlementId) {
    return updateSettlement(settlementId, function (s) {
      s.reconciliation = s.reconciliation || {}
      s.reconciliation.status = 'b_confirmed'
      s.reconciliation.bConfirmedAt = nowISO().replace('T', ' ').slice(0, 19)
      addLog(s, '乙方', '确认对账', '确认金额一致，待开票')
    })
  }

  // 甲方确认对账（适用于乙方发起的对账）
  function actionA_confirmReconciliation(settlementId) {
    return updateSettlement(settlementId, function (s) {
      s.reconciliation = s.reconciliation || {}
      s.reconciliation.status = 'a_confirmed'
      s.reconciliation.aConfirmedAt = nowISO().replace('T', ' ').slice(0, 19)
      addLog(s, '甲方', '确认对账', '确认金额一致，待开票')
    })
  }

  // 乙方提出异议（适用于甲方发起的对账）
  function actionB_raiseDispute(settlementId, reason) {
    return updateSettlement(settlementId, function (s) {
      s.reconciliation = s.reconciliation || {}
      s.reconciliation.status = 'disputed'
      s.reconciliation.disputeBy = 'B'
      s.reconciliation.disputeReason = reason || '金额/单据存在差异'
      addLog(s, '乙方', '提出异议', s.reconciliation.disputeReason)
    })
  }

  // 甲方提出异议（适用于乙方发起的对账）
  function actionA_raiseDispute(settlementId, reason) {
    return updateSettlement(settlementId, function (s) {
      s.reconciliation = s.reconciliation || {}
      s.reconciliation.status = 'disputed'
      s.reconciliation.disputeBy = 'A'
      s.reconciliation.disputeReason = reason || '金额/单据存在差异'
      addLog(s, '甲方', '提出异议', s.reconciliation.disputeReason)
    })
  }

  function actionB_issueInvoice(settlementId, invoiceNo, total, taxRate) {
    return updateSettlement(settlementId, function (s) {
      var t = parseFloat(total || 0) || 0
      var rate = parseFloat(taxRate || 13) || 0
      var tax = +(t * rate / (100 + rate)).toFixed(2)
      var amount = +(t - tax).toFixed(2)
      var inv = { id: invoiceNo || ('INV-' + new Date().getFullYear() + '-NEW'), settlementId: settlementId, amount: amount, tax: tax, total: t, issueDate: (nowISO().slice(0, 10)), status: 'issued' }
      s.invoices = s.invoices || []
      s.invoices.unshift(inv)
      addLog(s, '乙方', '开具发票', inv.id + ' 价税合计 ¥' + t.toFixed(2))
    })
  }

  function actionB_issueInvoiceWithFile(settlementId, invoiceNo, total, taxRate, fileInfo) {
    return updateSettlement(settlementId, function (s) {
      var t = parseFloat(total || 0) || 0
      var rate = parseFloat(taxRate || 13) || 0
      var tax = +(t * rate / (100 + rate)).toFixed(2)
      var amount = +(t - tax).toFixed(2)
      var inv = { 
        id: invoiceNo || ('INV-' + new Date().getFullYear() + '-NEW'), 
        settlementId: settlementId, 
        amount: amount, 
        tax: tax, 
        total: t, 
        issueDate: (nowISO().slice(0, 10)), 
        status: 'issued',
        file: fileInfo  // 包含文件信息
      }
      s.invoices = s.invoices || []
      s.invoices.unshift(inv)
      addLog(s, '乙方', '开具发票并上传', inv.id + ' 价税合计 ¥' + t.toFixed(2) + '，文件：' + fileInfo.name)
    })
  }

  function actionB_sendInvoice(settlementId, invoiceNo) {
    return updateSettlement(settlementId, function (s) {
      var inv = (s.invoices || []).find(function (x) { return x.id === invoiceNo })
      if (!inv) return
      inv.status = 'sent'
      addLog(s, '乙方', '发送发票', invoiceNo + ' 已同步至甲方')
    })
  }

  function actionA_approveInvoice(settlementId, invoiceNo) {
    return updateSettlement(settlementId, function (s) {
      var inv = (s.invoices || []).find(function (x) { return x.id === invoiceNo })
      if (!inv) return
      inv.status = 'a_approved'
      addLog(s, '甲方', '审核发票', invoiceNo + ' 审核通过')
    })
  }

  function actionA_createPayment(settlementId, amount) {
    return updateSettlement(settlementId, function (s) {
      var amt = parseFloat(amount || 0) || 0
      if (amt <= 0) amt = Math.min(50000, (s.amount && s.amount.settlementAmount) ? s.amount.settlementAmount : 0)
      s.payments = s.payments || []
      var id = 'PAY-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 900) + 100)
      s.payments.unshift({ id: id, settlementId: settlementId, amount: amt, method: '银行转账', status: 'submitted', applyDate: nowISO().slice(0, 10), payDate: '' })
      addLog(s, '甲方', '发起付款申请', id + ' 申请金额 ¥' + amt.toFixed(2))
    })
  }

  // 新增：甲方创建付款（带凭证）
  function actionA_createPaymentWithVoucher(settlementId, method, voucherFile) {
    return updateSettlement(settlementId, function (s) {
      var amt = (s.amount && s.amount.settlementAmount) ? s.amount.settlementAmount : 0
      // 计算已付款金额
      var paid = 0
      ;(s.payments || []).forEach(function(p) { if (p.status === 'paid') paid += (p.amount || 0) })
      var remaining = amt - paid
      if (remaining <= 0) remaining = amt

      s.payments = s.payments || []
      var id = 'PAY-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 900) + 100)
      var payment = {
        id: id,
        settlementId: settlementId,
        amount: remaining,
        method: method || '银行转账',
        status: 'paid',
        applyDate: nowISO().slice(0, 10),
        payDate: nowISO().slice(0, 10),
        voucher: voucherFile  // 付款凭证文件信息
      }
      s.payments.unshift(payment)
      var logDetail = id + ' 付款金额 ¥' + remaining.toFixed(2)
      if (voucherFile) {
        logDetail += '，凭证：' + voucherFile.name
      }
      addLog(s, '甲方', '执行付款', logDetail)
    })
  }

  function actionA_approvePayment(settlementId, paymentId) {
    return updateSettlement(settlementId, function (s) {
      var p = (s.payments || []).find(function (x) { return x.id === paymentId })
      if (!p) return
      p.status = 'approved'
      addLog(s, '甲方', '审批付款', paymentId + ' 审批通过')
    })
  }

  function actionA_pay(settlementId, paymentId) {
    return updateSettlement(settlementId, function (s) {
      var p = (s.payments || []).find(function (x) { return x.id === paymentId })
      if (!p) return
      p.status = 'paid'
      p.payDate = nowISO().slice(0, 10)
      addLog(s, '甲方', '执行付款', paymentId + ' 已付款')
    })
  }

  // 新增：乙方上传发票（带文件）
  function actionB_uploadInvoice(settlementId, invoiceNo, amount, file) {
    return updateSettlement(settlementId, function (s) {
      var inv = { 
        id: invoiceNo, 
        settlementId: settlementId, 
        amount: amount, 
        tax: 0, 
        total: amount, 
        issueDate: nowISO().slice(0, 10), 
        status: 'sent',
        file: file ? { name: file.name, size: file.size, type: file.type } : null
      }
      s.invoices = s.invoices || []
      s.invoices.unshift(inv)
      addLog(s, '乙方', '上传发票', inv.id + ' 金额 ¥' + amount.toFixed(2))
    })
  }

  // 新增：乙方提出异议（新接口）
  function actionB_disputeReconciliation(settlementId, reason) {
    return actionB_raiseDispute(settlementId, reason)
  }

  // 暴露到全局，供页面调用
  window.FinanceCollabStore = {
    STORAGE_KEY: STORAGE_KEY,
    getStore: getStore,
    setActiveSettlement: setActiveSettlement,
    getActiveSettlementId: getActiveSettlementId,
    updateSettlement: updateSettlement,
    // 创建结算单相关 API
    getSuppliers: getSuppliers,
    getBuyers: getBuyers,
    getPendingOrders: getPendingOrders,
    getPendingSalesOrders: getPendingSalesOrders,
    getPendingExceptions: getPendingExceptions,
    getPendingBuyerExceptions: getPendingBuyerExceptions,
    // 多级供应链：B企业作为甲方的API
    getBEnterpriseSuppliers: function() { return B_ENTERPRISE_SUPPLIERS; },
    getBEnterpriseOrders: function(supplierCode) { return B_ENTERPRISE_ORDERS[supplierCode] || []; },
    getBEnterpriseExceptions: function(supplierCode) { return B_ENTERPRISE_EXCEPTIONS[supplierCode] || { returns: [], exchanges: [], concessions: [] }; },
    createSettlement: createSettlement,
    // 编辑删除结算单 API
    canEditOrDelete: canEditOrDelete,
    editSettlement: editSettlement,
    deleteSettlement: deleteSettlement,
    // 原有动作 API
    actionA_startReconciliation: actionA_startReconciliation,
    actionB_startReconciliation: actionB_startReconciliation,
    actionA_confirmReconciliation: actionA_confirmReconciliation,
    actionB_confirmReconciliation: actionB_confirmReconciliation,
    actionA_raiseDispute: actionA_raiseDispute,
    actionB_raiseDispute: actionB_raiseDispute,
    actionB_disputeReconciliation: actionB_disputeReconciliation,
    actionB_issueInvoice: actionB_issueInvoice,
    actionB_issueInvoiceWithFile: actionB_issueInvoiceWithFile,
    actionB_uploadInvoice: actionB_uploadInvoice,
    actionB_sendInvoice: actionB_sendInvoice,
    actionA_approveInvoice: actionA_approveInvoice,
    actionA_createPayment: actionA_createPayment,
    actionA_createPaymentWithVoucher: actionA_createPaymentWithVoucher,
    actionA_approvePayment: actionA_approvePayment,
    actionA_pay: actionA_pay
  }
  
  console.log('[FinanceCollabStore] 初始化完成，API已暴露')
})()

