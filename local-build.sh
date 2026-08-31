#!/bin/bash

set -e

MODULE_NAME="ReSuSFS"
MODULE_BUILD_NAME="module"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${SCRIPT_DIR}/build"
WEBUI_DIR="${SCRIPT_DIR}/webui"
MODULE_DIR="${SCRIPT_DIR}/module"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
	echo -e "${GREEN}[+]${NC} $1"
}

print_warn() {
	echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
	echo -e "${RED}[-]${NC} $1"
}

check_prerequisites() {
	print_info "Checking prerequisites..."

	if ! command -v pnpm &> /dev/null; then
		print_error "pnpm is not installed. Install with: npm install -g pnpm"
		exit 1
	fi

	if ! command -v node &> /dev/null; then
		print_error "Node.js is not installed"
		exit 1
	fi

	if ! command -v jq &> /dev/null; then
		print_error "jq is not installed"
		exit 1
	fi

	if ! command -v zip &> /dev/null; then
		print_error "zip is not installed"
		exit 1
	fi

	if [ ! -d "$MODULE_DIR" ]; then
		print_error "Module directory not found: $MODULE_DIR"
		exit 1
	fi

	if [ ! -d "$WEBUI_DIR" ]; then
		print_warn "WebUI directory not found, skipping webui build"
		SKIP_WEBUI=true
	else
		SKIP_WEBUI=false
	fi

	if [ ! -f "${SCRIPT_DIR}/update.json" ]; then
		print_error "update.json not found in project root"
		exit 1
	fi
}

build_webui() {
	if [ "$SKIP_WEBUI" = true ]; then
		return
	fi

	rm -rf "$BUILD_DIR/$MODULE_BUILD_NAME"
	rm -f $BUILD_DIR/*.zip

	print_info "Building webui..."

	mkdir -p "$BUILD_DIR/webui"

	cp -r "$WEBUI_DIR"/. "$BUILD_DIR/webui/"

	cd "$BUILD_DIR/webui"

	if [ ! -f "pnpm-lock.yaml" ]; then
		print_warn "pnpm-lock.yaml not found, using regular install"
		pnpm install
	else
		pnpm install --frozen-lockfile --config.verify-deps-before-run=false
	fi

	pnpm build

	cd "$SCRIPT_DIR"
}

get_version_info() {
	print_info "Getting version information..."

	VERSION_CODE=$(jq -r .versionCode update.json)
	VERSION=$(jq -r .version update.json)

	if [ -z "$VERSION_CODE" ] || [ "$VERSION_CODE" = "null" ]; then
		print_error "Failed to get versionCode from update.json"
		exit 1
	fi

	if [ -z "$VERSION" ] || [ "$VERSION" = "null" ]; then
		print_error "Failed to get version from update.json"
		exit 1
	fi

	ZIP_NAME="${MODULE_NAME}_${VERSION_CODE}"

	print_info "Version: $VERSION (Code: $VERSION_CODE)"
	print_info "ZIP Name: $ZIP_NAME"
}

prepare_build_dir() {
	print_info "Preparing module..."

	mkdir -p "$BUILD_DIR/$MODULE_BUILD_NAME"

	cp -r "$MODULE_DIR"/. "$BUILD_DIR/$MODULE_BUILD_NAME/"
}

create_zip() {
	print_info "Creating zip file..."

	cd "$BUILD_DIR/$MODULE_BUILD_NAME"
	zip -r "../$ZIP_NAME.zip" .
	cd "$SCRIPT_DIR"

	print_info "Zip created: $BUILD_DIR/$ZIP_NAME.zip"
}

main() {
	check_prerequisites
	build_webui
	get_version_info
	prepare_build_dir
	create_zip

	print_info "Build completed successfully!"
	print_info "Output: $BUILD_DIR/$ZIP_NAME.zip"
}

main "$@"