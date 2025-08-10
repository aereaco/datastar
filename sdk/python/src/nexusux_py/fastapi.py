from typing import Annotated, Any, Union

from fastapi import Depends

from .sse import SSE_HEADERS, ServerSentEventGenerator
from .starlette import StateResponse, read_signals

__all__ = [
    "SSE_HEADERS",
    "StateResponse",
    "ReadSignals",
    "ServerSentEventGenerator",
    "read_signals",
]


ReadSignals = Annotated[Union[dict[str, Any], None], Depends(read_signals)]