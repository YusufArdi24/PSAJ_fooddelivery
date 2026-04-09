# Production Authentication Fix - Deployment Guide

## Problem Fixed
- **Error**: `Connection could not be established with host "ssl://smtp.gmail.com:465"`
- **Cause**: SMTP timeout during email verification in early steps of authentication
- **Solution**: Implemented async queue system with fallover strategy

## Changes Made

### 1. **Queue System Enabled**
- Created database queue migration (`create_jobs_table`)
- Configure queue to use failover: `database → deferred → sync`
- This ensures email notifications don't block registration process

### 2. **Mail Configuration Updated**
- Increased timeout from 30s → 90s for more reliable connections
- Fixed port/scheme defaults: port 587 with TLS (not 465 SSL)
- Added failover mailer: tries SMTP, falls back to logging

### 3. **Notification System Async**
- `CustomerVerifyEmail` notification now uses `afterCommit()` for async dispatch
- `Customer::sendEmailVerificationNotification()` wrapped with try-catch
- All email failures logged but don't block auth flow

### 4. **Error Handling**
- Registration succeeds even if email fails to send
- Users can request email resend via endpoint later
- All errors logged to `storage/logs/`

## Deployment Steps

### Step 1: Update Backend
```bash
cd be

# Pull latest code
git pull origin main

# Run queue migration
php artisan migrate

# Clear cache
php artisan config:cache
php artisan cache:clear

# (Optional) Set up queue worker if using Railway
# Add this to your Procfile or start script:
# worker: php artisan queue:work --tries=3 --timeout=600

# Or use: queue:listen for development
```

### Step 2: Verify .env Settings
Ensure in `be/.env` (Railway environment variables):

```env
# Mail Configuration
MAIL_MAILER=smtp
MAIL_SCHEME=tls
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=warungedin@gmail.com
MAIL_PASSWORD=ytiyrvbnvrijgohh
MAIL_TIMEOUT=90

# Queue Configuration
QUEUE_CONNECTION=failover  # or database/sync depending on workers

# Database
DB_QUEUE_CONNECTION=  # use default mysql connection
DB_QUEUE_TABLE=jobs
DB_QUEUE=default
```

### Step 3: Test Locally First
```bash
# Terminal 1: Start Laravel dev server
cd be
php artisan serve

# Terminal 2: Process queue jobs
php artisan queue:listen

# Terminal 3: Run registration flow in frontend
cd fe
npm run dev
```

Test flow:
1. Sign up with email
2. Check if OTP email received (or check `jobs` table)
3. Try Google login
4. Monitor `storage/logs/laravel.log` for errors

## What Happens If SMTP Still Fails

With the new system:
1. ✓ Registration succeeds (customer created)
2. ✓ Email queued to `jobs` table
3. ✓ Queue worker attempts to send (with 3 retries)
4. ✓ If mail server offline → logged but doesn't fail auth
5. ✓ User can:
   - Manually verify later with endpoint: `POST /api/v1/customers/verify-email` 
   - Request OTP resend: `POST /api/v1/pending-registration/resend-otp`

## Monitoring

### Check Queue Status
```bash
# SSH into Railway container
# Check pending jobs
SELECT COUNT(*) FROM jobs;

# Check failed jobs
SELECT * FROM failed_jobs;
```

### Check Logs
```bash
# Follow logs in Railway dashboard or:
tail -f storage/logs/laravel.log | grep -i "mail\|queue\|failed"
```

### Test Email Manually
```bash
# Test SMTP connection in artisan
php artisan tinker
>>> Mail::raw('Test', function($m) { $m->to('test@example.com'); });
```

## Common Issues

### Issue: Queue jobs pile up but not processing
**Solution**: Start queue worker
```bash
# Railway: Add worker process to Procfile
# Heroku / Local: run `php artisan queue:work`
```

### Issue: Still getting SMTP timeout
**Solution**: Possible causes
- Gmail 2FA enabled - use [App Password](https://myaccount.google.com/apppasswords)
- Firewall blocks port 587 - contact Railway support
- Wrong credentials - test in tinker

### Issue: Email still not sent
**Check**: 
1. Logs: `tail storage/logs/laravel.log`
2. Database: `SELECT * FROM failed_jobs`
3. Gmail: Check if blocked as suspicious

## Rollback (If Issues)

```bash
# Revert migrations
php artisan migrate:rollback

# Revert config changes
git checkout be/config/mail.php be/config/queue.php

# Clear cache
php artisan config:cache
```

## Next Steps

1. **Deploy to Production**
2. **Test: Registration → Email verification**
3. **Test: Google login**
4. **Monitor logs for first 24h**
5. **Enable queue worker for better performance**

---

**Questions?** Check:
- `be/config/mail.php` - Mail configuration
- `be/config/queue.php` - Queue configuration  
- `be/app/Models/Customer.php` - Email sending logic
- `be/app/Notifications/CustomerVerifyEmail.php` - Email template
