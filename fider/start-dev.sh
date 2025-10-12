#!/bin/bash

echo '🚀 Starting Fider Development Environment'
echo '========================================='

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "✅ bash -lc "cd /home/tims/root/fider && echo 'Creating development start script...' && cat > start-dev.sh << 'EOF'
#!/bin/bash

echo '🚀 Starting Fider Development Environment'
echo '========================================='

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e \"${GREEN}✅ $1${NC}\"
}

print_warning() {
    echo -e \"${YELLOW}⚠️  $1${NC}\"
}

print_error() {
    echo -e \"${RED}❌ $1${NC}\"
}

print_info() {
    echo -e \"${BLUE}ℹ️  $1${NC}\"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error 'Docker is not running. Please start Docker first.'
    exit 1
fi

# Stop and remove existing dev database if it exists
print_info 'Cleaning up existing development database...'
docker stop fider-dev-db 2>/dev/null || true
docker rm fider-dev-db 2>/dev/null || true

# Start development database
print_info 'Starting PostgreSQL development database...'
docker run -d --name fider-dev-db \\
    -e POSTGRES_USER=fider \\
    -e POSTGRES_PASSWORD=s0m3g00dp4ssw0rd \\
    -e POSTGRES_DB=fider_dev \\
    -p 5433:5432 \\
    postgres:17

# Wait for database to be ready
print_info 'Waiting for database to start...'
sleep 5

# Check if database is ready
print_info 'Testing database connection...'
until docker exec fider-dev-db pg_isready -U fider > /dev/null 2>&1; do
    print_warning 'Database not ready yet, waiting...'
    sleep 2
done

print_status 'Database is ready!'

# Build the application
print_info 'Building Fider application...'
make build

if [ $? -ne 0 ]; then
    print_error 'Build failed!'
    exit 1
fi

print_status 'Build completed successfully!'

# Run migrations
print_info 'Running database migrations...'
DATABASE_URL=postgres://fider:s0m3g00dp4ssw0rd@localhost:5433/fider_dev?sslmode=disable ./fider migrate

if [ $? -ne 0 ]; then
    print_error 'Migration failed!'
    exit 1
fi

print_status 'Migrations completed!'

# Start Fider
print_info 'Starting Fider development server...'
print_info 'Port: 3002'
print_info 'Database: localhost:5433'
print_info 'URL: http://localhost:3002'

# Set environment variables and start Fider
export PORT=3002
export DATABASE_URL=postgres://fider:s0m3g00dp4ssw0rd@localhost:5433/fider_dev?sslmode=disable
export JWT_SECRET=DEV_SECRET_FOR_LOCAL_DEVELOPMENT
export BASE_URL=http://localhost:3002
export EMAIL_NOREPLY=fider@namekart.com
export EMAIL_SMTP_HOST=smtp.office365.com
export EMAIL_SMTP_PORT=587
export EMAIL_SMTP_USERNAME=noreply@namekart.com
export EMAIL_SMTP_PASSWORD=T0910@1959
export EMAIL_SMTP_ENABLE_STARTTLS=true

print_status 'Fider development server started!'
print_info 'Access your development instance at: http://localhost:3002'
print_info 'To stop: Ctrl+C, then run: docker stop fider-dev-db && docker rm fider-dev-db'

# Start Fider in the foreground
./fider
