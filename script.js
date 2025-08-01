// 患者データ管理
let patients = []; // 患者リスト
let currentPatient = null; // 現在選択中の患者

// ページロード時の初期化
window.addEventListener('load', function() {
    loadPatients();
    updatePatientList();
});

// 患者データをローカルストレージから読み込む
function loadPatients() {
    const savedPatients = localStorage.getItem('iip_patients');
    if (savedPatients) {
        patients = JSON.parse(savedPatients);
    }
}

// 患者データをローカルストレージに保存
function savePatients() {
    localStorage.setItem('iip_patients', JSON.stringify(patients));
}

// 患者リストの表示を更新
function updatePatientList() {
    const patientListElement = document.getElementById('patient-list').getElementsByTagName('tbody')[0];
    const noPatientMessage = document.getElementById('no-patients-message');
    
    // リストを初期化
    patientListElement.innerHTML = '';
    
    if (patients.length === 0) {
        noPatientMessage.style.display = 'block';
    } else {
        noPatientMessage.style.display = 'none';
        
        // 患者リストを表示
        patients.forEach((patient, index) => {
            const row = document.createElement('tr');
            
            // 患者ID/名前列
            const nameCell = document.createElement('td');
            nameCell.textContent = patient.id;
            row.appendChild(nameCell);
            
            // 最終更新列
            const lastUpdateCell = document.createElement('td');
            if (patient.lastUpdate) {
                const date = new Date(patient.lastUpdate);
                lastUpdateCell.textContent = date.toLocaleString();
            } else {
                lastUpdateCell.textContent = '未使用';
            }
            row.appendChild(lastUpdateCell);
            
            // 操作列
            const actionCell = document.createElement('td');
            
            // IIP開始ボタン
            const startButton = document.createElement('button');
            startButton.textContent = 'IIP開始/再開';
            startButton.className = 'small-button';
            startButton.onclick = function() {
                selectPatient(index);
            };
            actionCell.appendChild(startButton);
            
            // 削除ボタン
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '削除';
            deleteButton.className = 'small-button delete-btn';
            deleteButton.onclick = function() {
                if (confirm(`患者「${patient.id}」のデータを削除しますか？この操作は元に戻せません。`)) {
                    patients.splice(index, 1);
                    savePatients();
                    updatePatientList();
                }
            };
            actionCell.appendChild(deleteButton);
            
            row.appendChild(actionCell);
            patientListElement.appendChild(row);
        });
    }
}

// 新規患者登録
function registerPatient() {
    const patientId = document.getElementById('patient-id').value.trim();
    
    if (!patientId) {
        alert('患者IDまたは名前を入力してください');
        return;
    }
    
    // 既存患者のチェック
    const existingPatientIndex = patients.findIndex(p => p.id === patientId);
    
    if (existingPatientIndex >= 0) {
        // 既存患者の場合
        selectPatient(existingPatientIndex);
    } else {
        // 新規患者の場合
        const newPatient = {
            id: patientId,
            bgHistory: [],
            insulinRateHistory: [],
            timestamps: [],
            lastUpdate: null
        };
        
        patients.push(newPatient);
        savePatients();
        selectPatient(patients.length - 1);
    }
}

// 患者を選択してIIP計算機を表示
function selectPatient(index) {
    currentPatient = patients[index];
    
    // 患者情報表示の更新
    document.getElementById('current-patient-name').textContent = `患者: ${currentPatient.id}`;
    
    // 表示切替
    document.getElementById('patient-selection').style.display = 'none';
    document.getElementById('iip-calculator').style.display = 'block';
    
    // 患者データの読み込み
    loadPatientData();
    
    // デフォルトタブを表示
    openTab('initial');
}

// 患者選択画面に戻る
function returnToPatientList() {
    // 現在の患者データを保存
    if (currentPatient) {
        savePatientData();
    }
    
    currentPatient = null;
    
    // 表示切替
    document.getElementById('iip-calculator').style.display = 'none';
    document.getElementById('patient-selection').style.display = 'block';
    
    // 患者リストを更新
    updatePatientList();
}

