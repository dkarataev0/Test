---
name: parser-ui
description: "Красивый интерфейс и вывод для парсера/скрипта сбора данных: стильная консоль (rich + typer: прогресс-бары, таблицы, панели, цветные логи), веб-панель управления (Streamlit или FastAPI + HTML) с кнопкой запуска, прогрессом и таблицей результатов, оформленные Excel/HTML-отчёты. Использовать, когда парсер нужно сделать «красивым», удобным, понятным для не-программиста, добавить интерфейс, прогресс или отчёт."
---

# Parser UI - красиво и понятно

Сначала уточни у пользователя тип интерфейса, если он не назван (скилл `requirements-interview`). Логику парсера держи отдельно от интерфейса (см. `parser-builder`): интерфейс только вызывает `scraper.crawl(...)` и показывает результат.

Для подбора палитры, шрифтов и стиля веб-интерфейса используй скилл `ui-ux-pro-max`.

## Вариант 1. Красивая консоль (по умолчанию)

`typer` для команд и `rich` для вывода.

```python
# parser/__main__.py
import time
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import (Progress, SpinnerColumn, BarColumn, TextColumn,
                           MofNCompleteColumn, TimeElapsedColumn)
from rich.logging import RichHandler

from .client import Client
from .scraper import crawl
from .export import save

app = typer.Typer(help="Парсер каталога", add_completion=False)
console = Console()

@app.command()
def run(url: str = typer.Argument(..., help="Стартовая страница"),
        limit: int = typer.Option(None, help="Максимум записей"),
        out: str = typer.Option("result.xlsx", help="Файл результата")):
    """Собрать данные и сохранить в файл."""
    console.print(Panel.fit(f"[bold]Парсер[/]\n[dim]{url}[/]", border_style="blue"))
    client = Client()
    start, items, errors = time.monotonic(), [], 0
    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"),
                  BarColumn(), MofNCompleteColumn(), TimeElapsedColumn(),
                  console=console) as progress:
        task = progress.add_task("Сбор данных", total=limit)
        for item in crawl(client, url, limit):
            items.append(item)
            progress.advance(task)
    save(items, out)

    table = Table(title="Первые записи", header_style="bold cyan", show_lines=False)
    for col in ("Название", "Цена", "Ссылка"):
        table.add_column(col, overflow="fold")
    for i in items[:10]:
        table.add_row(i.title, f"{i.price:,.2f}" if i.price else "-", str(i.url))
    console.print(table)
    console.print(Panel(
        f"[green]✔ Собрано:[/] {len(items)}   [red]✖ Ошибок:[/] {errors}   "
        f"[blue]⏱ {time.monotonic() - start:.1f} с[/]\n[bold]Файл:[/] {out}",
        title="Готово", border_style="green"))

if __name__ == "__main__":
    app()
```

Правила:
- Логи - через `RichHandler` в консоль (уровень INFO) и обычный `FileHandler` в файл (DEBUG).
- Ошибки показывай человеческим текстом в красной панели с подсказкой, что делать; трейсбек - только в лог или с `--debug`.
- Не засоряй экран: прогресс-бар вместо строки на каждую страницу.
- Цвета со смыслом: зелёный - успех, жёлтый - предупреждение, красный - ошибка, приглушённый - второстепенное.

## Вариант 2. Веб-панель

**Быстро - Streamlit** (одна команда `streamlit run app.py`):
- Поля ввода URL и лимита, выбор полей, кнопка «Запустить».
- `st.progress` + `st.status` во время работы, `st.dataframe` с результатом, `st.metric` для сводки (собрано / ошибок / время).
- Кнопки `st.download_button` для Excel и CSV.
- Тема в `.streamlit/config.toml` (основной цвет, шрифт), `st.set_page_config(page_title=..., layout="wide")`.

**Гибко - FastAPI + одна HTML-страница**:
- `POST /api/run` запускает задачу в фоне, `GET /api/status/{id}` (или Server-Sent Events) отдаёт прогресс, `GET /api/result/{id}.xlsx` - файл.
- Страница: карточка с формой, прогресс-бар, таблица результатов с поиском/сортировкой, кнопки скачивания. Tailwind через CDN допустим.
- Перед версткой - `ui-ux-pro-max` для стиля, палитры и шрифтов.

Чек-лист веб-интерфейса:
- [ ] Состояния: пусто (подсказка, что ввести), загрузка (прогресс + что сейчас делается), успех (сводка + таблица + скачать), ошибка (понятный текст + «Повторить»).
- [ ] Кнопка блокируется во время работы, повторный клик не запускает второй прогон.
- [ ] Работает на телефоне (ширина 375 px, без горизонтальной прокрутки, кнопки ≥ 44 px).
- [ ] Контраст текста ≥ 4.5:1, есть тёмная тема или хотя бы аккуратная светлая.
- [ ] Числа и цены форматированы (`1 299,90 ₽`), ссылки кликабельны, длинный текст обрезается с подсказкой.

## Вариант 3. Красивый отчёт-файл

- **Excel**: жирная цветная шапка, закреплённая первая строка, автофильтр, ширина колонок по содержимому, кликабельные ссылки, отдельный лист «Сводка» (шаблон в `parser-builder/references/patterns.md`).
- **HTML-отчёт**: одна самодостаточная страница с карточками-метриками и таблицей; открывается двойным кликом.

## Проверка перед сдачей

- Запусти интерфейс и посмотри на него сам: для консоли - реальный прогон с `--limit 5`; для веба - открыть в Playwright, сделать скриншоты на 1280 px и 375 px и посмотреть их (скилл `run`).
- Покажи пользователю скриншот или пример вывода и спроси, всё ли нравится - при необходимости предложи 2-3 варианта стиля через `AskUserQuestion` с `preview`.
