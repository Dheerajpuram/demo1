# 🚀 Supabase Setup Guide

This guide explains how to set up Supabase for your Telecom Device Management System when you're ready to switch from PostgreSQL to Supabase.

## 📋 Prerequisites

- Supabase account (sign up at [supabase.com](https://supabase.com))
- Supabase CLI installed (`npm install -g supabase`)
- Node.js and npm installed

## 🛠️ Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `telecom-device-management`
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
5. Click "Create new project"
6. Wait for the project to be ready (usually 2-3 minutes)

### 2. Get Project Credentials

1. Go to your project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 3. Update Environment Variables

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Update the `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Initialize Supabase Locally

1. Initialize Supabase in your project:
   ```bash
   supabase init
   ```

2. Link to your remote project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Copy the migration file:
   ```bash
   cp supabase/migrations/20250101000000_initial_schema.sql supabase/migrations/
   ```

### 5. Run Database Migration

1. Apply the migration to your Supabase database:
   ```bash
   supabase db push
   ```

2. Or run the SQL directly in the Supabase SQL Editor:
   - Go to **SQL Editor** in your Supabase dashboard
   - Copy and paste the contents of `supabase/migrations/20250101000000_initial_schema.sql`
   - Click "Run"

### 6. Deploy Edge Functions (Optional)

If you want to use the advanced analytics functions:

1. Deploy the device utilization function:
   ```bash
   supabase functions deploy device-utilization
   ```

2. Deploy the device alerts function:
   ```bash
   supabase functions deploy device-alerts
   ```

### 7. Update Your Application

To switch from PostgreSQL to Supabase:

1. **Install Supabase dependencies**:
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Update your API service**:
   - Replace `src/lib/api-service.ts` with `src/lib/supabase-api-service.ts`
   - Or gradually migrate by updating imports

3. **Update authentication**:
   - Replace `src/contexts/AuthContext.tsx` with `src/contexts/SupabaseAuthContext.tsx`
   - Update your App.tsx to use the new context

4. **Update environment variables**:
   - Make sure your `.env` file has the correct Supabase credentials

## 🔧 Configuration

### Row Level Security (RLS)

The migration includes basic RLS policies. You may want to customize them based on your needs:

1. Go to **Authentication** → **Policies** in your Supabase dashboard
2. Review and modify the policies for each table
3. Consider adding more specific policies based on user roles

### Real-time Subscriptions

The Supabase setup includes real-time subscriptions for:
- Device changes
- Utilization log updates
- Alert notifications

To use them, import the subscription functions from `src/lib/supabase.ts`:

```typescript
import { subscribeToDevices, subscribeToUtilizationLogs } from '../lib/supabase'

// Subscribe to device changes
const subscription = subscribeToDevices((payload) => {
  console.log('Device changed:', payload)
})
```

### Storage (Optional)

If you want to add file uploads (device images, documents):

1. Go to **Storage** in your Supabase dashboard
2. Create buckets:
   - `device-images` (public)
   - `documents` (private)
3. Update the storage policies as needed

## 🚀 Advanced Features

### Edge Functions

The included Edge Functions provide:

1. **Device Utilization Analytics** (`device-utilization`):
   - Utilization trends over time
   - Device efficiency metrics
   - Peak usage patterns
   - Utilization summary

2. **Automated Alerts** (`device-alerts`):
   - Low/high utilization alerts
   - Maintenance due alerts
   - End-of-life warnings
   - Automated alert generation

### Usage Examples

```typescript
// Get utilization trends
const response = await fetch('/functions/v1/device-utilization?action=utilization-trends')
const data = await response.json()

// Generate all alerts
const response = await fetch('/functions/v1/device-alerts?action=generate-alerts')
const data = await response.json()
```

## 🔄 Migration Strategy

### Gradual Migration

1. **Phase 1**: Set up Supabase alongside PostgreSQL
2. **Phase 2**: Migrate read operations to Supabase
3. **Phase 3**: Migrate write operations to Supabase
4. **Phase 4**: Remove PostgreSQL dependencies

### Data Migration

To migrate existing data from PostgreSQL to Supabase:

1. Export data from PostgreSQL:
   ```bash
   pg_dump -h localhost -U postgres -d telecom_device_management > backup.sql
   ```

2. Transform the data to match Supabase schema
3. Import using Supabase dashboard or API

## 🛡️ Security Considerations

1. **API Keys**: Never commit your service role key to version control
2. **RLS Policies**: Review and test all Row Level Security policies
3. **CORS**: Configure CORS settings for your domain
4. **Rate Limiting**: Consider implementing rate limiting for API calls

## 📊 Monitoring

1. **Database**: Monitor database performance in the Supabase dashboard
2. **API**: Check API usage and limits
3. **Functions**: Monitor Edge Function execution and logs
4. **Auth**: Track authentication events and user activity

## 🆘 Troubleshooting

### Common Issues

1. **Connection Issues**:
   - Check your project URL and API keys
   - Verify your project is active and not paused

2. **Migration Errors**:
   - Check the SQL syntax in the migration file
   - Ensure all required extensions are enabled

3. **RLS Issues**:
   - Test policies with different user roles
   - Check if policies are properly enabled

4. **Function Deployment**:
   - Ensure you're logged in to Supabase CLI
   - Check function logs for errors

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## 🎉 You're Ready!

Once you've completed these steps, your Telecom Device Management System will be running on Supabase with:

- ✅ Real-time database updates
- ✅ Built-in authentication
- ✅ Row Level Security
- ✅ Edge Functions for advanced analytics
- ✅ Automated alert generation
- ✅ File storage capabilities
- ✅ Scalable infrastructure

Happy coding! 🚀