// 現在の患者データを読み込む
function loadPatientData() {
    if (!currentPatient) return;
    
    // グローバル変数に患者データをロード
    bgHistory = currentPatient.bgHistory || [];
    insulinRateHistory = currentPatient.insulinRateHistory || [];
    timestamps = currentPatient.timestamps || [];
    
    // 最新のインスリン投与量を事前入力
    if (insulinRateHistory.length > 0) {
        document.getElementById('currentRate').value = insulinRateHistory[insulinRateHistory.length - 1];
    }
    
    // 最新と前回の血糖値を事前入力
    if (bgHistory.length > 1) {
        document.getElementById('currentBG').value = '';  // 最新値は入力してもらう
        document.getElementById('previousBG').value = bgHistory[bgHistory.length - 1];
    }
    
    // 履歴表の更新
    updateHistoryTable();
    
    // チャートの更新
    if (typeof drawBGChart === 'function') {
        drawBGChart();
    }
}

// 現在の患者データを保存
function savePatientData() {
    if (!currentPatient) return;
    
    // 患者データ更新
    currentPatient.bgHistory = bgHistory;
    currentPatient.insulinRateHistory = insulinRateHistory;
    currentPatient.timestamps = timestamps;
    currentPatient.lastUpdate = new Date().toISOString();
    
    // ローカルストレージに保存
    savePatients();
}

// 現在の患者の履歴をクリア
function clearPatientHistory() {
    if (!currentPatient) return;
    
    if (confirm('この患者の履歴データをすべて削除しますか？この操作は元に戻せません。')) {
        bgHistory = [];
        insulinRateHistory = [];
        timestamps = [];
        
        // 患者データを更新
        savePatientData();
        
        // 表示を更新
        updateHistoryTable();
        if (typeof drawBGChart === 'function') {
            drawBGChart();
        }
        
        alert('履歴データを削除しました。');
    }
}

// タブ切り替え機能
function openTab(tabName) {
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }
    
    const tabButtons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }
    
    document.getElementById(tabName).classList.add('active');
    
    // すべてのタブボタンをループして一致するものをアクティブに
    for (let i = 0; i < tabButtons.length; i++) {
        if (tabButtons[i].getAttribute('onclick').includes(tabName)) {
            tabButtons[i].classList.add('active');
        }
    }
    
    // 低血糖タブを開いた場合は前回の対応指示をクリア
    if (tabName === 'hypo') {
        clearHypoglycemiaResults();
    }
}

// 低血糖対応結果をクリアする関数
function clearHypoglycemiaResults() {
    const hypoResult = document.getElementById('hypoResult');
    if (hypoResult) {
        hypoResult.style.display = 'none';
        document.getElementById('hypoAction').textContent = '';
        document.getElementById('hypoNotes').textContent = '';
    }
}

// 血糖値とインスリン投与量の履歴を保存する配列
let bgHistory = [];
let insulinRateHistory = [];
let timestamps = [];

// 測定間隔に関する変数
let stableReadingsCount = 0;
let lowInsulinStableReadingsCount = 0;

// 新しいデータポイントを履歴に追加
function addDataPoint(bg, insulinRate) {
    const now = new Date();
    bgHistory.push(bg);
    insulinRateHistory.push(insulinRate);
    timestamps.push(now.toISOString());
    
    // 最大100ポイントに制限
    if (bgHistory.length > 100) {
        bgHistory.shift();
        insulinRateHistory.shift();
        timestamps.shift();
    }
    
    // 患者データを保存
    if (currentPatient) {
        savePatientData();
    }
    
    updateHistoryTable();
    if (typeof drawBGChart === 'function') {
        drawBGChart();
    }
}

