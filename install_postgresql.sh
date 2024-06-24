#!/bin/bash

# Update the package list and install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start the PostgreSQL service
sudo systemctl start postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql

# Set a password for the PostgreSQL user "postgres"
echo "Enter a password for the 'postgres' user:"
read -s postgres_password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$postgres_password';"

# Restart PostgreSQL to apply the password change
sudo systemctl restart postgresql

echo "PostgreSQL installation and password setup completed."
