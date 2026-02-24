"""
QBO OAuth 2.0 authorization code flow helpers.
Handles redirect to Intuit, callback token exchange, and token refresh.
"""

import urllib.parse
from datetime import datetime, timezone, timedelta

import httpx

from app.core.config import settings

INTUIT_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2"
INTUIT_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
INTUIT_REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke"


def get_authorize_url(state: str) -> str:
    """Build the Intuit OAuth authorize redirect URL."""
    params = {
        "client_id": settings.qbo_client_id,
        "redirect_uri": settings.qbo_redirect_uri,
        "response_type": "code",
        "scope": "com.intuit.quickbooks.accounting",
        "state": state,
    }
    return f"{INTUIT_AUTH_URL}?{urllib.parse.urlencode(params)}"


async def exchange_code(code: str) -> dict:
    """Exchange authorization code for access + refresh tokens."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            INTUIT_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.qbo_redirect_uri,
            },
            auth=(settings.qbo_client_id, settings.qbo_client_secret),
            headers={"Accept": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "access_token": data["access_token"],
            "refresh_token": data["refresh_token"],
            "expires_in": data["expires_in"],
            "token_expires_at": datetime.now(timezone.utc) + timedelta(seconds=data["expires_in"]),
        }


async def refresh_tokens(refresh_token: str) -> dict:
    """Refresh an expired access token."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            INTUIT_TOKEN_URL,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            },
            auth=(settings.qbo_client_id, settings.qbo_client_secret),
            headers={"Accept": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()
        return {
            "access_token": data["access_token"],
            "refresh_token": data["refresh_token"],
            "expires_in": data["expires_in"],
            "token_expires_at": datetime.now(timezone.utc) + timedelta(seconds=data["expires_in"]),
        }


async def revoke_token(refresh_token: str) -> None:
    """Revoke a refresh token (disconnect)."""
    async with httpx.AsyncClient() as client:
        await client.post(
            INTUIT_REVOKE_URL,
            data={"token": refresh_token},
            auth=(settings.qbo_client_id, settings.qbo_client_secret),
            headers={"Accept": "application/json"},
        )
