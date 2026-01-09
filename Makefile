.PHONY: help install dev run test clean migrate upgrade downgrade docker-up docker-down docker-logs

help:
	@echo "Milo Campaign API - Available commands:"
	@echo ""
	@echo "  make install       - Install dependencies"
	@echo "  make dev           - Run development server"
	@echo "  make run           - Run production server"
	@echo "  make test          - Run tests"
	@echo "  make clean         - Clean cache and temporary files"
	@echo "  make migrate       - Create new migration"
	@echo "  make upgrade       - Apply migrations"
	@echo "  make downgrade     - Rollback last migration"
	@echo "  make docker-up     - Start Docker containers"
	@echo "  make docker-down   - Stop Docker containers"
	@echo "  make docker-logs   - View Docker logs"
	@echo ""

install:
	pip install --upgrade pip
	pip install -r requirements.txt

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run:
	gunicorn app.main:app \
		--workers 4 \
		--worker-class uvicorn.workers.UvicornWorker \
		--bind 0.0.0.0:8000

test:
	pytest tests/ -v

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	rm -rf .coverage htmlcov/

migrate:
	alembic revision --autogenerate -m "$(msg)"

upgrade:
	alembic upgrade head

downgrade:
	alembic downgrade -1

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-build:
	docker-compose build

docker-restart:
	docker-compose restart
