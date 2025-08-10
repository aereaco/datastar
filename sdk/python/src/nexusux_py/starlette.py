from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any

from starlette.requests import Request
from starlette.responses import StreamingResponse as _StreamingResponse

from . import _read_signals
from .sse import SSE_HEADERS, StateEvent, StateEvents, ServerSentEventGenerator

if TYPE_CHECKING:
    from starlette.background import BackgroundTask

__all__ = [
    "SSE_HEADERS",
    "StateResponse",
    "ServerSentEventGenerator",
    "read_signals",
]


class StateResponse(_StreamingResponse):
    """Respond with 0..N `StateEvent`s"""

    default_headers: dict[str, str] = SSE_HEADERS.copy()

    def __init__(
        self,
        content: StateEvents = None,
        status_code: int | None = None,
        headers: Mapping[str, str] | None = None,
        background: BackgroundTask | None = None,
    ) -> None:
        if not content:
            status_code = status_code or 204
            content = tuple()
        else:
            status_code = status_code or 200
            headers = {**self.default_headers, **(headers or {})}
        if isinstance(content, StateEvent):
            content = (content,)
        super().__init__(content, status_code=status_code, headers=headers, background=background)


async def read_signals(request: Request) -> dict[str, Any] | None:
    return _read_signals(
        request.method, request.headers, request.query_params, await request.body()
    )
