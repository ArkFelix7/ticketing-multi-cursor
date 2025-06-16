# Ticketing System Platform

## Overview

This project is a ticketing system platform designed for multiple companies, allowing them to manage their support tickets efficiently. The platform will utilize Firebase for authentication and will support mailbox ingestion from various email providers. The UI will be inspired by the provided demo codebase.

## Functional Deliverables

### 1. Authentication
- **Firebase Authentication**: 
  - Multi-company support where each company has its own isolated environment.
  - URL structure: `www.abc.com/company-1`, `www.abc.com/company-2`.
  - Companies can sign up and send invites to their employees.
  - Employees can sign in only if they have been invited.

### 2. Mailbox Ingestion
- **Connect Multiple Mailboxes**: 
  - Support for IMAP, Gmail API, Exchange, and SMTP.
  - Parse To/Cc headers and store raw MIME data.

### 3. Ticket Management
- **Ticket ID Generation**: 
  - Auto-generate unique ticket references (e.g., TCK-0001).
  
- **Auto-Reply + CC**: 
  - Send replies from a default support address.
  - Include 3-4 predefined CC recipients on every reply.

### 4. User Interface
- **Inbox UI**: 
  - Web interface listing raw incoming emails (sender, subject, timestamp).
  
- **Ticket List UI**: 
  - Dashboard showing Ticket ID, Subject, Status, Priority, Created At.
  
- **Ticket Detail & Reply UI**: 
  - View original email thread, reply form, display CC list and history.
  
- **Settings UI**: 
  - Configure default “From” address, CC recipient list, and mailbox connections.

### 5. Recommendations
- **CC & Assignee Recommendation**: 
  - Implement basic rule-based logic to suggest CC and assignment for new tickets.

## Screen Flow
1. **Login**
2. **Inbox** (raw emails)
3. **Tickets** (list view)
4. **Ticket Detail** (view + reply + CC/assignment suggestions)
5. **Settings**
6. **(Add others if required)**

## Project Setup

### Prerequisites
- Node.js (version X.X.X)
- Firebase account
- Access to email services (IMAP/Gmail API/Exchange/SMTP)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/ticketing-system.git
   cd ticketing-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project.
   - Enable Firebase Authentication.
   - Configure Firestore or Realtime Database as needed.

4. Configure environment variables:
   - Create a `.env` file in the root directory and add your Firebase configuration and email service credentials.

5. Run the application:
   ```bash
   npm start
   ```

### Development
- Follow the structure of the demo codebase for UI components.
- Ensure that all components are reusable and maintainable.

## Contribution
- Contributions are welcome! Please create a pull request for any changes or enhancements.

## License
- This project is licensed under the MIT License.

## Contact
- For any questions or issues, please contact [Your Name] at [Your Email].


## Progress & Migration Status

### Completed
- Installed and configured dependencies: Prisma, Supabase, Firebase Authentication SDKs
- Defined Prisma schema (`prisma/schema.prisma`) with `User`, `Company`, and `Ticket` models
- Set up Prisma client in `lib/prisma.ts`
- Created Supabase client in `lib/supabase.ts`
- Implemented data-service layer (`lib/data-service.ts`) for hybrid Firebase Auth + Prisma database operations
- Migrated registration form (`app/(auth)/register/page.tsx`) to use `createUserAccount` and `createCompany` functions

### Current Issues
- Registration flow fails in the browser with the error:
  [31mError: PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in ``)[0m
- The registration page remains stuck on **Registering...** due to PrismaClient bundling error

### Next Steps
1. Refactor database calls to server-side: move Prisma operations into Next.js API routes (`app/api/auth/register/route.ts`)
2. Ensure `PrismaClient` is only instantiated in Node.js (server) environment and not in client bundles
3. Push Prisma schema to Supabase database: `npx prisma db push`
4. Test end-to-end registration flow once server-side endpoints are in place
5. Migrate other Firestore-based pages (`tickets`, `settings`, `inbox`) to use the new data-service layer
6. Remove all Firestore dependencies after migration is complete
7. Deploy to staging environment for QA and verification