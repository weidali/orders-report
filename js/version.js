#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const command = args[0] || 'help';

// Пути к файлам
const VERSION_FILE = path.join(__dirname, '../version.json');
const HTML_FILE = path.join(__dirname, '../index.html');
const PACKAGE_FILE = path.join(__dirname, '../package.json');

function showHelp() {
    console.log(`
🎯 Система управления версиями Trading Tracker

Использование:
  npm run version:[command]

Команды:
  version:patch    - Увеличить patch версию (0.1.0 → 0.1.1)
  version:minor    - Увеличить minor версию (0.1.0 → 0.2.0)  
  version:major    - Увеличить major версию (0.1.0 → 1.0.0)
  version:set      - Установить конкретную версию (npm run version:set 1.2.3)
  version:show     - Показать текущую версию
  version:help     - Показать эту справку

Примеры:
  npm run version:patch
  npm run version:minor
  npm run version:set 2.0.0
  npm run version:show

Файлы:
  version.json    - Хранит текущую версию
  index.html      - Отображает версию в интерфейсе
  package.json    - Синхронизированная версия
`);
}

function readVersion() {
    try {
        return JSON.parse(readFileSync(VERSION_FILE, 'utf8'));
    } catch (error) {
        console.error('❌ Ошибка чтения version.json:', error.message);
        process.exit(1);
    }
}

function writeVersion(versionData) {
    try {
        writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2));
    } catch (error) {
        console.error('❌ Ошибка записи version.json:', error.message);
        process.exit(1);
    }
}

function updateHtmlVersion(newVersion) {
    try {
        let html = readFileSync(HTML_FILE, 'utf8');
        
        // Обновляем версию в HTML
        const versionRegex = /<span id="app-version">v(\d+\.\d+\.\d+)<\/span>/;
        if (versionRegex.test(html)) {
            html = html.replace(versionRegex, `<span id="app-version">v${newVersion}</span>`);
        } else {
            console.log('⚠️  Элемент версии не найден в HTML, добавляем...');
            html = html.replace(
                /<footer>[\s\S]*?<\/footer>/,
                `<footer>
                    <p class="footer-description">
                        Таблица для учёта фьючерсных сделок с криптовалютой | 
                        <span id="app-version">v${newVersion}</span> 
                        Создано для отслеживания торговой деятельности
                    </p>
                </footer>`
            );
        }
        
        writeFileSync(HTML_FILE, html);
    } catch (error) {
        console.error('❌ Ошибка обновления HTML:', error.message);
        process.exit(1);
    }
}

function updatePackageVersion(newVersion) {
    try {
        const packageData = JSON.parse(readFileSync(PACKAGE_FILE, 'utf8'));
        packageData.version = newVersion;
        writeFileSync(PACKAGE_FILE, JSON.stringify(packageData, null, 2));
    } catch (error) {
        console.error('❌ Ошибка обновления package.json:', error.message);
    }
}

function incrementVersion(type, specificVersion = null) {
    const versionData = readVersion();
    let [major, minor, patch] = versionData.version.split('.').map(Number);
    
    let newVersion;
    
    if (specificVersion) {
        // Установка конкретной версии
        if (!/^\d+\.\d+\.\d+$/.test(specificVersion)) {
            console.error('❌ Неверный формат версии. Используйте: major.minor.patch');
            process.exit(1);
        }
        newVersion = specificVersion;
    } else {
        // Автоинкремент
        switch (type) {
            case 'major':
                major++;
                minor = 0;
                patch = 0;
                break;
            case 'minor':
                minor++;
                patch = 0;
                break;
            case 'patch':
                patch++;
                break;
            default:
                console.error('❌ Неизвестный тип версии');
                showHelp();
                process.exit(1);
        }
        newVersion = `${major}.${minor}.${patch}`;
    }
    
    // Обновляем данные
    versionData.version = newVersion;
    versionData.buildDate = new Date().toISOString();
    versionData.lastUpdated = new Date().toLocaleString('ru-RU');
    
    // Записываем изменения
    writeVersion(versionData);
    updateHtmlVersion(newVersion);
    updatePackageVersion(newVersion);
    
    console.log(`✅ Версия обновлена: v${newVersion}`);
    console.log(`📅 Дата сборки: ${new Date().toLocaleString('ru-RU')}`);
    
    return newVersion;
}

function showCurrentVersion() {
    const versionData = readVersion();
    console.log('\n📋 Информация о версии:');
    console.log(`   Версия:       v${versionData.version}`);
    console.log(`   Дата сборки:  ${new Date(versionData.buildDate).toLocaleString('ru-RU')}`);
    if (versionData.lastUpdated) {
        console.log(`   Последнее обновление: ${versionData.lastUpdated}`);
    }
    console.log(`   Описание:     ${versionData.description}`);
    console.log('');
}

// Обработка команд
switch (command) {
    case 'patch':
    case 'minor':
    case 'major':
        incrementVersion(command);
        break;
        
    case 'set':
        const version = args[1];
        if (!version) {
            console.error('❌ Укажите версию: npm run version:set 1.2.3');
            process.exit(1);
        }
        incrementVersion('set', version);
        break;
        
    case 'show':
        showCurrentVersion();
        break;
        
    case 'help':
    default:
        showHelp();
        break;
}