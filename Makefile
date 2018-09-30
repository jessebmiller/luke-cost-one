.PHONY: ganache
ganache:
	docker run -d --rm --name ganache -p 8545:8545 trufflesuite/ganache-cli || true

