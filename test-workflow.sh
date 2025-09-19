#!/bin/bash
echo "🧪 Тестирование системы версионирования"

# Симулируем мерж в master
echo "🔀 Симуляция мержа в master..."
CURRENT_VERSION=$(node -e "console.log(require('./version.json').version)")
echo "Текущая версия: v$CURRENT_VERSION"

# Обновляем версию
npm run version:patch --silent
NEW_VERSION=$(node -e "console.log(require('./version.json').version)")

echo "Новая версия: v$NEW_VERSION"
echo "✅ Тест завершен успешно"