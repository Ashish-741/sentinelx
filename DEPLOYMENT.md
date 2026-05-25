# 🚀 SentinelX - Production Deployment Guide

This guide outlines how to deploy the **SentinelX** platform to a production environment. Since the project is fully dockerized with a reverse proxy, the recommended approach is using **Docker Compose** on a virtual private server (VPS) such as AWS EC2, DigitalOcean, or Linode.

---

## 🏗️ Architecture Overview

In production, the application runs inside an isolated Docker virtual network:
1. **Nginx (Frontend Container)**: Listens on port `80` (and `443` for SSL) to serve the React static build and reverse-proxies `/api` requests to the Backend.
2. **Node.js (Backend Container)**: Runs on port `5000` (internal only, not exposed to the internet).
3. **FastAPI (ML Service Container)**: Runs on port `8000` (internal only, secure microservice boundary).
4. **MongoDB (Database Container)**: Stores data in a persistent Docker volume (internal only).

---

## 🌐 Option 1: VPS Deployment (DigitalOcean, AWS EC2, Linode)

This is the recommended deployment method because it allows you to run the entire stack on a single cheap server (starting at $6–$12/month) since the ML service has been optimized for CPU-only execution.

### Step 1: Provision your Server
1. Create a VPS (e.g., DigitalOcean Droplet, AWS EC2 instance, or Linode Nanode).
2. Select **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS** as the operating system.
3. Configure your CPU/RAM. We recommend at least **2 GB RAM** and **1 vCPU** to handle the ML model loading.

### Step 2: Install Docker & Docker Compose
Connect to your server via SSH and run:
```bash
# Update package database
sudo apt-get update

# Install prerequisites
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker’s official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose v2
sudo apt-get install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### Step 3: Clone and Configure the Project
1. Clone your project onto the server:
   ```bash
   git clone <your-repository-url> /opt/sentinelx
   cd /opt/sentinelx
   ```
2. Copy the production environment variables configuration:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` in a text editor (e.g., `nano .env`) and set secure values:
   - Generate a strong `JWT_SECRET`:
     ```bash
     openssl rand -base64 32
     ```
   - Update `FRONTEND_URL` to your production domain (e.g., `https://yourdomain.com`).
   - Add your live API keys for **VirusTotal**, **AbuseIPDB**, and **WHOIS** to enable real scanning feeds.
   - Configure a strong seed password for the default admin account.

### Step 4: Build and Start the Stack
Run Docker Compose in detached mode to download the images, build the services, and start them:
```bash
sudo docker compose up -d --build
```
Verify the status of the containers:
```bash
sudo docker compose ps
```

### Step 5: Seed the Database
Run the admin database seeder inside the running backend container to generate the initial admin account:
```bash
sudo docker compose exec backend npm run seed
```

---

## 🔒 Step 6: Securing the Server with SSL (Let's Encrypt)

To serve the site securely via `https://` (which is required for browser cookie security and WebSockets), you should map your domain to your VPS IP and set up SSL.

### 1. Point DNS Records
In your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.), add an **A Record** pointing to your VPS IP:
- `yourdomain.com` ➔ `VPS_PUBLIC_IP`
- `www.yourdomain.com` ➔ `VPS_PUBLIC_IP`

### 2. Update Port Bindings in `docker-compose.yml`
Modify the `frontend` service port bindings in `/opt/sentinelx/docker-compose.yml` to bind to port 80:
```yaml
  frontend:
    # ...
    ports:
      - "80:80"
```
*(Apply the changes: `sudo docker compose up -d`)*

### 3. Install Certbot (Let's Encrypt) on the Host
Use Certbot to request a SSL certificate:
```bash
sudo apt install -y certbot
```

### 4. Configure Nginx for SSL
We recommend using **Nginx on the VPS host** to manage the SSL connection and forward requests to the Docker container, or modifying the internal `frontend/nginx.conf` to mount SSL certificates.

The easiest way is to run Nginx on the host server:
1. Install Nginx on the VPS: `sudo apt install -y nginx`
2. Stop host Nginx temporarily: `sudo systemctl stop nginx`
3. Generate SSL certificate using certbot:
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
   ```
4. Create an Nginx config on the host `/etc/nginx/sites-available/sentinelx` to reverse proxy to port `8080` (where our frontend container will listen):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name yourdomain.com www.yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://127.0.0.1:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
5. Enable site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sentinelx /etc/nginx/sites-enabled/
   sudo systemctl start nginx
   ```

---

## 🛠️ Maintenance & Monitoring

### Viewing Logs
View real-time logs for all services or a specific container:
```bash
# All logs
sudo docker compose logs -f

# Backend only
sudo docker compose logs -f backend

# ML Service only
sudo docker compose logs -f ml-service
```

### Updating the Code
When you push updates to your repository, pull them on the server and rebuild the containers:
```bash
git pull
sudo docker compose up -d --build
```

### Backing up MongoDB
Create a backup of the MongoDB database:
```bash
sudo docker compose exec mongodb mongodump --out /data/db/backups/backup_$(date +%F)
```
The backup will be securely stored on your host server under the persistent volume path `/var/lib/docker/volumes/cybersecurity-project_mongodb-data/_data/backups/`.
