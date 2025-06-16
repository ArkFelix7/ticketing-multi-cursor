# Email Ticketing System - Setup & Troubleshooting Guide

## Initial Setup

1. **Set up the database**
   ```
   npx prisma migrate dev --name init
   ```

2. **Add the system user (required for automatic ticket creation)**
   ```
   npx ts-node scripts/apply-system-user-migration.ts
   ```

3. **Start the development server**
   ```
   npm run dev
   ```

## Common Issues & Troubleshooting

### Email Processing

- **Issue**: Email received but not converted to ticket
  - Verify the system user exists in database (id = 'system')
  - Check that mailbox is properly connected
  - Review logs for error messages during mail sync

- **Issue**: Ticket creation fails with foreign key constraint error
  - This typically happens if the system user is missing
  - Run the system user migration script: `npx ts-node scripts/apply-system-user-migration.ts`

- **Issue**: Email displayed incorrectly in inbox
  - Verify email structure in database
  - Check if expected fields like `toEmail`, `ccEmail` exist and have proper values

### Database

- **Issue**: Database connection failures
  - Check DATABASE_URL and DIRECT_URL in your environment
  - Verify the database is running and accessible

- **Issue**: Schema mismatch errors
  - Run `npx prisma db push` to synchronize your schema

## Maintaining Email Integration

1. **Regularly check email sync logs** to catch issues early
2. **Monitor mailbox status** in the settings page
3. **Set up auto-retry for failed syncs** to ensure all emails are processed

## Extending the System

To add features like:
- **New email templates**: Update the `sendAutoReply` function in `lib/mailbox-sync.ts`
- **New ticket statuses**: Update the Ticket model in `prisma/schema.prisma`
- **Custom notification rules**: Create a new handler in the mailbox sync process

## Security Notes

- Keep mailbox credentials secure
- Review user permissions regularly
- Use system user only for automated processes
