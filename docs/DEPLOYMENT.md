# 🚀 Deployment Guide

## Prerequisites

Before deploying the Loan Management System, ensure you have:

- **Node.js 18+** installed
- **MongoDB** database (local or cloud)
- **Cloudinary** account for file storage
- **SMTP** email service credentials
- **Domain name** (for production)
- **SSL certificate** (for production)

---

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/loan-management
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/loan-management

# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-chars
NEXTAUTH_URL=http://localhost:3000
# For production:
# NEXTAUTH_URL=https://yourdomain.com

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Optional: Additional Configuration
NODE_ENV=production
PORT=3000
```

### Environment Variable Details

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `NEXTAUTH_SECRET` | Secret key for JWT signing (min 32 chars) | ✅ |
| `NEXTAUTH_URL` | Base URL of your application | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |
| `SMTP_HOST` | SMTP server hostname | ✅ |
| `SMTP_PORT` | SMTP server port | ✅ |
| `SMTP_USER` | SMTP username/email | ✅ |
| `SMTP_PASS` | SMTP password/app password | ✅ |
| `SMTP_FROM` | From email address | ✅ |

---

## 🌐 Deployment Options

### Option 1: Vercel Deployment (Recommended)

Vercel provides the easiest deployment for Next.js applications.

#### Steps:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Import your repository
   - Configure project settings

3. **Set Environment Variables**
   - In Vercel dashboard, go to Project Settings
   - Navigate to Environment Variables
   - Add all required environment variables
   - Make sure to set `NEXTAUTH_URL` to your Vercel domain

4. **Deploy**
   - Vercel will automatically deploy on every push to main branch
   - Monitor deployment logs for any issues

#### Vercel Configuration

Create `vercel.json` in root directory:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Option 2: Railway Deployment

Railway offers easy deployment with built-in database options.

#### Steps:

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository

2. **Configure Environment**
   - Add all environment variables in Railway dashboard
   - Railway can provide MongoDB if needed

3. **Deploy**
   - Railway automatically builds and deploys
   - Custom domain can be configured

### Option 3: DigitalOcean App Platform

#### Steps:

1. **Create App**
   - Go to DigitalOcean App Platform
   - Connect your repository

2. **Configure Build Settings**
   ```yaml
   name: loan-management-system
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/loan-management-system
       branch: main
     run_command: npm start
     build_command: npm run build
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
   ```

3. **Set Environment Variables**
   - Add all required environment variables
   - Configure custom domain

### Option 4: Self-Hosted VPS

For complete control, deploy on your own VPS.

#### Requirements:
- Ubuntu 20.04+ or similar Linux distribution
- 2GB+ RAM
- 20GB+ storage
- Node.js 18+
- PM2 for process management
- Nginx for reverse proxy

#### Steps:

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/loan-management-system.git
   cd loan-management-system
   
   # Install dependencies
   npm install
   
   # Create environment file
   cp .env.example .env.local
   # Edit .env.local with your values
   
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start npm --name "loan-app" -- start
   pm2 save
   pm2 startup
   ```

3. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/loan-app
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/loan-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **SSL Certificate (Let's Encrypt)**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx -y
   
   # Get certificate
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 🗄️ Database Setup

### MongoDB Atlas (Cloud)

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create new cluster
   - Choose appropriate tier

2. **Configure Access**
   - Add IP addresses to whitelist
   - Create database user
   - Get connection string

3. **Initialize Database**
   ```bash
   # The application will create collections automatically
   # No manual database setup required
   ```

### Local MongoDB

1. **Install MongoDB**
   ```bash
   # Ubuntu
   sudo apt install mongodb -y
   
   # macOS
   brew install mongodb-community
   
   # Windows
   # Download from mongodb.com
   ```

2. **Start MongoDB**
   ```bash
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   ```

---

## 📧 Email Service Setup

### Gmail SMTP

1. **Enable 2FA** on your Gmail account
2. **Generate App Password**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"

3. **Configure Environment**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-digit-app-password
   ```

### SendGrid

1. **Create Account** at [SendGrid](https://sendgrid.com)
2. **Generate API Key**
3. **Configure Environment**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

---

## 🔧 Post-Deployment Checklist

### Security
- [ ] All environment variables are set correctly
- [ ] HTTPS is enabled with valid SSL certificate
- [ ] Database access is restricted to application only
- [ ] SMTP credentials are secure (app passwords, not main passwords)
- [ ] Cloudinary API keys are properly configured

### Functionality
- [ ] User registration works
- [ ] Email sending works (test with forgot password)
- [ ] File upload works (test document upload)
- [ ] Database connections are stable
- [ ] All API endpoints respond correctly

### Performance
- [ ] Application loads quickly
- [ ] Database queries are optimized
- [ ] File uploads complete successfully
- [ ] Chat system works in real-time

### Monitoring
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Configure uptime monitoring
- [ ] Set up database backups
- [ ] Monitor application logs

---

## 🔄 Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf .next
   npm run build
   ```

2. **Database Connection Issues**
   - Check MongoDB URI format
   - Verify network connectivity
   - Check firewall settings

3. **Email Not Sending**
   - Verify SMTP credentials
   - Check spam folders
   - Test with different email providers

4. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper CORS settings

### Logs and Debugging

```bash
# Check application logs (PM2)
pm2 logs loan-app

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check system logs
sudo journalctl -u nginx -f
```

---

## 📞 Support

For deployment support:
- Check the troubleshooting section
- Review environment variable configuration
- Verify all external service credentials
- Contact the development team with specific error messages

---

**🎉 Congratulations! Your Loan Management System is now deployed and ready for production use.**
