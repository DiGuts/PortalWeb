"""Async email sending utility. Silently skipped if SMTP_HOST is not configured."""
import os
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, html: str) -> None:
    """Send an HTML email. No-op if SMTP_HOST env var is not set."""
    smtp_host = os.getenv("SMTP_HOST", "")
    if not smtp_host:
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = os.getenv("SMTP_FROM", "TAVIL Portal <notifications@tavil.net>")
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=smtp_host,
            port=int(os.getenv("SMTP_PORT", "587")),
            username=os.getenv("SMTP_USER", ""),
            password=os.getenv("SMTP_PASS", ""),
            start_tls=True,
        )
        logger.info("[EMAIL OK] to=%s subject=%r", to, subject)
    except Exception as e:
        logger.error("[EMAIL ERROR] to=%s subject=%r error=%s", to, subject, e)
