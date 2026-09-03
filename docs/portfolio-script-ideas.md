# 20 идей CLI-скриптов для портфолио Fomin

Ниже — идеи небольших open-source или showcase-инструментов в том же формате, что и `create_emails.py`: один понятный сценарий, консольный интерфейс, измеримый результат и возможность показать красивый terminal demo. Все идеи рассчитаны на легитимные задачи разработки, автоматизации и работы с собственными данными.

## 1. `site_audit.py` — аудит сайта за одну команду

Проверяет доступность страниц, HTTP-коды, title, description, robots.txt, sitemap, битые ссылки и базовые performance-сигналы.

```bash
python3 site_audit.py https://example.com --depth 2 --output audit.json
```

**Вау-эффект для портфолио:** финальный отчёт с оценкой сайта, списком ошибок и прогресс-баром проверки.

## 2. `image_optimizer.py` — умное сжатие изображений

Массово уменьшает JPG, PNG и WebP, сохраняет структуру папок и показывает, сколько мегабайт удалось сэкономить.

```bash
python3 image_optimizer.py ./images --format webp --quality 82 --output ./optimized
```

**Вау-эффект для портфолио:** строка `saved 68.4 MB / 73% smaller` и таблица до/после.

## 3. `api_monitor.py` — мониторинг API

Периодически отправляет безопасные GET-запросы к указанным endpoint, измеряет latency, проверяет статус и сохраняет историю доступности.

```bash
python3 api_monitor.py --config endpoints.yml --interval 30 --output uptime.csv
```

**Вау-эффект для портфолио:** live-терминал с зелёными/красными индикаторами, p95 latency и uptime за период.

## 4. `csv_cleaner.py` — очистка CSV без Excel

Удаляет дубли, нормализует телефоны и даты, исправляет пробелы, проверяет обязательные поля и создаёт clean-файл.

```bash
python3 csv_cleaner.py clients.csv --dedupe email --normalize-phone --output clients_clean.csv
```

**Вау-эффект для портфолио:** отчёт `12,430 rows → 11,982 clean rows`, список найденных проблем и preview первых строк.

## 5. `pdf_merge_cli.py` — сборщик PDF-документов

Объединяет PDF, добавляет нумерацию, титульный лист и оглавление из списка файлов.

```bash
python3 pdf_merge_cli.py --input docs/ --sort name --number-pages --output package.pdf
```

**Вау-эффект для портфолио:** drag-and-drop сценарий, красивый summary и готовый пакет документов.

## 6. `subtitle_sync.py` — синхронизация субтитров

Сдвигает временные коды SRT/VTT, меняет FPS и экспортирует субтитры в другой формат.

```bash
python3 subtitle_sync.py movie.srt --shift 1.35 --format vtt --output movie.vtt
```

**Вау-эффект для портфолио:** preview первых реплик, статистика длительности и визуальный timeline в терминале.

## 7. `folder_backup.py` — резервная копия с манифестом

Архивирует папку, исключает временные файлы, считает SHA-256, шифрует архив по запросу и создаёт manifest.json.

```bash
python3 folder_backup.py ./project --exclude node_modules,.git --compress zstd --output backups/
```

**Вау-эффект для портфолио:** воспроизводимый backup-flow с контрольными суммами и понятным восстановлением.

## 8. `json_to_types.py` — генератор TypeScript-типов

Берёт JSON-пример и создаёт интерфейсы TypeScript, поддерживает вложенные объекты, массивы и опциональные поля.

```bash
python3 json_to_types.py response.json --name ApiResponse --output types.ts
```

**Вау-эффект для портфолио:** демонстрация «JSON → готовый types.ts» за одну секунду.

## 9. `env_checker.py` — проверка конфигурации проекта

Сверяет `.env` с `.env.example`, проверяет обязательные ключи, скрывает секреты в отчёте и предупреждает о слабых настройках.

```bash
python3 env_checker.py --env .env --template .env.example --strict
```

**Вау-эффект для портфолио:** понятный checklist `14/14 variables valid` без вывода секретов.

## 10. `markdown_to_site.py` — Markdown в мини-сайт

Превращает README или папку Markdown-файлов в статический сайт с оглавлением, поиском, кодовыми блоками и dark mode.

```bash
python3 markdown_to_site.py ./docs --title "Project docs" --theme dark --output dist
```

**Вау-эффект для портфолио:** из папки заметок появляется готовый deploy-ready сайт.

## 11. `git_release.py` — генератор release notes

Анализирует commits между двумя тегами, группирует изменения по типам и создаёт CHANGELOG.md.

```bash
python3 git_release.py --from v1.2.0 --to HEAD --output RELEASE_NOTES.md
```

**Вау-эффект для портфолио:** автоматическая документация релиза с категориями Features, Fixes и Breaking changes.