// 履歴テーブルを更新
function updateHistoryTable() {
    const tableBody = document.getElementById('historyTableBody');
    if (!tableBody) return;
    
    // テーブルをクリア
    tableBody.innerHTML = '';
    
    // 最新の10エントリを表示（降順）
    for (let i = bgHistory.length - 1; i >= Math.max(0, bgHistory.length - 10); i--) {
        const row = document.createElement('tr');
        
        const timeCell = document.createElement('td');
        const date = new Date(timestamps[i]);
        timeCell.textContent = date.toLocaleString();
        row.appendChild(timeCell);
        
        const bgCell = document.createElement('td');
        bgCell.textContent = bgHistory[i];
        // 血糖値に応じた色分け
        if (bgHistory[i] < 70) {
            bgCell.style.color = 'red';
        } else if (bgHistory[i] >= 140 && bgHistory[i] <= 180) {
            bgCell.style.color = 'green';
        } else if (bgHistory[i] > 180) {
            bgCell.style.color = 'orange';
        }
        row.appendChild(bgCell);
        
        const rateCell = document.createElement('td');
        rateCell.textContent = insulinRateHistory[i];
        row.appendChild(rateCell);
        
        // 削除ボタンを追加
        const actionCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '削除';
        deleteButton.className = 'small-button delete-btn';
        deleteButton.onclick = function() {
            deleteDataPoint(i);
        };
        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);
        
        tableBody.appendChild(row);
    }
}

// 個別のデータポイントを削除する関数
function deleteDataPoint(index) {
    if (index < 0 || index >= bgHistory.length) {
        alert('削除対象のデータが見つかりません。');
        return;
    }
    
    const date = new Date(timestamps[index]);
    const bgValue = bgHistory[index];
    const insulinValue = insulinRateHistory[index];
    
    if (confirm(`以下のデータを削除しますか？この操作は元に戻せません。\n\n日時: ${date.toLocaleString()}\n血糖値: ${bgValue} mg/dL\nインスリン投与量: ${insulinValue} 単位/時`)) {
        // 配列から該当のデータを削除
        bgHistory.splice(index, 1);
        insulinRateHistory.splice(index, 1);
        timestamps.splice(index, 1);
        
        // 患者データを保存
        if (currentPatient) {
            savePatientData();
        }
        
        // 表示を更新
        updateHistoryTable();
        if (typeof drawBGChart === 'function') {
            drawBGChart();
        }
        
        alert('データを削除しました。');
    }
}

