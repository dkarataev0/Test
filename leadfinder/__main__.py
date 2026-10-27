"""Запуск: python -m leadfinder"""
import argparse
import logging
import threading
import webbrowser

import uvicorn


def main():
    parser = argparse.ArgumentParser(description="LeadFinder — поиск клиентов на создание сайтов")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--no-browser", action="store_true", help="не открывать браузер")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    url = f"http://127.0.0.1:{args.port}"
    print(f"\n  LeadFinder запущен: {url}\n  Остановить: Ctrl+C\n")
    if not args.no_browser:
        threading.Timer(1.2, webbrowser.open, args=(url,)).start()
    uvicorn.run("leadfinder.app:app", host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
