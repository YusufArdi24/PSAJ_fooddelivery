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
    icu-dev \
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

# Set default APP_URL for build time (required by Laravel)
ENV APP_URL=http://localhost:8000

# Install dependencies with --no-scripts to avoid artisan commands that need APP_URL
RUN composer install --no-dev --no-scripts --optimize-autoloader

# Run scripts manually in safe way (package:discover might fail but we can continue)
RUN php artisan package:discover --ansi || true

# Expose port
EXPOSE 8000

# Start application
CMD ["sh", "-c", "php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"]
