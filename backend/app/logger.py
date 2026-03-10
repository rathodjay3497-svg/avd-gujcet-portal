"""
Centralized Logging Configuration Module

This module provides a standardized logging configuration for the entire backend application.
Logs are written to app.log file with a standardized format including:
- Timestamp
- Log Level
- Service Name
- Function Name
- User ID (if available)
- Request ID (if available)
- Message

Log Levels:
- DEBUG: Detailed information for debugging
- INFO: General information about application flow
- WARNING: Warning messages that don't stop execution
- ERROR: Error messages that stop specific operations
- CRITICAL: Critical errors that may stop the application
"""

import logging
import os
from logging.handlers import RotatingFileHandler
from datetime import datetime
from typing import Optional
from functools import wraps
import uuid

# Get the project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_FILE_PATH = os.path.join(PROJECT_ROOT, "app.log")

# Default log level from environment
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

# Maximum log file size: 100MB
MAX_LOG_SIZE = 100 * 1024 * 1024  # 100MB

# Keep 30 backup files (30 days of logs if rotated daily)
BACKUP_COUNT = 30


class StandardizedFormatter(logging.Formatter):
    """
    Custom formatter that provides a standardized log format.
    
    Format: [timestamp] [level] [service] [function] [user_id] [request_id] - message
    Example: [2024-01-15 14:30:45,123] [INFO] [auth] [verify_otp] [user_123] [req_abc123] - OTP verified successfully
    """
    
    def __init__(self):
        super().__init__(
            fmt="[%(asctime)s] [%(levelname)s] [%(service)s] [%(funcName)s] [%(user_id)s] [%(request_id)s] - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S,%f"
        )
    
    def format(self, record):
        # Set default values for extra fields if not present
        if not hasattr(record, 'service'):
            record.service = 'app'
        if not hasattr(record, 'funcName'):
            record.funcName = 'unknown'
        if not hasattr(record, 'user_id'):
            record.user_id = 'N/A'
        if not hasattr(record, 'request_id'):
            record.request_id = 'N/A'
        
        return super().format(record)


class ServiceLogger:
    """
    Service-specific logger wrapper that provides easy methods for logging
    at different levels with service context.
    """
    
    def __init__(self, service_name: str, logger: logging.Logger):
        self.service_name = service_name
        self.logger = logger
    
    def _log(self, level: str, message: str, user_id: Optional[str] = None, 
             request_id: Optional[str] = None, extra: Optional[dict] = None):
        """Internal method to log with extra context."""
        extra_data = {
            'service': self.service_name,
            'user_id': user_id or 'N/A',
            'request_id': request_id or 'N/A'
        }
        if extra:
            extra_data.update(extra)
        
        log_func = getattr(self.logger, level.lower())
        log_func(message, extra=extra_data)
    
    def debug(self, message: str, user_id: Optional[str] = None,
              request_id: Optional[str] = None, **kwargs):
        """Log debug message."""
        self._log('DEBUG', message, user_id, request_id, kwargs)
    
    def info(self, message: str, user_id: Optional[str] = None,
             request_id: Optional[str] = None, **kwargs):
        """Log info message."""
        self._log('INFO', message, user_id, request_id, kwargs)
    
    def warning(self, message: str, user_id: Optional[str] = None,
                request_id: Optional[str] = None, **kwargs):
        """Log warning message."""
        self._log('WARNING', message, user_id, request_id, kwargs)
    
    def error(self, message: str, user_id: Optional[str] = None,
              request_id: Optional[str] = None, exc_info: bool = False, **kwargs):
        """Log error message."""
        extra_data = kwargs
        extra_data['exc_info'] = exc_info
        self._log('ERROR', message, user_id, request_id, extra_data)
        if exc_info:
            self.logger.exception(message, extra={
                'service': self.service_name,
                'user_id': user_id or 'N/A',
                'request_id': request_id or 'N/A'
            })
    
    def critical(self, message: str, user_id: Optional[str] = None,
                 request_id: Optional[str] = None, **kwargs):
        """Log critical message."""
        self._log('CRITICAL', message, user_id, request_id, kwargs)


def get_logger(service_name: str) -> ServiceLogger:
    """
    Get a service-specific logger instance.
    
    Args:
        service_name: Name of the service (e.g., 'auth', 'dynamo', 'email')
    
    Returns:
        ServiceLogger instance for the specified service
    """
    logger = logging.getLogger(service_name)
    return ServiceLogger(service_name, logger)


def log_function_call(logger: ServiceLogger, level: str = 'DEBUG'):
    """
    Decorator to automatically log function calls.
    
    Args:
        logger: ServiceLogger instance
        level: Log level for function call logging
    
    Example:
        @log_function_call(auth_logger)
        def my_function(param1, param2):
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            func_name = func.__name__
            logger.debug(
                f"Calling function '{func_name}' with args={args}, kwargs={kwargs}",
                request_id=get_request_id()
            )
            try:
                result = func(*args, **kwargs)
                logger.debug(
                    f"Function '{func_name}' completed successfully",
                    request_id=get_request_id()
                )
                return result
            except Exception as e:
                logger.error(
                    f"Function '{func_name}' raised exception: {str(e)}",
                    exc_info=True,
                    request_id=get_request_id()
                )
                raise
        return wrapper
    return decorator


# Global request ID storage (thread-local for Lambda)
_request_id_context = {}


def set_request_id(request_id: str):
    """Set the current request ID for logging context."""
    _request_id_context['current'] = request_id


def get_request_id() -> str:
    """Get the current request ID or generate a new one."""
    return _request_id_context.get('current', str(uuid.uuid4())[:8])


def generate_request_id() -> str:
    """Generate and set a new request ID."""
    new_id = str(uuid.uuid4())[:8]
    _request_id_context['current'] = new_id
    return new_id


def clear_request_id():
    """Clear the current request ID."""
    _request_id_context.pop('current', None)


# Create the main logger
def setup_logging():
    """
    Set up the centralized logging configuration.
    This function should be called once at application startup.
    """
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, LOG_LEVEL))
    
    # Remove existing handlers
    logger.handlers = []
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, LOG_LEVEL))
    console_formatter = StandardizedFormatter()
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # Create file handler with rotation
    file_handler = RotatingFileHandler(
        LOG_FILE_PATH,
        maxBytes=MAX_LOG_SIZE,
        backupCount=BACKUP_COUNT,
        encoding='utf-8'
    )
    file_handler.setLevel(getattr(logging, LOG_LEVEL))
    file_formatter = StandardizedFormatter()
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    # Log startup message
    logger.info(f"Logging initialized. Log level: {LOG_LEVEL}. Log file: {LOG_FILE_PATH}")
    
    return logger


# Pre-configured loggers for common services
auth_logger = get_logger('auth')
dynamo_logger = get_logger('dynamo')
s3_logger = get_logger('s3')
email_logger = get_logger('email')
sms_logger = get_logger('sms')
pdf_logger = get_logger('pdf')
jwt_logger = get_logger('jwt')
otp_logger = get_logger('otp')
api_logger = get_logger('api')
admin_logger = get_logger('admin')
event_logger = get_logger('event')
registration_logger = get_logger('registration')
