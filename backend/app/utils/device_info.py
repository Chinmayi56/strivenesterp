"""
StriveNest ERP - Device & Client Request Info Utilities
Utility functions for extracting Client IP address, User-Agent header, Browser, OS, and Device details.
"""

import re
from typing import Dict, Optional, Tuple
from fastapi import Request


def get_client_ip(request: Request) -> str:
    """
    Extracts the client's real IP address from headers, respecting reverse proxy headers.
    """
    if not request:
        return "127.0.0.1"

    # Check headers in order of preference
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        # X-Forwarded-For can contain comma-separated IPs; the first one is the original client
        client_ip = x_forwarded_for.split(",")[0].strip()
        if client_ip:
            return client_ip

    x_real_ip = request.headers.get("X-Real-IP")
    if x_real_ip:
        return x_real_ip.strip()

    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"


def parse_user_agent(user_agent: Optional[str]) -> Tuple[str, str, str]:
    """
    Parses a User-Agent string to return (browser, operating_system, device_type).
    """
    if not user_agent:
        return ("Unknown Browser", "Unknown OS", "Desktop")

    ua = user_agent.lower()

    # Determine Device Type
    if "mobile" in ua or "android" in ua or "iphone" in ua:
        device_type = "Mobile"
    elif "ipad" in ua or "tablet" in ua:
        device_type = "Tablet"
    else:
        device_type = "Desktop"

    # Determine Operating System
    if "windows" in ua:
        os_name = "Windows"
    elif "macintosh" in ua or "mac os" in ua:
        os_name = "macOS"
    elif "android" in ua:
        os_name = "Android"
    elif "iphone" in ua or "ipad" in ua or "cpu os" in ua:
        os_name = "iOS"
    elif "linux" in ua:
        os_name = "Linux"
    else:
        os_name = "Unknown OS"

    # Determine Browser
    if "edg/" in ua or "edge/" in ua:
        browser_name = "Microsoft Edge"
    elif "chrome/" in ua and "safari/" in ua and "edg/" not in ua and "opr/" not in ua:
        browser_name = "Google Chrome"
    elif "firefox/" in ua:
        browser_name = "Mozilla Firefox"
    elif "safari/" in ua and "chrome/" not in ua:
        browser_name = "Apple Safari"
    elif "opr/" in ua or "opera/" in ua:
        browser_name = "Opera"
    else:
        browser_name = "Browser/Client"

    return (browser_name, os_name, device_type)
