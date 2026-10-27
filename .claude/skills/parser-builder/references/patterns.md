# Шаблоны кода для парсера

## HTTP-клиент с ретраями и лимитом

```python
# parser/client.py
import random
import time
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential_jitter, retry_if_exception

log = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
}

def _retryable(exc: BaseException) -> bool:
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in (429, 500, 502, 503, 504)
    return isinstance(exc, (httpx.TransportError, httpx.TimeoutException))

class Client:
    def __init__(self, delay: float = 1.0):
        self.delay = delay
        self._last = 0.0
        self.http = httpx.Client(
            headers=HEADERS,
            timeout=httpx.Timeout(30, connect=10),
            follow_redirects=True,
        )

    def _throttle(self) -> None:
        wait = self.delay * random.uniform(0.7, 1.3) - (time.monotonic() - self._last)
        if wait > 0:
            time.sleep(wait)
        self._last = time.monotonic()

    @retry(retry=retry_if_exception(_retryable), stop=stop_after_attempt(5),
           wait=wait_exponential_jitter(initial=1, max=30), reraise=True)
    def get(self, url: str, **kw) -> httpx.Response:
        self._throttle()
        r = self.http.get(url, **kw)
        if r.status_code == 429 and (ra := r.headers.get("Retry-After", "")).isdigit():
            time.sleep(int(ra))
        r.raise_for_status()
        return r

    def close(self) -> None:
        self.http.close()
```

Для большого объёма - `httpx.AsyncClient` + `asyncio.Semaphore(3)` вместо последовательных запросов.

## Модель и разбор

```python
# parser/models.py
from pydantic import BaseModel, HttpUrl

class Product(BaseModel):
    title: str
    price: float | None = None
    url: HttpUrl
    in_stock: bool | None = None
```

```python
# parser/parse.py
import re
import logging
from urllib.parse import urljoin
from selectolax.lexbor import LexborHTMLParser as HTMLParser
from .models import Product

log = logging.getLogger(__name__)

def parse_price(text: str | None) -> float | None:
    if not text:
        return None
    digits = re.sub(r"[^\d,.]", "", text).replace(",", ".")
    try:
        return float(digits)
    except ValueError:
        return None

def parse_listing(html: str, base_url: str) -> list[Product]:
    tree = HTMLParser(html)
    items = []
    for card in tree.css("[data-product-id], .product-card"):
        link = card.css_first("a[href]")
        title = card.css_first("[itemprop=name], .title")
        if not link or not title:
            log.warning("Пропущена карточка без ссылки/названия")
            continue
        price = card.css_first("[itemprop=price], .price")
        items.append(Product(
            title=title.text(strip=True),
            price=parse_price(price.text() if price else None),
            url=urljoin(base_url, link.attributes["href"]),
        ))
    return items

def next_page(html: str, base_url: str) -> str | None:
    a = HTMLParser(html).css_first("a[rel=next], .pagination .next a")
    return urljoin(base_url, a.attributes["href"]) if a else None
```

## Пагинация с защитой от зацикливания

```python
def crawl(client, start_url: str, limit: int | None = None):
    seen, url = set(), start_url
    while url and url not in seen:
        seen.add(url)
        html = client.get(url).text
        products = parse_listing(html, url)
        if not products:
            break
        for p in products:
            yield p
            if limit and (limit := limit - 1) == 0:
                return
        url = next_page(html, url)
```

## JSON внутри страницы (часто проще HTML)

```python
import json
node = HTMLParser(html).css_first("script#__NEXT_DATA__")
data = json.loads(node.text()) if node else None
for ld in HTMLParser(html).css('script[type="application/ld+json"]'):
    obj = json.loads(ld.text())
```

## Playwright для JS-сайтов

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(locale="ru-RU")
    # перехват API-ответов часто лучше, чем разбор DOM
    page.on("response", lambda r: "/api/" in r.url and log.debug(r.url))
    page.goto(url, wait_until="networkidle")
    page.wait_for_selector(".product-card")
    html = page.content()
    browser.close()
```

## Экспорт в красивый Excel

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

def to_xlsx(rows: list[dict], path: str) -> None:
    wb = Workbook()
    ws = wb.active
    ws.title = "Данные"
    headers = list(rows[0].keys()) if rows else []
    ws.append(headers)
    for r in rows:
        ws.append([str(v) if v is not None and not isinstance(v, (int, float, bool)) else v
                   for v in r.values()])
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="2563EB")
        c.alignment = Alignment(horizontal="center")
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions
    for i, h in enumerate(headers, 1):
        width = max([len(str(h))] + [len(str(r.get(h) or "")) for r in rows[:200]])
        ws.column_dimensions[get_column_letter(i)].width = min(max(width + 2, 10), 60)
        if h in ("url", "link", "ссылка"):
            for cell in ws.iter_cols(min_col=i, max_col=i, min_row=2):
                for c in cell:
                    if c.value:
                        c.hyperlink = c.value
                        c.style = "Hyperlink"
    wb.save(path)
```

## Тест на фикстуре

```python
# tests/test_parse.py
from pathlib import Path
from parser.parse import parse_listing, parse_price

FIX = Path(__file__).parent / "fixtures"

def test_listing_has_products():
    items = parse_listing((FIX / "listing.html").read_text(), "https://example.com/")
    assert len(items) > 0
    assert all(i.title for i in items)
    assert all(str(i.url).startswith("https://") for i in items)

def test_parse_price():
    assert parse_price("1 299,90 ₽") == 1299.90
    assert parse_price(None) is None
```
