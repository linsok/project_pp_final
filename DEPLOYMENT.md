# Room Booking System - Deployment Guide

This guide will walk you through deploying the Room Booking System to Render.com.

## Prerequisites

1. A [GitHub](https://github.com/) account
2. A [Render.com](https://render.com/) account (connected to your GitHub)
3. Git installed on your local machine

## Deployment Steps

### 1. Prepare Your Repository

1. Create a new repository on GitHub
2. Push your code to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_REPOSITORY_URL
   git push -u origin main
   ```

### 2. Deploy to Render.com

1. Log in to your [Render.com](https://dashboard.render.com/) account
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure your web service:
   - **Name**: rupp-room-booking (or your preferred name)
   - **Region**: Choose the one closest to your users
   - **Branch**: main (or your main branch)
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - **Start Command**: `gunicorn config.wsgi:application`

5. Set up environment variables (from the `.env.example` file):
   - Click on the "Environment" tab
   - Add each variable from `.env.example` with your production values
   - Make sure to set `DEPLOY_ENV=production`

6. Click "Create Web Service"

### 3. Set Up Database

1. In the Render Dashboard, click "New +" and select "PostgreSQL"
2. Configure the database:
   - **Name**: rupp-room-db
   - **Database**: rupp_room_db
   - **User**: rupp_room_user
   - **Plan**: Free
   - **Region**: Same as your web service

3. After creation, go to your web service settings and add the `DATABASE_URL` from the PostgreSQL service

### 4. Configure Environment Variables

Make sure these environment variables are set in your Render dashboard:

```
DEBUG=False
SECRET_KEY=your-secure-secret-key
DEPLOY_ENV=production
ALLOWED_HOSTS=.onrender.com
```

### 5. Deploy

1. Push any changes to trigger a new deployment
2. Monitor the build and deployment logs in the Render dashboard

## Post-Deployment

1. Create a superuser to access the admin panel:
   - Go to the "Shell" tab in your Render dashboard
   - Run: `python manage.py createsuperuser`
   - Follow the prompts to create an admin user

2. Access the admin panel at `https://your-app-url.onrender.com/admin/`

## Troubleshooting

- **Static files not loading**: Make sure `collectstatic` ran successfully during build
- **Database connection issues**: Verify your `DATABASE_URL` is correctly set
- **500 errors**: Check the logs in the Render dashboard for detailed error messages

## Maintenance

- **Backups**: Render automatically backs up your database
- **Updates**: Push changes to your repository to trigger new deployments
- **Monitoring**: Use the Render dashboard to monitor your application's health

## Support

For additional help, please contact the development team or refer to the project documentation.