## 12. `screenshot_diff.py` — визуальный diff страниц

Сравнивает два скриншота сайта, подсвечивает изменения и создаёт diff-image с процентом изменённых пикселей.

```bash
python3 screenshot_diff.py before.png after.png --threshold 18 --output diff.png
```

**Вау-эффект для портфолио:** яркая карта изменений и короткий отчёт для QA/дизайна.

## 13. `qr_batch.py` — генератор QR-паков

Создаёт QR-коды для списка ссылок, добавляет логотип, подпись и экспортирует всё в PNG/SVG или ZIP.

```bash
python3 qr_batch.py links.csv --logo logo.png --format svg --output qr-pack/
```

**Вау-эффект для портфолио:** batch-генерация сотен брендированных QR с итоговой статистикой.

## 14. `utm_builder.py` — массовая генерация UTM-ссылок

Берёт базовую ссылку и CSV с кампаниями, создаёт чистые UTM-URL и короткий preview-отчёт.

```bash
python3 utm_builder.py campaigns.csv --base https://example.com --output links.csv
```

**Вау-эффект для портфолио:** единообразные маркетинговые ссылки без ручной рутины и ошибок.

## 15. `text_translate_batch.py` — подготовка локализаций

Собирает строки из JSON/Markdown, проверяет пропуски между языками, формирует translation report и экспортирует пакет для перевода.

```bash
python3 text_translate_batch.py i18n/ --base ru --languages en,uk --report i18n-report.json
```

**Вау-эффект для портфолио:** visual summary `RU 100% · EN 96% · UK 91%` и список missing keys.

## 16. `log_analyzer.py` — разбор логов приложения

Читает Nginx, application или JSON logs, считает ошибки по типам, строит hourly summary и находит подозрительные пики.

```bash
python3 log_analyzer.py app.log --format auto --since 24h --output report.html
```

**Вау-эффект для портфолио:** ASCII-график ошибок и список endpoint с самым высоким error rate.

## 17. `schedule_builder.py` — генератор расписания публикаций

Собирает контент из CSV, проверяет даты и создаёт календарь в ICS/CSV без подключения к соцсетям.

```bash
python3 schedule_builder.py posts.csv --timezone Europe/Kyiv --format ics --output calendar.ics
```

**Вау-эффект для портфолио:** удобное превращение контент-плана в календарь для телефона или команды.

## 18. `invoice_generator.py` — генератор счетов

Создаёт аккуратные PDF-счета из JSON-шаблона, считает позиции, скидки и итог, поддерживает несколько языков и валют.

```bash
python3 invoice_generator.py order.json --template clean --currency USD --output invoice.pdf
```

**Вау-эффект для портфолио:** `JSON → polished PDF` с нулевой ручной версткой.

## 19. `project_scaffold.py` — быстрый старт проекта

Создаёт структуру проекта из шаблона: README, `.gitignore`, env example, src, tests и базовый CI-файл.

```bash
python3 project_scaffold.py my-tool --stack python-cli --license mit --git
```

**Вау-эффект для портфолио:** интерактивный wizard, который за несколько секунд выдаёт аккуратный production-ready skeleton.

## 20. `local_drop.py` — безопасная передача файлов в локальной сети

Поднимает временный локальный сервер, показывает QR-код и позволяет передать файлы между устройствами в одной сети. По умолчанию сервер завершается после таймера.

```bash
python3 local_drop.py ./share --port 8080 --expires 15m --qr
```

**Вау-эффект для портфолио:** терминал показывает URL, QR и countdown, а после истечения срока сервер сам закрывается.

## Как превратить эти идеи в сильную серию

Лучше не добавлять все 20 как одинаковые карточки. Сильнее будет сделать раздел **Fomin Tools** с 6–8 полноценными инструментами, а остальные оформить как «лабораторию» или roadmap. Для каждого релиза стоит показывать одну команду запуска, короткий terminal GIF, пример результата, количество обработанных объектов и ссылку на GitHub.

### Рекомендуемый первый набор

1. `site_audit.py` — ближе всего к веб-разработке.
2. `image_optimizer.py` — легко показать измеримую экономию.
3. `csv_cleaner.py` — понятен бизнесу.
4. `json_to_types.py` — хорошо демонстрирует developer tooling.
5. `screenshot_diff.py` — визуально зрелищный кейс.
6. `local_drop.py` — эффектная интерактивная demo-сценарий.
7. `invoice_generator.py` — показывает практическую пользу.
8. `project_scaffold.py` — усиливает образ разработчика инструментов.

> Важно: для портфолио лучше показывать не обещание «1000 за 5 секунд», а честную метрику конкретного запуска: размер входных данных, время, окружение и итоговый результат.
