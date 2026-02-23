.PHONY: dev stop restart

dev:
	npm start

stop:
	npm run stop

restart:
	npm run stop
	npm start
