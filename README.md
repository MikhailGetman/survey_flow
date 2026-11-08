# SurveyFlow

Веб-конструктор опросов с онлайн-статистикой и экспортом отчётов.

## Стек

- Frontend: Vue 3 + TypeScript + Pinia
- Backend: Express + TypeScript + MariaDB + Socket.IO
- Экспорт: PDFKit + CSV для SPSS
- Git: GitHub

## Команда

| Роль | Человек |
|---|---|
| PM + Frontend | Зрожаев А.В. |
| Lead Dev + Frontend | Гетьман М.Е. |
| Backend + DevOps | Серкин К.А. |
| Аналитик + UI/UX + БД | Игнатчик В.В. |
| QA + QA/DevOps | Царева Е.М. |

## Документы

- [`WBS.md`](WBS.md) — структура работ
- [`TZ.md`](TZ.md) — техническое задание
- [`docs/MODULES.md`](docs/MODULES.md) — модули и занятость ролей
- [`docs/artifacts/gantt.png`](docs/artifacts/gantt.png) — диаграмма Ганта
- [`docs/artifacts/gantt.pdf`](docs/artifacts/gantt.pdf) — PDF Ганта
- [`docs/artifacts/kanban.png`](docs/artifacts/kanban.png) — канбан
- [`docs/artifacts/SurveyFlow_GanttProject.csv`](docs/artifacts/SurveyFlow_GanttProject.csv) — импорт в GanttProject
- [`docs/requirements/AUTH_REQUIREMENTS.md`](docs/requirements/AUTH_REQUIREMENTS.md) — требования к auth
- [`docs/requirements/TEACHER_REQUIREMENTS.md`](docs/requirements/TEACHER_REQUIREMENTS.md) — требования преподавателя
- [`docs/analysis/MARKET_RESEARCH.md`](docs/analysis/MARKET_RESEARCH.md) — рынок и killer features
- [`docs/analysis/STATS_REQUIREMENTS.md`](docs/analysis/STATS_REQUIREMENTS.md) — предварительная статистика
- [`docs/analysis/FILTER_REQUIREMENTS.md`](docs/analysis/FILTER_REQUIREMENTS.md) — фильтры статистики

## Текущий спринт

До 11.11.2026:

- регистрация;
- вход;
- авторизация.

## Запуск

```bash
# backend
cd backend
npm install
npm run dev

# frontend
cd frontend
npm install
npm run serve
```

Backend: `http://localhost:3000`  
Frontend: `http://localhost:8080`
