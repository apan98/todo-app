#!/bin/sh
set -e
echo "Running migrations..."
npx sequelize-cli db:migrate
echo "Running seeds..."
npx sequelize-cli db:seed:all
echo "Starting server..."
exec npm start
