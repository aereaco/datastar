from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.http import HttpRequest
from django.http import StreamingHttpResponse as _StreamingHttpResponse

from . import _read_signals
from .sse import SSE_HEADERS, StateEvent, StateEvents, ServerSentEventGenerator

if TYPE_CHECKING:
    from collections.abc import Mapping


__all__ = [
    "SSE_HEADERS",
    "StateResponse",
    "ServerSentEventGenerator",
    "read_signals",
]


class StateResponse(_StreamingHttpResponse):
    """Respond with 0..N `StateEvent`s"""

    default_headers: dict[str, str] = SSE_HEADERS.copy()

    def __init__(
        self,
        content: StateEvents = None,
        *,
        status: int | None = None,
        headers: Mapping[str, str] | None = None,
    ) -> None:
        if not content:
            status = status or 204
            content = tuple()
        else:
            headers = {**self.default_headers, **(headers or {})}
        if isinstance(content, StateEvent):
            content = (content,)
        super().__init__(content, status=status, headers=headers)


def read_signals(request: HttpRequest) -> dict[str, Any] | None:
    return _read_signals(request.method, request.headers, request.GET, request.body)