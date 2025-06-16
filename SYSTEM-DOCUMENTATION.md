# Multi-Tenant Ticketing System Documentation

## Overview

This multi-tenant ticketing system is a comprehensive platform designed to manage support tickets across multiple companies (tenants). The system integrates email-based ticket creation and management with a web interface, providing a centralized solution for customer support teams.

## System Architecture

The platform is built using:
- **Frontend**: Next.js with React and TypeScript
- **Authentication**: Firebase Authentication
- **Database**: PostgreSQL via Supabase
- **Email Integration**: SMTP/IMAP for email processing
- **Hosting**: Deployed on Vercel

## Core Functionality and User Journey

### 1. Authentication & User Management

#### 1.1 User Registration
- New users can register with email and password
- Registration is linked to a specific company (tenant)
- Users provide name, email, and create a password
- System creates a user record in Firebase Authentication
- User profile is stored in the database with company association

#### 1.2 User Login
- Users log in with email and password via Firebase Authentication
- System validates credentials and retrieves user session
- Upon successful login, users are directed to their company dashboard
- JWT tokens are used for session management

#### 1.3 Invitation System
- Company administrators can invite new team members
- System generates a unique invitation token
- Invitation is sent via email with a registration link
- Invited users can register using the invitation link
- Token verification ensures only invited users can join a specific company

### 2. Company (Tenant) Management

#### 2.1 Company Creation
- First user becomes the company administrator
- Company profile includes name, slug (URL identifier), and settings
- Each company operates as a separate tenant in the system

#### 2.2 Company Settings
- Administrators can configure company-specific settings
- Settings include branding, notification preferences, and team management
- User roles and permissions are managed at the company level
- Email configuration options:
  - Auto-reply enable/disable toggle
  - Auto-reply template customization
  - Default outbound email mailbox selection 
  - Employee domain registration for forwarded email identification

### 3. Mailbox Integration

#### 3.1 Mailbox Configuration
- Companies can connect multiple email mailboxes to the system
- Configuration includes IMAP/SMTP server details, credentials
- Support for various email providers (Gmail, Outlook, etc.)
- Secure credential storage for email account access
- Configurable outbound email options:
  - Selection of which mailbox to use for sending responses
  - Configuration of employee email domains to recognize internal forwarded emails

#### 3.2 Email Synchronization
- System regularly syncs with connected mailboxes
- Incoming emails are automatically converted to tickets
- Email threading is maintained through conversation tracking
- Attachments are preserved and accessible in the system

#### 3.3 Email Reply Processing
- Replies to tickets are captured and associated with the original ticket
- System maintains conversation context and threading
- Email responses from the system include ticket references

### 4. Ticket Management

#### 4.1 Ticket Creation
- Tickets can be created via:
  - Incoming emails to connected mailboxes
  - Manual creation through the web interface
  - API integration with other systems
- Each ticket is assigned a unique identifier
- Tickets contain subject, description, priority, status, and assignments
- Tickets track source/origin information (email, web interface, and future channels like WhatsApp)
- System identifies forwarded customer emails from employees to avoid sending auto-replies to internal staff

#### 4.2 Ticket Assignment
- Tickets can be assigned to specific team members
- Auto-assignment rules can be configured
- Team members can claim unassigned tickets
- Assignment changes trigger notifications

#### 4.3 Ticket Handling
- Support agents can update ticket status (Open, In Progress, Resolved, Closed)
- Internal notes can be added (visible only to team)
- Responses can be sent to customers directly from the interface
- Ticket history tracks all actions and communications

#### 4.4 Ticket Organization
- Tickets can be filtered by status, priority, assignment, and more
- Search functionality for finding specific tickets
- Categorization via tags or custom fields
- Views can be customized per user preferences

### 5. Communication Flow

#### 5.1 Email to Ticket Conversion
- Incoming emails create new tickets in the system
- Subject line becomes the ticket title
- Email body becomes the ticket description
- Original sender is recorded as the ticket requester
- Email metadata is preserved for reference

