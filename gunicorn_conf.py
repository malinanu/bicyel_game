"""Gunicorn configuration file for production deployment."""

import multiprocessing
import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
backlog = 2048

# Worker processes
workers = int(os.getenv('WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'uvicorn.workers.UvicornWorker'
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging
accesslog = '-'
errorlog = '-'
loglevel = os.getenv('LOG_LEVEL', 'info')
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(L)s'

# Process naming
proc_name = 'milo_campaign_api'

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (if needed)
# keyfile = '/path/to/keyfile'
# certfile = '/path/to/certfile'

# Debugging
reload = os.getenv('DEBUG', 'False').lower() == 'true'
reload_engine = 'auto'

# Server hooks
def on_starting(server):
    """Called just before the master process is initialized."""
    print("Starting Milo Campaign API server...")

def on_reload(server):
    """Called to recycle workers during a reload via SIGHUP."""
    print("Reloading workers...")

def when_ready(server):
    """Called just after the server is started."""
    print("Server is ready. Spawning workers")

def worker_int(worker):
    """Called just after a worker exited on SIGINT or SIGQUIT."""
    print(f"Worker {worker.pid} was interrupted")

def post_worker_init(worker):
    """Called just after a worker has initialized the application."""
    print(f"Worker {worker.pid} initialized")
