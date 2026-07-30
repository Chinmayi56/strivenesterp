"""
StriveNest ERP - Enterprise Logging Configuration
Configures structured console and daily file rotation logging.
"""

import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from app.core.config import settings


LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logging() -> logging.Logger:
    """Configures global application logging."""
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    root_logger = logging.getLogger("strivenest")
    root_logger.setLevel(log_level)

    # Avoid duplicate handlers if setup_logging is called multiple times
    if root_logger.handlers:
        return root_logger

    formatter = logging.Formatter(fmt=LOG_FORMAT, datefmt=DATE_FORMAT)

    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # File Handler (Rotating)
    if settings.LOG_TO_FILE:
        log_dir = os.path.dirname(settings.LOG_FILE_PATH) or "logs"
        os.makedirs(log_dir, exist_ok=True)

        file_handler = RotatingFileHandler(
            settings.LOG_FILE_PATH,
            maxBytes=10 * 1024 * 1024,  # 10 MB per file
            backupCount=5,
            encoding="utf-8"
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

    root_logger.info("Logging configured successfully [Level: %s]", settings.LOG_LEVEL)
    return root_logger


logger = setup_logging()


def get_logger(module_name: str) -> logging.Logger:
    """Returns a logger instance scoped to a module."""
    return logging.getLogger(f"strivenest.{module_name}")
