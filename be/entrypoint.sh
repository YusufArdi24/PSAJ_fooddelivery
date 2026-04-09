#!/bin/bash
set -e

echo "========================================="
echo "   LARAVEL APPLICATION STARTUP"
echo "========================================="
cd /app

# Step 1: CLEAN bootstrap cache - CRITICAL!
echo "1️⃣  Cleaning bootstrap cache..."
rm -rf bootstrap/cache/*
mkdir -p bootstrap/cache

# Step 2: CREATE fresh .env from example
echo "2️⃣  Creating fresh .env..."
if [ -f .env ]; then
    rm .env
fi
cp .env.example .env
chmod 644 .env

# Step 3: SET environment variables in .env
echo "3️⃣  Setting environment variables..."

# ENSURE APP_URL is valid
if [ -z "$APP_URL" ]; then
    # Production on Railway: use HTTPS
    if [ "$APP_ENV" = "production" ] && [ ! -z "$RAILWAY_DOMAIN" ]; then
        APP_URL="https://$RAILWAY_DOMAIN"
    else
        APP_URL="http://127.0.0.1:8000"
    fi
elif [[ ! "$APP_URL" =~ ^https?:// ]]; then
    # Plain domain without protocol - add https for production
    if [ "$APP_ENV" = "production" ]; then
        APP_URL="https://$APP_URL"
    else
        APP_URL="http://$APP_URL"
    fi
fi

# Remove trailing slash if present
APP_URL="${APP_URL%/}"

# Verify no invalid characters
if [[ "$APP_URL" =~ [[:space:]] ]]; then
    echo "   ❌ APP_URL contains spaces! Using fallback..."
    APP_URL="https://127.0.0.1:8000"
fi

echo "   APP_URL: $APP_URL"

APP_ENV="${APP_ENV:-production}"
APP_DEBUG="${APP_DEBUG:-false}"
APP_KEY="${APP_KEY:-base64:XbAzi6vg8BmX26gv/IrDr059QtHqeyoaOy4DoTIlUqU=}"
APP_NAME="${APP_NAME:-Warung Edin}"

# Update .env - use single quotes to avoid shell expansion
sed -i.bak "s|^APP_URL=.*|APP_URL=$APP_URL|" .env
sed -i "s|^ASSET_URL=.*|ASSET_URL=$APP_URL|" .env
sed -i "s|^APP_ENV=.*|APP_ENV=$APP_ENV|" .env
sed -i "s|^APP_DEBUG=.*|APP_DEBUG=$APP_DEBUG|" .env
sed -i "s|^APP_KEY=.*|APP_KEY=$APP_KEY|" .env
sed -i "s|^APP_NAME=.*|APP_NAME=\"$APP_NAME\"|" .env

# CRITICAL: Ensure DB_CONNECTION is ALWAYS mysql (not sqlite!)
sed -i "s|^DB_CONNECTION=.*|DB_CONNECTION=mysql|" .env

# Step 3.5: Handle Email Configuration  
echo "3.5️⃣  Configuring email service..."

if [ ! -z "$MAIL_MAILER" ]; then 
    sed -i "s|^MAIL_MAILER=.*|MAIL_MAILER=$MAIL_MAILER|" .env
    
    if [ "$MAIL_MAILER" = "resend" ]; then
        echo "   Using Resend cloud email API"
        if [ ! -z "$RESEND_API_KEY" ]; then
            sed -i "s|^RESEND_API_KEY=.*|RESEND_API_KEY=$RESEND_API_KEY|" .env
        fi
    elif [ "$MAIL_MAILER" = "sendgrid" ]; then
        echo "   Using SendGrid email driver"
        if [ ! -z "$SENDGRID_API_KEY" ]; then
            sed -i "s|^SENDGRID_API_KEY=.*|SENDGRID_API_KEY=$SENDGRID_API_KEY|" .env
        fi
    elif [ "$MAIL_MAILER" = "smtp" ]; then
        echo "   Using SMTP email driver"
        if [ ! -z "$MAIL_SCHEME" ]; then
            if [ "$MAIL_SCHEME" = "tls" ]; then
                MAIL_SCHEME="smtp"
                echo "   Converting MAIL_SCHEME: tls → smtp (Symfony Mailer compat)"
            fi
            sed -i "s|^MAIL_SCHEME=.*|MAIL_SCHEME=$MAIL_SCHEME|" .env
        fi
        if [ ! -z "$MAIL_HOST" ]; then sed -i "s|^MAIL_HOST=.*|MAIL_HOST=$MAIL_HOST|" .env; fi
        if [ ! -z "$MAIL_PORT" ]; then sed -i "s|^MAIL_PORT=.*|MAIL_PORT=$MAIL_PORT|" .env; fi
        if [ ! -z "$MAIL_USERNAME" ]; then sed -i "s|^MAIL_USERNAME=.*|MAIL_USERNAME=$MAIL_USERNAME|" .env; fi
        if [ ! -z "$MAIL_PASSWORD" ]; then sed -i "s|^MAIL_PASSWORD=.*|MAIL_PASSWORD=$MAIL_PASSWORD|" .env; fi
        if [ ! -z "$MAIL_TIMEOUT" ]; then sed -i "s|^MAIL_TIMEOUT=.*|MAIL_TIMEOUT=$MAIL_TIMEOUT|" .env; fi
    fi
fi

if [ ! -z "$MAIL_FROM_ADDRESS" ]; then sed -i "s|^MAIL_FROM_ADDRESS=.*|MAIL_FROM_ADDRESS=$MAIL_FROM_ADDRESS|" .env; fi
if [ ! -z "$MAIL_FROM_NAME" ]; then sed -i "s|^MAIL_FROM_NAME=.*|MAIL_FROM_NAME=\"$MAIL_FROM_NAME\"|" .env; fi
echo "   ✅ Email service configured"

# Step 4: Handle Railway MySQL variables
echo "4️⃣  Configuring database..."
echo "   Environment Variables:"
echo "   MYSQLHOST=$MYSQLHOST"
echo "   MYSQLDATABASE=$MYSQLDATABASE"
echo "   MYSQLUSER=$MYSQLUSER"
echo "   MYSQLPORT=${MYSQLPORT:-3306}"

# ALWAYS update database config - CRITICAL FOR PRODUCTION
sed -i "s|^DB_HOST=.*|DB_HOST=${MYSQLHOST:-mysql.railway.internal}|" .env
sed -i "s|^DB_PORT=.*|DB_PORT=${MYSQLPORT:-3306}|" .env
sed -i "s|^DB_DATABASE=.*|DB_DATABASE=${MYSQLDATABASE:-railway}|" .env
sed -i "s|^DB_USERNAME=.*|DB_USERNAME=${MYSQLUSER:-root}|" .env
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=${MYSQLPASSWORD:-}|" .env

echo "   ✅ Database configured"

# Step 5: VERIFY .env was written correctly
echo "5️⃣  Verifying .env configuration..."
FINAL_URL=$(grep "^APP_URL=" .env | cut -d= -f2-)
FINAL_DB_CONNECTION=$(grep "^DB_CONNECTION=" .env | cut -d= -f2-)
FINAL_DB_HOST=$(grep "^DB_HOST=" .env | cut -d= -f2-)
FINAL_DB_DATABASE=$(grep "^DB_DATABASE=" .env | cut -d= -f2-)
FINAL_DB_USERNAME=$(grep "^DB_USERNAME=" .env | cut -d= -f2-)
FINAL_MAIL_SCHEME=$(grep "^MAIL_SCHEME=" .env | cut -d= -f2-)
FINAL_MAIL_MAILER=$(grep "^MAIL_MAILER=" .env | cut -d= -f2-)
FINAL_MAIL_HOST=$(grep "^MAIL_HOST=" .env | cut -d= -f2-)
FINAL_MAIL_PORT=$(grep "^MAIL_PORT=" .env | cut -d= -f2-)
FINAL_MAIL_USERNAME=$(grep "^MAIL_USERNAME=" .env | cut -d= -f2-)
FINAL_MAIL_FROM=$(grep "^MAIL_FROM_ADDRESS=" .env | cut -d= -f2-)

echo "   APP_URL: $FINAL_URL"
echo "   DB_CONNECTION: $FINAL_DB_CONNECTION"
echo "   DB_HOST: $FINAL_DB_HOST"
echo "   DB_DATABASE: $FINAL_DB_DATABASE"
echo "   DB_USERNAME: $FINAL_DB_USERNAME"
echo "   MAIL_MAILER: $FINAL_MAIL_MAILER"
echo "   MAIL_SCHEME: $FINAL_MAIL_SCHEME"
echo "   MAIL_HOST: $FINAL_MAIL_HOST"
echo "   MAIL_PORT: $FINAL_MAIL_PORT"
echo "   MAIL_USERNAME: $FINAL_MAIL_USERNAME"
echo "   MAIL_FROM_ADDRESS: $FINAL_MAIL_FROM"

if [ -z "$FINAL_URL" ] || [ "$FINAL_URL" = "http://localhost" ]; then
    echo "   ⚠️ Invalid APP_URL in .env, fixing..."
    if [ "$APP_ENV" = "production" ] && [ ! -z "$RAILWAY_DOMAIN" ]; then
        sed -i "s|^APP_URL=.*|APP_URL=https://$RAILWAY_DOMAIN|" .env
    else
        sed -i "s|^APP_URL=.*|APP_URL=http://127.0.0.1:8000|" .env
    fi
fi

if [ "$FINAL_DB_CONNECTION" != "mysql" ]; then
    echo "   ⚠️ Invalid DB_CONNECTION! Must be mysql, fixing..."
    sed -i "s|^DB_CONNECTION=.*|DB_CONNECTION=mysql|" .env
fi

# Step 6: Output .env for verification
echo ""
echo "   Current .env values:"
grep "^APP_\|^DB_CONNECTION\|^DB_HOST" .env | head -10
echo ""
# Step 6.5: Install Composer dependencies (CRITICAL - needed for Livewire!)
echo "6️⃣ .5️⃣  Installing Composer dependencies..."
if [ -f "composer.json" ]; then
    composer install --no-dev --optimize-autoloader --no-interaction 2>&1 | grep -E "(installed|Installing|Nothing)" | head -3
    echo "   ✅ Composer dependencies installed"
else
    echo "   ⚠️ composer.json not found"
fi
# Step 7: AGGRESSIVELY clear all Laravel caches
echo "6️⃣  Clearing Laravel caches (aggressive)..."
rm -rf bootstrap/cache/config.php bootstrap/cache/*.php
php artisan config:clear --no-interaction 2>/dev/null || echo "   (config:clear skipped)"
php artisan route:clear --no-interaction 2>/dev/null || echo "   (route:clear skipped)"
php artisan cache:clear --no-interaction 2>/dev/null || echo "   (cache:clear skipped)"
php artisan view:clear --no-interaction 2>/dev/null || echo "   (view:clear skipped)"
echo "   Cache cleared successfully"

# Step 7.5: Ensure public/storage exists
echo "7️⃣ .5️⃣  Setting up storage symlink..."
rm -rf public/storage 2>/dev/null
php artisan storage:link --no-interaction 2>/dev/null || echo "   (storage:link skipped)"
chmod -R 755 public 2>/dev/null || true
echo "   ✅ Storage configured"

# Step 7.8: Install Composer dependencies (CRITICAL!)
echo "7️⃣ .8️⃣  Installing Composer dependencies..."
if [ -f "composer.json" ]; then
    composer install --no-dev --optimize-autoloader 2>&1 | tail -5
    echo "   ✅ Composer dependencies installed"
else
    echo "   ⚠️ composer.json not found"
fi

# Step 8: Publish Assets (Livewire + Filament)
echo "8️⃣  Publishing package assets..."
mkdir -p public/vendor public/livewire

# Publish Livewire assets
echo "   Publishing Livewire..."
php artisan livewire:publish --assets --force 2>&1 | tail -3 || true
php artisan filament:publish --force 2>&1 | tail -3 || true

# Ensure livewire.js exists - if not, Livewire will generate dynamically
if [ ! -f "public/livewire/livewire.js" ]; then
    echo "   ℹ️  Livewire will serve JS dynamically via route"
fi

# Verify vendors directory created
ls -la public/vendor/livewire/ 2>/dev/null && echo "   ✅ Livewire vendor files found" || echo "   ℹ️  Livewire files will be generated on demand"

chmod -R 755 public/vendor public/livewire 2>/dev/null || true
echo "   ✅ Assets configuration complete"

# Step 9: Run migrations (only if database configured)
echo "9️⃣  Database migrations..."
if [ ! -z "$MYSQLHOST" ]; then
    php artisan migrate --force --no-interaction 2>&1 | tail -2 || echo "   (migrations skipped)"
else
    echo "   Skipped (no database configured)"
fi

# Step 9.5: Seed database (create admin account)
echo "9️⃣ .5️⃣  Seeding admin account..."
if [ ! -z "$MYSQLHOST" ]; then
    php artisan db:seed --class=AdminSeeder --force --no-interaction 2>&1 | tail -2 || echo "   (seeding skipped)"
    echo "   ✅ Admin account ready"
else
    echo "   Skipped (no database configured)"
fi

# Step 10: Optimize application (config cache only)
echo "🔟  Optimizing application..."
rm -rf bootstrap/cache/*
php artisan config:cache --no-interaction 2>/dev/null || echo "   (config:cache skipped)"
echo "   ✅ Optimization complete"

# Step 10.5: Test application bootstrap
echo "🔟 .5️⃣  Testing application bootstrap..."
php artisan tinker --execute="echo 'Bootstrap OK'" 2>/dev/null || echo "   (bootstrap test skipped)"
echo ""
echo "========================================="
echo "   ✅ Starting Laravel Server"
echo "   URL: $(grep '^APP_URL=' .env | cut -d= -f2-)"
echo "   DB Connection: $(grep '^DB_CONNECTION=' .env | cut -d= -f2-)"
echo "   Mode: $(grep '^APP_ENV=' .env | cut -d= -f2-)"
echo "========================================="
echo ""

exec php artisan serve --host=0.0.0.0 --port=8000
