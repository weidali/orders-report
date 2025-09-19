class SecurityManager {
    constructor() {
        this.operationLimits = {
            lastOperation: 0,
            minInterval: 1000
        };
        this.operationTimeout = null;
    }

    // Проверка лимита операций (простая версия)
    checkOperationLimit(operationName = 'operation') {
        const now = Date.now();
        const timeSinceLastOp = now - this.operationLimits.lastOperation;
        
        if (timeSinceLastOp < this.operationLimits.minInterval) {
            const waitTime = this.operationLimits.minInterval - timeSinceLastOp;
            throw new Error(`Слишком частые операции. Подождите ${Math.ceil(waitTime/1000)} секунд.`);
        }
        
        this.operationLimits.lastOperation = now;
        return true;
    }

    // Проверка лимита с UI (расширенная версия)
    checkOperationLimitWithUI(operationName = 'operation') {
        return new Promise((resolve, reject) => {
            const now = Date.now();
            const timeSinceLastOp = now - this.operationLimits.lastOperation;
            
            if (timeSinceLastOp < this.operationLimits.minInterval) {
                const waitTime = this.operationLimits.minInterval - timeSinceLastOp;
                
                // Блокируем кнопки на время ожидания
                this.disableButtons(true);
                
                // Показываем обратный отсчет
                this.showCooldown(waitTime);
                
                // Ждем завершения времени ожидания
                setTimeout(() => {
                    this.operationLimits.lastOperation = Date.now();
                    this.disableButtons(false);
                    this.hideCooldown();
                    resolve(true);
                }, waitTime);
            } else {
                this.operationLimits.lastOperation = now;
                resolve(true);
            }
        });
    }

    disableButtons(disabled) {
        const buttons = document.querySelectorAll('button:not(#cancel-trade-btn)');
        buttons.forEach(button => {
            button.disabled = disabled;
            button.style.opacity = disabled ? '0.6' : '1';
            button.style.cursor = disabled ? 'not-allowed' : 'pointer';
        });
    }

    showCooldown(waitTime) {
        // Создаем или находим элемент для отображения обратного отсчета
        let cooldownElement = document.getElementById('cooldown-message');
        
        if (!cooldownElement) {
            cooldownElement = document.createElement('div');
            cooldownElement.id = 'cooldown-message';
            cooldownElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #e74c3c;
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                z-index: 1000;
                font-weight: bold;
            `;
            document.body.appendChild(cooldownElement);
        }
        
        let remaining = Math.ceil(waitTime / 1000);
        cooldownElement.textContent = `Подождите: ${remaining}с`;
        cooldownElement.style.display = 'block';
        
        // Обновляем обратный отсчет
        const interval = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(interval);
                cooldownElement.style.display = 'none';
            } else {
                cooldownElement.textContent = `Подождите: ${remaining}с`;
            }
        }, 1000);
    }

    hideCooldown() {
        const cooldownElement = document.getElementById('cooldown-message');
        if (cooldownElement) {
            cooldownElement.style.display = 'none';
        }
    }
}

// Создаем глобальный экземпляр
const securityManager = new SecurityManager();