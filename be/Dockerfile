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

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create necessary directories
RUN mkdir -p /var/log/nginx /var/cache/nginx

# Set build-time environment variables for composer install ONLY
ENV APP_KEY=base64:XbAzi6vg8BmX26gv/IrDr059QtHqeyoaOy4DoTIlUqU= \
    APP_URL=http://127.0.0.1 \
    APP_ENV=production \
    APP_DEBUG=false

# Install dependencies with --no-scripts to avoid artisan commands that need APP_URL
RUN composer install --no-dev --no-scripts --optimize-autoloader

# IMPORTANT: Do NOT create .env or run artisan commands during build!
# entrypoint.sh will handle everything at runtime

# Expose port
EXPOSE 8000

# Use bash + entrypoint script via CMD (more reliable than ENTRYPOINT)
CMD ["/bin/bash", "/app/entrypoint.sh"]
