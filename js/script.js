document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const coinSelect = document.getElementById('coin-select');
    const addTradeBtn = document.getElementById('add-trade-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const saveFileBtn = document.getElementById('save-file-btn');
    const loadFileBtn = document.getElementById('load-file-btn');
    const fileInput = document.getElementById('file-input');
    const tradeForm = document.getElementById('trade-form');
    const saveTradeBtn = document.getElementById('save-trade-btn');
    const cancelTradeBtn = document.getElementById('cancel-trade-btn');
    const tradesTable = document.getElementById('trades-table');
    
    // Статистические элементы
    const totalProfitEl = document.getElementById('total-profit');
    const totalTradesEl = document.getElementById('total-trades');
    const successRateEl = document.getElementById('success-rate');
    const avgProfitEl = document.getElementById('avg-profit');
    
    // Массив для хранения сделок
    let trades = JSON.parse(localStorage.getItem('cryptoFuturesTrades')) || [];
    let currentCoin = 'BTC';
    // let editingIndex = -1;
    
    // Инициализация
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
        const tbody = tradesTable.querySelector('tbody');
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
                    <button onclick="startEditTrade(${globalIndex})" class="btn-edit">Редакт.</button>
                    <button onclick="deleteTrade(${index})" class="btn-delete">Удалить</button>
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
            totalProfitEl.textContent = '0.00 USDT';
            totalTradesEl.textContent = '0';
            successRateEl.textContent = '0%';
            avgProfitEl.textContent = '0.00 USDT';
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
        
        totalProfitEl.textContent = `${totalProfit.toFixed(2)} USDT`;
        totalProfitEl.className = `stat-value ${totalProfit >= 0 ? 'profit' : 'loss'}`;
        totalTradesEl.textContent = totalTrades;
        successRateEl.textContent = `${successRate.toFixed(1)}%`;
        avgProfitEl.textContent = `${avgProfit.toFixed(2)} USDT`;
        avgProfitEl.className = `stat-value ${avgProfit >= 0 ? 'profit' : 'loss'}`;
    }
    
    // Форматирование даты и времени
    function formatDateTime(dateTimeStr) {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('ru-RU');
    }
    
    // Показать форму добавления сделки
    addTradeBtn.addEventListener('click', function() {
        tradeForm.style.display = 'grid';
    });
    
    // Скрыть форму добавления сделки
    cancelTradeBtn.addEventListener('click', function() {
        tradeForm.style.display = 'none';
    });
    
    // Сохранение сделки
    saveTradeBtn.addEventListener('click', function() {
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
        tradeForm.style.display = 'none';
        
        updateTradesTable();
        updateStats();
    });
    
    // Очистка всех сделок
    clearAllBtn.addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите удалить все сделки?')) {
            trades = trades.filter(trade => trade.coin !== currentCoin);
            localStorage.setItem('cryptoFuturesTrades', JSON.stringify(trades));
            updateTradesTable();
            updateStats();
        }
    });
    
    // Сохранение в файл
    saveFileBtn.addEventListener('click', function() {
        if (trades.length === 0) {
            alert('Нет данных для сохранения!');
            return;
        }
        
        const dataStr = JSON.stringify(trades, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `фьючерсные_сделки_${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });
    
    // Загрузка из файла
    loadFileBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function(event) {
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
    });

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
                        <input type="datetime-local" id="edit-date" value="${trade.date.slice(0, 16)}">
                    </div>
                    <div class="form-group">
                        <label for="edit-direction">Направление</label>
                        <select id="edit-direction">
                            <option value="long" ${trade.direction === 'long' ? 'selected' : ''}>Лонг</option>
                            <option value="short" ${trade.direction === 'short' ? 'selected' : ''}>Шорт</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-entry-price">Цена входа (USDT)</label>
                        <input type="number" id="edit-entry-price" step="0.01" value="${trade.entryPrice}">
                    </div>
                    <div class="form-group">
                        <label for="edit-exit-price">Цена выхода (USDT)</label>
                        <input type="number" id="edit-exit-price" step="0.01" value="${trade.exitPrice}">
                    </div>
                    <div class="form-group">
                        <label for="edit-amount">Количество (контрактов)</label>
                        <input type="number" id="edit-amount" step="0.001" value="${trade.amount}">
                    </div>
                    <div class="form-group">
                        <label for="edit-leverage">Плечо</label>
                        <input type="number" id="edit-leverage" value="${trade.leverage}" min="1" max="100">
                    </div>
                    <div class="form-group">
                        <label for="edit-fee">Комиссия (%)</label>
                        <input type="number" id="edit-fee" step="0.01" value="${trade.fee}" min="0">
                    </div>
                    <div class="form-group">
                        <label for="edit-notes">Примечания</label>
                        <input type="text" id="edit-notes" value="${trade.notes || ''}">
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
    window.deleteTrade = function(index) {
        // Находим глобальный индекс сделки
        const coinTrades = trades.filter(trade => trade.coin === currentCoin);
        const globalIndex = trades.indexOf(coinTrades[index]);
        
        if (globalIndex !== -1) {
            trades.splice(globalIndex, 1);
            localStorage.setItem('cryptoFuturesTrades', JSON.stringify(trades));
            updateTradesTable();
            updateStats();
        }
    };
    
    // Смена криптовалюты
    coinSelect.addEventListener('change', function() {
        currentCoin = coinSelect.value;
        updateTradesTable();
        updateStats();
    });
    
    // Инициализация при загрузке
    init();
});