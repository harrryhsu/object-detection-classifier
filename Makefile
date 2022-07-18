all: build deploy
bootstrap: npm-bootstrap
build: build-web build-api build-docker
deploy: 
	docker push harryhsu4/object-detection-classifier:latest
build-docker: 
	docker build . -t harryhsu4/object-detection-classifier:latest
build-web:
	cd web && npm run build && cd ../
build-api:
	cd api && npm run build && cd ../
npm-bootstrap:
	cd web && npm install && cd ../api && npm install && cd ../