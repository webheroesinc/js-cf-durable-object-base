
SRC = $(shell find src -name "*.ts")

TEST_FIXTURES = $(shell find tests/fixtures -name "*.ts" -not -path "*/dist/*")

# Build library from TypeScript sources
lib/index.js: $(SRC) node_modules
	npm run build
	touch $@

# Install dependencies
node_modules: package.json
	npm install
	touch $@

# Build test fixture
tests/fixtures/dist/durable-object-test.js: $(TEST_FIXTURES) lib/index.js tests/fixtures/package.json
	npm run build:test-fixture
	touch $@
