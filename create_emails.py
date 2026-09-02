#!/usr/bin/env python3

from __future__ import annotations

import argparse
import concurrent.futures
import json
import re
import sys
import tempfile
import time
import urllib.error
import urllib.request
import urllib.parse
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Callable


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")
DEFAULT_TIMEOUT = 10.0
DEFAULT_RETRIES = 3
DEFAULT_DELAY = 0.0
DEFAULT_WORKERS = 16
MAX_COUNT = 1000
MAX_WORKERS = 64


@dataclass(frozen=True)
class Provider:
    """Описание API-провайдера и поля email в его JSON-ответе."""

    name: str
    url: str
    email_field: str


PROVIDERS = {
    "guerrillamail": Provider(
        "Guerrillamail",
        "https://api.guerrillamail.com/ajax.php?f=get_email_address",
        "email_addr",
    ),
    "tempmail": Provider(
        "Tempmail",
        "https://api.tempmail.com/api/email/new",
        "email",
    ),
}


class EmailCreator:
    """Параллельно запрашивает адреса и собирает статистику ошибок."""

    def __init__(
        self,
        *,
        timeout: float = DEFAULT_TIMEOUT,
        retries: int = DEFAULT_RETRIES,
        delay: float = DEFAULT_DELAY,
        workers: int = DEFAULT_WORKERS,
        request: Callable[[str, float], dict[str, Any]] | None = None,
    ) -> None:
        self.emails: list[str] = []
        self.failed = 0
        self.timeout = timeout
        self.retries = retries
        self.delay = delay
        self.workers = workers
        self._request = request or self._request_json

    @staticmethod
    def _request_json(url: str, timeout: float) -> dict[str, Any]:
        request = urllib.request.Request(
            url,
            headers={
                "Accept": "application/json",
                "User-Agent": "TemporaryEmailCreator/2.0",
            },
        )
        with urllib.request.urlopen(request, timeout=timeout) as response:
            if response.status < 200 or response.status >= 300:
                raise RuntimeError(f"HTTP {response.status}")
            payload = json.loads(response.read().decode("utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("API вернул JSON не в виде объекта")
        return payload

    def _request_with_retries(self, url: str) -> dict[str, Any]:
        last_error: Exception | None = None
        for attempt in range(self.retries + 1):
            try:
                return self._request(url, self.timeout)
            except (
                urllib.error.URLError,
                urllib.error.HTTPError,
                TimeoutError,
                OSError,
                json.JSONDecodeError,
                ValueError,
                RuntimeError,
            ) as error:
                last_error = error
                if attempt == self.retries:
                    break
                time.sleep(min(8.0, 0.5 * (2**attempt)))
        if last_error is None:
            raise RuntimeError("запрос не был выполнен")
        raise last_error

    @staticmethod
    def _extract_email(data: dict[str, Any], field: str) -> str:
        value = data.get(field)
        if not isinstance(value, str) or not EMAIL_PATTERN.fullmatch(value.strip()):
            raise ValueError(f"поле {field!r} не содержит корректный email")
        return value.strip().lower()

    def create(
        self, provider: Provider, count: int, username: str | None = None
    ) -> None:
        """Создать count адресов у одного провайдера."""
        print(f"\nСоздаем почты через {provider.name}...\n")

        if username and provider.name != "Guerrillamail":
            print("Примечание: Tempmail не поддерживает выбор username, будет создан случайный.")

        def fetch(request_index: int) -> str:
            url = provider.url
            requested_username = (
                username if request_index == 1 else f"{username}-{request_index}"
            ) if username else None
            if requested_username and provider.name == "Guerrillamail":
                query = urllib.parse.urlencode({"email_user": requested_username})
                url = f"{url}&{query}" if "?" in url else f"{url}?{query}"
            return self._extract_email(
                self._request_with_retries(url), provider.email_field
            )

        started = time.monotonic()
        completed = 0
        with concurrent.futures.ThreadPoolExecutor(
            max_workers=min(self.workers, count),
            thread_name_prefix="email-request",
        ) as executor:
            futures = [
                executor.submit(fetch, request_index)
                for request_index in range(1, count + 1)
            ]
            for index, future in enumerate(
                concurrent.futures.as_completed(futures), 1
            ):
                completed += 1
                try:
                    email = future.result()
                    if email in self.emails:
                        raise ValueError("провайдер вернул уже полученный адрес")
                except (
                    urllib.error.URLError,
                    urllib.error.HTTPError,
                    TimeoutError,
                    OSError,
                    json.JSONDecodeError,
                    ValueError,
                    RuntimeError,
                ) as error:
                    self.failed += 1
                    print(f" [{completed:3d}/{count}] Ошибка: {str(error)[:70]}")
                else:
                    self.emails.append(email)
                    print(f" [{completed:3d}/{count}] {email}")
                if self.delay:
                    time.sleep(self.delay)
        elapsed = time.monotonic() - started
        speed = count / elapsed if elapsed else float("inf")
        print(f"Скорость: {speed:.1f} запросов/сек")

    def save_to_file(self, filename: str | Path | None = None) -> bool:
        """Сохранить адреса атомарно, чтобы не оставить поврежденный файл."""
        if not self.emails:
            print("Нет почт для сохранения!")
            return False

        path = Path(filename) if filename else Path(
            f"real_emails_{datetime.now():%Y%m%d_%H%M%S}.txt"
        )
        path.parent.mkdir(parents=True, exist_ok=True)
        content = (
            "EMAIL АДРЕСА\n"
            + "=" * 60
            + "\n"
            + f"Создано: {datetime.now():%Y-%m-%d %H:%M:%S}\n"
            + f"Всего почт: {len(self.emails)}\n"
            + "=" * 60
            + "\n\n"
            + "\n".join(f"{index}. {email}" for index, email in enumerate(self.emails, 1))
            + "\n"
        )
        try:
            with tempfile.NamedTemporaryFile(
                "w", encoding="utf-8", dir=path.parent, delete=False
            ) as temporary:
                temporary.write(content)
                temporary_path = Path(temporary.name)
            temporary_path.replace(path)
        except OSError as error:
            if "temporary_path" in locals():
                temporary_path.unlink(missing_ok=True)
            print(f"Ошибка сохранения: {error}")
            return False
        print(f"\nСохранено в файл: {path} ({len(self.emails)} почт)")
        return True


def positive_int(value: str) -> int:
    try:
        number = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("нужно целое число") from error
    if not 1 <= number <= MAX_COUNT:
        raise argparse.ArgumentTypeError(f"число должно быть от 1 до {MAX_COUNT}")
    return number


def nonnegative_int(value: str) -> int:
    try:
        number = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("нужно целое число") from error
    if number < 0:
        raise argparse.ArgumentTypeError("число не может быть отрицательным")
    return number


def worker_count(value: str) -> int:
    try:
        number = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("нужно целое число") from error
    if not 1 <= number <= MAX_WORKERS:
        raise argparse.ArgumentTypeError(f"число должно быть от 1 до {MAX_WORKERS}")
    return number


def username_value(value: str) -> str:
    if not USERNAME_PATTERN.fullmatch(value):
        raise argparse.ArgumentTypeError(
            "username: 1-64 символа, только латиница, цифры, ., _ и -"
        )
    return value


def prompt_username() -> str | None:
    while True:
        value = input("Желаемый username перед @ (Enter — случайный): ").strip()
        if not value:
            return None
        try:
            return username_value(value)
        except argparse.ArgumentTypeError as error:
            print(f"Ошибка: {error}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("-c", "--count", type=positive_int, help="количество адресов")
    parser.add_argument(
        "-p", "--provider", choices=("guerrillamail", "tempmail", "both"),
        help="провайдер (по умолчанию интерактивный выбор)",
    )
    parser.add_argument("-o", "--output", help="файл для сохранения")
    parser.add_argument(
        "-u", "--username", type=username_value,
        help="желаемая часть адреса перед @ (поддержка зависит от API)",
    )
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT)
    parser.add_argument("--retries", type=nonnegative_int, default=DEFAULT_RETRIES)
    parser.add_argument("--delay", type=float, default=DEFAULT_DELAY)
    parser.add_argument(
        "-w", "--workers", type=worker_count, default=DEFAULT_WORKERS,
        help=f"параллельные запросы (по умолчанию {DEFAULT_WORKERS})",
    )
    return parser


def choose_provider(choice: str) -> list[Provider]:
    if choice == "both":
        return [PROVIDERS["guerrillamail"], PROVIDERS["tempmail"]]
    return [PROVIDERS[choice]]


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.timeout <= 0 or args.delay < 0:
        parser.error("timeout должен быть > 0, delay не может быть отрицательным")

    while True:
        provider_choice = args.provider
        if provider_choice is None:
            print("\nВыберите сервис:\n  1  Guerrillamail\n  2  Tempmail\n  3  Оба\n")
            provider_choice = {"1": "guerrillamail", "2": "tempmail", "3": "both"}.get(
                input("Ваш выбор (1-3): ").strip()
            )
            if provider_choice is None:
                parser.error("неверный выбор провайдера")

        count = args.count
        if count is None:
            try:
                count = positive_int(
                    input(f"Сколько почт создать? (1-{MAX_COUNT}): ").strip()
                )
            except argparse.ArgumentTypeError as error:
                parser.error(str(error))

        username = args.username
        if username is None:
            username = prompt_username()

        providers = choose_provider(provider_choice)
        counts = [count] if len(providers) == 1 else [count // 2, count - count // 2]
        creator = EmailCreator(
            timeout=args.timeout,
            retries=args.retries,
            delay=args.delay,
            workers=args.workers,
        )
        for provider, provider_count in zip(providers, counts):
            if provider_count:
                creator.create(provider, provider_count, username)

        print(f"\nГотово! Создано: {len(creator.emails)}; ошибок: {creator.failed}")
        if creator.emails:
            print("\nПримеры:")
            print("\n".join(f"  • {email}" for email in creator.emails[:10]))
            if args.output or input("\nСохранить в файл? (y/n): ").strip().lower() == "y":
                creator.save_to_file(args.output)

        if input("\nПродолжить работу? (y/n): ").strip().lower() != "y":
            break
        args.provider = None
        args.count = None
        args.username = None
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nПрервано пользователем", file=sys.stderr)
        raise SystemExit(130)
