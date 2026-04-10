# Docker Deployment Guide

Complete guide to deploying your ICHAS Management System using Docker.

## 📋 Table of Contents

1. [Local Development](#local-development)
2. [DigitalOcean App Platform](#digitalocean-app-platform)
3. [Railway](#railway)
4. [Render](#render)
5. [AWS EC2](#aws-ec2)
6. [Environment Variables](#environment-variables)
7. [Troubleshooting](#troubleshooting)

---

## 🐳 Local Development

### Prerequisites
- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose installed (included with Docker Desktop)

### Running Locally

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Run database migrations
docker-compose exec app npm run db:push

# Stop containers
docker-compose down

# Remove volumes (careful - deletes data!)
docker-compose down -v
```

**Access your app**: http://localhost:3000

### Rebuilding After Changes

```bash
# Rebuild the image
docker-compose build

# Start with new image
docker-compose up -d
```

---

## ☁️ DigitalOcean App Platform (RECOMMENDED)

**Best for:** Easy setup, managed platform, $5-12/month

### Step 1: Create GitHub Repo (if not already)

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/kaicollege.git
git push -u origin main
```

### Step 2: Deploy on DigitalOcean

1. **Sign up** at [DigitalOcean](https://www.digitalocean.com)
2. **Go to** Apps → Create App
3. **Select** your GitHub repository (authorize first)
4. **Select branch**: `main`
5. **Choose environment**: Production
6. **Click** "Next"

### Step 3: Configure App

1. **Source Type**: Dockerfile
2. **Build Command**: (leave empty - auto-detected)
3. **Run Command**: (leave empty - defined in Dockerfile)
4. **HTTP Port**: 3000
5. **HTTP Routes**: ✓ Accept all
6. **Click** "Next"

### Step 4: Set Environment Variables

Click **"Edit"** → **"Variables"**

Add these environment variables:

```
NODE_ENV=production
DATABASE_URL=file:/app/data/production.db
NEXT_PUBLIC_API_URL=https://your-app-name.ondigitalocean.app
```

### Step 5: Configure Persistent Volume

1. Click **"Add Component"** → **"Persistent Volume"**
2. **Mount Path**: `/app/data`
3. **Size**: 5 GB (start small, scale as needed)
4. **Click** "Next"

### Step 6: Review & Deploy

- Review all settings
- Click **"Create Resources"**
- Wait 5-10 minutes for deployment

**Your app will be live at**: `https://your-app-name.ondigitalocean.app`

### Automatic Deploys

After initial setup, every push to `main` branch auto-deploys!

```bash
# Deploy by pushing to main
git push origin main
```

### Scale Resources

**DigitalOcean Pricing:**
- **Basic**: $5/month (512MB RAM, 0.25 CPU)
- **Standard**: $12/month (1GB RAM, 0.5 CPU)
- **Auto-scale**: Available with Pro plan

---

## 🚂 Railway (VERY EASY)

**Best for:** Simplicity, generous free tier, $5/month

### Step 1: Connect GitHub

1. Go to [Railway](https://railway.app)
2. Click **"GitHub Login"**
3. Authorize Railway

### Step 2: Deploy Project

1. Click **"New Project"**
2. **Select** your GitHub repo
3. **Select** branch: `main`
4. **Click** "Deploy Now"

Wait 5-10 minutes...

### Step 3: Configure Variables

Click **"Variables"** tab:

```
NODE_ENV=production
DATABASE_URL=file:/app/data/production.db
NEXT_PUBLIC_API_URL=https://your-app-name.up.railway.app
```

### Step 4: Add Storage

1. Click **"Volumes"**
2. **Mount Path**: `/app/data`
3. **Size**: 5GB

### Auto Updates

Every push to `main` auto-deploys automatically!

**Railway Cost**: ~$5 usage

---

## 🎨 Render (VERY EASY)

**Best for:** Free tier, simple setup, $0-15/month

### Step 1: Connect GitHub

1. Go to [Render](https://render.com)
2. Click **"Sign up with GitHub"**

### Step 2: Create New Web Service

1. Dashboard → **"New +"** → **"Web Service"**
2. **Connect** your repository
3. **Name**: ichas-management
4. **Region**: Choose closest to you
5. **Branch**: main
6. **Runtime**: Docker
7. **Click** "Create Web Service"

### Step 3: Configure Environment

**Settings** → **"Environment"** → Add variables:

```
NODE_ENV=production
DATABASE_URL=file:/app/data/production.db
NEXT_PUBLIC_API_URL=https://ichas-management.onrender.com
```

### Step 4: Add Persistent Disk

1. Click **"Environment"** → **"Disks"**
2. **Add New Disk**:
   - Path: `/app/data`
   - Size: 5GB
   - Click "Create"

### Auto Redeploy

Push to GitHub to auto-redeploy:

```bash
git push origin main
```

**Render Free Tier**: Auto-sleep after 15 min inactivity (Paid: $12/month always on)

---

## 🔧 AWS EC2 (MOST CONTROL)

**Best for:** Full control, free tier eligible, varies

### Step 1: Create EC2 Instance

1. **AWS Console** → **EC2** → **"Launch Instance"**
2. **AMI**: Ubuntu 22.04 LTS (Free tier eligible)
3. **Instance Type**: t3.micro or t2.micro (Free tier)
4. **Key Pair**: Create new or use existing
5. **Security Group**: 
   - HTTP (80) → 0.0.0.0
   - HTTPS (443) → 0.0.0.0
   - SSH (22) → Your IP
6. **Storage**: 20GB (Free tier)
7. **Launch**

### Step 2: Connect & Setup Docker

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### Step 3: Clone & Deploy

```bash
# Clone repository
git clone https://github.com/yourusername/kaicollege.git
cd kaicollege

# Create environment file
cat > .env.production << EOF
NODE_ENV=production
DATABASE_URL=file:/app/data/production.db
NEXT_PUBLIC_API_URL=https://your-domain.com
EOF

# Create docker-compose for production
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: file:/app/data/production.db
    volumes:
      - ./data:/app/data
    restart: always
EOF

# Start container
docker-compose -f docker-compose.prod.yml up -d

# Verify running
docker ps
```

### Step 4: Setup Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo tee /etc/nginx/sites-available/kaicollege << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/kaicollege /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renew (already enabled)
sudo systemctl enable certbot.timer
```

---

## 🔐 Environment Variables

### Production Variables

Create `.env.production` file:

```env
# Required
NODE_ENV=production
DATABASE_URL=file:/app/data/production.db

# API Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com

# Session Configuration (in milliseconds)
SESSION_TIMEOUT=3600000

# Optional - Logging
DEBUG=false
LOG_LEVEL=info
```

### Safe Variable Setting

**Never commit .env files!** Use platform-specific secret management:

- **DigitalOcean**: App → Settings → Variables
- **Railway**: Variables tab
- **Render**: Environment section
- **AWS**: Secrets Manager or Parameter Store

---

## 📊 Monitoring & Maintenance

### View Logs

**DigitalOcean:**
```bash
# In dashboard: App → Overview → "View Logs"
```

**Railway:**
```bash
# In dashboard: Logs tab
```

**Docker (Local):**
```bash
docker-compose logs -f
docker-compose logs app --tail=50
```

### Database Backup

**Local backup:**
```bash
docker-compose exec app cp prisma/dev.db backups/backup-$(date +%Y%m%d-%H%M%S).db
```

**Cloud platforms:** Download from file manager or use built-in backup

### Update Application

```bash
# Pull latest code
git pull origin main

# Wait for auto-redeploy or manually:
docker-compose build
docker-compose up -d
```

---

## 🆘 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Rebuild
docker-compose build --no-cache

# Restart
docker-compose restart app
```

### Database Connection Error

```bash
# Ensure data directory exists
docker-compose exec app ls -la /app/data

# Reinitialize database
docker-compose exec app npm run db:push
```

### Out of Memory

**Local:**
```bash
# Increase Docker memory in Docker Desktop → Preferences
```

**Cloud:** Upgrade instance size in platform dashboard

### Port Already in Use

```bash
# Change port in docker-compose.yml
# ports: "8000:3000"  (instead of 3000:3000)
```

### Slow Performance

1. Check CPU/Memory usage in dashboard
2. Upgrade instance size
3. Enable caching in Cloudflare/CDN

---

## ✅ Deployment Checklist

- [ ] Dockerfile created
- [ ] docker-compose.yml created
- [ ] .dockerignore created
- [ ] Code pushed to GitHub
- [ ] Platform account created (DigitalOcean/Railway/etc)
- [ ] Repository connected to platform
- [ ] Environment variables set
- [ ] Persistent storage configured
- [ ] Test deployment works
- [ ] Database initialized
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active
- [ ] Monitoring setup
- [ ] Backup procedure documented

---

## 💰 Cost Comparison

| Platform | CPU | RAM | Storage | Price |
|----------|-----|-----|---------|-------|
| **DigitalOcean** | 0.5 CPU | 512MB | 5GB SSD | $5/mo |
| **Railway** | Shared | 512MB + | 5GB | $5/mo |
| **Render** | Shared | 512MB | 5GB | Free→$12/mo |
| **AWS EC2** | 1 CPU | 512MB | 20GB | Free→$5-10/mo |

---

## 📞 Support

- **DigitalOcean Help**: https://docs.digitalocean.com/products/app-platform/
- **Railway Docs**: https://docs.railway.app/
- **Render Guide**: https://render.com/docs
- **Docker Docs**: https://docs.docker.com/

---

**Status**: ✅ Ready to Deploy!

Choose your platform above and follow the steps. You'll be live in minutes! 🚀
