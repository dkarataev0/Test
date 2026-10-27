"""Запуск: python -m leadfinder"""
import argparse
import logging
import socket
import threading
import webbrowser

import uvicorn


def local_ip() -> str:
    """IP компьютера в домашней сети (по нему телефон откроет приложение)."""
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        try:
            s.connect(("10.255.255.255", 1))  # пакеты не отправляются, только выбор интерфейса
            return s.getsockname()[0]
        except OSError:
            return "127.0.0.1"


def main():
    parser = argparse.ArgumentParser(description="LeadFinder — поиск клиентов на создание сайтов")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--no-browser", action="store_true", help="не открывать браузер")
    parser.add_argument("--phone", action="store_true",
                        help="открыть доступ с телефона в той же Wi-Fi сети")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    url = f"http://127.0.0.1:{args.port}"
    host = "0.0.0.0" if args.phone else "127.0.0.1"
    print(f"\n  LeadFinder запущен: {url}")
    if args.phone:
        print(f"  С телефона (та же Wi-Fi сеть): http://{local_ip()}:{args.port}")
        print("  Внимание: приложение видно всем устройствам в этой сети.")
    print("  Остановить: Ctrl+C\n")
    if not args.no_browser:
        threading.Timer(1.2, webbrowser.open, args=(url,)).start()
    uvicorn.run("leadfinder.app:app", host=host, port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
