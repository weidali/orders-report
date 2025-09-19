# 📊 Crypto Futures Tracker

<div align="center">

![Version](https://img.shields.io/github/package-json/v/weidali/orders-report?color=blue&label=version)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-success.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![HTML5](https://img.shields.io/badge/HTML5-%23E34F26.svg?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-%231572B6.svg?logo=css3&logoColor=white)

[Демо](#-демо) • [Возможности](#-возможности) • [Установка](#-установка) • [Использование](#-использование) • [Безопасность](#-безопасность)

</div>
Отслеживание криптовалютных сделок с сохранением в файл

![Crypto Futures Tracker](https://img.shields.io/badge/Crypto-TrackerProfessional-success)

![Crypto Futures Tracker](https://via.placeholder.com/800x300/203a43/ffffff?text=Crypto+Futures+Tracker+Professional+Trading+Dashboard)

## ✨ Возможности

### 📈 Основной функционал
- ✅ **Учет сделок** - Добавление, редактирование и удаление фьючерсных сделок
- 📊 **Статистика в реальном времени** - Прибыль, ROI, успешность сделок
- 🎯 **Поддержка множества криптовалют** - BTC, ETH, SOL, XRP, ADA и другие
- ⚡ **Автоматические расчеты** - P&L, ROE, комиссии

### 🔧 Дополнительные возможности
- 💾 **Локальное хранение** - Данные сохраняются в вашем браузере
- 📤 **Импорт/Экспорт** - Сохранение и загрузка данных в JSON формате
- 📱 **Адаптивный дизайн** - Работает на компьютерах и мобильных устройствах
- 🎨 **Красивый интерфейс** - Современный дизайн с градиентами

### 🛡️ Функции безопасности
- 🔒 **Валидация данных** - Проверка корректности вводимых значений
- 🛡️ **Защита от XSS** - Экранирование пользовательского ввода
- ⚡ **Лимит операций** - Защита от слишком частых действий

## 🚀 Демо

Посмотрите работающую версию проекта:  
[**🌐 Открыть демо на GitHub Pages**](https://weidali.github.io/orders-report/)

![Демо интерфейса](https://via.placeholder.com/600x300/203a43/ffffff?text=Professional+Trading+Interface)

### Локальная установка
```bash
# Клонируйте репозиторий
git clone https://github.com/weidali/orders-report.git

# Перейдите в папку проекта
cd orders-report
npm i
# Откройте index.html в браузере
# или используйте live server
npx live-server
```

## 📁 Структура проекта

```
orders-report/
├── index.html          # Главная HTML страница
├── css/
│   └── style.css      # Стили приложения
├── js/
│   └── script.js      # Основная логика приложения
├── README.md          # Этот файл
└── .gitignore         # Git ignore файл
```

## 🎮 Использование

### Добавление сделки
1. Нажмите **"Добавить сделку"**
2. Заполните данные:
   - Дата и время сделки
   - Направление (Лонг/Шорт)
   - Цены входа и выхода
   - Количество контрактов
   - Плечо и комиссию
3. Нажмите **"Сохранить сделку"**

### Редактирование сделки
1. Нажмите **"Редакт."** рядом с нужной сделкой
2. Измените необходимые поля
3. Сохраните изменения

### Экспорт данных
1. Нажмите **"Сохранить в файл"**
2. Данные будут скачаны в JSON формате
3. Храните файл в безопасном месте

## 🛡️ Безопасность

### Уровень защиты
![Security Level](https://img.shields.io/badge/Security-Level_%E2%98%85%E2%98%85%E2%98%85%E2%98%85%E2%98%86-yellow)

### Реализованные меры безопасности
- ✅ **Локальное хранение** - Данные не покидают ваш браузер
- ✅ **Валидация входных данных** - Проверка всех вводимых значений
- ✅ **Экранирование HTML** - Защита от XSS атак
- ✅ **Content Security Policy** - Политика безопасности контента

### Рекомендации по безопасности
1. **Регулярно экспортируйте данные** с шифрованием
2. **Не храните критически важную информацию** в примечаниях

## 🛠️ Технологии

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?style=for-the-badge&logo=githubpages&logoColor=white)

### Версионирование

```bash
npm i

# Показать справку
npm run version:help
npm run help

# Показать текущую версию
npm run version:show

# Увеличить patch версию (0.1.0 → 0.1.1)
npm run version:patch

# Увеличить minor версию (0.1.0 → 0.2.0)  
npm run version:minor

# Увеличить major версию (0.1.0 → 1.0.0)
npm run version:major

# Установить конкретную версию
npm run version:set 2.0.0

# Сборка с автоинкрементом patch версии
npm run build
```

Пример работы:
```bash
$ npm run version:show

📋 Информация о версии:
   Версия:       v0.1.0
   Дата сборки:  15.01.2024, 13:00:00
   Описание:     Трекер фьючерсных сделок с криптовалютой

$ npm run version:patch
✅ Версия обновлена: v0.1.1
📅 Дата сборки: 15.01.2024, 13:05:00

$ npm run version:show

📋 Информация о версии:
   Версия:       v0.1.1
   Дата сборки:  15.01.2024, 13:05:00
   Последнее обновление: 15.01.2024, 13:05:00
   Описание:     Трекер фьючерсных сделок с криптовалютой
```

Git хук для автоматического обновления версии:
`.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Автоматически обновляем patch версию перед коммитом
echo "🔄 Автоматическое обновление версии..."
npm run version:patch --silent

# Добавляем измененные файлы в коммит
git add version.json index.html package.json

echo "✅ Версия обновлена"
```
Сделайть файл исполняемым:
```bash
chmod +x .git/hooks/pre-commit
```

### Git хуки для автоматического версионирования и тегирования
Как это работает

1. **Разработка производится в ветке `dev`**
2. **Когда готов релиз, делается мерж `dev` в `master`**
3. **GitHub Actions автоматически:**
   - Обновляет patch версию (0.1.0 → 0.1.1)
   - Коммитит изменения version.json, package.json, index.html
   - Создает git tag v0.1.1
   - Создает GitHub Release с описанием

## 📊 Статистика проекта

![GitHub repo size](https://img.shields.io/github/repo-size/ваш-username/orders-report)
![GitHub last commit](https://img.shields.io/github/last-commit/ваш-username/orders-report)
![GitHub issues](https://img.shields.io/github/issues/ваш-username/orders-report)
![GitHub pull requests](https://img.shields.io/github/issues-pr/ваш-username/orders-report)



## 📝 Лицензия

Этот проект распространяется под лицензией MIT. Подробнее см. в файле [LICENSE](LICENSE).

![MIT License](https://img.shields.io/badge/License-MIT-green.svg)
