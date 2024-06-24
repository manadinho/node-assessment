# Middleware Server Deployment Guide (Manual)

This document outlines the steps required to manually deploy our middleware application on a server.

## Prerequisites

- A server with Node.js installed.
- Access to the server via SSH or direct command line.
- The server should have a Node.js compatible web server like Nginx or Apache installed.
- Access to the project's repository (e.g., GitHub, GitLab, Bitbucket).

## Step 1: Accessing the Server

1. SSH into your server with the following command:

   ```bash
   ssh user@your_server_ip
   ```

2. Enter your password when prompted.

## Step 2: Clone the Repository

1. Navigate to the directory where you want to host your project:

   ```bash
   cd /var/www
   ```

2. Clone the project repository:

   ```bash
   git clone https://middleware_repository_url.git
   ```

3. Change to the project directory:

   ```bash
   cd your_project_name
   ```

## Step 3: Install Project Dependencies

1. Install the project dependencies by running:

   ```bash
   npm install
   ```

## Step 4: Install Postgresql

1. To install and configure Postgresql on your server you just has to run `install_postgresql.sh` file.

2. First make this file executeable.

   ```bash
   chmod +x install_postgresql.sh
   ```

3. Run script with given command.

   ```bash
   ./install_postgresql.sh
   ```

## Step 5: Environment Configuration

1. Copy `.env.example` and paste as `.env` file and change values accordinng to you configurations:

   ```bash
   cp .env.example .env
   ```

## Step 6: Run Migrations

1. Run migration with this command:

   ```bash
   npx sequelize db:migrate
   ```

## Step 7: Start the Application

1. Start your Node.js application:

   ```bash
   npm start
   ```

   Or use a process manager like PM2 for better process management:

   ```bash
   pm2 start index.js --name your_project_name
   ```

## Step 8: Set Up Reverse Proxy

1. Configure Nginx to forward requests to your Node.js application:

2. Restart Nginx to apply the changes:

   ```bash
   sudo systemctl restart nginx
   ```

## Step 9: Verify the Deployment

1. Open your web browser and go to your application's domain to verify that it is running correctly.

## Additional Steps

- Set up SSL with Let's Encrypt for HTTPS if necessary.
- Configure your firewall to allow traffic to the necessary ports (e.g., 80, 443).

## Conclusion

Your Middleware Server should now be successfully deployed and accessible via your domain.
