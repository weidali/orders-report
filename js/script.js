// Глобальные переменные
let trades = JSON.parse(localStorage.getItem('cryptoFuturesTrades')) || [];
let currentCoin = 'all'; // Изменено на 'all' по умолчанию
let editingIndex = -1;
let currentPeriod = 'all';
let startDateFilter = null;
let endDateFilter = null;

// Функции для работы с датами
const DateUtils = {
    startOfDay: (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    },
    endOfDay: (date) => {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
    },
    startOfWeek: (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    },
    endOfWeek: (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() + (7 - day) - (day === 0 ? 7 : 0);
        d.setDate(diff);
        d.setHours(23, 59, 59, 999);
        return d;
    },
    startOfMonth: (date) => {
        const d = new Date(date);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    },
    endOfMonth: (date) => {
        const d = new Date(date);
        d.setMonth(d.getMonth() + 1);
        d.setDate(0);
        d.setHours(23, 59, 59, 999);
        return d;
    },
    startOfYear: (date) => {
        const d = new Date(date);
        d.setMonth(0, 1);
        d.setHours(0, 0, 0, 0);
        return d;
    },
    endOfYear: (date) => {
        const d = new Date(date);
        d.setMonth(11, 31);
        d.setHours(23, 59, 59, 999);
        return d;
    }
};

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
    
    // Обработчики для фильтрации
    setupFilterHandlers();
});

// Инициализация приложения
function init() {
    loadFilterState(); // Загружаем сохраненные фильтры
    updateTradesTable();
    updateStats();
    
    // Установка текущей даты и времени по умолчанию
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('trade-date').value = localDateTime;
}

// Фильтрация сделок по периоду
function filterTradesByPeriod(trades, period) {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
        case 'today':
            startDate = DateUtils.startOfDay(now);
            endDate = DateUtils.endOfDay(now);
            break;
        case 'week':
            startDate = DateUtils.startOfWeek(now);
            endDate = DateUtils.endOfWeek(now);
            break;
        case 'month':
            startDate = DateUtils.startOfMonth(now);
            endDate = DateUtils.endOfMonth(now);
            break;
        case 'year':
            startDate = DateUtils.startOfYear(now);
            endDate = DateUtils.endOfYear(now);
            break;
        case 'custom':
            if (!startDateFilter || !endDateFilter) return trades;
            startDate = DateUtils.startOfDay(startDateFilter);
            endDate = DateUtils.endOfDay(endDateFilter);
            break;
        default:
            return trades; // 'all'
    }

    return trades.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate >= startDate && tradeDate <= endDate;
    });
}

