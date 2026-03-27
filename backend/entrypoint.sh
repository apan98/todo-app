#!/bin/sh
# Exit immediately if a command exits with a non-zero status.
set -e

# It's a good practice to wait for the database to be ready.
# This simple loop tries to connect to the database, and waits if it's not available.
# Note: This requires sequelize-cli to be configured to read the database URL from the environment.
until npx sequelize-cli db:migrate:status; do
  >&2 echo "Postgres is still unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing migrations and seeds"

# Run database migrations
npx sequelize-cli db:migrate

# Seed the database
npx sequelize-cli db:seed:all

# Execute the main container command (e.g., "npm start")
exec "$@"
