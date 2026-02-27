
        const deviceGroups = [
            {
                id: 'workshop-a',
                name: '生产车间A',
                icon: '🏭',
                devices: [
                    { id: 'EQ-001', name: '数控车床-001', type: 'production', health: 92, status: 'normal', lastDiagnosis: '2025-01-22 10:30' },
                    { id: 'EQ-002', name: '数控车床-002', type: 'production', health: 85, status: 'warning', lastDiagnosis: '2025-01-21 14:20' },
                    { id: 'EQ-003', name: '加工中心-001', type: 'production', health: 78, status: 'warning', lastDiagnosis: '2025-01-20 09:15' }
                ]
            },
            {
                id: 'workshop-power',
                name: '动力车间',
                icon: '⚡',
                devices: [
                    { id: 'EN-001', name: '空压机-001', type: 'energy', health: 95, status: 'normal', lastDiagnosis: '2025-01-22 08:00' },
                    { id: 'EN-002', name: '变压器-001', type: 'energy', health: 88, status: 'normal', lastDiagnosis: '2025-01-21 16:30' }
                ]
            },
            {
                id: 'workshop-safety',
                name: '安环设备',
                icon: '🛡️',
                devices: [
                    { id: 'SF-001', name: '烟雾探测器-001', type: 'safety', health: 88, status: 'normal', lastDiagnosis: '2025-01-22 11:00' },
                    { id: 'SF-002', name: '气体检测仪-001', type: 'safety', health: 91, status: 'normal', lastDiagnosis: '2025-01-21 10:00' }
                ]
            }
        ];

        
        const diagnosisHistory = [
            { date: '01-22 10:30', device: '数控车床-001', type: '快速诊断', result: 'good', score: 92 },
            { date: '01-22 08:00', device: '空压机-001', type: '深度诊断', result: 'good', score: 95 },
            { date: '01-21 14:20', device: '数控车床-002', type: '快速诊断', result: 'warning', score: 85 },
            { date: '01-21 10:00', device: '气体检测仪-001', type: '专项诊断', result: 'good', score: 91 },
            { date: '01-20 16:30', device: '变压器-001', type: '快速诊断', result: 'good', score: 88 }
        ];

        
        let currentDevice = null;
        let selectedMode = 'quick';
        let isDiagnosing = false;

        
        function openToolModal(title, content, showActionBtn = false) {
            document.getElementById('toolModalTitle').textContent = title;
            document.getElementById('toolModalContent').innerHTML = content;
            document.getElementById('toolModalActionBtn').style.display = showActionBtn ? 'inline-flex' : 'none';
            document.getElementById('toolModal').classList.add('show');
        }

        
        function closeToolModal() {
            document.getElementById('toolModal').classList.remove('show');
        }

        
        function init() {
            renderDeviceTree();
            renderHistoryList();
            
            
            if (deviceGroups.length > 0 && deviceGroups[0].devices.length > 0) {
                selectDevice(deviceGroups[0].devices[0]);
            }
            
            
            const chatBtn = document.getElementById('chatBtn');
            if (chatBtn) {
                chatBtn.addEventListener('click', function() {
                    openAIChat();
                });
            }
            
            
            bindChatModalEvents();
        }
        
        
        function bindChatModalEvents() {
            
            const closeBtn = document.getElementById('chatModalClose');
            if (closeBtn) {
                closeBtn.addEventListener('click', closeChatModal);
            }
            
            
            const sendBtn = document.getElementById('chatSendBtn');
            if (sendBtn) {
                sendBtn.addEventListener('click', sendChatMessage);
            }
            
            
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.addEventListener('keypress', handleChatKeyPress);
            }
            
            
            const quickQuestionBtns = document.querySelectorAll('.quick-question-btn[data-question]');
            quickQuestionBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const question = this.getAttribute('data-question');
                    sendQuickQuestion(question);
                });
            });

            
            const toolItems = document.querySelectorAll('.tool-item[data-tool]');
            toolItems.forEach(item => {
                item.addEventListener('click', function() {
                    const tool = this.getAttribute('data-tool');
                    openTool(tool);
                });
            });

            
            const toolModalCloseBtn = document.getElementById('toolModalCloseBtn');
            if (toolModalCloseBtn) {
                toolModalCloseBtn.addEventListener('click', closeToolModal);
            }

            
            const toolModalCloseBtn2 = document.getElementById('toolModalCloseBtn2');
            if (toolModalCloseBtn2) {
                toolModalCloseBtn2.addEventListener('click', closeToolModal);
            }
        }

        
        function renderDeviceTree() {
            const container = document.getElementById('deviceTree');
            container.innerHTML = deviceGroups.map(group => `
                <div class="device-group">
                    <div class="group-header" onclick="toggleGroup('${group.id}')">
                        <span class="group-icon" id="icon-${group.id}">▶</span>
                        <span class="group-name">${group.icon} ${group.name}</span>
                        <span class="group-count">${group.devices.length}</span>
                    </div>
                    <div class="device-list" id="list-${group.id}" style="display: none;">
                        ${group.devices.map(device => `
                            <div class="device-item" data-id="${device.id}" onclick="selectDeviceById('${device.id}')">
                                <div class="device-icon" style="background: ${getDeviceIconBg(device.type)};">
                                    ${getDeviceIcon(device.type)}
                                </div>
                                <div class="device-info">
                                    <div class="device-name">${device.name}</div>
                                    <div class="device-meta">
                                        <span class="health-badge ${getHealthClass(device.health)}">${device.health}分</span>
                                        <span class="status-dot ${device.status}"></span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
            
            
            toggleGroup(deviceGroups[0].id);
        }

        
        function toggleGroup(groupId) {
            const list = document.getElementById(`list-${groupId}`);
            const icon = document.getElementById(`icon-${groupId}`);
            if (list.style.display === 'none') {
                list.style.display = 'block';
                icon.classList.add('expanded');
            } else {
                list.style.display = 'none';
                icon.classList.remove('expanded');
            }
        }

        
        function selectDeviceById(deviceId) {
            for (const group of deviceGroups) {
                const device = group.devices.find(d => d.id === deviceId);
                if (device) {
                    selectDevice(device);
                    break;
                }
            }
        }

        
        function selectDevice(device) {
            currentDevice = device;
            
            
            document.querySelectorAll('.device-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.id === device.id) {
                    item.classList.add('active');
                }
            });
            
            
            resetDiagnosisState();
            
            
            renderDeviceHistoryList(device.name);
            
            
            updateTaskList();
        }
        
        
        function resetDiagnosisState() {
            
            document.getElementById('startBtn').disabled = false;
            document.getElementById('startBtn').innerHTML = '<span>▶️</span> 开始诊断';
            
            
            document.getElementById('aiStatus').innerHTML = '<span class="ai-status-dot"></span><span>系统就绪</span>';
            document.getElementById('aiStatus').classList.remove('diagnosing');
            
            
            document.getElementById('diagnosisProgress').classList.remove('show');
            
            
            document.getElementById('progressFill').style.width = '0%';
            document.getElementById('progressPercent').textContent = '0%';
            
            
            for (let i = 1; i <= 5; i++) {
                const step = document.getElementById(`step${i}`);
                step.classList.remove('active', 'completed');
                if (i === 1) {
                    step.classList.add('active');
                }
            }
            
            
            document.getElementById('resultContent').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🤖</div>
                    <div class="empty-title">开始智能诊断</div>
                    <div class="empty-desc">选择左侧设备，点击"开始诊断"按钮，AI将基于实时监测数据、历史运行记录、维保维修信息等多维度数据进行智能分析</div>
                </div>
            `;
            
            
            document.getElementById('resultActions').style.display = 'none';
            
            
            isDiagnosing = false;
        }

        
        function updateTaskList() {
            const taskList = document.getElementById('taskList');
            if (currentDevice) {
                taskList.innerHTML = `
                    <div class="task-item">
                        <div class="task-status pending"></div>
                        <div class="task-info">
                            <div class="task-name">${currentDevice.name}</div>
                            <div class="task-meta">等待诊断 | 健康度: ${currentDevice.health}分</div>
                        </div>
                    </div>
                `;
            }
        }

        
        function renderHistoryList() {
            const container = document.getElementById('historyList');
            container.innerHTML = diagnosisHistory.map(h => `
                <div class="history-item" onclick="viewHistoryDetail('${h.device}', '${h.date}')">
                    <span class="history-date">${h.date}</span>
                    <span class="history-type">${h.type}</span>
                    <span class="history-result ${h.result}">${h.score}分</span>
                </div>
            `).join('');
        }
        
        
        function renderDeviceHistoryList(deviceName) {
            const container = document.getElementById('historyList');
            const deviceHistory = diagnosisHistory.filter(h => h.device === deviceName);
            
            if (deviceHistory.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="padding: 20px; text-align: center; color: var(--text-muted);">
                        <div style="font-size: 24px; margin-bottom: 8px;">📋</div>
                        <div style="font-size: 13px;">暂无历史诊断记录</div>
                    </div>
                `;
            } else {
                container.innerHTML = deviceHistory.map(h => `
                    <div class="history-item" onclick="viewHistoryDetail('${h.device}', '${h.date}')">
                        <span class="history-date">${h.date}</span>
                        <span class="history-type">${h.type}</span>
                        <span class="history-result ${h.result}">${h.score}分</span>
                    </div>
                `).join('');
            }
        }

        
        function selectMode(mode) {
            selectedMode = mode;
            document.querySelectorAll('.mode-card').forEach(card => {
                card.classList.remove('active');
                if (card.dataset.mode === mode) {
                    card.classList.add('active');
                }
            });
            
            
            if (currentDevice) {
                resetDiagnosisState();
            }
        }

        
        function startDiagnosis() {
            if (!currentDevice) {
                alert('请先选择要诊断的设备');
                return;
            }
            
            if (isDiagnosing) return;
            
            isDiagnosing = true;
            
            
            document.getElementById('startBtn').disabled = true;
            document.getElementById('startBtn').innerHTML = '<span>⏳</span> 诊断中...';
            document.getElementById('aiStatus').innerHTML = '<span class="ai-status-dot"></span><span>正在诊断</span>';
            document.getElementById('aiStatus').classList.add('diagnosing');
            document.getElementById('diagnosisProgress').classList.add('show');
            
            
            document.querySelector('.task-status').className = 'task-status running';
            
            
            let progress = 0;
            let currentStep = 1;
            const totalSteps = 5;
            const stepNames = ['数据收集', '特征提取', '模型分析', '生成结果', '输出建议'];
            
            const interval = setInterval(() => {
                progress += Math.random() * 15 + 5;
                if (progress > 100) progress = 100;
                
                
                document.getElementById('progressFill').style.width = progress + '%';
                document.getElementById('progressPercent').textContent = Math.floor(progress) + '%';
                
                
                const stepIndex = Math.min(Math.floor(progress / 20), totalSteps - 1);
                if (stepIndex >= currentStep) {
                    document.getElementById(`step${currentStep}`).classList.add('completed');
                    document.getElementById(`step${currentStep}`).classList.remove('active');
                    currentStep++;
                    if (currentStep <= totalSteps) {
                        document.getElementById(`step${currentStep}`).classList.add('active');
                    }
                }
                
                
                const stepTitle = stepNames[Math.min(stepIndex, totalSteps - 1)];
                document.querySelector('.progress-title').textContent = `正在${stepTitle}...`;
                
                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        completeDiagnosis();
                    }, 500);
                }
            }, selectedMode === 'quick' ? 200 : selectedMode === 'deep' ? 600 : 400);
        }

        
        function showTooltip(event, date, health) {
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
                tooltip.innerHTML = `
                    <div><strong>日期:</strong> ${date}</div>
                    <div><strong>健康度:</strong> ${health}</div>
                    <div><strong>状态:</strong> ${health >= 90 ? '优秀' : health >= 70 ? '良好' : '需关注'}</div>
                `;
                tooltip.style.opacity = '1';
                tooltip.style.left = (event.pageX + 10) + 'px';
                tooltip.style.top = (event.pageY - 10) + 'px';
            }
        }
        
        
        function hideTooltip() {
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
                tooltip.style.opacity = '0';
            }
        }
        
        
        function completeDiagnosis() {
            isDiagnosing = false;
            
            
            document.getElementById('startBtn').disabled = false;
            document.getElementById('startBtn').innerHTML = '<span>▶️</span> 重新诊断';
            document.getElementById('aiStatus').innerHTML = '<span class="ai-status-dot"></span><span>诊断完成</span>';
            document.getElementById('aiStatus').classList.remove('diagnosing');
            document.getElementById('diagnosisProgress').classList.remove('show');
            
            
            document.querySelector('.task-status').className = 'task-status completed';
            document.querySelector('.task-name').textContent = currentDevice.name + ' - 诊断完成';
            document.querySelector('.task-meta').textContent = 'AI分析完成，查看结果';
            
            
            showDiagnosisResult();
            
            
            document.getElementById('resultActions').style.display = 'flex';
        }

        
        function showDiagnosisResult() {
            const health = currentDevice.health;
            const anomalies = generateAnomalies(health);
            const deviceType = currentDevice.type;
            
            const resultContent = document.getElementById('resultContent');
            
            
            resultContent.innerHTML = generateDiagnosisResult(health, deviceType, selectedMode);
        }
        
        
