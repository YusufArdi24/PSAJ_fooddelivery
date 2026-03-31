#!/bin/bash
set -e

echo "Installing required PHP extensions..."

# Install missing extensions
docker-php-ext-install intl zip

echo "Running composer install..."
composer install --optimize-autoloader --no-scripts --no-interaction

echo "Build completed successfully!"
