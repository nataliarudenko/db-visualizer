# Meta-DB Visualizer

**Універсальний графічний інтерфейс управління PostgreSQL на основі метаданих**

Система працює за принципом "Metadata-First" — додаток не містить жодної заздалегідь визначеної схеми даних. Структура інтерфейсу будується динамічно після інтроспекції підключеної бази даних.

## 🏗️ Технічний стек

| Шар | Технологія |
|-----|------------|
| Frontend | React 18 + Vite |
| Graph Rendering | React Flow v12 |
| State Management | Zustand |
| Backend | NestJS (Node.js) |
| Database | PostgreSQL |
| DB Client | node-postgres (pg) |

## 🚀 Запуск

### Передумови
- Node.js ≥ 18
- PostgreSQL (будь-яка версія ≥ 12)

### 1. Встановлення залежностей

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Запуск серверів

```bash
# Backend (порт 3001)
cd backend
npm run start:dev

# Frontend (порт 5173)
cd frontend
npm run dev
```

### 3. Використання

1. Відкрийте http://localhost:5173
2. Введіть дані підключення до PostgreSQL
3. Натисніть "Connect"
4. Побачите граф з таблицями вашої БД

## 📋 Функціонал

- **Динамічна інтроспекція БД** — автоматичне виявлення таблиць, колонок, типів, FK
- **Графічне полотно** — таблиці як вузли, FK як з'єднання (React Flow)
- **Drag-and-Drop зв'язки** — створення FK перетягуванням лінії між полями
- **Збереження макету** — координати вузлів зберігаються в БД (`_metadb_layout`)
- **Universal Data Manager** — CRUD для будь-якої таблиці
- **Auto-Generated Forms** — автоматична генерація форм на основі типів колонок
- **Searchable Select** — для FK полів — пошук по пов'язаній таблиці
- **Inline Editing** — редагування просто в таблиці даних

## 📁 Структура проекту

```
pract/
├── backend/               # NestJS API
│   └── src/
│       ├── connection/    # Управління з'єднанням з БД
│       ├── introspection/ # Інтроспекція метаданих через information_schema
│       ├── data/          # CRUD операції для будь-якої таблиці
│       ├── schema/        # Створення/видалення FK
│       └── layout/        # Збереження макету canvas
└── frontend/              # React + React Flow
    └── src/
        ├── pages/         # ConnectionPage, CanvasPage
        ├── components/    # TableNode, DataPanel, AutoForm, SearchableSelect
        ├── stores/        # Zustand stores
        └── utils/         # API wrapper, type mapper
```