function generateDiagnosisResult(health, deviceType, mode) {
            const realTimeMetrics = generateRealTimeMetrics(deviceType);
            const immediateAlerts = generateImmediateAlerts(health, deviceType);
            const historicalTrends = mode !== 'quick' ? generateHistoricalTrends(health) : '';
            const anomalyDetails = mode === 'deep' ? generateAnomalyDetails(health, deviceType) : '';
            const specialFocus = mode === 'special' ? generateSpecialFocus(health, deviceType) : '';
            
            let result = `<div class="overview-cards">
                    <div class="overview-card">
                        <div class="overview-card-header">
                            <div class="overview-card-icon" style="background: ${getHealthBg(health)}; color: ${getHealthColor(health)};">⚡</div>
                            <span class="overview-card-title">实时健康度</span>
                        </div>
                        <div class="overview-card-value" style="color: ${getHealthColor(health)};">${health}</div>
                        <div class="overview-card-trend"><span>基于实时数据</span></div>
                    </div>
                    <div class="overview-card">
                        <div class="overview-card-header">
                            <div class="overview-card-icon" style="background: var(--warning-bg); color: var(--warning);">🚨</div>
                            <span class="overview-card-title">即时预警</span>
                        </div>
                        <div class="overview-card-value" style="color: ${getRiskColor(health)};">${health < 90 ? '1' : '0'}</div>
                        <div class="overview-card-trend"><span>需立即关注</span></div>
                    </div>
                    <div class="overview-card">
                        <div class="overview-card-header">
                            <div class="overview-card-icon" style="background: var(--info-bg); color: var(--info);">📊</div>
                            <span class="overview-card-title">监测指标</span>
                        </div>
                        <div class="overview-card-value">${realTimeMetrics.length}</div>
                        <div class="overview-card-trend"><span>实时监测中</span></div>
                    </div>
                    <div class="overview-card">
                        <div class="overview-card-header">
                            <div class="overview-card-icon" style="background: var(--primary-bg); color: var(--primary);">⏱️</div>
                            <span class="overview-card-title">响应时间</span>
                        </div>
                        <div class="overview-card-value">${Math.floor(15 + Math.random() * 10)}s</div>
                        <div class="overview-card-trend"><span>快速响应</span></div>
                    </div>
                </div>`;
            
            if (mode !== 'quick') {
                result += `<div class="analysis-section"><div class="section-title"><span>📈</span> 历史趋势分析</div>${historicalTrends}</div>`;
            }
            
            result += `<div class="analysis-section"><div class="section-title"><span>📡</span> 实时数据监测</div><div class="realtime-metrics">${realTimeMetrics}</div></div>`;
            result += `<div class="analysis-section"><div class="section-title"><span>⚠️</span> 即时预警信息</div><div class="anomaly-list">${immediateAlerts}</div></div>`;
            
            if (mode === 'deep' && anomalyDetails) {
                result += `<div class="analysis-section"><div class="section-title"><span>🔍</span> 异常详情分析</div>${anomalyDetails}</div>`;
            }
            
            if (mode === 'special' && specialFocus) {
                result += `<div class="analysis-section"><div class="section-title"><span>🎯</span> 专项分析焦点</div>${specialFocus}</div>`;
            }
            
            result += `<div class="analysis-section"><div class="section-title"><span>🔧</span> 处理建议</div><div class="anomaly-list">${generateImmediateSuggestions(health)}</div></div>`;
            
            return result;
        }
        
        
        
        
        
        
        function generateTechMetrics(deviceType, health) {
            const metrics = {
                production: [
                    { name: '主轴温度', value: (60 + Math.random() * 15).toFixed(1), unit: '°C', threshold: 70, status: health < 85 ? 'warning' : 'normal' },
                    { name: '主轴转速', value: Math.floor(8000 + Math.random() * 4000), unit: 'rpm', threshold: 12000, status: 'normal' },
                    { name: '电机电流', value: (15 + Math.random() * 10).toFixed(1), unit: 'A', threshold: 30, status: health < 80 ? 'warning' : 'normal' },
                    { name: '振动强度', value: (0.5 + Math.random() * 2).toFixed(2), unit: 'mm/s', threshold: 4.5, status: health < 75 ? 'danger' : 'normal' },
                    { name: '进给速度', value: Math.floor(500 + Math.random() * 1000), unit: 'mm/min', threshold: 2000, status: 'normal' },
                    { name: '切削力', value: (100 + Math.random() * 150).toFixed(1), unit: 'N', threshold: 300, status: 'normal' }
                ],
                energy: [
                    { name: '排气压力', value: (0.7 + Math.random() * 0.4).toFixed(2), unit: 'MPa', threshold: 1.2, status: 'normal' },
                    { name: '油温', value: (45 + Math.random() * 20).toFixed(1), unit: '°C', threshold: 70, status: 'normal' },
                    { name: '功率因数', value: (0.85 + Math.random() * 0.1).toFixed(2), unit: '', threshold: 0.9, status: 'normal' },
                    { name: '负载率', value: Math.floor(60 + Math.random() * 30), unit: '%', threshold: 90, status: health < 85 ? 'warning' : 'normal' },
                    { name: '排气温度', value: (70 + Math.random() * 25).toFixed(1), unit: '°C', threshold: 100, status: 'normal' },
                    { name: '油位', value: Math.floor(70 + Math.random() * 25), unit: '%', threshold: 30, status: 'normal' }
                ],
                safety: [
                    { name: '烟雾浓度', value: (0.1 + Math.random() * 0.4).toFixed(2), unit: 'ppm', threshold: 1.0, status: 'normal' },
                    { name: '环境温度', value: (20 + Math.random() * 10).toFixed(1), unit: '°C', threshold: 40, status: 'normal' },
                    { name: '环境湿度', value: Math.floor(40 + Math.random() * 40), unit: '%', threshold: 80, status: 'normal' },
                    { name: '气体压力', value: (2.0 + Math.random() * 0.5).toFixed(2), unit: 'bar', threshold: 3.0, status: 'normal' },
                    { name: '响应时间', value: (0.1 + Math.random() * 0.3).toFixed(2), unit: 's', threshold: 1.0, status: 'normal' },
                    { name: '电池电压', value: (11.5 + Math.random() * 2.5).toFixed(1), unit: 'V', threshold: 10.5, status: health < 80 ? 'warning' : 'normal' }
                ]
            };
            
            const data = metrics[deviceType] || metrics.production;
            return `<div class="metrics-grid">
                ${data.map(m => `
                    <div class="metric-item ${m.status}">
                        <div class="metric-header">
                            <span class="metric-name">${m.name}</span>
                            <span class="metric-status ${m.status}">${m.status === 'normal' ? '正常' : m.status === 'warning' ? '预警' : '告警'}</span>
                        </div>
                        <div class="metric-value">${m.value}<span class="metric-unit">${m.unit}</span></div>
                        <div class="metric-bar">
                            <div class="metric-fill ${m.status}" style="width: ${Math.min((m.value / m.threshold) * 80, 100)}%"></div>
                        </div>
                        <div class="metric-threshold">阈值: ${m.threshold}${m.unit}</div>
                    </div>
                `).join('')}
            </div>`;
        }
        
        
        function generateTrendChart(health) {
            const days = ['1月15', '1月16', '1月17', '1月18', '1月19', '1月20', '1月21'];
            const values = days.map((_, i) => Math.floor(health - 5 + Math.random() * 10));
            const maxVal = Math.max(...values);
            
            return `<div class="trend-chart-container">
                <div class="chart-bars">
                    ${values.map((v, i) => `
                        <div class="chart-bar-item">
                            <div class="chart-bar" style="height: ${(v / 100) * 150}px; background: ${v >= 90 ? 'var(--success)' : v >= 70 ? 'var(--warning)' : 'var(--danger)'}"></div>
                            <div class="chart-value">${v}</div>
                            <div class="chart-label">${days[i]}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="trend-summary">
                    <span>7日平均: <strong>${Math.floor(values.reduce((a, b) => a + b, 0) / values.length)}</strong></span>
                    <span>最高: <strong>${Math.max(...values)}</strong></span>
                    <span>最低: <strong>${Math.min(...values)}</strong></span>
                    <span>趋势: <strong class="${health >= 90 ? 'trend-up' : health >= 70 ? '' : 'trend-down'}">${health >= 90 ? '↑ 上升' : health >= 70 ? '→ 平稳' : '↓ 下降'}</strong></span>
                </div>
            </div>`;
        }
        
        
        function generatePartsHealth(health) {
            const parts = [
                { name: '主轴轴承', health: Math.floor(health - 5 + Math.random() * 15), icon: '🔩' },
                { name: '电机', health: Math.floor(health - 3 + Math.random() * 10), icon: '⚡' },
                { name: '冷却系统', health: Math.floor(health - 8 + Math.random() * 20), icon: '❄️' },
                { name: '润滑系统', health: Math.floor(health - 2 + Math.random() * 8), icon: '🛢️' },
                { name: '传动系统', health: Math.floor(health - 5 + Math.random() * 12), icon: '⚙️' },
                { name: '控制系统', health: Math.floor(health + Math.random() * 5), icon: '🎛️' }
            ];
            
            return `<div class="parts-grid">
                ${parts.map(p => `
                    <div class="part-item">
                        <div class="part-icon">${p.icon}</div>
                        <div class="part-name">${p.name}</div>
                        <div class="part-health">
                            <div class="part-health-bar">
                                <div class="part-health-fill ${p.health >= 90 ? 'excellent' : p.health >= 70 ? 'warning' : 'danger'}" style="width: ${p.health}%"></div>
                            </div>
                            <span class="part-health-value ${p.health >= 90 ? 'excellent' : p.health >= 70 ? 'warning' : 'danger'}">${p.health}%</span>
                        </div>
                    </div>
                `).join('')}
            </div>`;
        }
        
        
        function generateEnergyAnalysis(health) {
            const power = (50 + Math.random() * 30).toFixed(1);
            const efficiency = (85 + Math.random() * 10).toFixed(1);
            const cost = (Math.random() * 5000).toFixed(0);
            
            return `<div class="energy-grid">
                <div class="energy-item">
                    <div class="energy-icon">⚡</div>
                    <div class="energy-label">当前功率</div>
                    <div class="energy-value">${power} <span>kW</span></div>
                </div>
                <div class="energy-item">
                    <div class="energy-icon">�</div>
                    <div class="energy-label">运行效率</div>
                    <div class="energy-value ${parseFloat(efficiency) >= 90 ? 'excellent' : ''}">${efficiency} <span>%</span></div>
                </div>
                <div class="energy-item">
                    <div class="energy-icon">💰</div>
                    <div class="energy-label">本月能耗</div>
                    <div class="energy-value">${cost} <span>元</span></div>
                </div>
                <div class="energy-item">
                    <div class="energy-icon">🌿</div>
                    <div class="energy-label">碳排放</div>
                    <div class="energy-value">${(parseFloat(cost) * 0.5).toFixed(0)} <span>kg</span></div>
                </div>
            </div>
            <div class="energy-tip">
                <span class="tip-icon">💡</span>
                <span>${health >= 90 ? '设备运行效率良好，能耗处于正常范围。建议保持当前运行状态。' : '检测到能耗异常，建议优化运行参数以降低能耗成本。'}</span>
            </div>`;
        }
        
        
        function generateMaintenanceSuggestions(health) {
            const suggestions = [];
            
            if (health >= 90) {
                suggestions.push({
                    icon: '✅',
                    title: '设备运行状态优秀',
                    desc: '所有关键指标均在正常范围内，设备运行状态良好。建议继续保持当前的维护保养计划，定期进行例行检查。',
                    priority: 'low',
                    action: '常规保养'
                });
                suggestions.push({
                    icon: '📅',
                    title: '建议进行月度例行保养',
                    desc: '按照设备维护手册，建议30天后进行下一次例行保养，重点检查润滑系统和滤网更换。',
                    priority: 'low',
                    action: '计划保养'
                });
            } else if (health >= 70) {
                suggestions.push({
                    icon: '⚠️',
                    title: '关注异常指标变化',
                    desc: '检测到部分技术指标偏离正常范围，建议加强监控频率，并在一周内安排详细检查。',
                    priority: 'medium',
                    action: '重点检查'
                });
                suggestions.push({
                    icon: '🔧',
                    title: '调整运行参数',
                    desc: '根据AI分析，建议将负载率调整至合理区间（75%-85%），可有效降低设备磨损，延长使用寿命。',
                    priority: 'medium',
                    action: '参数调整'
                });
            } else {
                suggestions.push({
                    icon: '🚨',
                    title: '建议立即停机检查',
                    desc: '设备存在严重异常，继续运行可能导致故障停机或安全事故。建议立即安排停机检修。',
                    priority: 'high',
                    action: '紧急检修'
                });
                suggestions.push({
                    icon: '📦',
                    title: '准备更换关键部件',
                    desc: '根据健康度分析，主轴轴承和冷却系统部件老化严重，建议提前采购备件，做好更换准备。',
                    priority: 'high',
                    action: '备件准备'
                });
            }
            
            return suggestions.map(s => `
                <div class="anomaly-item">
                    <div class="anomaly-icon">${s.icon}</div>
                    <div class="anomaly-content">
                        <div class="anomaly-title">${s.title}</div>
                        <div class="anomaly-desc">${s.desc}</div>
                        <div class="anomaly-meta">
                            <span class="anomaly-tag ${s.priority === 'high' ? 'critical' : s.priority === 'medium' ? 'warning' : 'info'}">${s.priority === 'high' ? '紧急' : s.priority === 'medium' ? '重要' : '一般'}</span>
                            <span class="confidence">建议措施: ${s.action}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        
        function generateHistoryComparison(health) {
            const history = [
                { date: '本周', health: health, change: '+2%' },
                { date: '上周', health: health - 2, change: '-1%' },
                { date: '本月', health: health - 3, change: '+5%' },
                { date: '上月', health: health - 5, change: '0%' }
            ];
            
            return `<div class="history-table">
                <table>
                    <thead>
                        <tr>
                            <th>时间周期</th>
                            <th>健康指数</th>
                            <th>变化趋势</th>
                            <th>诊断次数</th>
                            <th>异常次数</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(h => `
                            <tr>
                                <td>${h.date}</td>
                                <td><span class="health-value ${h.health >= 90 ? 'excellent' : h.health >= 70 ? 'warning' : 'danger'}">${h.health}</span></td>
                                <td><span class="trend-badge ${h.change.startsWith('+') ? 'up' : h.change.startsWith('-') ? 'down' : 'stable'}">${h.change}</span></td>
                                <td>${Math.floor(3 + Math.random() * 10)}</td>
                                <td>${h.health >= 90 ? 0 : Math.floor(Math.random() * 3)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="comparison-summary">
                <span>📊 总体评价: 设备${health >= 90 ? '运行稳定，各项指标正常' : health >= 70 ? '存在一定波动，需持续关注' : '健康状况不佳，建议优先处理'}，建议${health >= 90 ? '保持当前维护周期' : '缩短检查周期，加强监控'}。</span>
            </div>`;
        }

        
        function generateRealTimeMetrics(deviceType) {
            const metrics = {
                production: [
                    { name: '主轴温度', value: (60 + Math.random() * 15).toFixed(1), unit: '°C', status: 'normal' },
                    { name: '主轴转速', value: Math.floor(8000 + Math.random() * 4000), unit: 'rpm', status: 'normal' },
                    { name: '电机电流', value: (15 + Math.random() * 10).toFixed(1), unit: 'A', status: 'normal' },
                    { name: '进给速度', value: (80 + Math.random() * 40).toFixed(0), unit: 'mm/min', status: 'normal' }
                ],
                energy: [
                    { name: '排气压力', value: (0.7 + Math.random() * 0.4).toFixed(2), unit: 'MPa', status: 'normal' },
                    { name: '油温', value: (45 + Math.random() * 20).toFixed(1), unit: '°C', status: 'normal' },
                    { name: '负载率', value: Math.floor(60 + Math.random() * 30), unit: '%', status: 'normal' },
                    { name: '功率因数', value: (0.85 + Math.random() * 0.1).toFixed(2), unit: '', status: 'normal' }
                ],
                safety: [
                    { name: '烟雾浓度', value: (0.1 + Math.random() * 0.4).toFixed(2), unit: 'ppm', status: 'normal' },
                    { name: '环境温度', value: (20 + Math.random() * 10).toFixed(1), unit: '°C', status: 'normal' },
                    { name: '响应时间', value: (0.1 + Math.random() * 0.3).toFixed(2), unit: 's', status: 'normal' },
                    { name: '电池电压', value: (11.5 + Math.random() * 2.5).toFixed(1), unit: 'V', status: 'normal' }
                ],
                auxiliary: [
                    { name: '液压压力', value: (15 + Math.random() * 10).toFixed(1), unit: 'MPa', status: 'normal' },
                    { name: '液压温度', value: (35 + Math.random() * 15).toFixed(1), unit: '°C', status: 'normal' },
                    { name: '冷却液温度', value: (25 + Math.random() * 10).toFixed(1), unit: '°C', status: 'normal' },
                    { name: '润滑压力', value: (0.3 + Math.random() * 0.2).toFixed(2), unit: 'MPa', status: 'normal' }
                ]
            };
            
            const data = metrics[deviceType] || metrics.production;
            return `<div class="realtime-metrics-grid">
                ${data.map(m => `
                    <div class="realtime-metric-item">
                        <div class="metric-name">${m.name}</div>
                        <div class="metric-value">${m.value}<span class="metric-unit">${m.unit}</span></div>
                        <div class="metric-status ${m.status}">● 正常</div>
                    </div>
                `).join('')}
            </div>`;
        }
        
        
        function generateImmediateAlerts(health, deviceType) {
            const alerts = [];
            
            if (health < 90) {
                alerts.push({
                    icon: '🌡️',
                    title: '主轴温度偏高',
                    desc: '主轴温度达到65.2°C，超过正常范围（<60°C），建议检查冷却系统工作状态',
                    level: health < 80 ? 'critical' : 'warning',
                    confidence: Math.floor(75 + Math.random() * 15)
                });
            }
            
            if (health < 85) {
                alerts.push({
                    icon: '⚡',
                    title: '电机电流波动',
                    desc: '检测到电机电流存在异常波动，峰值达到额定值的110%，可能影响设备寿命',
                    level: 'warning',
                    confidence: Math.floor(70 + Math.random() * 15)
                });
            }
            
            if (health >= 90) {
                alerts.push({
                    icon: '✅',
                    title: '设备运行正常',
                    desc: '各项指标均在正常范围内，设备运行状态良好',
                    level: 'info',
                    confidence: Math.floor(90 + Math.random() * 8)
                });
            }
            
            return alerts.map(a => `
                <div class="anomaly-item ${a.level}">
                    <div class="anomaly-icon">${a.icon}</div>
                    <div class="anomaly-content">
                        <div class="anomaly-title">${a.title}</div>
                        <div class="anomaly-desc">${a.desc}</div>
                        <div class="anomaly-meta">
                            <span class="anomaly-tag ${a.level}">${a.level === 'critical' ? '严重' : a.level === 'warning' ? '警告' : '提示'}</span>
                            <span class="confidence">置信度: ${a.confidence}%</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        
        function generateImmediateSuggestions(health) {
            const suggestions = [];
            
            if (health < 80) {
                suggestions.push({
                    icon: '🚨',
                    title: '建议立即检查冷却系统',
                    desc: '主轴温度异常，建议立即检查冷却液液位、冷却泵工作状态和冷却管路通畅性',
                    priority: 'high',
                    action: '立即检查'
                });
                
                suggestions.push({
                    icon: '⚡',
                    title: '检查电机负载状态',
                    desc: '电机电流异常波动，建议检查负载变化情况，确认是否存在异常阻力',
                    priority: 'high',
                    action: '负载检查'
                });
            } else if (health < 90) {
                suggestions.push({
                    icon: '👁️',
                    title: '加强实时监控',
                    desc: '建议增加监控频率，每15分钟检查一次关键指标变化',
                    priority: 'medium',
                    action: '加强监控'
                });
                
                suggestions.push({
                    icon: '📊',
                    title: '记录异常数据',
                    desc: '建议记录异常数据，为后续深度诊断提供数据支持',
                    priority: 'medium',
                    action: '数据记录'
                });
            } else {
                suggestions.push({
                    icon: '✅',
                    title: '保持当前状态',
                    desc: '设备运行状态良好，建议继续保持当前运行参数和维护计划',
                    priority: 'low',
                    action: '保持状态'
                });
            }
            
            return suggestions.map(s => `
                <div class="anomaly-item">
                    <div class="anomaly-icon">${s.icon}</div>
                    <div class="anomaly-content">
                        <div class="anomaly-title">${s.title}</div>
                        <div class="anomaly-desc">${s.desc}</div>
                        <div class="anomaly-meta">
                            <span class="anomaly-tag ${s.priority === 'high' ? 'critical' : s.priority === 'medium' ? 'warning' : 'info'}">${s.priority === 'high' ? '紧急' : s.priority === 'medium' ? '重要' : '一般'}</span>
                            <span class="confidence">建议措施: ${s.action}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        
        function generateHistoricalTrends(health) {
            const trendData = [];
            for (let i = 30; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const trendHealth = health + Math.floor(Math.random() * 10 - 5);
                trendData.push({
                    date: date.toLocaleDateString(),
                    health: Math.max(60, Math.min(100, trendHealth))
                });
            }

        function generateAnomalyDetails(health, deviceType) {
            const anomalies = generateAnomalies(health);
            if (anomalies.length === 0) {
                return '<div style="padding: 20px; text-align: center; color: var(--text-muted);">未发现异常</div>';
            }
            return anomalies.map(a => `
                <div class="anomaly-item ${a.severity}">
                    <div class="anomaly-header">
                        <span class="anomaly-name">${a.name}</span>
                        <span class="anomaly-severity">${a.severity === 'critical' ? '严重' : a.severity === 'high' ? '重要' : '一般'}</span>
                    </div>
                    <div class="anomaly-desc">${a.description}</div>
                    <div class="anomaly-suggestion">建议: ${a.suggestion}</div>
                </div>
            `).join('');
        }


        function generateSpecialFocus(health, deviceType) {
            return generateSpecialFocusAreas(deviceType);
        }

            
            
            const chartData = trendData.slice(-14);
            const maxHealth = Math.max(...chartData.map(d => d.health));
            const minHealth = Math.min(...chartData.map(d => d.health));
            const range = maxHealth - minHealth || 20;
            
            
            const svgWidth = 600;
            const svgHeight = 200;
            const padding = 40;
            const chartWidth = svgWidth - 2 * padding;
            const chartHeight = svgHeight - 2 * padding;
            
            const points = chartData.map((d, i) => {
                const x = padding + (i / (chartData.length - 1)) * chartWidth;
                const y = padding + (1 - (d.health - minHealth) / range) * chartHeight;
                return { x, y, health: d.health, date: d.date };
            });
            
            const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`;
            
            
            const avgHealth = chartData.reduce((sum, d) => sum + d.health, 0) / chartData.length;
            const lineClass = avgHealth >= 90 ? 'excellent' : avgHealth >= 70 ? 'warning' : 'danger';
            
            return `
                <div class="trend-summary">
                    <div class="trend-item">
                        <div class="trend-label">30天平均健康度</div>
                        <div class="trend-value">${(health + Math.floor(Math.random() * 5)).toFixed(1)}</div>
                    </div>
                    <div class="trend-item">
                        <div class="trend-label">趋势变化</div>
                        <div class="trend-value ${health >= 90 ? 'up' : health >= 70 ? 'stable' : 'down'}">
                            ${health >= 90 ? '↑ 稳定向好' : health >= 70 ? '→ 略有波动' : '↓ 需要关注'}
                        </div>
                    </div>
                    <div class="trend-item">
                        <div class="trend-label">异常天数</div>
                        <div class="trend-value">${health >= 90 ? '0' : health >= 70 ? '2-3' : '5-8'}天</div>
                    </div>
                </div>
                <div class="line-chart-container">
                    <div class="line-chart">
                        <svg class="line-chart-svg" viewBox="0 0 ${svgWidth} ${svgHeight}">
                            <!-- 网格线 -->
                            <defs>
                                <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 50 0 L 0 0 0 40" fill="none" stroke="var(--border-light)" stroke-width="1" opacity="0.3"/>
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                            
                            <!-- 区域填充 -->
                            <path d="${areaPath}" fill="url(#gradient-${lineClass})" opacity="0.3"/>
                            
                            <!-- 渐变定义 -->
                            <defs>
                                <linearGradient id="gradient-excellent" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style="stop-color:#52c41a;stop-opacity:0.6" />
                                    <stop offset="100%" style="stop-color:#52c41a;stop-opacity:0.1" />
                                </linearGradient>
                                <linearGradient id="gradient-warning" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style="stop-color:#faad14;stop-opacity:0.6" />
                                    <stop offset="100%" style="stop-color:#faad14;stop-opacity:0.1" />
                                </linearGradient>
                                <linearGradient id="gradient-danger" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style="stop-color:#ff4d4f;stop-opacity:0.6" />
                                    <stop offset="100%" style="stop-color:#ff4d4f;stop-opacity:0.1" />
                                </linearGradient>
                            </defs>
                            
                            <!-- 主线条 -->
                            <path d="${linePath}" class="chart-line ${lineClass}" />
                            
                            <!-- 数据点 -->
                            ${points.map((p, i) => `
                                <circle cx="${p.x}" cy="${p.y}" class="chart-point ${p.health >= 90 ? 'excellent' : p.health >= 70 ? 'warning' : 'danger'}" 
                                        onmouseover="showTooltip(event, '${p.date}', ${p.health})"
                                        onmouseout="hideTooltip()" />
                            `).join('')}
                            
                            <!-- X轴 -->
                            <line x1="${padding}" y1="${svgHeight - padding}" x2="${svgWidth - padding}" y2="${svgHeight - padding}" class="chart-axis"/>
                            
                            <!-- Y轴 -->
                            <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${svgHeight - padding}" class="chart-axis"/>
                            
                            <!-- Y轴标签 -->
                            <text x="${padding - 10}" y="${padding}" class="chart-axis-label" text-anchor="end">${maxHealth.toFixed(0)}</text>
                            <text x="${padding - 10}" y="${svgHeight - padding}" class="chart-axis-label" text-anchor="end">${minHealth.toFixed(0)}</text>
                            <text x="${padding - 10}" y="${padding + chartHeight/2}" class="chart-axis-label" text-anchor="end">${((maxHealth + minHealth)/2).toFixed(0)}</text>
                        </svg>
                        <div class="chart-tooltip" id="tooltip"></div>
                    </div>
                </div>
            `;
        }






            
            
            const chartData = trendData.slice(-14);
            const maxHealth = Math.max(...chartData.map(d => d.health));
            const minHealth = Math.min(...chartData.map(d => d.health));
            const range = maxHealth - minHealth || 20;
            
            
            const svgWidth = 600;
            const svgHeight = 200;
            const padding = 40;
            const chartWidth = svgWidth - 2 * padding;
            const chartHeight = svgHeight - 2 * padding;
            
            const points = chartData.map((d, i) => {
                const x = padding + (i / (chartData.length - 1)) * chartWidth;
                const y = padding + (1 - (d.health - minHealth) / range) * chartHeight;
                return { x, y, health: d.health, date: d.date };
            });
            
            const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`;
            
            
            const avgHealth = chartData.reduce((sum, d) => sum + d.health, 0) / chartData.length;
            const lineClass = avgHealth >= 90 ? 'excellent' : avgHealth >= 70 ? 'warning' : 'danger';
            
            return `
                <div class="trend-summary">
                    <div class="trend-item">
                        <div class="trend-label">30天平均健康度</div>
                        <div class="trend-value">${(health + Math.floor(Math.random() * 5)).toFixed(1)}</div>
                    </div>
                    <div class="trend-item">
                        <div class="trend-label">趋势变化</div>
                        <div class="trend-value ${health >= 90 ? 'up' : health >= 70 ? 'stable' : 'down'}">
                            ${health >= 90 ? '↑ 稳定向好' : health >= 70 ? '→ 略有波动' : '↓ 需要关注'}
                        </div>
                    </div>
                    <div class="trend-item">
                        <div class="trend-label">异常天数</div>
                        <div class="trend-value">${health >= 90 ? '0' : health >= 70 ? '2-3' : '5-8'}天</div>
                    </div>
                </div>
                <div class="line-chart-container">
                    <div class="line-chart">
                        <svg class="line-chart-svg" viewBox="0 0 ${svgWidth} ${svgHeight}">
                            <!-- 网格线 -->
                            <defs>
                                <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 50 0 L 0 0 0 40" fill="none" stroke="var(--border-light)" stroke-width="1" opacity="0.3"/>
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                            
                            <!-- 区域填充 -->
                            <path d="${areaPath}" fill="url(#gradient-${lineClass})" opacity="0.3"/>
                            
                            <!-- 渐变定义 -->
                            <defs>
                                <linearGradient id="gradient-excellent" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style="stop-color:#52c41a;stop-opacity:0.6" />
                                    <stop offset="100%" style="stop-color:#52c41a;stop-opacity:0.1" />
                                </linearGradient>
                                <linearGradient id="gradient-warning" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style="stop-color:#faad14;stop-opacity:0.6" />
                                    <stop offset="100%" style="stop-color:#faad14;stop-opacity:0.1" />
                                </linearGradient>
                                <linearGradient id="gradient-danger" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style="stop-color:#ff4d4f;stop-opacity:0.6" />
                                    <stop offset="100%" style="stop-color:#ff4d4f;stop-opacity:0.1" />
                                </linearGradient>
                            </defs>
                            
                            <!-- 主线条 -->
                            <path d="${linePath}" class="chart-line ${lineClass}" />
                            
                            <!-- 数据点 -->
                            ${points.map((p, i) => `
                                <circle cx="${p.x}" cy="${p.y}" class="chart-point ${p.health >= 90 ? 'excellent' : p.health >= 70 ? 'warning' : 'danger'}" 
                                        onmouseover="showTooltip(event, '${p.date}', ${p.health})"
                                        onmouseout="hideTooltip()" />
                            `).join('')}
                            
                            <!-- X轴 -->
                            <line x1="${padding}" y1="${svgHeight - padding}" x2="${svgWidth - padding}" y2="${svgHeight - padding}" class="chart-axis"/>
                            
                            <!-- Y轴 -->
                            <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${svgHeight - padding}" class="chart-axis"/>
                            
                            <!-- Y轴标签 -->
                            <text x="${padding - 10}" y="${padding}" class="chart-axis-label" text-anchor="end">${maxHealth.toFixed(0)}</text>
                            <text x="${padding - 10}" y="${svgHeight - padding}" class="chart-axis-label" text-anchor="end">${minHealth.toFixed(0)}</text>
                            <text x="${padding - 10}" y="${padding + chartHeight/2}" class="chart-axis-label" text-anchor="end">${((maxHealth + minHealth)/2).toFixed(0)}</text>
                        </svg>
                        <div class="chart-tooltip" id="tooltip"></div>
                    </div>
                </div>
            `;
        }
        
        
        function generateParameterAnalysis(health, deviceType) {
            
            const parameterConfigs = {
                production: [
                    { name: '主轴温度', unit: '°C', normalRange: '45-65', threshold: 70 },
                    { name: '主轴转速', unit: 'rpm', normalRange: '6000-10000', threshold: 12000 },
                    { name: '电机电流', unit: 'A', normalRange: '12-22', threshold: 30 },
                    { name: '振动强度', unit: 'mm/s', normalRange: '0.5-2.5', threshold: 4.5 }
                ],
                energy: [
                    { name: '排气压力', unit: 'MPa', normalRange: '0.6-0.9', threshold: 1.2 },
                    { name: '油温', unit: '°C', normalRange: '40-60', threshold: 70 },
                    { name: '功率因数', unit: '', normalRange: '0.85-0.95', threshold: 0.9 },
                    { name: '负载率', unit: '%', normalRange: '60-85', threshold: 90 }
                ],
                safety: [
                    { name: '烟雾浓度', unit: 'ppm', normalRange: '0.1-0.5', threshold: 1.0 },
                    { name: '环境温度', unit: '°C', normalRange: '18-28', threshold: 40 },
                    { name: '环境湿度', unit: '%', normalRange: '40-70', threshold: 80 },
                    { name: '气体压力', unit: 'bar', normalRange: '2.0-2.5', threshold: 3.0 }
                ]
            };
            
            const configs = parameterConfigs[deviceType] || parameterConfigs.production;
            
            
            const parameterAnalysis = configs.map(config => {
                const currentValue = generateParameterValue(config, health);
                const avgValue = generateParameterValue(config, health + 5);
                const maxValue = generateParameterValue(config, health - 5, true);
                const minValue = generateParameterValue(config, health + 10, false);
                const exceedCount = health < 85 ? Math.floor(Math.random() * 15) : 0;
                const trend = health >= 90 ? 'stable' : health >= 70 ? 'slight-up' : 'up';
                
                return {
                    ...config,
                    currentValue,
                    avgValue,
                    maxValue,
                    minValue,
                    exceedCount,
                    trend,
                    status: currentValue > config.threshold ? 'danger' : currentValue > config.threshold * 0.9 ? 'warning' : 'normal'
                };
            });
            
            
            const abnormalParams = parameterAnalysis.filter(p => p.status !== 'normal');
            
            return `
                <div class="parameter-overview">
                    <div class="parameter-stats-grid">
                        <div class="parameter-stat-card">
                            <div class="parameter-stat-icon">📊</div>
                            <div class="parameter-stat-content">
                                <div class="parameter-stat-label">监测参数总数</div>
                                <div class="parameter-stat-value">${parameterAnalysis.length} 项</div>
                            </div>
                        </div>
                        <div class="parameter-stat-card">
                            <div class="parameter-stat-icon">✅</div>
                            <div class="parameter-stat-content">
                                <div class="parameter-stat-label">正常参数</div>
                                <div class="parameter-stat-value good">${parameterAnalysis.filter(p => p.status === 'normal').length} 项</div>
                            </div>
                        </div>
                        <div class="parameter-stat-card">
                            <div class="parameter-stat-icon">⚠️</div>
                            <div class="parameter-stat-content">
                                <div class="parameter-stat-label">预警参数</div>
                                <div class="parameter-stat-value warning">${parameterAnalysis.filter(p => p.status === 'warning').length} 项</div>
                            </div>
                        </div>
                        <div class="parameter-stat-card">
                            <div class="parameter-stat-icon">🚨</div>
                            <div class="parameter-stat-content">
                                <div class="parameter-stat-label">告警参数</div>
                                <div class="parameter-stat-value danger">${parameterAnalysis.filter(p => p.status === 'danger').length} 项</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="parameter-detail-section">
                    <div class="analysis-subtitle">📈 参数历史趋势分析（30天）</div>
                    <div class="parameter-trend-grid">
                        ${parameterAnalysis.map(param => `
                            <div class="parameter-trend-card ${param.status}">
                                <div class="parameter-trend-header">
                                    <div class="parameter-trend-name">${param.name}</div>
                                    <div class="parameter-trend-status ${param.status}">
                                        ${param.status === 'normal' ? '正常' : param.status === 'warning' ? '预警' : '告警'}
                                    </div>
                                </div>
                                <div class="parameter-trend-values">
                                    <div class="trend-value-item">
                                        <span class="trend-value-label">当前值</span>
                                        <span class="trend-value-num ${param.status}">${param.currentValue}${param.unit}</span>
                                    </div>
                                    <div class="trend-value-item">
                                        <span class="trend-value-label">30天平均</span>
                                        <span class="trend-value-num">${param.avgValue}${param.unit}</span>
                                    </div>
                                    <div class="trend-value-item">
                                        <span class="trend-value-label">最高值</span>
                                        <span class="trend-value-num">${param.maxValue}${param.unit}</span>
                                    </div>
                                    <div class="trend-value-item">
                                        <span class="trend-value-label">最低值</span>
                                        <span class="trend-value-num">${param.minValue}${param.unit}</span>
                                    </div>
                                </div>
                                <div class="parameter-trend-info">
                                    <div class="trend-info-item">
                                        <span class="trend-info-label">正常范围:</span>
                                        <span class="trend-info-value">${param.normalRange} ${param.unit}</span>
                                    </div>
                                    <div class="trend-info-item">
                                        <span class="trend-info-label">阈值:</span>
                                        <span class="trend-info-value">${param.threshold} ${param.unit}</span>
                                    </div>
                                    <div class="trend-info-item">
                                        <span class="trend-info-label">超限次数:</span>
                                        <span class="trend-info-value ${param.exceedCount > 0 ? 'warning' : ''}">${param.exceedCount} 次</span>
                                    </div>
                                </div>
                                <div class="parameter-trend-bar">
                                    <div class="trend-bar-bg">
                                        <div class="trend-bar-fill ${param.trend}" style="width: ${Math.min((param.currentValue / param.threshold) * 100, 100)}%"></div>
                                    </div>
                                    <div class="trend-bar-labels">
                                        <span>0</span>
                                        <span>${(param.threshold / 2).toFixed(1)}</span>
                                        <span>${param.threshold}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${abnormalParams.length > 0 ? `
                <div class="parameter-abnormal-section">
                    <div class="analysis-subtitle">⚠️ 异常参数详细分析</div>
                    <div class="abnormal-params-list">
                        ${abnormalParams.map(param => `
                            <div class="abnormal-param-item ${param.status}">
                                <div class="abnormal-param-header">
                                    <div class="abnormal-param-name">${param.name}</div>
                                    <div class="abnormal-param-badge ${param.status}">${param.status === 'warning' ? '预警' : '告警'}</div>
                                </div>
                                <div class="abnormal-param-analysis">
                                    <div class="analysis-text">
                                        ${generateParameterAnalysisText(param, health)}
                                    </div>
                                    <div class="analysis-suggestion">
                                        <strong>建议措施：</strong>${generateParameterSuggestion(param)}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            `;
        }
        
        
        function generateParameterValue(config, health, isMax = false) {
            const [min, max] = config.normalRange.split('-').map(v => parseFloat(v));
            const threshold = config.threshold;
            
            if (isMax) {
                return (max + Math.random() * (threshold - max) * 0.3).toFixed(1);
            }
            
            const baseValue = min + (max - min) * 0.5;
            const variation = (max - min) * 0.3;
            const healthFactor = (100 - health) / 100;
            
            let value = baseValue + (Math.random() - 0.5) * variation + healthFactor * (threshold - baseValue) * 0.2;
            return Math.max(min * 0.8, Math.min(threshold * 1.1, value)).toFixed(1);
        }
        
        
        function generateParameterAnalysisText(param, health) {
            const texts = {
                '主轴温度': param.currentValue > param.threshold ? 
                    `主轴温度达到${param.currentValue}°C，超过阈值${param.threshold}°C，连续高温可能导致轴承磨损加速。` : 
                    `主轴温度${param.currentValue}°C，接近阈值${param.threshold}°C，需要密切关注温度变化趋势。`,
                '主轴转速': `主轴转速${param.currentValue}rpm，${param.currentValue > 10000 ? '高转速运行，注意润滑和冷却' : '运行平稳'}。`,
                '电机电流': param.currentValue > param.threshold * 0.9 ? 
                    `电机电流${param.currentValue}A，${param.currentValue > param.threshold ? '超过' : '接近'}额定值，可能存在负载过大或电机老化问题。` : 
                    `电机电流${param.currentValue}A，运行正常。`,
                '振动强度': param.currentValue > 3.0 ? 
                    `振动强度${param.currentValue}mm/s，超过ISO标准，可能存在机械不平衡或轴承损坏。` : 
                    `振动强度${param.currentValue}mm/s，${param.currentValue > 2.5 ? '略高于正常范围' : '在正常范围内'}。`,
                '排气压力': `排气压力${param.currentValue}MPa，${param.currentValue > 0.9 ? '压力偏高，检查管路阻力' : '压力正常'}。`,
                '油温': param.currentValue > 65 ? 
                    `油温${param.currentValue}°C，温度过高，可能影响润滑效果和设备寿命。` : 
                    `油温${param.currentValue}°C，温度正常。`,
                '负载率': `负载率${param.currentValue}%，${param.currentValue > 85 ? '高负载运行，注意设备散热' : '负载适中'}。`,
                '烟雾浓度': param.currentValue > 0.8 ? 
                    `烟雾浓度${param.currentValue}ppm，超过安全标准，需要立即检查。` : 
                    `烟雾浓度${param.currentValue}ppm，在安全范围内。`
            };
            
            return texts[param.name] || `${param.name}当前值${param.currentValue}${param.unit}，${param.status === 'normal' ? '运行正常' : param.status === 'warning' ? '需要关注' : '需要立即处理'}。`;
        }
        
        
        function generateParameterSuggestion(param) {
            const suggestions = {
                '主轴温度': param.currentValue > param.threshold ? '立即停机检查冷却系统，清理散热器，检查润滑状态。' : '加强温度监测，准备冷却系统维护计划。',
                '主轴转速': '维持当前转速，定期检查主轴精度。',
                '电机电流': param.currentValue > param.threshold ? '检查负载情况，排查电机绝缘，必要时更换电机。' : '监测电流变化趋势，避免长时间高负载运行。',
                '振动强度': param.currentValue > 3.0 ? '立即进行动平衡校正，检查轴承状态，必要时更换。' : '增加振动监测频率，安排预防性维护。',
                '排气压力': '检查管路是否有堵塞，清理过滤器，检查阀门状态。',
                '油温': '检查冷却系统，清理冷却器，更换冷却液。',
                '负载率': '优化生产计划，避免长时间高负载运行，合理安排停机休息。',
                '烟雾浓度': '检查传感器状态，排查现场火源，加强通风。'
            };
            
            return suggestions[param.name] || '继续监测参数变化，如有异常及时处理。';
        }
        
        
        function generatePredictiveAnalysis(health) {
            const predictions = [];
            
            if (health < 85) {
                predictions.push({
                    icon: '🔮',
                    title: '轴承磨损预测',
                    desc: '基于振动频谱分析，主轴轴承预计在未来45-60天内需要更换，建议提前准备备件',
                    confidence: Math.floor(80 + Math.random() * 15),
                    timeframe: '45-60天'
                });
                
                predictions.push({
                    icon: '🌡️',
                    title: '冷却系统老化预测',
                    desc: '冷却效率呈下降趋势，预计90天后需要清洗或更换冷却器',
                    confidence: Math.floor(75 + Math.random() * 15),
                    timeframe: '90天'
                });
            }
            
            if (health < 80) {
                predictions.push({
                    icon: '⚡',
                    title: '电机绝缘老化预测',
                    desc: '绝缘电阻值持续下降，预计120天内需要电机大修',
                    confidence: Math.floor(70 + Math.random() * 20),
                    timeframe: '120天'
                });
            }
            
            if (health >= 85) {
                predictions.push({
                    icon: '✅',
                    title: '设备状态良好',
                    desc: '基于历史数据分析，设备在未来180天内保持良好状态的概率为95%',
                    confidence: Math.floor(90 + Math.random() * 8),
                    timeframe: '180天'
                });
            }
            
            return predictions.map(p => `
                <div class="anomaly-item">
                    <div class="anomaly-icon">${p.icon}</div>
                    <div class="anomaly-content">
                        <div class="anomaly-title">${p.title}</div>
                        <div class="anomaly-desc">${p.desc}</div>
                        <div class="anomaly-meta">
                            <span class="confidence">预测时间: ${p.timeframe}</span>
                            <span class="confidence">置信度: ${p.confidence}%</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        
        function generateComprehensiveAssessment(health, deviceType) {
            const assessments = [];
            
            assessments.push({
                icon: '📊',
                title: '数据质量评估',
                desc: `历史数据完整性: ${Math.floor(90 + Math.random() * 10)}%，数据准确性: ${Math.floor(85 + Math.random() * 10)}%，数据时效性: ${Math.floor(95 + Math.random() * 5)}%`,
                status: 'excellent'
            });
            
            assessments.push({
                icon: '🔍',
                title: '故障模式分析',
                desc: `基于历史${Math.floor(12 + Math.random() * 8)}个月的故障数据，识别出${health < 80 ? '3' : '1-2'}种主要故障模式，建立了相应的预测模型`,
                status: health < 80 ? 'warning' : 'good'
            });
            
            assessments.push({
                icon: '🎯',
                title: '风险评估',
                desc: `综合评估设备运行风险: ${health >= 90 ? '低风险' : health >= 70 ? '中等风险' : '高风险'}，主要风险因素包括${health < 85 ? '设备老化、维护不当' : '正常运行磨损'}`,
                status: health >= 90 ? 'excellent' : health >= 70 ? 'warning' : 'danger'
            });
            
            assessments.push({
                icon: '💰',
                title: '经济影响评估',
                desc: `预计维护成本: ${health >= 90 ? '5,000-8,000' : health >= 70 ? '8,000-15,000' : '15,000-25,000'}元，停机损失: ${health >= 90 ? '< 5,000' : health >= 70 ? '5,000-20,000' : '> 20,000'}元`,
                status: health >= 90 ? 'excellent' : health >= 70 ? 'warning' : 'danger'
            });
            
            return assessments.map(a => `
                <div class="anomaly-item">
                    <div class="anomaly-icon">${a.icon}</div>
                    <div class="anomaly-content">
                        <div class="anomaly-title">${a.title}</div>
                        <div class="anomaly-desc">${a.desc}</div>
                        <div class="anomaly-meta">
                            <span class="anomaly-tag ${a.status}">${a.status === 'excellent' ? '优秀' : a.status === 'good' ? '良好' : a.status === 'warning' ? '注意' : '需关注'}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        
        function generateRuntimeAnalysis(health, deviceType) {
            const runtimeData = {
                totalRuntime: Math.floor(2000 + Math.random() * 3000),
                monthlyRuntime: Math.floor(400 + Math.random() * 200),
                loadRate: Math.floor(60 + Math.random() * 30),
                efficiency: Math.floor(75 + Math.random() * 20),
                startStopCount: Math.floor(50 + Math.random() * 100),
                idleTime: Math.floor(10 + Math.random() * 20),
                faultCount: health >= 90 ? Math.floor(Math.random() * 3) : health >= 70 ? Math.floor(3 + Math.random() * 5) : Math.floor(8 + Math.random() * 7),
                maintenanceCount: Math.floor(5 + Math.random() * 10)
            };
            
            const runtimeMetrics = [
                { label: '累计运行时间', value: runtimeData.totalRuntime, unit: '小时', icon: '⏱️', status: 'normal' },
                { label: '月均运行时间', value: runtimeData.monthlyRuntime, unit: '小时', icon: '📅', status: 'normal' },
                { label: '平均负载率', value: runtimeData.loadRate, unit: '%', icon: '📊', status: runtimeData.loadRate > 85 ? 'warning' : 'normal' },
                { label: '运行效率', value: runtimeData.efficiency, unit: '%', icon: '⚡', status: runtimeData.efficiency >= 80 ? 'normal' : 'warning' },
                { label: '启停次数', value: runtimeData.startStopCount, unit: '次/月', icon: '🔄', status: runtimeData.startStopCount > 80 ? 'warning' : 'normal' },
                { label: '待机时间占比', value: runtimeData.idleTime, unit: '%', icon: '⏸️', status: runtimeData.idleTime > 25 ? 'warning' : 'normal' }
            ];
            
            const faultAnalysis = {
                recentFaults: runtimeData.faultCount,
                faultTrend: health >= 90 ? '稳定' : health >= 70 ? '略有上升' : '明显上升',
                mainFaultTypes: health >= 90 ? ['无显著故障'] : health >= 70 ? ['轻微告警', '参数偏离'] : ['部件磨损', '系统故障', '传感器异常'],
                mtbf: Math.floor(health * 10 + Math.random() * 50),
                mttr: Math.floor(2 + Math.random() * 4)
            };
            
            return `
                <div class="runtime-metrics-grid">
                    ${runtimeMetrics.map(m => `
                        <div class="runtime-metric-item ${m.status}">
                            <div class="runtime-metric-icon">${m.icon}</div>
                            <div class="runtime-metric-content">
                                <div class="runtime-metric-label">${m.label}</div>
                                <div class="runtime-metric-value">${m.value}<span class="runtime-metric-unit">${m.unit}</span></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="runtime-analysis-detail">
                    <div class="analysis-subtitle">📊 故障统计分析</div>
                    <div class="fault-stats">
                        <div class="fault-stat-item">
                            <div class="fault-stat-label">近30天故障次数</div>
                            <div class="fault-stat-value ${faultAnalysis.recentFaults === 0 ? 'good' : faultAnalysis.recentFaults < 5 ? 'warning' : 'danger'}">${faultAnalysis.recentFaults} 次</div>
                        </div>
                        <div class="fault-stat-item">
                            <div class="fault-stat-label">故障趋势</div>
                            <div class="fault-stat-value">${faultAnalysis.faultTrend}</div>
                        </div>
                        <div class="fault-stat-item">
                            <div class="fault-stat-label">平均故障间隔(MTBF)</div>
                            <div class="fault-stat-value">${faultAnalysis.mtbf} 小时</div>
                        </div>
                        <div class="fault-stat-item">
                            <div class="fault-stat-label">平均修复时间(MTTR)</div>
                            <div class="fault-stat-value">${faultAnalysis.mttr} 小时</div>
                        </div>
                    </div>
                    <div class="fault-types">
                        <div class="analysis-subtitle">🔍 主要故障类型</div>
                        <div class="fault-type-list">
                            ${faultAnalysis.mainFaultTypes.map(t => `
                                <span class="fault-type-tag">${t}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
        
        
        function generatePartsLifecycleAnalysis(health, deviceType) {
            const partsData = [
                {
                    name: '主轴轴承',
                    icon: '🔩',
                    installedDate: new Date(Date.now() - Math.floor(365 + Math.random() * 730) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                    currentHealth: Math.floor(health - 10 + Math.random() * 20),
                    expectedLife: Math.floor(2000 + Math.random() * 1000),
                    usedLife: Math.floor(500 + Math.random() * 1500),
                    remainingLife: Math.floor(300 + Math.random() * 700),
                    replacementCost: Math.floor(3000 + Math.random() * 2000),
                    priority: 'high'
                },
                {
                    name: '主轴电机',
                    icon: '⚡',
                    installedDate: new Date(Date.now() - Math.floor(200 + Math.random() * 600) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                    currentHealth: Math.floor(health - 5 + Math.random() * 15),
                    expectedLife: Math.floor(3000 + Math.random() * 2000),
                    usedLife: Math.floor(400 + Math.random() * 1200),
                    remainingLife: Math.floor(800 + Math.random() * 1500),
                    replacementCost: Math.floor(8000 + Math.random() * 4000),
                    priority: 'medium'
                },
                {
                    name: '冷却系统',
                    icon: '❄️',
                    installedDate: new Date(Date.now() - Math.floor(100 + Math.random() * 400) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                    currentHealth: Math.floor(health - 15 + Math.random() * 25),
                    expectedLife: Math.floor(1500 + Math.random() * 1000),
                    usedLife: Math.floor(300 + Math.random() * 800),
                    remainingLife: Math.floor(200 + Math.random() * 600),
                    replacementCost: Math.floor(2000 + Math.random() * 1500),
                    priority: 'high'
                },
                {
                    name: '润滑系统',
                    icon: '🛢️',
                    installedDate: new Date(Date.now() - Math.floor(50 + Math.random() * 200) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                    currentHealth: Math.floor(health - 2 + Math.random() * 10),
                    expectedLife: Math.floor(1000 + Math.random() * 500),
                    usedLife: Math.floor(100 + Math.random() * 400),
                    remainingLife: Math.floor(400 + Math.random() * 800),
                    replacementCost: Math.floor(1500 + Math.random() * 1000),
                    priority: 'low'
                },
                {
                    name: '传动系统',
                    icon: '⚙️',
                    installedDate: new Date(Date.now() - Math.floor(300 + Math.random() * 500) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                    currentHealth: Math.floor(health - 8 + Math.random() * 18),
                    expectedLife: Math.floor(2500 + Math.random() * 1500),
                    usedLife: Math.floor(600 + Math.random() * 1000),
                    remainingLife: Math.floor(500 + Math.random() * 1200),
                    replacementCost: Math.floor(5000 + Math.random() * 3000),
                    priority: 'medium'
                },
                {
                    name: '控制系统',
                    icon: '🎛️',
                    installedDate: new Date(Date.now() - Math.floor(150 + Math.random() * 300) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                    currentHealth: Math.floor(health + Math.random() * 10),
                    expectedLife: Math.floor(4000 + Math.random() * 2000),
                    usedLife: Math.floor(200 + Math.random() * 600),
                    remainingLife: Math.floor(1500 + Math.random() * 2500),
                    replacementCost: Math.floor(12000 + Math.random() * 8000),
                    priority: 'low'
                }
            ];
            
            return `
                <div class="parts-lifecycle-grid">
                    ${partsData.map(part => {
                        const lifePercentage = (part.usedLife / part.expectedLife * 100).toFixed(1);
                        const healthClass = part.currentHealth >= 90 ? 'excellent' : part.currentHealth >= 70 ? 'warning' : 'danger';
                        const priorityClass = part.priority === 'high' ? 'critical' : part.priority === 'medium' ? 'warning' : 'info';
                        const priorityText = part.priority === 'high' ? '高优先级' : part.priority === 'medium' ? '中优先级' : '低优先级';
                        
                        return `
                            <div class="part-lifecycle-card">
                                <div class="part-lifecycle-header">
                                    <div class="part-lifecycle-icon">${part.icon}</div>
                                    <div class="part-lifecycle-info">
                                        <div class="part-lifecycle-name">${part.name}</div>
                                        <div class="part-lifecycle-date">安装日期: ${part.installedDate}</div>
                                    </div>
                                    <div class="part-lifecycle-priority">
                                        <span class="priority-tag ${priorityClass}">${priorityText}</span>
                                    </div>
                                </div>
                                <div class="part-lifecycle-health">
                                    <div class="health-indicator">
                                        <span class="health-label">当前健康度</span>
                                        <span class="health-value ${healthClass}">${part.currentHealth}%</span>
                                    </div>
                                    <div class="health-bar">
                                        <div class="health-progress ${healthClass}" style="width: ${part.currentHealth}%"></div>
                                    </div>
                                </div>
                                <div class="part-lifecycle-stats">
                                    <div class="lifecycle-stat">
                                        <div class="lifecycle-stat-label">设计寿命</div>
                                        <div class="lifecycle-stat-value">${part.expectedLife}h</div>
                                    </div>
                                    <div class="lifecycle-stat">
                                        <div class="lifecycle-stat-label">已用寿命</div>
                                        <div class="lifecycle-stat-value">${part.usedLife}h (${lifePercentage}%)</div>
                                    </div>
                                    <div class="lifecycle-stat">
                                        <div class="lifecycle-stat-label">剩余寿命</div>
                                        <div class="lifecycle-stat-value highlight">${part.remainingLife}h</div>
                                    </div>
                                    <div class="lifecycle-stat">
                                        <div class="lifecycle-stat-label">更换成本</div>
                                        <div class="lifecycle-stat-value">¥${part.replacementCost.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div class="part-lifecycle-recommendation">
                                    <div class="recommendation-text">
                                        ${part.currentHealth < 70 ? `⚠️ 建议${Math.floor(part.remainingLife / 24)}天内安排更换` : 
                                          part.currentHealth < 85 ? `📅 建议${Math.floor(part.remainingLife / 24)}天内准备备件` : 
                                          '✅ 状态良好，继续监测'}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        
        function generatePredictiveMaintenanceSuggestions(health, deviceType) {
            const suggestions = [];
            
            
            if (health < 70) {
                
                suggestions.push({
                    icon: '🚨',
                    title: '紧急备件储备计划',
                    desc: '设备健康度较低，建议立即储备以下关键备件：主轴轴承（预计15天内更换，成本¥3,000-5,000）、冷却系统（预计20天内更换，成本¥2,000-3,500）、传动系统（预计30天内检修，成本¥5,000-8,000）。紧急采购成本比计划采购高30-50%。',
                    priority: 'high',
                    timeframe: '立即执行',
                    cost: '¥10,000-16,500'
                });
                
                suggestions.push({
                    icon: '🔧',
                    title: '关键部件更换时间表',
                    desc: '基于生命周期分析，建议按以下时间表执行更换：第1周-主轴轴承（健康度<70%，剩余寿命<300小时）、第2周-冷却系统（健康度<75%，剩余寿命<400小时）、第3-4周-传动系统全面检修。建议安排停机窗口，避免生产损失。',
                    priority: 'high',
                    timeframe: '分阶段执行',
                    cost: '停机损失约¥20,000-50,000'
                });
            } else if (health < 85) {
                
                suggestions.push({
                    icon: '📦',
                    title: '预防性备件储备建议',
                    desc: '建议30天内完成以下备件采购：主轴轴承×1（¥3,500，预计45-60天后需要）、冷却器滤芯×2（¥800，建议每3个月更换）、润滑油脂×5L（¥500，常规消耗品）。提前采购可节省成本15-20%，并避免紧急采购风险。',
                    priority: 'high',
                    timeframe: '30天内',
                    cost: '¥4,800'
                });
                
                suggestions.push({
                    icon: '📅',
                    title: '计划性维护排期',
                    desc: '建议制定90天维护计划：第30天-主轴轴承状态复查（预计剩余寿命600小时）、第60天-冷却系统清洗保养（延长使用寿命20%）、第90天-全面检修评估。合理安排可利用生产间隙，减少停机影响。',
                    priority: 'medium',
                    timeframe: '90天计划',
                    cost: '维护成本¥8,000-12,000'
                });
            } else {
                
                suggestions.push({
                    icon: '✅',
                    title: '常规备件库存管理',
                    desc: '设备状态良好，建议维持常规备件库存：易损件（密封圈、滤芯等）保持1-2个月用量、关键部件（轴承、电机）保持1套应急库存。预计年维护成本¥5,000-8,000，建议每季度评估库存状态。',
                    priority: 'low',
                    timeframe: '常规管理',
                    cost: '年成本¥5,000-8,000'
                });
                
                suggestions.push({
                    icon: '📊',
                    title: '优化维护周期建议',
                    desc: '基于当前健康状态，建议将例行维护周期从月度调整为季度，可节省维护成本约30%。同时加强状态监测，每2周进行一次关键参数检查，提前发现潜在问题。预计可延长设备使用寿命10-15%。',
                    priority: 'low',
                    timeframe: '长期优化',
                    cost: '节省成本约¥3,000/年'
                });
            }
            
            
            suggestions.push({
                icon: '🏪',
                title: '备件供应商管理',
                desc: '建议建立2-3家合格供应商名录，确保关键备件48小时内到货。与供应商签订框架协议，享受批量采购折扣（通常可节省10-15%）。建立备件质量追溯体系，避免使用劣质配件导致二次故障。',
                priority: 'medium',
                timeframe: '60天内',
                cost: '管理成本¥2,000/年'
            });
            
            suggestions.push({
                icon: '💰',
                title: '维护成本预算规划',
                desc: `根据设备健康度和生命周期分析，建议年度维护预算：${health >= 90 ? '¥5,000-8,000（常规维护）' : health >= 70 ? '¥15,000-25,000（预防性维护+备件储备）' : '¥30,000-50,000（大修+关键部件更换）'}。建议预留10-15%应急资金应对突发故障。`,
                priority: 'medium',
                timeframe: '年度规划',
                cost: '预算内执行'
            });
            
            return suggestions.map(s => `
                <div class="anomaly-item">
                    <div class="anomaly-icon">${s.icon}</div>
                    <div class="anomaly-content">
                        <div class="anomaly-title">${s.title}</div>
                        <div class="anomaly-desc">${s.desc}</div>
                        <div class="anomaly-meta">
                            <span class="anomaly-tag ${s.priority === 'high' ? 'critical' : s.priority === 'medium' ? 'warning' : 'info'}">${s.priority === 'high' ? '高优先级' : s.priority === 'medium' ? '中优先级' : '低优先级'}</span>
                            <span class="confidence">时间: ${s.timeframe}</span>
                            ${s.cost ? `<span class="confidence">成本: ${s.cost}</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        
        function generateSpecialFocusAreas(deviceType) {
            const focusAreas = {
                production: [
                    {
                        icon: '🔧',
                        title: '加工精度专项分析',
                        desc: '针对加工精度下降问题，分析主轴精度、导轨磨损、反向间隙等关键影响因素',
                        severity: 'high'
                    },
                    {
                        icon: '🌡️',
                        title: '热变形专项分析',
                        desc: '分析设备热变形对加工精度的影响，包括主轴热伸长、床身热变形等',
                        severity: 'medium'
                    },
                    {
                        icon: '⚡',
                        title: '电气系统专项分析',
                        desc: '针对电气故障频发问题，分析电机、驱动器、控制系统等电气部件状态',
                        severity: 'high'
                    }
                ],
                energy: [
                    {
                        icon: '💰',
                        title: '能效优化专项分析',
                        desc: '针对能耗过高问题，分析压缩效率、管路泄漏、控制策略等能效影响因素',
                        severity: 'high'
                    },
                    {
                        icon: '🔊',
                        title: '噪音异常专项分析',
                        desc: '针对设备噪音异常问题，分析机械振动、气流噪音、轴承状态等',
                        severity: 'medium'
                    },
                    {
                        icon: '🌡️',
                        title: '冷却系统专项分析',
                        desc: '分析冷却系统效率下降原因，包括冷却器结垢、冷却液老化等',
                        severity: 'medium'
                    }
                ],
                safety: [
                    {
                        icon: '🚨',
                        title: '安全响应专项分析',
                        desc: '针对安全响应延迟问题，分析传感器灵敏度、信号传输、控制逻辑等',
                        severity: 'critical'
                    },
                    {
                        icon: '🔋',
                        title: '备用电源专项分析',
                        desc: '分析备用电源系统状态，包括电池容量、充电效率、切换可靠性等',
                        severity: 'high'
                    },
                    {
                        icon: '📡',
                        title: '通信系统专项分析',
                        desc: '针对通信故障问题，分析信号强度、传输协议、网络稳定性等',
                        severity: 'medium'
                    }
                ],
                auxiliary: [
                    {
                        icon: '💧',
                        title: '液压系统专项分析',
                        desc: '针对液压系统压力不足问题，分析泵浦状态、油路堵塞、密封件老化等',
                        severity: 'high'
                    },
                    {
                        icon: '🔄',
                        title: '循环系统专项分析',
                        desc: '分析冷却液、润滑油等循环系统的循环效率、污染程度、过滤效果等',
                        severity: 'medium'
                    },
                    {
                        icon: '🔧',
                        title: '机械结构专项分析',
                        desc: '针对机械结构异常，分析导轨磨损、丝杆间隙、联轴器对中等',
                        severity: 'medium'
                    }
                ]
            };
            
            const areas = focusAreas[deviceType] || focusAreas.production;
            return areas.map(area => `
                <div class="special-focus-item">
                    <div class="focus-icon">${area.icon}</div>
                    <div class="focus-content">
                        <div class="focus-title">${area.title}</div>
                        <div class="focus-desc">${area.desc}</div>
                        <div class="focus-severity severity-${area.severity}">
                            ${area.severity === 'critical' ? '🔴 严重' : area.severity === 'high' ? '🟡 重要' : '🟢 一般'}
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        
        function generateRootCauseAnalysis(health, deviceType) {
            const rootCauses = [];
            
            if (health < 85) {
                rootCauses.push({
                    icon: '🎯',
                    title: '根本原因识别',
                    desc: '通过故障树分析(FTA)和鱼骨图分析，识别出设备异常的根本原因：主轴轴承磨损导致运行阻力增加',
                    method: 'FTA分析',
                    confidence: Math.floor(85 + Math.random() * 10)
                });
                
                rootCauses.push({
                    icon: '🔗',
                    title: '关联因素分析',
                    desc: '分析发现冷却系统效率下降、润滑不良、负载过重等因素相互关联，共同导致设备性能下降',
                    method: '关联分析',
                    confidence: Math.floor(80 + Math.random() * 15)
                });
                
                rootCauses.push({
                    icon: '⚡',
                    title: '影响因素权重',
                    desc: '轴承磨损(40%)、冷却不良(25%)、润滑不足(20%)、负载过重(15%)为主要影响因素',
                    method: '权重分析',
                    confidence: Math.floor(75 + Math.random() * 15)
                });
            } else {
                rootCauses.push({
                    icon: '✅',
                    title: '设备状态良好',
                    desc: '未发现明显的根本原因，设备运行状态良好，建议继续保持当前维护策略',
                    method: '综合分析',
                    confidence: Math.floor(90 + Math.random() * 8)
                });
            }
            
            return rootCauses.map(c => `
                <div class="anomaly-item">
                    <div class="anomaly-icon">${c.icon}</div>
                    <div class="anomaly-content">
                        <div class="anomaly-title">${c.title}</div>
                        <div class="anomaly-desc">${c.desc}</div>
                        <div class="anomaly-meta">
                            <span class="confidence">分析方法: ${c.method}</span>
                            <span class="confidence">置信度: ${c.confidence}%</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        
        function generateProfessionalRecommendations(health, deviceType) {
            const recommendations = [];
            
            if (health < 85) {
                recommendations.push({
                    icon: '👨‍🔧',
                    title: '主轴轴承更换建议',
                    desc: '建议采用专业轴承拆卸工具，按照制造商规范进行更换，更换后进行动平衡测试和精度校准',
                    professional: '机械工程师',
                    urgency: 'high'
                });
                
                recommendations.push({
                    icon: '🌡️',
                    title: '冷却系统优化建议',
                    desc: '建议清洗冷却器、更换冷却液、检查冷却泵，优化冷却参数设置，确保冷却效果达到设计要求',
                    professional: '热管理专家',
                    urgency: 'medium'
                });
                
                recommendations.push({
                    icon: '⚡',
                    title: '电气系统检查建议',
                    desc: '建议检查电机绝缘、驱动器参数、控制系统逻辑，必要时进行电机大修或更换',
                    professional: '电气工程师',
                    urgency: 'medium'
                });
            }
            
            recommendations.push({
                icon: '📋',
                title: '维护计划调整建议',
                desc: '建议调整维护周期，增加关键部件检查频率，建立专项维护档案',
                professional: '维护工程师',
                urgency: 'low'
            });
            
            recommendations.push({
                icon: '📊',
                title: '监控策略优化建议',
                desc: '建议增加专项监控指标，优化报警阈值设置，建立趋势分析模型',
                professional: '数据分析师',
                urgency: 'low'
            });
            
            return recommendations.map(r => `
                <div class="anomaly-item">
                    <div class="anomaly-icon">${r.icon}</div>
                    <div class="anomaly-content">
                        <div class="anomaly-title">${r.title}</div>
                        <div class="anomaly-desc">${r.desc}</div>
                        <div class="anomaly-meta">
                            <span class="confidence">建议专家: ${r.professional}</span>
                            <span class="anomaly-tag ${r.urgency === 'high' ? 'critical' : r.urgency === 'medium' ? 'warning' : 'info'}">${r.urgency === 'high' ? '紧急' : r.urgency === 'medium' ? '重要' : '一般'}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        
        function generateSpecialTreatmentPlan(health, deviceType) {
            const plans = [];
            
            if (health < 80) {
                plans.push({
                    icon: '📅',
                    title: '紧急处理方案（0-7天）',
                    desc: '立即降低设备负荷至70%，增加监控频率至每2小时一次，准备关键备件，联系专业技术人员',
                    priority: 'critical',
                    cost: '5,000-10,000元',
                    duration: '7天'
                });
                
                plans.push({
                    icon: '🔧',
                    title: '短期修复方案（7-30天）',
                    desc: '更换主轴轴承、清洗冷却系统、校准设备精度、测试验证修复效果',
                    priority: 'high',
                    cost: '15,000-25,000元',
                    duration: '30天'
                });
                
                plans.push({
                    icon: '📈',
                    title: '长期优化方案（30-90天）',
                    desc: '优化运行参数、建立预测性维护体系、培训操作人员、建立设备健康档案',
                    priority: 'medium',
                    cost: '8,000-15,000元',
                    duration: '90天'
                });
            } else if (health < 90) {
                plans.push({
                    icon: '👁️',
                    title: '监控强化方案（0-30天）',
                    desc: '增加监控频率至每4小时一次，记录详细运行数据，建立趋势分析模型',
                    priority: 'medium',
                    cost: '2,000-5,000元',
                    duration: '30天'
                });
                
                plans.push({
                    icon: '🛠️',
                    title: '预防性维护方案（30-60天）',
                    desc: '进行预防性维护，检查关键部件，更换易损件，优化维护计划',
                    priority: 'medium',
                    cost: '8,000-12,000元',
                    duration: '60天'
                });
            } else {
                plans.push({
                    icon: '✅',
                    title: '状态维持方案',
                    desc: '保持当前维护计划，继续监控关键指标，按计划进行例行保养',
                    priority: 'low',
                    cost: '3,000-5,000元',
                    duration: '持续'
                });
            }
            
            return plans.map(p => `
                <div class="anomaly-item">
                    <div class="anomaly-icon">${p.icon}</div>
                    <div class="anomaly-content">
                        <div class="anomaly-title">${p.title}</div>
                        <div class="anomaly-desc">${p.desc}</div>
                        <div class="anomaly-meta">
                            <span class="anomaly-tag ${p.priority === 'critical' ? 'critical' : p.priority === 'high' ? 'warning' : 'info'}">${p.priority === 'critical' ? '紧急' : p.priority === 'high' ? '重要' : '一般'}</span>
                            <span class="confidence">预计成本: ${p.cost}</span>
                            <span class="confidence">处理周期: ${p.duration}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        
        function generateAnomalies(health) {
            const anomalies = [];
            
            if (health < 90) {
                anomalies.push({
                    icon: '🌡️',
                    title: '主轴温度偏高',
                    desc: '主轴温度达到65.2°C，超过正常范围（<60°C），建议检查冷却系统工作状态',
                    level: health < 80 ? 'critical' : 'warning',
                    confidence: Math.floor(75 + Math.random() * 15)
                });
            }
            
            if (health < 85) {
                anomalies.push({
                    icon: '⚡',
                    title: '电机电流波动',
                    desc: '检测到电机电流存在异常波动，峰值达到额定值的110%，可能影响设备寿命',
                    level: 'warning',
                    confidence: Math.floor(70 + Math.random() * 15)
                });
            }
            
            if (health >= 90) {
                anomalies.push({
                    icon: '✅',
                    title: '设备运行正常',
                    desc: '各项指标均在正常范围内，设备运行状态良好，建议继续保持当前维护计划',
                    level: 'info',
                    confidence: Math.floor(90 + Math.random() * 8)
                });
            }
            
            return anomalies;
        }

        
        function getDeviceIconBg(type) {
            const colors = {
                production: '#e6f7ff',
                energy: '#f6ffed',
                safety: '#fff2f0',
                auxiliary: '#f9f0ff'
            };
            return colors[type] || '#f5f5f5';
        }

        
        function getDeviceIcon(type) {
            const icons = {
                production: '🏭',
                energy: '⚡',
                safety: '🛡️',
                auxiliary: '🛠️'
            };
            return icons[type] || '📋';
        }

        
        function getHealthClass(health) {
            if (health >= 90) return 'excellent';
            if (health >= 80) return 'good';
            if (health >= 70) return 'warning';
            return 'danger';
        }

        
        function getHealthColor(health) {
            if (health >= 90) return '#52c41a';
            if (health >= 80) return '#1890ff';
            if (health >= 70) return '#faad14';
            return '#ff4d4f';
        }

        
        function getHealthBg(health) {
            if (health >= 90) return '#f6ffed';
            if (health >= 80) return '#e6f7ff';
            if (health >= 70) return '#fffbe6';
            return '#fff2f0';
        }

        
        function getRiskLevel(health) {
            if (health >= 90) return '正常';
            if (health >= 80) return '良好';
            if (health >= 70) return '注意';
            return '警告';
        }

        
        function getRiskColor(health) {
            if (health >= 90) return '#52c41a';
            if (health >= 80) return '#1890ff';
            if (health >= 70) return '#faad14';
            return '#ff4d4f';
        }

        
        function generateReport() {
            if (!currentDevice) return;
            
            const reportTitle = `${currentDevice.name} 智能诊断报告`;
            document.getElementById('reportTitle').value = reportTitle;
            
            const reportType = document.getElementById('reportType').value;
            const deviceType = currentDevice.type;
            const health = currentDevice.health;
            
            
            const techMetrics = generateTechMetricsForReport(deviceType, health);
            const maintenanceSuggestions = generateMaintenanceSuggestionsForReport(health);
            const energyAnalysis = generateEnergyAnalysisForReport(health);
            const partsHealth = generatePartsHealthForReport(health);
            const historyComparison = generateHistoryComparisonForReport(health);
            
            let reportPreview = '';
            
            if (reportType === 'full') {
                reportPreview = generateFullReport(currentDevice, techMetrics, maintenanceSuggestions, energyAnalysis, partsHealth, historyComparison);
            } else if (reportType === 'summary') {
                reportPreview = generateSummaryReport(currentDevice, techMetrics, maintenanceSuggestions);
            } else if (reportType === 'technical') {
                reportPreview = generateTechnicalReport(currentDevice, techMetrics, partsHealth);
            }
            
            document.getElementById('reportPreview').textContent = reportPreview;
            document.getElementById('reportModal').classList.add('show');
        }
        
        
        function generateFullReport(device, techMetrics, maintenanceSuggestions, energyAnalysis, partsHealth, historyComparison) {
            return `
${device.name} 智能诊断报告
============================

📋 基本信息
----------------
设备名称: ${device.name}
设备编号: ${device.id}
设备类型: ${getDeviceTypeName(device.type)}
诊断时间: ${new Date().toLocaleString()}
诊断模式: ${selectedMode === 'quick' ? '快速诊断' : selectedMode === 'deep' ? '深度诊断' : '专项诊断'}
诊断周期: ${selectedMode === 'quick' ? '30秒' : selectedMode === 'deep' ? '3-5分钟' : '1-2分钟'}

🎯 诊断结论
----------------
健康指数: ${device.health}分 (${getHealthLevel(device.health)})
风险等级: ${getRiskLevel(device.health)}
AI置信度: ${Math.floor(85 + Math.random() * 10)}%
预测故障: ${device.health >= 90 ? '0' : device.health >= 70 ? '1' : '2'}个 (未来30天内)
建议措施: ${getRecommendationLevel(device.health)}

🔍 异常检测与分析
----------------
${generateAnomaliesForReport(device.health)}

📊 技术指标分析
----------------
${techMetrics}

🔧 部件健康状态
----------------
${partsHealth}

⚡ 能耗与效率分析
----------------
${energyAnalysis}

💡 智能维护建议
----------------
${maintenanceSuggestions}

📈 历史对比分析
----------------
${historyComparison}

🔮 预测性维护建议
----------------
基于AI模型分析，设备未来30天内的维护需求如下：
${generatePredictiveMaintenance(device.health)}

📋 后续行动计划
----------------
${generateActionPlan(device.health)}

📊 数据质量评估
----------------
数据完整性: ${Math.floor(90 + Math.random() * 10)}%
数据准确性: ${Math.floor(85 + Math.random() * 15)}%
数据时效性: ${Math.floor(95 + Math.random() * 5)}%

📝 报告说明
----------------
本报告由AI智能诊断系统基于多维度数据分析生成，包括：
• 实时监测数据 (传感器数据、运行参数)
• 历史运行数据 (性能趋势、故障记录)
• 维保维修数据 (保养记录、维修历史)
• 环境数据 (温湿度、振动、噪音等)

报告生成时间: ${new Date().toLocaleString()}
报告有效期: 7天
下次建议诊断时间: ${getNextDiagnosisTime()}

⚠️ 免责声明
----------------
本报告仅供参考，实际维护决策应结合现场检查和专业工程师判断。
如发现紧急情况，请立即停机并联系专业技术人员。
            `.trim();
        }
        
        
        function generateSummaryReport(device, techMetrics, maintenanceSuggestions) {
            return `
${device.name} 智能诊断摘要报告
================================

设备信息: ${device.name} (${device.id})
诊断时间: ${new Date().toLocaleString()}

核心指标:
• 健康指数: ${device.health}分 (${getHealthLevel(device.health)})
• 风险等级: ${getRiskLevel(device.health)}
• AI置信度: ${Math.floor(85 + Math.random() * 10)}%

关键发现:
${generateKeyFindings(device.health)}

维护建议:
${generateBriefMaintenanceSuggestions(device.health)}

下次诊断: ${getNextDiagnosisTime()}
            `.trim();
        }
        
        
        function generateTechnicalReport(device, techMetrics, partsHealth) {
            return `
${device.name} 技术诊断报告
==============================

设备信息:
设备名称: ${device.name}
设备编号: ${device.id}
设备类型: ${getDeviceTypeName(device.type)}
诊断时间: ${new Date().toLocaleString()}

技术指标详情:
${techMetrics}

部件状态分析:
${partsHealth}

技术建议:
${generateTechnicalRecommendations(device.health)}

报告生成时间: ${new Date().toLocaleString()}
            `.trim();
        }
        
        
        function generateTechMetricsForReport(deviceType, health) {
            const metrics = {
                production: [
                    { name: '主轴温度', value: (60 + Math.random() * 15).toFixed(1), unit: '°C', threshold: 70, status: health < 85 ? 'warning' : 'normal' },
                    { name: '主轴转速', value: Math.floor(8000 + Math.random() * 4000), unit: 'rpm', threshold: 12000, status: 'normal' },
                    { name: '电机电流', value: (15 + Math.random() * 10).toFixed(1), unit: 'A', threshold: 30, status: health < 80 ? 'warning' : 'normal' },
                    { name: '振动强度', value: (0.5 + Math.random() * 2).toFixed(2), unit: 'mm/s', threshold: 4.5, status: health < 75 ? 'danger' : 'normal' }
                ],
                energy: [
                    { name: '排气压力', value: (0.7 + Math.random() * 0.4).toFixed(2), unit: 'MPa', threshold: 1.2, status: 'normal' },
                    { name: '油温', value: (45 + Math.random() * 20).toFixed(1), unit: '°C', threshold: 70, status: 'normal' },
                    { name: '负载率', value: Math.floor(60 + Math.random() * 30), unit: '%', threshold: 90, status: health < 85 ? 'warning' : 'normal' },
                    { name: '功率因数', value: (0.85 + Math.random() * 0.1).toFixed(2), unit: '', threshold: 0.9, status: 'normal' }
                ],
                safety: [
                    { name: '烟雾浓度', value: (0.1 + Math.random() * 0.4).toFixed(2), unit: 'ppm', threshold: 1.0, status: 'normal' },
                    { name: '环境温度', value: (20 + Math.random() * 10).toFixed(1), unit: '°C', threshold: 40, status: 'normal' },
                    { name: '响应时间', value: (0.1 + Math.random() * 0.3).toFixed(2), unit: 's', threshold: 1.0, status: 'normal' },
                    { name: '电池电压', value: (11.5 + Math.random() * 2.5).toFixed(1), unit: 'V', threshold: 10.5, status: health < 80 ? 'warning' : 'normal' }
                ]
            };
            
            const data = metrics[deviceType] || metrics.production;
            return data.map(m => 
                `• ${m.name}: ${m.value}${m.unit} (阈值: ${m.threshold}${m.unit}) [${m.status === 'normal' ? '正常' : m.status === 'warning' ? '预警' : '告警'}]`
            ).join('\n');
        }
        
        
        function generateMaintenanceSuggestionsForReport(health) {
            if (health >= 90) {
                return `• 设备运行状态优秀，建议保持当前维护计划
• 按标准周期进行例行保养
• 继续监控关键指标变化趋势`;
            }


 else if (health >= 80) {
                return `• 设备状态良好，建议加强日常巡检
• 关注异常指标的发展趋势
• 适当调整维护周期，提前预防`;
            } else if (health >= 70) {
                return `• 设备存在异常，建议一周内安排检查
• 重点检查异常指标相关部件
• 考虑调整运行参数至最优区间
• 增加监控频率，及时发现问题`;
            } else {
                return `• 设备健康状况不佳，建议立即安排检修
• 优先处理高风险异常项目
• 准备必要的备件和工具
• 考虑临时降低运行负荷
• 联系专业技术人员进行详细检查`;
            }
        }
        
        
        function generateEnergyAnalysisForReport(health) {
            const power = (50 + Math.random() * 30).toFixed(1);
            const efficiency = (85 + Math.random() * 10).toFixed(1);
            const monthlyCost = (Math.random() * 5000).toFixed(0);
            
            return `当前功率: ${power} kW
运行效率: ${efficiency}%
月度能耗成本: ${monthlyCost} 元
碳排放量: ${(parseFloat(monthlyCost) * 0.5).toFixed(0)} kg

${health >= 90 ? '能耗表现良好，建议保持当前运行状态' : '检测到能耗异常，建议优化运行参数'}`;
        }
        
        
        function generatePartsHealthForReport(health) {
            const parts = [
                { name: '主轴轴承', health: Math.floor(health - 5 + Math.random() * 15) },
                { name: '电机', health: Math.floor(health - 3 + Math.random() * 10) },
                { name: '冷却系统', health: Math.floor(health - 8 + Math.random() * 20) },
                { name: '润滑系统', health: Math.floor(health - 2 + Math.random() * 8) }
            ];
            
            return parts.map(p => 
                `• ${p.name}: ${p.health}% ${p.health >= 90 ? '(优秀)' : p.health >= 80 ? '(良好)' : p.health >= 70 ? '(注意)' : '(需检修)'}`
            ).join('\n');
        }
        
        
        function generateHistoryComparisonForReport(health) {
            return `本周健康指数: ${health}分
上周健康指数: ${health - 2}分
月度变化趋势: ${health >= 90 ? '稳定向好' : health >= 70 ? '略有波动' : '需要关注'}
诊断频率建议: ${health >= 90 ? '每周1次' : health >= 70 ? '每周2次' : '每日1次'}`;
        }
        
        
        function generateAnomaliesForReport(health) {
            if (health >= 90) {
                return '✅ 无异常发现，设备运行状态良好';
            } else if (health >= 80) {
                return '⚠️ 发现轻微异常，建议关注相关指标变化';
            } else if (health >= 70) {
                return '⚠️ 检测到多项异常，建议安排检查';
            } else {
                return '🚨 发现严重异常，建议立即处理';
            }
        }
        
        
        function generatePredictiveMaintenance(health) {
            if (health >= 90) {
                return '• 未来30天内故障概率 < 5%\n• 建议按标准周期维护\n• 无需特殊预防措施';
            } else if (health >= 80) {
                return '• 未来30天内故障概率 5-15%\n• 建议加强日常巡检\n• 关注关键部件状态变化';
            } else if (health >= 70) {
                return '• 未来30天内故障概率 15-30%\n• 建议一周内安排检查\n• 准备必要的维护资源';
            } else {
                return '• 未来30天内故障概率 > 30%\n• 建议立即安排检修\n• 优先处理高风险项目';
            }
        }
        
        
        function generateActionPlan(health) {
            if (health >= 90) {
                return '• 继续执行标准维护计划\n• 保持当前监控频率\n• 记录运行数据用于趋势分析';
            } else if (health >= 80) {
                return '• 增加监控频率至每日2次\n• 一周内完成全面检查\n• 更新维护计划，加强预防性维护';
            } else if (health >= 70) {
                return '• 立即安排专业技术人员检查\n• 3天内完成异常项目处理\n• 调整运行参数至安全区间\n• 准备必要的备件和工具';
            } else {
                return '• 立即停机检修\n• 联系设备制造商技术支持\n• 制定详细的维修方案\n• 准备应急备件和替代设备\n• 安排专业技术团队现场处理';
            }
        }
        
        
        function getDeviceTypeName(type) {
            const names = {
                production: '生产设备',
                energy: '能源设备',
                safety: '安环设备',
                auxiliary: '辅助设备'
            };
            return names[type] || '未知设备';
        }
        
        
        function getHealthLevel(health) {
            if (health >= 90) return '优秀';
            if (health >= 80) return '良好';
            if (health >= 70) return '一般';
            return '需关注';
        }
        
        
        function getRecommendationLevel(health) {
            if (health >= 90) return '保持当前状态';
            if (health >= 80) return '加强监控';
            if (health >= 70) return '优先处理';
            return '紧急处理';
        }
        
        
        function generateKeyFindings(health) {
            if (health >= 90) {
                return '• 设备运行状态优秀\n• 各项指标均在正常范围内\n• 无需特殊处理';
            } else if (health >= 80) {
                return '• 设备状态良好\n• 个别指标略有波动\n• 建议加强监控';
            } else if (health >= 70) {
                return '• 设备存在异常\n• 多项指标偏离正常范围\n• 需要关注处理';
            } else {
                return '• 设备健康状况不佳\n• 发现严重异常\n• 建议立即处理';
            }
        }
        
        
        function generateBriefMaintenanceSuggestions(health) {
            if (health >= 90) {
                return '• 保持标准维护周期\n• 继续监控关键指标';
            } else if (health >= 80) {
                return '• 加强日常巡检\n• 关注异常指标变化';
            } else if (health >= 70) {
                return '• 一周内安排检查\n• 调整运行参数';
            } else {
                return '• 立即安排检修\n• 优先处理高风险项目';
            }
        }
        
        
        function generateTechnicalRecommendations(health) {
            if (health >= 90) {
                return '技术指标表现优秀，建议保持当前技术参数设置。';
            } else if (health >= 80) {
                return '技术指标基本正常，建议微调相关参数以优化性能。';
            } else if (health >= 70) {
                return '技术指标存在偏差，建议重点检查相关技术环节。';
            } else {
                return '技术指标严重异常，建议立即进行技术诊断和修复。';
            }
        }
        
        
        function getNextDiagnosisTime() {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + (currentDevice.health >= 90 ? 7 : currentDevice.health >= 70 ? 3 : 1));
            return nextDate.toLocaleDateString();
        }

        
        function exportReport() {
            const reportContent = document.getElementById('reportPreview').textContent;
            const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentDevice.id}_诊断报告_${new Date().toISOString().slice(0, 10)}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            closeModal();
            alert('报告已导出！');
        }

        
        function createWorkOrder() {
            alert(`已为 ${currentDevice.name} 创建维护工单！\n工单编号: WO-${Date.now().toString().slice(-8)}`);
        }

        
        function closeModal() {
            document.getElementById('reportModal').classList.remove('show');
        }

        
        function openAIChat() {
            if (!currentDevice) {
                alert('请先选择要咨询的设备');
                return;
            }
            
            
            document.getElementById('chatDeviceName').textContent = currentDevice.name;
            
            
            document.getElementById('chatModal').classList.add('show');
            
            
            const chatMessages = document.getElementById('chatMessages');
            const systemMessage = chatMessages.querySelector('.system-message');
            chatMessages.innerHTML = '';
            chatMessages.appendChild(systemMessage);
            
            
            setTimeout(() => {
                document.getElementById('chatInput').focus();
            }, 100);
        }
        
        
        function closeChatModal() {
            document.getElementById('chatModal').classList.remove('show');
        }
        
        
        function sendChatMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            
            addChatMessage(message, 'user');
            
            
            input.value = '';
            
            
            showTypingIndicator();
            
            
            setTimeout(() => {
                removeTypingIndicator();
                const response = generateAIResponse(message);
                addChatMessage(response, 'system');
            }, 1000 + Math.random() * 1000);
        }
        
        
        function sendQuickQuestion(question) {
            document.getElementById('chatInput').value = question;
            sendChatMessage();
        }
        
        
        function handleChatKeyPress(event) {
            if (event.key === 'Enter') {
                sendChatMessage();
            }
        }
        
        
        function addChatMessage(content, type) {
            const chatMessages = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${type}-message`;
            
            const avatar = type === 'user' ? '👤' : '🤖';
            const avatarBg = type === 'user' ? 'user' : 'system';
            
            messageDiv.innerHTML = `
                <div class="message-avatar ${avatarBg}">${avatar}</div>
                <div class="message-content">${content}</div>
            `;
            
            chatMessages.appendChild(messageDiv);
            
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        
        function showTypingIndicator() {
            const chatMessages = document.getElementById('chatMessages');
            const typingDiv = document.createElement('div');
            typingDiv.className = 'chat-message system-message typing-indicator';
            typingDiv.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="chat-typing">
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                    <span style="font-size: 12px; color: var(--text-muted);">AI思考中...</span>
                </div>
            `;
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        
        function removeTypingIndicator() {
            const typingIndicator = document.querySelector('.typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }
        
        
        function generateAIResponse(question) {
            const health = currentDevice ? currentDevice.health : 85;
            const deviceName = currentDevice ? currentDevice.name : '设备';
            const deviceType = currentDevice ? getDeviceTypeName(currentDevice.type) : '生产设备';
            
            
            const lowerQuestion = question.toLowerCase();
            
            
            if (lowerQuestion.includes('状态') || lowerQuestion.includes('怎么样') || lowerQuestion.includes('如何')) {
                return generateStatusResponse(deviceName, health, deviceType);
            }
            
            
            if (lowerQuestion.includes('维护') || lowerQuestion.includes('建议') || lowerQuestion.includes('保养') || lowerQuestion.includes('怎么办')) {
                return generateMaintenanceResponse(deviceName, health);
            }
            
            
            if (lowerQuestion.includes('预测') || lowerQuestion.includes('趋势') || lowerQuestion.includes('未来') || lowerQuestion.includes('风险')) {
                return generatePredictionResponse(deviceName, health);
            }
            
            
            if (lowerQuestion.includes('部件') || lowerQuestion.includes('零件') || lowerQuestion.includes('轴承') || lowerQuestion.includes('电机')) {
                return generatePartsResponse(deviceName, health);
            }
            
            
            if (lowerQuestion.includes('故障') || lowerQuestion.includes('问题') || lowerQuestion.includes('异常') || lowerQuestion.includes('报警')) {
                return generateFaultResponse(deviceName, health);
            }
            
            
            if (lowerQuestion.includes('参数') || lowerQuestion.includes('温度') || lowerQuestion.includes('压力') || lowerQuestion.includes('电流')) {
                return generateParameterResponse(deviceName, health, deviceType);
            }
            
            
            if (lowerQuestion.includes('成本') || lowerQuestion.includes('费用') || lowerQuestion.includes('价格') || lowerQuestion.includes('多少钱')) {
                return generateCostResponse(health);
            }
            
            
            if (lowerQuestion.includes('时间') || lowerQuestion.includes('多久') || lowerQuestion.includes('什么时候') || lowerQuestion.includes('周期')) {
                return generateTimeResponse(health);
            }
            
            
            return generateDefaultResponse(deviceName, health);
        }
        
        
        function generateStatusResponse(deviceName, health, deviceType) {
            let status = '';
            let details = '';
            
            if (health >= 90) {
                status = '运行状态优秀';
                details = '所有关键指标均在正常范围内，设备运行平稳，无需特殊关注。';
            } else if (health >= 80) {
                status = '运行状态良好';
                details = '整体运行正常，个别指标略有波动，建议保持正常监控。';
            } else if (health >= 70) {
                status = '运行状态一般';
                details = '检测到部分指标偏离正常范围，需要加强关注并及时处理。';
            } else {
                status = '运行状态不佳';
                details = '发现多项严重异常，建议立即安排检查和处理，避免故障扩大。';
            }
            
            return `<p><strong>${deviceName}</strong> 当前${status}。</p>
                    <p>健康度评分：<strong>${health}分</strong> (${getHealthLevel(health)})</p>
                    <p>${details}</p>
                    <p>设备类型：${deviceType}</p>
                    <p>上次诊断：${currentDevice ? currentDevice.lastDiagnosis : '刚刚'}</p>`;
        }
        
        
        function generateMaintenanceResponse(deviceName, health) {
            let priority = '';
            let actions = '';
            
            if (health >= 90) {
                priority = '常规维护';
                actions = '<li>继续执行标准维护计划</li><li>保持当前监控频率</li><li>定期进行例行检查</li>';
            } else if (health >= 80) {
                priority = '加强监控';
                actions = '<li>增加巡检频率至每日2次</li><li>关注异常指标变化趋势</li><li>一周内完成全面检查</li>';
            } else if (health >= 70) {
                priority = '优先处理';
                actions = '<li>3天内安排专业技术人员检查</li><li>重点检查轴承、冷却系统等关键部件</li><li>准备必要的备件和工具</li><li>调整运行参数至安全区间</li>';
            } else {
                priority = '紧急处理';
                actions = '<li>立即停机检修</li><li>联系设备制造商技术支持</li><li>制定详细的维修方案</li><li>准备应急备件和替代设备</li>';
            }
            
            return `<p>针对 <strong>${deviceName}</strong> 的维护建议（优先级：${priority}）：</p>
                    <ul>${actions}</ul>
                    <p>预计维护成本：${health >= 90 ? '¥5,000-8,000/年' : health >= 80 ? '¥8,000-15,000/年' : health >= 70 ? '¥15,000-25,000' : '¥30,000-50,000+'}</p>`;
        }
        
        
        function generatePredictionResponse(deviceName, health) {
            let riskLevel = '';
            let prediction = '';
            let timeframe = '';
            
            if (health >= 90) {
                riskLevel = '低风险';
                prediction = '设备在未来90天内保持良好运行状态的概率为95%以上';
                timeframe = '建议下次诊断时间：7天后';
            } else if (health >= 80) {
                riskLevel = '中低风险';
                prediction = '设备在未来60天内正常运行概率为85%，需关注关键指标变化';
                timeframe = '建议下次诊断时间：3-5天后';
            } else if (health >= 70) {
                riskLevel = '中风险';
                prediction = '设备在未来30天内可能出现故障的概率为20-30%，建议加强监控';
                timeframe = '建议下次诊断时间：1-2天后';
            } else {
                riskLevel = '高风险';
                prediction = '设备在未来7-15天内可能出现故障的概率超过50%，需要立即处理';
                timeframe = '建议立即安排检修';
            }
            
            return `<p><strong>${deviceName}</strong> 预测性分析结果：</p>
                    <p>风险等级：<strong style="color: ${getHealthColor(health)}">${riskLevel}</strong></p>
                    <p>${prediction}</p>
                    <p>${timeframe}</p>
                    <p>主要风险因素：${health < 85 ? '设备老化、维护不当、运行负荷过大' : '正常运行磨损'}</p>`;
        }
        
        
        function generatePartsResponse(deviceName, health) {
            const parts = [
                { name: '主轴轴承', health: Math.floor(health - 5 + Math.random() * 10) },
                { name: '主轴电机', health: Math.floor(health - 3 + Math.random() * 8) },
                { name: '冷却系统', health: Math.floor(health - 8 + Math.random() * 15) },
                { name: '润滑系统', health: Math.floor(health - 2 + Math.random() * 6) },
                { name: '传动系统', health: Math.floor(health - 5 + Math.random() * 12) },
                { name: '控制系统', health: Math.floor(health + Math.random() * 5) }
            ];
            
            const criticalParts = parts.filter(p => p.health < 70);
            const warningParts = parts.filter(p => p.health >= 70 && p.health < 85);
            
            let response = `<p><strong>${deviceName}</strong> 关键部件健康状况：</p>`;
            response += '<ul>';
            parts.forEach(part => {
                const status = part.health >= 90 ? '✅' : part.health >= 70 ? '⚠️' : '🚨';
                response += `<li>${status} ${part.name}：${part.health}%</li>`;
            });
            response += '</ul>';
            
            if (criticalParts.length > 0) {
                response += `<p>🚨 <strong>需要立即关注的部件：</strong>${criticalParts.map(p => p.name).join('、')}</p>`;
            }
            if (warningParts.length > 0) {
                response += `<p>⚠️ <strong>需要加强监控的部件：</strong>${warningParts.map(p => p.name).join('、')}</p>`;
            }
            
            return response;
        }
        
        
        function generateFaultResponse(deviceName, health) {
            if (health >= 90) {
                return `<p><strong>${deviceName}</strong> 当前未发现明显故障。</p>
                        <p>✅ 设备运行正常，各项指标均在安全范围内。</p>
                        <p>建议继续保持当前的维护和监控策略。</p>`;
            }
            
            const faults = health >= 80 ? [
                '个别传感器数据略有波动',
                '运行参数在正常范围内轻微偏移'
            ] : health >= 70 ? [
                '主轴温度偏高',
                '振动强度接近阈值',
                '电机电流不稳定'
            ] : [
                '主轴轴承磨损严重',
                '冷却系统效率下降',
                '电机绝缘老化',
                '传动系统异常振动'
            ];
            
            let response = `<p><strong>${deviceName}</strong> 检测到以下${health >= 80 ? '轻微异常' : '故障'}：</p><ul>`;
            faults.forEach(fault => {
                response += `<li>${fault}</li>`;
            });
            response += '</ul>';
            
            response += `<p>${health >= 80 ? '建议加强监控，及时处理。' : '建议立即安排检修，避免故障扩大。'}</p>`;
            
            return response;
        }
        
        
        function generateParameterResponse(deviceName, health, deviceType) {
            const params = deviceType === '生产设备' ? [
                { name: '主轴温度', value: (60 + Math.random() * 15).toFixed(1), unit: '°C', threshold: 70 },
                { name: '主轴转速', value: Math.floor(8000 + Math.random() * 4000), unit: 'rpm', threshold: 12000 },
                { name: '电机电流', value: (15 + Math.random() * 10).toFixed(1), unit: 'A', threshold: 30 },
                { name: '振动强度', value: (0.5 + Math.random() * 2).toFixed(2), unit: 'mm/s', threshold: 4.5 }
            ] : deviceType === '能源设备' ? [
                { name: '排气压力', value: (0.7 + Math.random() * 0.4).toFixed(2), unit: 'MPa', threshold: 1.2 },
                { name: '油温', value: (45 + Math.random() * 20).toFixed(1), unit: '°C', threshold: 70 },
                { name: '功率因数', value: (0.85 + Math.random() * 0.1).toFixed(2), unit: '', threshold: 0.9 },
                { name: '负载率', value: Math.floor(60 + Math.random() * 30), unit: '%', threshold: 90 }
            ] : [
                { name: '烟雾浓度', value: (0.1 + Math.random() * 0.4).toFixed(2), unit: 'ppm', threshold: 1.0 },
                { name: '环境温度', value: (20 + Math.random() * 10).toFixed(1), unit: '°C', threshold: 40 },
                { name: '环境湿度', value: Math.floor(40 + Math.random() * 40), unit: '%', threshold: 80 },
                { name: '气体压力', value: (2.0 + Math.random() * 0.5).toFixed(2), unit: 'bar', threshold: 3.0 }
            ];
            
            let response = `<p><strong>${deviceName}</strong> 关键运行参数：</p><ul>`;
            params.forEach(param => {
                const status = param.value > param.threshold ? '🚨 超限' : param.value > param.threshold * 0.9 ? '⚠️ 预警' : '✅ 正常';
                response += `<li>${param.name}：${param.value}${param.unit} ${status}</li>`;
            });
            response += '</ul>';
            
            const abnormalParams = params.filter(p => p.value > p.threshold * 0.9);
            if (abnormalParams.length > 0) {
                response += `<p>需要关注的参数：${abnormalParams.map(p => p.name).join('、')}</p>`;
            }
            
            return response;
        }
        
        
        function generateCostResponse(health) {
            const maintenanceCost = health >= 90 ? '5,000-8,000' : health >= 80 ? '8,000-15,000' : health >= 70 ? '15,000-25,000' : '30,000-50,000+';
            const downtimeCost = health >= 90 ? '< 5,000' : health >= 80 ? '5,000-10,000' : health >= 70 ? '10,000-30,000' : '> 50,000';
            const sparePartsCost = health >= 90 ? '3,000-5,000' : health >= 80 ? '5,000-10,000' : health >= 70 ? '10,000-20,000' : '20,000-40,000';
            
            return `<p><strong>成本分析预估：</strong></p>
                    <ul>
                        <li>维护成本：¥${maintenanceCost}/年</li>
                        <li>停机损失：¥${downtimeCost}/次</li>
                        <li>备件储备：¥${sparePartsCost}</li>
                    </ul>
                    <p>${health < 80 ? '提前进行预防性维护可节省30-50%的紧急维修成本。' : '继续保持良好的维护策略，可有效控制成本。'}</p>`;
        }
        
        
        function generateTimeResponse(health) {
            const nextDiagnosis = health >= 90 ? '7天后' : health >= 80 ? '3-5天后' : health >= 70 ? '1-2天后' : '立即';
            const maintenanceWindow = health >= 90 ? '可安排在计划维护期' : health >= 80 ? '建议2周内安排' : health >= 70 ? '建议3天内安排' : '建议立即停机检修';
            const partsLeadTime = health >= 90 ? '常规采购周期（15-30天）' : health >= 80 ? '建议提前采购（7-15天）' : health >= 70 ? '紧急采购（3-7天）' : '现货或紧急调拨（1-3天）';
            
            return `<p><strong>时间安排建议：</strong></p>
                    <ul>
                        <li>下次诊断时间：${nextDiagnosis}</li>
                        <li>维护窗口：${maintenanceWindow}</li>
                        <li>备件采购周期：${partsLeadTime}</li>
                    </ul>
                    <p>合理安排维护时间可最大限度减少生产损失。</p>`;
        }
        
        
        function generateDefaultResponse(deviceName, health) {
            return `<p>感谢您的咨询！关于 <strong>${deviceName}</strong>：</p>
                    <p>当前健康度为 <strong>${health}分</strong>（${getHealthLevel(health)}）。</p>
                    <p>您可以问我：</p>
                    <ul>
                        <li>设备当前状态如何？</li>
                        <li>有哪些维护建议？</li>
                        <li>预测性分析结果是什么？</li>
                        <li>关键部件健康状况如何？</li>
                        <li>运行参数是否正常？</li>
                    </ul>
                    <p>我会根据设备数据为您提供专业的分析和建议。</p>`;
        }

        
        function viewHistoryDetail(device, date) {
            
            const historyItem = diagnosisHistory.find(h => h.device === device && h.date === date);
            const score = historyItem ? historyItem.score : 85;
            const type = historyItem ? historyItem.type : '快速诊断';

            const content = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px; margin-bottom: 8px;">${score >= 90 ? '🟢' : score >= 80 ? '🟡' : '🔴'}</div>
                    <div style="font-size: 32px; font-weight: bold; color: ${score >= 90 ? 'var(--success)' : score >= 80 ? 'var(--warning)' : 'var(--danger)'};">${score}分</div>
                    <div style="color: var(--text-secondary); margin-top: 8px;">${getHealthLevel(score)}</div>
                </div>

                <h3>📋 诊断信息</h3>
                <table class="comparison-table">
                    <tr>
                        <td style="text-align: left;"><strong>设备名称</strong></td>
                        <td>${device}</td>
                    </tr>
                    <tr>
                        <td style="text-align: left;"><strong>诊断时间</strong></td>
                        <td>2025-${date}</td>
                    </tr>
                    <tr>
                        <td style="text-align: left;"><strong>诊断类型</strong></td>
                        <td><span class="highlight">${type}</span></td>
                    </tr>
                    <tr>
                        <td style="text-align: left;"><strong>诊断结果</strong></td>
                        <td style="color: ${score >= 90 ? 'var(--success)' : score >= 80 ? 'var(--warning)' : 'var(--danger)'};">${score >= 90 ? '健康良好' : score >= 80 ? '需要关注' : '需要维护'}</td>
                    </tr>
                </table>

                <h3>🔍 诊断详情</h3>
                <ul>
                    <li>设备运行状态：${score >= 90 ? '正常' : score >= 80 ? '轻微异常' : '异常'}</li>
                    <li>关键部件健康度：${score - 5}分</li>
                    <li>运行效率：${Math.floor(80 + score / 10)}%</li>
                    <li>能耗水平：${score >= 85 ? '正常' : '偏高'}</li>
                </ul>

                <h3>💡 建议措施</h3>
                <div style="background: ${score >= 90 ? '#f6ffed' : score >= 80 ? '#fffbe6' : '#fff2f0'}; border: 1px solid ${score >= 90 ? '#b7eb8f' : score >= 80 ? '#ffe58f' : '#ffccc7'}; border-radius: 8px; padding: 12px;">
                    ${score >= 90 ? '✅ 设备状态良好，继续保持当前维护策略' : score >= 80 ? '⚠️ 建议加强监控，关注关键指标变化' : '🔴 建议尽快安排维护，避免故障扩大'}
                </div>
            `;

            openToolModal(`📊 ${device} 诊断详情`, content);
        }

        
        function batchDiagnosis() {
            alert('批量诊断功能：选择多个设备同时进行AI诊断');
        }

        
        function openTool(tool) {
            const toolNames = {
                template: '诊断模板',
                compare: '对比分析',
                knowledge: '知识库',
                schedule: '定时诊断'
            };
            
            switch(tool) {
                case 'template':
                    openTemplateTool();
                    break;
                case 'compare':
                    openCompareTool();
                    break;
                case 'knowledge':
                    openKnowledgeTool();
                    break;
                case 'schedule':
                    openScheduleTool();
                    break;
                default:
                    alert(`打开${toolNames[tool]}功能`);
            }
        }
        
        
        function openTemplateTool() {
            const templates = [
                {
                    name: '生产设备标准诊断',
                    desc: '适用于数控车床、加工中心等生产设备的标准诊断模板',
                    parameters: ['主轴温度', '主轴转速', '电机电流', '振动强度', '进给速度'],
                    frequency: '每日1次'
                },
                {
                    name: '能源设备专项诊断',
                    desc: '针对空压机、变压器等能源设备的专项诊断模板',
                    parameters: ['排气压力', '油温', '负载率', '功率因数', '排气温度'],
                    frequency: '每周2次'
                },
                {
                    name: '安环设备安全诊断',
                    desc: '烟雾探测器、气体检测仪等安环设备的安全诊断模板',
                    parameters: ['烟雾浓度', '环境温度', '响应时间', '电池电压', '气体压力'],
                    frequency: '每日2次'
                },
                {
                    name: '关键设备深度诊断',
                    desc: '对关键设备进行全方位深度分析的诊断模板',
                    parameters: ['所有技术指标', '历史数据对比', '趋势分析', '预测性维护', '风险评估'],
                    frequency: '每周1次'
                }
            ];

            const content = templates.map(t => `
                <div class="template-card">
                    <h4>📋 ${t.name}</h4>
                    <p>${t.desc}</p>
                    <p><strong>监测参数:</strong> ${t.parameters.join('、')}</p>
                    <p><strong>建议频率:</strong> <span class="highlight">${t.frequency}</span></p>
                </div>
            `).join('') + `
                <div style="margin-top: 16px; padding: 12px; background: #e6f7ff; border-radius: 8px; border-left: 4px solid var(--primary);">
                    <strong>💡 提示:</strong> 选择合适的模板可以提高诊断效率和准确性
                </div>
            `;

            openToolModal('🔧 诊断模板库', content, true);
        }

        
        function generateImprovementSuggestions(comparisonData, currentHealth) {
            const suggestions = [];

            if (currentHealth < 85) {
                suggestions.push('• 优先处理当前设备异常问题');
            }

            if (comparisonData.current.efficiency < comparisonData.industry.efficiency) {
                suggestions.push('• 优化运行参数，提升设备效率');
            }

            if (comparisonData.current.power > comparisonData.industry.power * 1.1) {
                suggestions.push('• 检查设备状态，降低能耗水平');
            }

            if (comparisonData.current.health < comparisonData.lastWeek.health) {
                suggestions.push('• 分析健康度下降原因，及时干预');
            }

            if (suggestions.length === 0) {
                suggestions.push('• 设备表现良好，继续保持当前状态');
            }

            return suggestions.join('\n');
        }

        
        function openCompareTool() {
            if (!currentDevice) {
                openToolModal('⚠️ 提示', '<p style="text-align: center; padding: 20px;">请先选择一个设备进行对比分析</p>');
                return;
            }

            const comparisonData = {
                current: {
                    health: currentDevice.health,
                    efficiency: Math.floor(85 + Math.random() * 10),
                    power: (50 + Math.random() * 30).toFixed(1),
                    runtime: Math.floor(100 + Math.random() * 200)
                },
                lastWeek: {
                    health: currentDevice.health - Math.floor(Math.random() * 5),
                    efficiency: Math.floor(80 + Math.random() * 15),
                    power: (45 + Math.random() * 35).toFixed(1),
                    runtime: Math.floor(80 + Math.random() * 180)
                },
                lastMonth: {
                    health: currentDevice.health - Math.floor(Math.random() * 8),
                    efficiency: Math.floor(75 + Math.random() * 20),
                    power: (40 + Math.random() * 40).toFixed(1),
                    runtime: Math.floor(60 + Math.random() * 160)
                },
                industry: {
                    health: 85,
                    efficiency: 88,
                    power: 65.0,
                    runtime: 150
                }
            };

            const getArrow = (current, compare) => current > compare ? '<span class="up">↑</span>' : '<span class="down">↓</span>';

            const content = `
                <h3>📊 对比维度: 当前 vs 上周 vs 上月 vs 行业平均</h3>
                <table class="comparison-table">
                    <tr>
                        <th>指标</th>
                        <th>当前</th>
                        <th>上周</th>
                        <th>上月</th>
                        <th>行业平均</th>
                    </tr>
                    <tr>
                        <td><strong>健康指数</strong></td>
                        <td><span class="highlight">${comparisonData.current.health}分</span></td>
                        <td>${comparisonData.lastWeek.health}分 ${getArrow(comparisonData.current.health, comparisonData.lastWeek.health)}</td>
                        <td>${comparisonData.lastMonth.health}分 ${getArrow(comparisonData.current.health, comparisonData.lastMonth.health)}</td>
                        <td>${comparisonData.industry.health}分 ${getArrow(comparisonData.current.health, comparisonData.industry.health)}</td>
                    </tr>
                    <tr>
                        <td><strong>运行效率</strong></td>
                        <td><span class="highlight">${comparisonData.current.efficiency}%</span></td>
                        <td>${comparisonData.lastWeek.efficiency}% ${getArrow(comparisonData.current.efficiency, comparisonData.lastWeek.efficiency)}</td>
                        <td>${comparisonData.lastMonth.efficiency}% ${getArrow(comparisonData.current.efficiency, comparisonData.lastMonth.efficiency)}</td>
                        <td>${comparisonData.industry.efficiency}% ${getArrow(comparisonData.current.efficiency, comparisonData.industry.efficiency)}</td>
                    </tr>
                    <tr>
                        <td><strong>功率消耗</strong></td>
                        <td><span class="highlight">${comparisonData.current.power} kW</span></td>
                        <td>${comparisonData.lastWeek.power} kW ${getArrow(comparisonData.lastWeek.power, comparisonData.current.power)}</td>
                        <td>${comparisonData.lastMonth.power} kW ${getArrow(comparisonData.lastMonth.power, comparisonData.current.power)}</td>
                        <td>${comparisonData.industry.power} kW ${getArrow(comparisonData.industry.power, comparisonData.current.power)}</td>
                    </tr>
                    <tr>
                        <td><strong>运行时间</strong></td>
                        <td><span class="highlight">${comparisonData.current.runtime}h</span></td>
                        <td>${comparisonData.lastWeek.runtime}h ${getArrow(comparisonData.current.runtime, comparisonData.lastWeek.runtime)}</td>
                        <td>${comparisonData.lastMonth.runtime}h ${getArrow(comparisonData.current.runtime, comparisonData.lastMonth.runtime)}</td>
                        <td>${comparisonData.industry.runtime}h ${getArrow(comparisonData.current.runtime, comparisonData.industry.runtime)}</td>
                    </tr>
                </table>

                <h3>💡 分析结论</h3>
                <ul>
                    <li>${comparisonData.current.health >= 85 ? '✅ 设备整体表现良好' : '⚠️ 设备存在一些问题，建议关注异常指标'}</li>
                    <li>${comparisonData.current.efficiency >= comparisonData.industry.efficiency ? '✅ 运行效率优于行业平均水平' : '⚠️ 运行效率低于行业平均，建议优化'}</li>
                    <li>${comparisonData.current.power <= comparisonData.industry.power ? '✅ 能耗控制良好' : '⚠️ 能耗偏高，建议检查设备状态'}</li>
                </ul>

                <h3>📋 改进建议</h3>
                <div style="background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 8px; padding: 12px;">
                    <pre style="margin: 0; white-space: pre-wrap; font-family: inherit;">${generateImprovementSuggestions(comparisonData, currentDevice.health)}</pre>
                </div>
            `;

            openToolModal(`📊 ${currentDevice.name} 对比分析`, content);
        }
        
        
        function openKnowledgeTool() {
            const knowledgeBase = [
                {
                    category: '故障诊断',
                    icon: '🔧',
                    items: [
                        '<strong>主轴温度异常:</strong> 检查冷却系统、润滑系统、轴承磨损',
                        '<strong>振动过大:</strong> 检查动平衡、轴承状态、基础松动',
                        '<strong>电机电流异常:</strong> 检查负载变化、绝缘状态、电源质量',
                        '<strong>加工精度下降:</strong> 检查导轨磨损、丝杠间隙、刀具磨损'
                    ]
                },
                {
                    category: '维护保养',
                    icon: '🛠️',
                    items: [
                        '<strong>日常保养:</strong> 清洁、润滑、紧固、调整',
                        '<strong>定期保养:</strong> 更换滤芯、检查油质、校准精度',
                        '<strong>年度保养:</strong> 大修、更换易损件、系统升级',
                        '<strong>预防维护:</strong> 根据运行数据预测性维护'
                    ]
                },
                {
                    category: '运行优化',
                    icon: '⚡',
                    items: [
                        '<strong>参数调整:</strong> 根据加工材料调整切削参数',
                        '<strong>程序优化:</strong> 优化加工路径，减少空行程',
                        '<strong>能效提升:</strong> 合理安排生产计划，减少待机时间',
                        '<strong>智能调度:</strong> 基于设备状态的智能排产'
                    ]
                },
                {
                    category: '安全操作',
                    icon: '🛡️',
                    items: [
                        '<strong>操作规范:</strong> 严格按照操作规程执行',
                        '<strong>安全防护:</strong> 佩戴防护用品，设置安全警示',
                        '<strong>应急处理:</strong> 熟悉紧急停机程序，掌握应急措施',
                        '<strong>定期检查:</strong> 安全装置功能检查与维护'
                    ]
                }
            ];

            const content = knowledgeBase.map(k => `
                <div class="template-card">
                    <h4>${k.icon} ${k.category}</h4>
                    <ul style="margin: 8px 0; padding-left: 20px;">
                        ${k.items.map(item => `<li style="margin-bottom: 6px;">${item}</li>`).join('')}
                    </ul>
                </div>
            `).join('') + `
                <div style="margin-top: 16px; padding: 12px; background: #e6f7ff; border-radius: 8px; border-left: 4px solid var(--primary);">
                    <strong>💡 提示:</strong> 知识库内容会根据实际使用经验持续更新
                </div>
            `;

            openToolModal('🎓 智能诊断知识库', content);
        }
        
        
        function openScheduleTool() {
            if (!currentDevice) {
                openToolModal('⚠️ 提示', '<p style="text-align: center; padding: 20px;">请先选择一个设备进行定时诊断设置</p>');
                return;
            }

            const schedules = [
                {
                    name: '每日快速诊断',
                    time: '08:00',
                    frequency: '每天',
                    status: 'active',
                    statusText: '已启用',
                    lastRun: '2025-01-22 08:00',
                    nextRun: '2025-01-23 08:00'
                },
                {
                    name: '每周深度诊断',
                    time: '14:00',
                    frequency: '每周一',
                    status: 'active',
                    statusText: '已启用',
                    lastRun: '2025-01-20 14:00',
                    nextRun: '2025-01-27 14:00'
                },
                {
                    name: '月度全面诊断',
                    time: '10:00',
                    frequency: '每月1日',
                    status: 'inactive',
                    statusText: '已禁用',
                    lastRun: '2025-01-01 10:00',
                    nextRun: '2025-02-01 10:00'
                }
            ];

            const content = `
                <h3>⏰ 定时诊断任务列表</h3>
                ${schedules.map(s => `
                    <div class="schedule-item">
                        <div>
                            <strong>${s.name}</strong>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                时间: ${s.time} | 频率: ${s.frequency}
                            </div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                                上次: ${s.lastRun} | 下次: ${s.nextRun}
                            </div>
                        </div>
                        <span class="schedule-status ${s.status}">${s.statusText}</span>
                    </div>
                `).join('')}

                <h3>💡 功能说明</h3>
                <ul>
                    <li>支持设置多个定时诊断任务</li>
                    <li>可自定义诊断时间和频率</li>
                    <li>自动发送诊断报告到指定邮箱</li>
                    <li>发现异常时立即发送预警通知</li>
                </ul>

                <div style="margin-top: 16px; padding: 12px; background: #e6f7ff; border-radius: 8px; border-left: 4px solid var(--primary);">
                    <strong>📧 通知设置:</strong> 诊断报告将发送至设备负责人邮箱
                </div>
            `;

            openToolModal(`📅 ${currentDevice.name} 定时诊断设置`, content, true);
        }

        
        init();
        
        
        window.toggleGroup = toggleGroup;
        window.selectDeviceById = selectDeviceById;
        window.selectMode = selectMode;
        window.startDiagnosis = startDiagnosis;
        window.generateReport = generateReport;
        window.exportReport = exportReport;
        window.createWorkOrder = createWorkOrder;
        window.closeModal = closeModal;
        window.viewHistory = viewHistory;
        window.viewHistoryDetail = viewHistoryDetail;
        window.batchDiagnosis = batchDiagnosis;
        window.openTool = openTool;
        window.openAIChat = openAIChat;
        window.closeChatModal = closeChatModal;
        window.sendChatMessage = sendChatMessage;
        window.sendQuickQuestion = sendQuickQuestion;
        window.handleChatKeyPress = handleChatKeyPress;
        window.openToolModal = openToolModal;
        window.closeToolModal = closeToolModal;