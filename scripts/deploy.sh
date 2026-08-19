#!/bin/bash
# Hostinger SSH Deploy Script
set -e

DEPLOY_PATH=$1

if [ -z "$DEPLOY_PATH" ]; then
    echo "❌ Error: DEPLOY_PATH argument is missing."
    echo "Usage: ./deploy.sh <absolute_deploy_path>"
    exit 1
fi

echo "🚀 Starting Deployment on Hostinger in $DEPLOY_PATH..."
cd "$DEPLOY_PATH"

if [ ! -f "release.tar.gz" ]; then
    echo "❌ Error: release.tar.gz package not found in $DEPLOY_PATH"
    exit 1
fi

echo "📦 Extracting release archive..."
tar -xzf release.tar.gz
rm release.tar.gz

# ----------------------------------------------------
# 1. Setup Backend (Laravel)
# ----------------------------------------------------
echo "⚙️  Configuring Backend..."
cd "$DEPLOY_PATH/backend"

# If production .env doesn't exist, copy from example
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying .env.example..."
    cp .env.example .env
    echo "⚠️  Please configure your database, mail, and other secrets inside: $DEPLOY_PATH/backend/.env"
fi

echo "📥 Installing Composer dependencies (no-dev, optimized)..."
# Check if composer is installed globally or locally
if command -v composer &> /dev/null; then
    composer install --no-dev --optimize-autoloader --no-interaction
elif [ -f "../composer.phar" ]; then
    php ../composer.phar install --no-dev --optimize-autoloader --no-interaction
else
    echo "⚠️  Composer not found. Downloading composer.phar..."
    curl -sS https://getcomposer.org/installer | php -- --install-dir=..
    php ../composer.phar install --no-dev --optimize-autoloader --no-interaction
fi

# Generate app key if not set
if ! grep -q "APP_KEY=base64:" .env; then
    echo "🔑 Generating Application Key..."
    php artisan key:generate
fi

# Run Database Migrations
echo "🗄️  Running Migrations..."
php artisan migrate --force

# Optimize Laravel configurations
echo "⚡ Optimizing Configurations..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# ----------------------------------------------------
# 2. Setup Public Folders & Symlinks
# ----------------------------------------------------
echo "🔗 Aligning public-facing folders..."
cd "$DEPLOY_PATH"

# Ensure public_html exists
mkdir -p public_html

# Copy React build files into public_html
echo "Serving React frontend from public_html..."
if [ -d "dist" ]; then
    rsync -a --delete dist/ public_html/
    echo "✅ Frontend assets copied to public_html"
else
    echo "❌ Error: dist/ directory (React build) not found."
    exit 1
fi

# Create symlink for Laravel API (public_html/api -> backend/public)
echo "Linking API to public_html/api..."
if [ -L "public_html/api" ]; then
    rm "public_html/api"
elif [ -d "public_html/api" ]; then
    rm -rf "public_html/api"
fi
ln -s ../backend/public public_html/api
echo "✅ Symlinked public_html/api to backend/public"

# Write .htaccess for React SPA routing with Apache rewrite rules
echo "📝 Configuring public_html/.htaccess..."
cat << 'EOF' > public_html/.htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  
  # Exclude api calls from frontend rewrites (let the api symlink handle it)
  RewriteCond %{REQUEST_URI} ^/api [NC]
  RewriteRule .* - [L]
  
  # Rewrite all other endpoints to index.html for SPA router (React Router)
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF
chmod 644 public_html/.htaccess
echo "✅ Apache rewrite rules (.htaccess) configured for React routing."

echo "🎉 Deployment successful!"
