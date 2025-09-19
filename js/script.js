// Глобальные переменные
let trades = JSON.parse(localStorage.getItem('cryptoFuturesTrades')) || [];
let currentCoin = 'BTC';
let editingIndex = -1;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    init();
    
    // Назначение обработчиков событий
    document.getElementById('coin-select').addEventListener('change', handleCoinChange);
    document.getElementById('add-trade-btn').addEventListener('click', showTradeForm);
    document.getElementById('cancel-trade-btn').addEventListener('click', hideTradeForm);
    document.getElementById('save-trade-btn').addEventListener('click', saveNewTrade);
    document.getElementById('clear-all-btn').addEventListener('click', clearAllTrades);
    document.getElementById('save-file-btn').addEventListener('click', saveToFile);
    document.getElementById('load-file-btn').addEventListener('click', triggerFileInput);
    document.getElementById('file-input').addEventListener('change', loadFromFile);
});

// Инициализация приложения
function init() {
    updateTradesTable();
    updateStats();
    
    // Установка текущей даты и времени по умолчанию
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('trade-date').value = localDateTime;
}

// Обновление таблицы сделок
function updateTradesTable() {
    const tbody = document.getElementById('trades-table').querySelector('tbody');
    tbody.innerHTML = '';
    
    const coinTrades = trades.filter(trade => trade.coin === currentCoin);
    
    coinTrades.forEach((trade, index) => {
        const row = document.createElement('tr');
        
        // Расчет PnL и ROE
        const isLong = trade.direction === 'long';
        const priceDiff = trade.exitPrice - trade.entryPrice;
        const pnl = isLong 
            ? priceDiff * trade.amount 
            : -priceDiff * trade.amount;
        const pnlAfterFees = pnl - (trade.entryPrice * trade.amount * trade.fee / 100) - (trade.exitPrice * trade.amount * trade.fee / 100);
        const margin = (trade.entryPrice * trade.amount) / trade.leverage;
        const roe = (pnlAfterFees / margin) * 100;
        
        // Находим глобальный индекс сделки
        const globalIndex = trades.indexOf(trade);
        
        row.innerHTML = `
            <td>${formatDateTime(trade.date)}</td>
            <td class="${trade.direction === 'long' ? 'profit' : 'loss'}">${trade.direction === 'long' ? 'Лонг' : 'Шорт'}</td>
            <td>${trade.entryPrice.toFixed(2)}</td>
            <td>${trade.exitPrice.toFixed(2)}</td>
            <td>${trade.amount}</td>
            <td>${trade.leverage}x</td>
            <td class="${pnlAfterFees >= 0 ? 'profit' : 'loss'}">${pnlAfterFees.toFixed(2)} USDT</td>
            <td class="${roe >= 0 ? 'profit' : 'loss'}">${roe.toFixed(2)}%</td>
            <td>${trade.notes || '-'}</td>
            <td>
                <button onclick="startEditTrade(${globalIndex})" class="btn-edit">✏️ Ред.</button>
                <button onclick="deleteTrade(${globalIndex})" class="btn-delete">🗑️ Удалить</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Обновление статистики
function updateStats() {
    const coinTrades = trades.filter(trade => trade.coin === currentCoin);
    const totalTrades = coinTrades.length;
    
    if (totalTrades === 0) {
        document.getElementById('total-profit').textContent = '0.00 USDT';
        document.getElementById('total-trades').textContent = '0';
        document.getElementById('success-rate').textContent = '0%';
        document.getElementById('avg-profit').textContent = '0.00 USDT';
        return;
    }
    
    // Расчет общей прибыли
    let totalProfit = 0;
    let profitableTrades = 0;
    
    coinTrades.forEach(trade => {
        const isLong = trade.direction === 'long';
        const priceDiff = trade.exitPrice - trade.entryPrice;
        const pnl = isLong 
            ? priceDiff * trade.amount 
            : -priceDiff * trade.amount;
        const pnlAfterFees = pnl - (trade.entryPrice * trade.amount * trade.fee / 100) - (trade.exitPrice * trade.amount * trade.fee / 100);
        
        totalProfit += pnlAfterFees;
        if (pnlAfterFees > 0) profitableTrades++;
    });
    
    const successRate = (profitableTrades / totalTrades) * 100;
    const avgProfit = totalProfit / totalTrades;
    const totalProfitEl = document.getElementById('total-profit');
    const successRateEl = document.getElementById('success-rate');
    const avgProfitEl = document.getElementById('avg-profit');
    
    totalProfitEl.textContent = `${totalProfit.toFixed(2)} USDT`;
    totalProfitEl.className = `stat-value ${totalProfit >= 0 ? 'profit' : 'loss'}`;
    document.getElementById('total-trades').textContent = totalTrades;
    successRateEl.textContent = `${successRate.toFixed(1)}%`;
    avgProfitEl.textContent = `${avgProfit.toFixed(2)} USDT`;
    avgProfitEl.className = `stat-value ${avgProfit >= 0 ? 'profit' : 'loss'}`;
}

// Экранирование HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Форматирование даты и времени
function formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('ru-RU');
}

// Обработчик изменения криптовалюты
function handleCoinChange() {
    currentCoin = document.getElementById('coin-select').value;
    updateTradesTable();
    updateStats();
}

// Показать форму добавления сделки
function showTradeForm() {
    document.getElementById('trade-form').style.display = 'grid';
}

// Скрыть форму добавления сделки
function hideTradeForm() {
    document.getElementById('trade-form').style.display = 'none';
}

// Сохранение новой сделки
async function saveNewTrade() {
    try {
        await securityManager.checkOperationLimitWithUI('save_trade');

        const trade = {
            coin: currentCoin,
            date: document.getElementById('trade-date').value,
            direction: document.getElementById('trade-direction').value,
            entryPrice: parseFloat(document.getElementById('entry-price').value),
            exitPrice: parseFloat(document.getElementById('exit-price').value),
            amount: parseFloat(document.getElementById('amount').value),
            leverage: parseInt(document.getElementById('leverage').value),
            fee: parseFloat(document.getElementById('fee').value),
            notes: document.getElementById('notes').value
        };
        
        // Валидация
        if (!trade.date || isNaN(trade.entryPrice) || isNaN(trade.exitPrice) || 
            isNaN(trade.amount) || trade.amount <= 0) {
            alert('Пожалуйста, заполните все обязательные поля корректно!');
            return;
        }
        
        trades.push(trade);
        localStorage.setItem('cryptoFuturesTrades', JSON.stringify(trades));
        
        // Сброс формы
        document.getElementById('entry-price').value = '';
        document.getElementById('exit-price').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('notes').value = '';
        hideTradeForm();
        
        updateTradesTable();
        updateStats();
    } catch (error) {
        if (error.message.includes('Слишком частые операции')) {
            // Обработка уже выполнена в checkOperationLimitWithUI
            return;
        }
        alert(error.message);
    }
}

// Очистка всех сделок
function clearAllTrades() {
    if (confirm('Вы уверены, что хотите удалить все сделки?')) {
        trades = trades.filter(trade => trade.coin !== currentCoin);
        localStorage.setItem('cryptoFuturesTrades', JSON.stringify(trades));
        updateTradesTable();
        updateStats();
    }
}

// Сохранение в файл
function saveToFile() {
    if (trades.length === 0) {
        alert('Нет данных для сохранения!');
        return;
    }
    
    const dataStr = JSON.stringify(trades, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `dump_фьючерсные_сделки_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Загрузка из файла
function triggerFileInput() {
    document.getElementById('file-input').click();
}

function loadFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const fileContent = e.target.result;
            const parsedTrades = JSON.parse(fileContent);
            
            if (Array.isArray(parsedTrades)) {
                if (confirm('Заменить текущие сделки загруженными?')) {
                    trades = parsedTrades;
                } else {
                    trades = [...trades, ...parsedTrades];
                }
                
                localStorage.setItem('cryptoFuturesTrades', JSON.stringify(trades));
                updateTradesTable();
                updateStats();
                alert(`Успешно загружено ${parsedTrades.length} сделок!`);
            } else {
                alert('Формат файла неверный!');
            }
        } catch (error) {
            alert('Ошибка при чтении файла: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Начать редактирование сделки
function startEditTrade(index) {
    // Закрываем предыдущую форму редактирования
    const existingForm = document.querySelector('.edit-form');
    if (existingForm) {
        existingForm.remove();
    }
    
    if (index < 0 || index >= trades.length) return;
    
    const trade = trades[index];
    editingIndex = index;
    
    // Находим строку таблицы для этой сделки
    const rows = document.getElementById('trades-table').querySelectorAll('tbody tr');
    let targetRow = null;
    
    for (let i = 0; i < rows.length; i++) {
        const btn = rows[i].querySelector('button[onclick="startEditTrade(' + index + ')"]');
        if (btn) {
            targetRow = rows[i];
            break;
        }
    }
    
    if (!targetRow) return;
    
    // Создаем форму редактирования
    const editForm = document.createElement('tr');
    editForm.className = 'edit-form';
    editForm.innerHTML = `
        <td colspan="10">
            <h3 style="margin-bottom: 15px; color: #f39c12;">Редактирование сделки</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div class="form-group">
                    <label for="edit-date">Дата и время</label>
                    <input type="datetime-local" id="edit-date" value="${escapeHtml(trade.date.slice(0, 16))}">
                </div>
                <div class="form-group">
                    <label for="edit-direction">Направление</label>
                    <select id="edit-direction">
                        <option value="long" ${escapeHtml(trade.direction) === 'long' ? 'selected' : ''}>Лонг</option>
                        <option value="short" ${escapeHtml(trade.direction) === 'short' ? 'selected' : ''}>Шорт</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-entry-price">Цена входа (USDT)</label>
                    <input type="number" id="edit-entry-price" step="0.01" value="${escapeHtml(trade.entryPrice)}">
                </div>
                <div class="form-group">
                    <label for="edit-exit-price">Цена выхода (USDT)</label>
                    <input type="number" id="edit-exit-price" step="0.01" value="${escapeHtml(trade.exitPrice)}">
                </div>
                <div class="form-group">
                    <label for="edit-amount">Количество (контрактов)</label>
                    <input type="number" id="edit-amount" step="0.001" value="${escapeHtml(trade.amount)}">
                </div>
                <div class="form-group">
                    <label for="edit-leverage">Плечо</label>
                    <input type="number" id="edit-leverage" value="${escapeHtml(trade.leverage)}" min="1" max="100">
                </div>
                <div class="form-group">
                    <label for="edit-fee">Комиссия (%)</label>
                    <input type="number" id="edit-fee" step="0.01" value="${escapeHtml(trade.fee)}" min="0">
                </div>
                <div class="form-group">
                    <label for="edit-notes">Примечания</label>
                    <input type="text" id="edit-notes" value="${escapeHtml(trade.notes) || ''}">
                </div>
            </div>
            <div class="edit-controls">
                <button onclick="saveEditTrade()" class="btn-save">Сохранить</button>
                <button onclick="cancelEditTrade()" style="background: #7f8c8d;">Отмена</button>
            </div>
        </td>
    `;
    
    // Вставляем форму редактирования после строки
    targetRow.parentNode.insertBefore(editForm, targetRow.nextSibling);
    
    // Прокручиваем к форме редактирования
    editForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Сохранить отредактированную сделку
function saveEditTrade() {
    if (editingIndex < 0 || editingIndex >= trades.length) return;
    
    const trade = trades[editingIndex];
    
    // Получаем новые значения из формы
    trade.date = document.getElementById('edit-date').value;
    trade.direction = document.getElementById('edit-direction').value;
    trade.entryPrice = parseFloat(document.getElementById('edit-entry-price').value);
    trade.exitPrice = parseFloat(document.getElementById('edit-exit-price').value);
    trade.amount = parseFloat(document.getElementById('edit-amount').value);
    trade.leverage = parseInt(document.getElementById('edit-leverage').value);
    trade.fee = parseFloat(document.getElementById('edit-fee').value);
    trade.notes = document.getElementById('edit-notes').value;
    
    // Валидация
    if (!trade.date || isNaN(trade.entryPrice) || isNaN(trade.exitPrice) || 
        isNaN(trade.amount) || trade.amount <= 0) {
        alert('Пожалуйста, заполните все обязательные поля корректно!');
        return;
    }
    
    // Сохраняем изменения
    localStorage.setItem('cryptoFuturesTrades', JSON.stringify(trades));
    
    // Закрываем форму редактирования
    const editForm = document.querySelector('.edit-form');
    if (editForm) {
        editForm.remove();
    }
    
    editingIndex = -1;
    
    // Обновляем таблицу и статистику
    updateTradesTable();
    updateStats();
    
    alert('Сделка успешно обновлена!');
}

// Отменить редактирование
function cancelEditTrade() {
    const editForm = document.querySelector('.edit-form');
    if (editForm) {
        editForm.remove();
    }
    editingIndex = -1;
}

// Удаление сделки
async function deleteTrade(index) {
    try {
        await securityManager.checkOperationLimitWithUI('delete_trade');
        if (confirm('Вы уверены, что хотите удалить эту сделку?')) {
            trades.splice(index, 1);
            localStorage.setItem('cryptoFuturesTrades', JSON.stringify(trades));
            updateTradesTable();
            updateStats();
        }
    } catch (error) {
        if (!error.message.includes('Слишком частые операции')) {
            alert(error.message);
        }
    }
}

// Сделаем функции глобальными для использования в onclick
window.startEditTrade = startEditTrade;
window.saveEditTrade = saveEditTrade;
window.cancelEditTrade = cancelEditTrade;
window.deleteTrade = deleteTrade;