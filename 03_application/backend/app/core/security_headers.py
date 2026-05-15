"""
File Purpose: security headers module
Inputs: Imported modules, function arguments, request payloads where applicable.
Outputs: Return values, API responses, and side effects documented in functions/classes.
Process: Implements module-specific business or UI logic.
Authorship: Louis Ferger-Andrews (@LouisFerger-Andrews)
"""

from collections.abc import Awaitable, Callable

from fastapi import Request, Response


SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Resource-Policy': 'same-origin',
}


async def add_security_headers(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    response = await call_next(request)
    for header, value in SECURITY_HEADERS.items():
        response.headers.setdefault(header, value)
    if request.url.scheme == 'https':
        response.headers.setdefault('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    return response
