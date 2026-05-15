.PHONY: dev build test deploy clean seed docker-up docker-down k8s-deploy

dev:
	docker-compose up -d mongodb redis
	cd backend && npm run dev &
	cd frontend && npm run dev

build:
	docker-compose build

test:
	cd backend && npm test
	cd frontend && npm test

deploy:
	docker-compose up -d --build
	@echo "Waiting for services..."
	@sleep 15
	docker-compose --profile seed run --rm backend-seed

clean:
	docker-compose down -v
	rm -rf backend/node_modules backend/dist frontend/node_modules frontend/dist

seed:
	docker-compose --profile seed run --rm backend-seed

docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down

k8s-deploy:
	helm upgrade --install sms ./helm/student-mgmt -n sms --create-namespace

backup:
	./scripts/backup-mongodb.sh

setup:
	cp backend/.env.example backend/.env
	@echo "Run 'make docker-up' then 'make seed'"
