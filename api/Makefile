ESBUILD = npx --no-install esbuild
ESBUILD_FLAGS = --bundle --platform=node --target=node22 --format=cjs --log-level=warning

build-ApiFunction:
	$(ESBUILD) src/handlers/api.js $(ESBUILD_FLAGS) --outfile="$(ARTIFACTS_DIR)/src/handlers/api.js"

build-StartPipelineFunction:
	$(ESBUILD) src/handlers/startPipeline.js $(ESBUILD_FLAGS) --outfile="$(ARTIFACTS_DIR)/src/handlers/startPipeline.js"

build-NormalizeFunction:
	$(ESBUILD) src/handlers/normalize.js $(ESBUILD_FLAGS) --outfile="$(ARTIFACTS_DIR)/src/handlers/normalize.js"

build-ClassifyFunction:
	$(ESBUILD) src/handlers/classify.js $(ESBUILD_FLAGS) --outfile="$(ARTIFACTS_DIR)/src/handlers/classify.js"

build-PersistFunction:
	$(ESBUILD) src/handlers/persist.js $(ESBUILD_FLAGS) --outfile="$(ARTIFACTS_DIR)/src/handlers/persist.js"

build-CollectTextractFunction:
	$(ESBUILD) src/handlers/collectTextract.js $(ESBUILD_FLAGS) --outfile="$(ARTIFACTS_DIR)/src/handlers/collectTextract.js"

build-MarkErrorFunction:
	$(ESBUILD) src/handlers/markError.js $(ESBUILD_FLAGS) --outfile="$(ARTIFACTS_DIR)/src/handlers/markError.js"
