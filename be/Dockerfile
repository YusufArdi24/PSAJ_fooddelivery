# Use official PHP image
FROM php:8.3-fpm

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libicu-dev \
    zip \
    unzip \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip intl
# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p /var/log/nginx /var/cache/nginx

# Copy .env from .env.example and set required variables for build/runtime
RUN cp .env.example .env

# Set runtime environment variables (APP_KEY and APP_URL from build config)
ENV APP_KEY=base64:XbAzi6vg8BmX26gv/IrDr059QtHqeyoaOy4DoTIlUqU= \
    APP_URL=http://127.0.0.1:8000 \
    APP_ENV=production \
    APP_DEBUG=false

# Install dependencies with --no-scripts to avoid artisan commands that need APP_URL
RUN composer install --no-dev --no-scripts --optimize-autoloader

# Run scripts manually in safe way (package:discover might fail but we can continue)
RUN php artisan package:discover --ansi || true

# Expose port
EXPOSE 8000

# Start application with proper environment
CMD ["sh", "-c", "export APP_URL=${APP_URL:-http://127.0.0.1:8000} && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"]