#### 5.2 Ticket Response
- Agents can reply to tickets through the web interface
- Responses are sent as emails to the original requester
- Agents can select which connected mailbox to send the response from
- System maintains email threading and conversation history
- CC addresses are preserved in communications
- Option to automatically CC assigned agent on outgoing emails
- Ability to add additional CC recipients when replying to tickets

#### 5.3 Automated Notifications & Auto-Reply System
- System sends notifications for ticket updates
- Notifications include ticket status changes, replies, and assignments
- Notification preferences can be configured per user
- Email templates are used for consistent communication
- Configurable auto-reply system with:
  - Enable/disable toggle for auto-replies
  - Customizable auto-reply templates
  - Ability to exclude company email addresses from auto-replies
  - Option to automatically CC assigned agents on outgoing emails

### 6. Dashboard and Reporting

#### 6.1 Dashboard
- Overview of ticket volume, status, and response times
- Quick access to unassigned and recently updated tickets
- Performance metrics for team and individual agents
- Activity feed showing recent system actions

#### 6.2 Reporting
- Ticket volume reports by time period
- Response time and resolution time metrics
- Agent performance statistics
- Custom report generation capabilities

## Technical Implementation Details

### Authentication Flow

1. User registers or logs in via Firebase Authentication
2. System verifies credentials and establishes session
3. JWT token is issued for authenticated API requests
4. Session management handles token refresh and expiration

### Email Processing Pipeline

1. Scheduler triggers regular mailbox synchronization
2. System connects to mailboxes via IMAP
3. New emails are identified and processed
4. System analyzes email headers to identify:
   - Forwarded emails from company employees
   - Original customer email addresses in forwarded emails
   - CC recipients that need to be preserved
5. Email content is parsed and converted to tickets
6. Tickets are tagged with source/origin information
7. Replies are matched to existing tickets via references
8. Auto-reply settings are checked (enabled/disabled)
9. If auto-reply is enabled, appropriate template is selected
10. Outgoing responses and auto-replies are sent via configured SMTP mailbox
11. Assigned agent is optionally added as CC to outbound emails

### Database Schema

The system utilizes a relational database structure with the following core entities:

- **Users**: User accounts and authentication details
- **Companies**: Tenant information and settings
- **Mailboxes**: Email account configurations
- **Tickets**: Support request details and metadata, including source/origin
- **Messages**: Individual communications within tickets
- **Attachments**: Files associated with tickets or messages
- **EmailTemplates**: Customizable templates for auto-replies and notifications
- **CompanySettings**: Company-specific configuration, including auto-reply settings
- **EmployeeDomains**: Registered employee email domains for forwarded email detection

### API Structure

The system provides RESTful APIs for:

- User management (`/api/auth/*`)
- Company management (`/api/companies/*`)
- Mailbox configuration (`/api/mailbox/*`)
- Ticket operations (`/api/tickets/*`)
- Settings management (`/api/settings/*`)

## Security Considerations

- Authentication via Firebase with secure JWT handling
- Encrypted storage of email credentials
- Role-based access control for company data
- Data isolation between tenants
- Input validation and sanitization
- HTTPS for all communications
- Rate limiting on sensitive operations

## Deployment Architecture

- Next.js application deployed on Vercel
- Database hosted on Supabase
- Static assets served via Vercel's CDN
- Environment variables for configuration management
- Connection pooling for database efficiency

## Integration Points

- Firebase Authentication for user management
- Supabase for database operations
- SMTP/IMAP for email processing
- Optional integrations with:
  - File storage services
  - Notification services
  - Analytics platforms

## Future Enhancement Possibilities

- Mobile application integration
- Knowledge base and self-service portal
- AI-powered ticket categorization and routing
- Advanced automation and workflow rules
- SLA management and enforcement
- Integration with additional communication channels:
  - WhatsApp Business API integration
  - Live chat widget for websites
  - Social media messaging platforms
- Advanced reporting and analytics dashboard
- Expanded multi-channel ticket source tracking
- Advanced template management for different communication channels

---

This documentation provides a comprehensive overview of the multi-tenant ticketing system, detailing the functionality, user journey, and technical implementation aspects of the platform.