// Обновление таблицы сделок
function updateTradesTable() {
    const tbody = document.getElementById('trades-table').querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Фильтрация по криптовалюте
    let filteredTrades = currentCoin === 'all' 
        ? trades 
        : trades.filter(trade => trade.coin === currentCoin);
    
    // Фильтрация по периоду
    filteredTrades = filterTradesByPeriod(filteredTrades, currentPeriod);
    
    // Обновление статистики периода
    updatePeriodStats(filteredTrades);
    
    // Отрисовка таблицы
    filteredTrades.forEach((trade) => {
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

// Статистика для выбранного периода
function updatePeriodStats(filteredTrades) {
    let periodStatsContainer = document.getElementById('period-stats');
    
    if (!periodStatsContainer) {
        // Создаем контейнер если его нет
        const statsContainer = document.querySelector('.stats');
        if (!statsContainer) return;
        
        periodStatsContainer = document.createElement('div');
        periodStatsContainer.id = 'period-stats';
        periodStatsContainer.className = 'period-stats';
        periodStatsContainer.innerHTML = `
            <div class="period-stat-card">
                <h3>Сделок в периоде</h3>
                <div class="period-stat-value" id="period-trades-count">0</div>
            </div>
            <div class="period-stat-card">
                <h3>Прибыль в периоде</h3>
                <div class="period-stat-value" id="period-profit">0.00 USDT</div>
            </div>
            <div class="period-stat-card">
                <h3>Средняя сделка</h3>
                <div class="period-stat-value" id="period-avg-trade">0.00 USDT</div>
            </div>
            <div class="period-stat-card">
                <h3>Период</h3>
                <div class="period-stat-value" id="current-period">Все время</div>
            </div>
        `;
        statsContainer.parentNode.insertBefore(periodStatsContainer, statsContainer.nextSibling);
    }
    
    // Расчет статистики
    const periodProfit = calculatePeriodProfit(filteredTrades);
    const periodTradesCount = filteredTrades.length;
    const avgTrade = periodTradesCount > 0 ? periodProfit / periodTradesCount : 0;
    
    // Обновление значений
    document.getElementById('period-trades-count').textContent = periodTradesCount;
    document.getElementById('period-profit').textContent = `${periodProfit.toFixed(2)} USDT`;
    document.getElementById('period-profit').className = `period-stat-value ${periodProfit >= 0 ? 'profit' : 'loss'}`;
    document.getElementById('period-avg-trade').textContent = `${avgTrade.toFixed(2)} USDT`;
    
    // Отображение текущего периода
    let periodText = 'Все время';
    if (currentPeriod === 'custom' && startDateFilter && endDateFilter) {
        periodText = `С ${startDateFilter.toLocaleDateString()} по ${endDateFilter.toLocaleDateString()}`;
    } else if (currentPeriod !== 'all') {
        const periodNames = {
            'today': 'Сегодня',
            'week': 'Эта неделя',
            'month': 'Этот месяц', 
            'year': 'Этот год'
        };
        periodText = periodNames[currentPeriod] || currentPeriod;
    }
    document.getElementById('current-period').textContent = periodText;
}

// Расчет прибыли за период
function calculatePeriodProfit(trades) {
    return trades.reduce((total, trade) => {
        const isLong = trade.direction === 'long';
        const priceDiff = trade.exitPrice - trade.entryPrice;
        const pnl = isLong ? priceDiff * trade.amount : -priceDiff * trade.amount;
        const pnlAfterFees = pnl - (trade.entryPrice * trade.amount * trade.fee / 100) - (trade.exitPrice * trade.amount * trade.fee / 100);
        return total + pnlAfterFees;
    }, 0);
}

// Обработчики событий для фильтров
function setupFilterHandlers() {
    // Фильтр по периоду
    const periodSelect = document.getElementById('period-select');
    if (periodSelect) {
        periodSelect.addEventListener('change', function() {
            currentPeriod = this.value;
            
            // Показать/скрыть кастомный выбор дат
            const customPeriod = document.getElementById('custom-period');
            if (customPeriod) {
                customPeriod.style.display = currentPeriod === 'custom' ? 'flex' : 'none';
            }
            
            updateTradesTable();
            saveFilterState();
        });
    }
    
    // Применение кастомного периода
    const applyCustomPeriodBtn = document.getElementById('apply-custom-period');
    if (applyCustomPeriodBtn) {
        applyCustomPeriodBtn.addEventListener('click', function() {
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            
            if (!startDateInput || !endDateInput) return;
            
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                alert('Пожалуйста, выберите корректные даты');
                return;
            }
            
            if (startDate > endDate) {
                alert('Начальная дата не может быть больше конечной');
                return;
            }
            
            startDateFilter = startDate;
            endDateFilter = endDate;
            updateTradesTable();
            saveFilterState();
        });
    }
    
    // Быстрые кнопки периодов
    document.querySelectorAll('.quick-period').forEach(button => {
        button.addEventListener('click', function() {
            const period = this.dataset.period;
            currentPeriod = period;
            
            // Обновляем выпадающий список
            const periodSelect = document.getElementById('period-select');
            if (periodSelect) {
                periodSelect.value = period;
            }
            
            // Скрываем кастомный период
            const customPeriod = document.getElementById('custom-period');
            if (customPeriod) {
                customPeriod.style.display = 'none';
            }
            
            updateTradesTable();
            saveFilterState();
        });
    });
}

// Сохранение состояния фильтров
function saveFilterState() {
    const filterState = {
        coin: currentCoin,
        period: currentPeriod,
        startDate: startDateFilter,
        endDate: endDateFilter
    };
    localStorage.setItem('filterState', JSON.stringify(filterState));
}

// Восстановление состояния фильтров
function loadFilterState() {
    const savedState = localStorage.getItem('filterState');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            currentCoin = state.coin || 'all';
            currentPeriod = state.period || 'all';
            startDateFilter = state.startDate ? new Date(state.startDate) : null;
            endDateFilter = state.endDate ? new Date(state.endDate) : null;
            
            // Обновление UI
            const coinSelect = document.getElementById('coin-select');
            const periodSelect = document.getElementById('period-select');
            
            if (coinSelect) coinSelect.value = currentCoin;
            if (periodSelect) periodSelect.value = currentPeriod;
            
            const customPeriod = document.getElementById('custom-period');
            if (customPeriod && currentPeriod === 'custom') {
                customPeriod.style.display = 'flex';
                
                const startDateInput = document.getElementById('start-date');
                const endDateInput = document.getElementById('end-date');
                
                if (startDateInput && startDateFilter) {
                    startDateInput.value = startDateFilter.toISOString().split('T')[0];
                }
                if (endDateInput && endDateFilter) {
                    endDateInput.value = endDateFilter.toISOString().split('T')[0];
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки состояния фильтров:', error);
        }
    }
}

// Обновление статистики
function updateStats() {
    const coinTrades = currentCoin === 'all' 
        ? trades 
        : trades.filter(trade => trade.coin === currentCoin);
    
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
    saveFilterState();
}

// Остальные функции остаются без изменений (showTradeForm, hideTradeForm, saveNewTrade, etc.)
// ... [остальной ваш код без изменений] ...

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
    // ... ваш существующий код ...
}

// Очистка всех сделок
function clearAllTrades() {
    // ... ваш существующий код ...
}

// Сохранение в файл
function saveToFile() {
    // ... ваш существующий код ...
}

// Загрузка из файла
function triggerFileInput() {
    // ... ваш существующий код ...
}

function loadFromFile(event) {
    // ... ваш существующий код ...
}

// Начать редактирование сделки
function startEditTrade(index) {
    // ... ваш существующий код ...
}

// Сохранить отредактированную сделку
function saveEditTrade() {
    // ... ваш существующий код ...
}

// Отменить редактирование
function cancelEditTrade() {
    // ... ваш существующий код ...
}

// Удаление сделки
async function deleteTrade(index) {
    // ... ваш существующий код ...
}

// Сделаем функции глобальными для использования в onclick
window.startEditTrade = startEditTrade;
window.saveEditTrade = saveEditTrade;
window.cancelEditTrade = cancelEditTrade;
window.deleteTrade = deleteTrade;