// 血糖値チャートを描画
function drawBGChart() {
    const ctx = document.getElementById('bgChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    // 既存のチャートがあれば破棄
    if (window.bgLineChart) {
        window.bgLineChart.destroy();
    }
    
    // チャート用の日時フォーマット
    const formattedDates = timestamps.map(ts => {
        const date = new Date(ts);
        return date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    });
    
    // チャート作成
    window.bgLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedDates,
            datasets: [
                {
                    label: '血糖値 (mg/dL)',
                    data: bgHistory,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'インスリン投与量 (単位/時)',
                    data: insulinRateHistory,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y-insulin'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '時間'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '血糖値 (mg/dL)'
                    },
                    min: 0,
                    max: 400,
                    grid: {
                        color: function(context) {
                            if (context.tick.value === 140 || context.tick.value === 180) {
                                return 'rgba(0, 255, 0, 0.5)';
                            }
                            if (context.tick.value === 70) {
                                return 'rgba(255, 0, 0, 0.5)';
                            }
                            return 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                },
                'y-insulin': {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'インスリン投与量 (単位/時)'
                    },
                    min: 0,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// 初期インスリン投与量計算
function calculateInitialDose() {
    const initialBG = parseFloat(document.getElementById('initialBG').value);
    
    if (isNaN(initialBG) || initialBG <= 0) {
        alert('有効な血糖値を入力してください');
        return;
    }
    
    let bolusDose = 0;
    let rate = 0;
    let notes = '';
    
    if (initialBG < 180) {
        notes = 'インスリン投与は血糖値が180 mg/dL以上の場合に推奨されます。';
    } else {
        // 初期インスリン量の計算: BG÷100を四捨五入で0.5単位ごとに切り上げ/切り下げ
        rate = Math.round((initialBG / 100) * 2) / 2;
        
        if (initialBG >= 300) {
            bolusDose = rate; // 300以上でボーラス投与
            notes = `初期BG = ${initialBG} mg/dL: ${initialBG} ÷ 100 = ${(initialBG / 100).toFixed(2)}、${rate}単位に丸め: IV ボーラス ${bolusDose} 単位 + インスリン投与開始 @ ${rate} 単位/時`;
        } else {
            notes = `初期BG = ${initialBG} mg/dL: ${initialBG} ÷ 100 = ${(initialBG / 100).toFixed(2)}、${rate}単位に丸め: ボーラスなし、インスリン投与開始 @ ${rate} 単位/時`;
        }
    }
    
    // 結果の表示
    document.getElementById('bolusDose').textContent = bolusDose > 0 ? `ボーラス投与: ${bolusDose} 単位` : 'ボーラス投与: 不要';
    document.getElementById('initialRate').textContent = `インスリン投与量: ${rate} 単位/時`;
    document.getElementById('initialNotes').textContent = notes;
    document.getElementById('initialResult').style.display = 'block';
    
    // 履歴に追加
    if (rate > 0) {
        addDataPoint(initialBG, rate);
    }
}

// インスリン投与量の調整計算 - 目標範囲140-180mg/dLに完全最適化
function calculateAdjustment() {
    const currentBG = parseFloat(document.getElementById('currentBG').value);
    const previousBG = parseFloat(document.getElementById('previousBG').value);
    const timeBetween = parseFloat(document.getElementById('timeBetween').value);
    const currentRate = parseFloat(document.getElementById('currentRate').value);
    
    if (isNaN(currentBG) || isNaN(previousBG) || isNaN(timeBetween) || isNaN(currentRate) || 
        currentBG <= 0 || previousBG <= 0 || timeBetween <= 0 || currentRate < 0) {
        alert('すべての項目に有効な値を入力してください');
        return;
    }
    
    // 時間あたりの血糖値変化率を計算
    const bgChangeTotal = currentBG - previousBG;
    const bgChangeRate = timeBetween > 1 ? bgChangeTotal / timeBetween : bgChangeTotal;
    
    let action = '';
    let newRate = currentRate;
    
    // BG < 100 mg/dLの場合は低血糖対応タブへ
    if (currentBG < 100) {
        alert('現在の血糖値が100 mg/dL未満です。低血糖対応タブを使用してください。');
        openTab('hypo');
        document.getElementById('hypoBG').value = currentBG;
        document.getElementById('hypoRate').value = currentRate;
        // 低血糖タブに移動する際は前回の結果をクリア
        clearHypoglycemiaResults();
        return;
    }
    
    // 血糖値と変化率に基づく調整
    if (currentBG >= 100 && currentBG < 140) {
        // 修正：BG 100-139 mg/dL（目標値より低い）
        if (currentBG >= 130) {
            // 130-139の範囲：少し下がっている程度なのでΔ分減量
            action = `血糖値が目標範囲下限（140mg/dL）を下回っています。インスリン投与量を減少 (-"Δ"): -${getDelta(currentRate)} 単位/時`;
            newRate = Math.max(0, currentRate - getDelta(currentRate));
        } else if (currentBG >= 110 && currentBG < 130) {
            // 110-129の範囲：かなり下がっているので2Δ分減量
            action = `血糖値が目標範囲より大幅に低下しています。インスリン投与量を大きく減少 (-"2Δ"): -${2 * getDelta(currentRate)} 単位/時`;
            newRate = Math.max(0, currentRate - 2 * getDelta(currentRate));
        } else {
            // 100-109の範囲：かなり低いので一時中止または大幅減量
            if (bgChangeRate < 0) {
                // まだ下がり続けている場合は一時中止
                action = 'インスリン投与を一時中止し、30分後に血糖値を再確認、100 mg/dL以上の場合は前回投与量の50%でインスリンを再開';
                newRate = 0;
            } else {
                // 上昇に転じている場合は大幅減量
                action = `血糖値が目標範囲から大幅に低下しています。インスリン投与量を半減: 前回の${currentRate}単位/時から${(currentRate * 0.5).toFixed(1)}単位/時に減量`;
                newRate = currentRate * 0.5;
            }
        }
    } else if (currentBG >= 140 && currentBG <= 180) {
        // BG 140-180 mg/dL（目標範囲内）
        if (bgChangeRate > 40) {
            action = `血糖値の上昇率が大きいため、インスリン投与量を増加 (+"Δ"): +${getDelta(currentRate)} 単位/時`;
            newRate = currentRate + getDelta(currentRate);
        } else if (bgChangeRate >= -20 && bgChangeRate <= 40) {
            action = 'インスリン投与量を変更しない（目標範囲内で安定）';
        } else if (bgChangeRate < -20 && bgChangeRate >= -40) {
            action = `血糖値の低下率が大きいため、インスリン投与量を減少 (-"Δ"): -${getDelta(currentRate)} 単位/時`;
            newRate = Math.max(0, currentRate - getDelta(currentRate));
        } else if (bgChangeRate < -40) {
            action = `血糖値の低下率が非常に大きいため、インスリンを30分間一時中止後、投与量を減少 (-"2Δ"): -${2 * getDelta(currentRate)} 単位/時`;
            newRate = Math.max(0, currentRate - 2 * getDelta(currentRate));
        }
    } else if (currentBG > 180 && currentBG < 220) {
        // 修正：BG 181-219 mg/dL（目標上限をやや超過）
        if (bgChangeRate > 40) {
            // 上昇率が大きい場合は2Δ増量
            action = `血糖値が目標上限を超え、かつ上昇率が大きいため、インスリン投与量を大幅増加 (+"2Δ"): +${2 * getDelta(currentRate)} 単位/時`;
            newRate = currentRate + 2 * getDelta(currentRate);
        } else if (bgChangeRate >= 0) {
            // 上昇中または変化なしならΔ増量
            action = `血糖値が目標上限を超えているため、インスリン投与量を増加 (+"Δ"): +${getDelta(currentRate)} 単位/時`;
            newRate = currentRate + getDelta(currentRate);
        } else if (bgChangeRate >= -40) {
            // 適度に下降中なら変更なし
            action = 'インスリン投与量を変更しない（適切に低下中）';
        } else if (bgChangeRate < -40) {
            // 急速に低下中ならΔ減量
            action = `血糖値の低下率が大きいため、インスリン投与量を減少 (-"Δ"): -${getDelta(currentRate)} 単位/時`;
            newRate = Math.max(0, currentRate - getDelta(currentRate));
        }
    } else if (currentBG >= 220 && currentBG < 300) {
        // 修正：BG 220-299 mg/dL（目標上限を大幅超過）
        if (bgChangeRate > 0) {
            // 上昇中なら2Δ増量
            action = `血糖値が目標上限を大幅に超え、かつ上昇中のため、インスリン投与量を大幅増加 (+"2Δ"): +${2 * getDelta(currentRate)} 単位/時`;
            newRate = currentRate + 2 * getDelta(currentRate);
        } else if (bgChangeRate >= -20) {
            // わずかに低下中または変化なしならΔ増量
            action = `血糖値が目標上限を大幅に超えているため、インスリン投与量を増加 (+"Δ"): +${getDelta(currentRate)} 単位/時`;
            newRate = currentRate + getDelta(currentRate);
        } else if (bgChangeRate >= -60) {
            // 適度に低下中なら変更なし
            action = 'インスリン投与量を変更しない（適切に低下中）';
        } else {
            // 急速に低下中ならΔ減量
            action = `血糖値は目標より高いが低下率が非常に大きいため、インスリン投与量を減少 (-"Δ"): -${getDelta(currentRate)} 単位/時`;
            newRate = Math.max(0, currentRate - getDelta(currentRate));
        }
    } else if (currentBG >= 300 && currentBG < 500) {
        // BG 300-499 mg/dL（重度の高血糖）
        if (bgChangeRate >= 0) {
            // 上昇中または変化なしなら3Δ増量（より強化）
            action = `血糖値が300 mg/dL以上で危険域にあるため、インスリン投与量を大幅増加 (+"3Δ"): +${3 * getDelta(currentRate)} 単位/時`;
            newRate = currentRate + 3 * getDelta(currentRate);
        } else if (bgChangeRate >= -30) {
            // わずかに低下中なら2Δ増量
            action = `血糖値が300 mg/dL以上で危険域にあるため、インスリン投与量を増加 (+"2Δ"): +${2 * getDelta(currentRate)} 単位/時`;
            newRate = currentRate + 2 * getDelta(currentRate);
        } else if (bgChangeRate >= -80) {
            // 適度に低下中ならΔ増量
            action = `血糖値が目標より非常に高いため、低下中でもインスリン投与量を増加 (+"Δ"): +${getDelta(currentRate)} 単位/時`;
            newRate = currentRate + getDelta(currentRate);
        } else if (bgChangeRate >= -120) {
            // 良好に低下中なら変更なし
            action = 'インスリン投与量を変更しない（適切に低下中）';
        } else {
            // 急速に低下中ならΔ減量
            action = `血糖値は目標より著しく高いが低下率が極めて大きいため、インスリン投与量を減少 (-"Δ"): -${getDelta(currentRate)} 単位/時`;
            newRate = Math.max(0, currentRate - getDelta(currentRate));
        }
    } else if (currentBG >= 500) {
        // BG ≥ 500 mg/dL（極度の高血糖、緊急事態）
        if (bgChangeRate >= 0) {
            // 上昇中または変化なしなら4Δ増量（最大限の増量）+ Dr.call
            action = `血糖値が500 mg/dL以上で極めて危険な状態です。Dr.callし、インスリン投与量を最大限増加 (+"4Δ"): +${4 * getDelta(currentRate)} 単位/時`;
            newRate = currentRate + 4 * getDelta(currentRate);
        } else if (bgChangeRate >= -30) {
            // わずかに低下中なら3Δ増量 + Dr.call
            action = `血糖値が500 mg/dL以上で極めて危険な状態です。Dr.callし、インスリン投与量を大幅増加 (+"3Δ"): +${3 * getDelta(currentRate)} 単位/時`;
            newRate = currentRate + 3 * getDelta(currentRate);
        } else if (bgChangeRate >= -80) {
            // 適度に低下中なら2Δ増量 + Dr.call
            action = `血糖値が500 mg/dL以上で極めて危険な状態です。Dr.callし、インスリン投与量を増加 (+"2Δ"): +${2 * getDelta(currentRate)} 単位/時`;
            newRate = currentRate + 2 * getDelta(currentRate);
        } else if (bgChangeRate >= -120) {
            // 良好に低下中ならΔ増量 + Dr.call
            action = `血糖値が500 mg/dL以上で極めて危険な状態です。Dr.callし、低下中でもインスリン投与量を増加 (+"Δ"): +${getDelta(currentRate)} 単位/時`;
            newRate = currentRate + getDelta(currentRate);
        } else {
            // 急速に低下中でも変更なし + Dr.call
            action = `血糖値が500 mg/dL以上で極めて危険な状態です。Dr.callし、急速低下中のためインスリン投与量を変更しない`;
        }
    }
    
    // 結果の表示
    document.getElementById('bgChange').textContent = `血糖値変化: ${previousBG} → ${currentBG} mg/dL (${bgChangeRate.toFixed(1)} mg/dL/時間)`;
    document.getElementById('adjustedRate').textContent = `調整後のインスリン投与量: ${newRate.toFixed(1)} 単位/時`;
    document.getElementById('adjustNotes').textContent = action;
    document.getElementById('adjustResult').style.display = 'block';
    
    // 安定性の判定
    const isInTargetRange = currentBG >= 140 && currentBG <= 180;
    const isRateUnchanged = Math.abs(newRate - currentRate) < 0.01; // 浮動小数点の比較のため余裕を持たせる
    
    if (isInTargetRange && isRateUnchanged) {
        stableReadingsCount++;
        
        // インスリン投与量が1単位/h未満で目標範囲内
        if (newRate < 1) {
            lowInsulinStableReadingsCount++;
            
            if (lowInsulinStableReadingsCount >= 3) {
                // IIP中止の提案
                document.getElementById('adjustNotes').textContent += 
                    '\n\n重要: インスリン投与量1単位/時未満で12時間（4時間間隔で3回連続）目標範囲内を維持しました。IIPの中止を検討してください。';
            }
        } else {
            lowInsulinStableReadingsCount = 0;
        }
        
        // 測定間隔の提案
        let intervalNote = '';
        if (stableReadingsCount >= 4) {
            intervalNote = '4回連続で安定したため、次回の血糖測定は4時間後に行ってください。';
        } else {
            intervalNote = `目標範囲内で安定: ${stableReadingsCount}/4回。${4 - stableReadingsCount}回連続安定すれば測定間隔を4時間に延長できます。`;
        }
        
        document.getElementById('adjustNotes').textContent += '\n\n' + intervalNote;
    } else {
        stableReadingsCount = 0;
        if (newRate < 1) {
            // 測定値は目標範囲外だがインスリン1単位/h未満の場合はカウントリセットしない
            if (isInTargetRange) {
                lowInsulinStableReadingsCount++;
            } else {
                lowInsulinStableReadingsCount = 0;
            }
        } else {
            lowInsulinStableReadingsCount = 0;
        }
        
        document.getElementById('adjustNotes').textContent += '\n\n注意: 安定していないため、次回測定は2時間後に行ってください。';
    }
    
    // 履歴に追加
    addDataPoint(currentBG, newRate);
}

// 低血糖対応の処理 - 日本の製剤サイズに合わせて修正
function handleHypoglycemia() {
    const hypoBG = parseFloat(document.getElementById('hypoBG').value);
    const hypoRate = parseFloat(document.getElementById('hypoRate').value);
    
    if (isNaN(hypoBG) || isNaN(hypoRate) || hypoBG < 0 || hypoRate < 0) {
        alert('有効な値を入力してください');
        return;
    }
    
    let action = '';
    let notes = '';
    let resumeRate = 0;
    
    if (hypoBG < 50) {
        // 日本の製剤サイズに合わせて修正（50%ブドウ糖40mL）+ Dr.call
        action = 'インスリン投与を直ちに中止し、50%ブドウ糖液40mL（2アンプル）を静注してDr.call';
        notes = '15分ごとに血糖値を再測定し、90 mg/dL以上になるまで継続。その後1時間ごとに測定し、140 mg/dL以上になったら30分待ってから前回の投与量の50%でインスリンを再開';
        resumeRate = hypoRate * 0.5;
    } else if (hypoBG >= 50 && hypoBG < 75) {
        // 日本の製剤サイズに合わせて修正（50%ブドウ糖20mL）+ Dr.call
        action = 'インスリン投与を直ちに中止し、50%ブドウ糖液20mL（1アンプル）を静注してDr.call';
        notes = '15分ごとに血糖値を再測定し、90 mg/dL以上になるまで継続。その後1時間ごとに測定し、140 mg/dL以上になったら30分待ってから前回の投与量の50%でインスリンを再開';
        resumeRate = hypoRate * 0.5;
    } else if (hypoBG >= 75 && hypoBG < 100) {
        action = 'インスリン投与を直ちに中止';
        notes = '15分ごとに血糖値を再測定し、90 mg/dL以上であることを確認。その後1時間ごとに測定し、140 mg/dL以上になったら30分待ってから前回の投与量の75%でインスリンを再開';
        resumeRate = hypoRate * 0.75;
    }
    
    // 結果の表示
    document.getElementById('hypoAction').textContent = action;
    document.getElementById('hypoNotes').textContent = `${notes}（再開時の投与量: ${resumeRate.toFixed(1)} 単位/時）`;
    document.getElementById('hypoResult').style.display = 'block';
    
    // 履歴に追加
    addDataPoint(hypoBG, 0); // 低血糖時はインスリン投与量0
}

// Δ値の取得（現在のインスリン投与量に基づく）
function getDelta(rate) {
    if (rate < 3) {
        return 0.5;
    } else if (rate >= 3 && rate <= 6) {
        return 1;
    } else if (rate > 6 && rate <= 9.5) {
        return 1.5;
    } else if (rate > 9.5 && rate <= 14.5) {
        return 2;
    } else if (rate > 14.5 && rate <= 19.5) {
        return 3;
    } else if (rate > 19.5) {
        return 4;
    }
}

// PDFレポート生成機能 - 文字化け対応
function generatePDFReport() {
    if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
        alert('PDFを生成するためのライブラリが読み込まれていません。');
        return;
    }
    
    // 日本語フォントをサポートするためにjspdfのunicode拡張を使用
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    
    // フォントの調整（デフォルトでは日本語非対応）
    // 代替として英語で出力し、日本語部分は固定テキストで表示
    
    // タイトルと日時
    doc.setFontSize(18);
    doc.text('Insulin Infusion Protocol Record', 10, 20);
    doc.setFontSize(12);
    doc.text(`Date/Time: ${new Date().toLocaleString()}`, 10, 30);
    
    // 患者情報
    if (currentPatient) {
        doc.text(`Patient ID: ${currentPatient.id}`, 10, 40);
    }
    
    // 血糖値履歴テーブル
    doc.setFontSize(14);
    doc.text('Blood Glucose and Insulin Rate History', 10, 60);
    
    // テーブルヘッダー
    doc.setFontSize(10);
    doc.text('Date/Time', 10, 70);
    doc.text('Blood Glucose (mg/dL)', 60, 70);
    doc.text('Insulin Rate (units/hr)', 120, 70);
    
    // テーブルデータ
    let yPos = 80;
    const maxEntries = Math.min(bgHistory.length, 20); // 最大20エントリ
    
    for (let i = bgHistory.length - 1; i >= Math.max(0, bgHistory.length - maxEntries); i--) {
        if (i < 0) break;
        
        const date = new Date(timestamps[i]);
        // 日付を英語フォーマットで表示（月/日/年 時:分）
        const dateStr = `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        doc.text(dateStr, 10, yPos);
        doc.text(bgHistory[i].toString(), 70, yPos);
        doc.text(insulinRateHistory[i].toString(), 130, yPos);
        yPos += 10;
        
        // ページが足りなくなったら新しいページを追加
        if (yPos > 280) {
            doc.addPage();
            yPos = 20;
        }
    }
    
    // チャートのキャプチャ
    if (window.bgLineChart) {
        try {
            const canvas = document.getElementById('bgChart');
            const imgData = canvas.toDataURL('image/png');
            
            doc.addPage();
            doc.text('Blood Glucose and Insulin Rate Chart', 10, 20);
            doc.addImage(imgData, 'PNG', 10, 30, 180, 100);
        } catch(e) {
            console.error('チャート画像の取得に失敗しました:', e);
        }
    }
    
    // ファイル名に患者IDと日時を含める
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const patientId = currentPatient ? currentPatient.id.replace(/[^\w\s]/gi, '') : 'unknown';
    const filename = `insulin_protocol_${patientId}_${timestamp}.pdf`;
    
    // PDFを保存
    doc.save(filename);
}
