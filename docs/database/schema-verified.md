# NafasDB schema — SSMS-verified summary

> **Verification reported by the project owner from SSMS.** The reported live database has 18 tables and 110 columns; Primary Keys, Unique Constraints, Foreign Keys, indexes, and CHECK constraints were reviewed, and all inspected Foreign Keys are enabled and trusted. This detailed reference is aligned to `database-data.js`, which contains 18 tables, 110 columns, and 24 documented relationships. The SSMS catalog export was not provided, so individual names, definitions, and index details below have not been independently reconciled against that output. Treat this as the verified schema reference subject to that limitation.

## Summary

- Database name: `NafasDB`.
- SSMS-reported totals: **18 tables** and **110 columns**; documented relationships: **24**.
- SSMS-reported review: Primary Keys, Unique Constraints, Foreign Keys, indexes, and CHECK constraints; all inspected FKs enabled and trusted.
- Key/index names and FK constraint names are not stored consistently in the model. Names shown only when explicitly present in the model.
- Column types, nullability, constraints, and index details below reproduce the documentation model and await a line-by-line comparison with the SSMS catalog export.

## Identity & access

### Tables

#### `dbo.Roles`

The four supported platform roles.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `RoleID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `RoleName` | `nvarchar(30)` | NOT NULL | UQ |  |

**Primary key:** `RoleID`.
**Unique constraint documented:** `UQ_Roles_RoleName` on `RoleName`.
**CHECK documented:** `CK_Roles_RoleName` — `RoleName IN (N'Personal User', N'Family Member', N'Therapist', N'Admin')`.

#### `dbo.Users`

Account identity, role, password hash, and account status.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `UserID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `RoleID` | `int` | NOT NULL | FK |  |
| `Email` | `nvarchar(254)` | NOT NULL | UQ |  |
| `PasswordHash` | `nvarchar(255)` | NOT NULL | — |  |
| `DisplayName` | `nvarchar(100)` | NOT NULL | — |  |
| `AccountStatus` | `nvarchar(20)` | NOT NULL | — | DEFAULT (N'Active') |
| `CreatedAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |
| `UpdatedAt` | `datetime2` | NULL | — |  |

**Primary key:** `UserID`.
**Unique constraint documented:** `UQ_Users_Email` on `Email`.
**CHECK documented:** `CK_Users_AccountStatus` — `AccountStatus IN (N'Active', N'Suspended', N'Closed')`.

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `RoleID` → `dbo.Roles.RoleID` (has role)

## Therapist review

### Tables

#### `dbo.TherapistApplications`

One submitted application version for a therapist.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `ApplicationID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `TherapistUserID` | `int` | NOT NULL | FK |  |
| `ApplicationNumber` | `int` | NOT NULL | — |  |
| `ProfessionalTitle` | `nvarchar(100)` | NOT NULL | — |  |
| `Specialization` | `nvarchar(120)` | NOT NULL | — |  |
| `ExperienceSummary` | `nvarchar(1500)` | NULL | — |  |
| `SubmittedAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |

**Primary key:** `ApplicationID`.
**Unique constraint documented:** `UQ_TherapistApplications_User_ApplicationNumber` on `TherapistUserID`, `ApplicationNumber`.
**CHECK documented:** `CK_TherapistApplications_ApplicationNumber` — `ApplicationNumber > 0`.

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `TherapistUserID` → `dbo.Users.UserID` (submitted by)

#### `dbo.TherapistApplicationStatusHistory`

Append-only status events for each therapist application.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `ApplicationStatusHistoryID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `ApplicationID` | `int` | NOT NULL | FK |  |
| `ApplicationStatus` | `nvarchar(20)` | NOT NULL | — |  |
| `ChangedAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |
| `ChangedByAdminUserID` | `int` | NULL | FK |  |
| `ReviewNotes` | `nvarchar(1000)` | NULL | — |  |

**Primary key:** `ApplicationStatusHistoryID`.
**CHECK documented:** `CK_TherapistApplicationStatusHistory_Status` — `ApplicationStatus IN (N'Pending', N'Approved', N'Rejected')`.
**CHECK documented:** `CK_TherapistApplicationStatusHistory_Reviewer` — `(ApplicationStatus = N'Pending' AND ChangedByAdminUserID IS NULL) OR (ApplicationStatus IN (N'Approved', N'Rejected') AND ChangedByAdminUserID IS NOT NULL)`.

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `ApplicationID` → `dbo.TherapistApplications.ApplicationID` (records status for)
- `ChangedByAdminUserID` → `dbo.Users.UserID` (reviewed by (optional))

#### `dbo.TherapistCredentials`

Qualifications and certificate metadata tied to an application; files are stored externally.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `CredentialID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `ApplicationID` | `int` | NOT NULL | FK |  |
| `CredentialType` | `nvarchar(30)` | NOT NULL | — |  |
| `CredentialName` | `nvarchar(200)` | NOT NULL | — |  |
| `IssuingOrganization` | `nvarchar(200)` | NULL | — |  |
| `CredentialReference` | `nvarchar(100)` | NULL | — |  |
| `IssueDate` | `date` | NULL | — |  |
| `FileReference` | `nvarchar(500)` | NULL | — |  |
| `FileName` | `nvarchar(255)` | NULL | — |  |
| `ContentType` | `nvarchar(100)` | NULL | — |  |
| `FileSizeBytes` | `bigint` | NULL | — |  |
| `UploadedAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |

**Primary key:** `CredentialID`.
**CHECK documented:** `CK_TherapistCredentials_CredentialType` — `CredentialType IN (N'Qualification', N'Certificate')`.
**CHECK documented:** `CK_TherapistCredentials_FileSize` — `FileSizeBytes IS NULL OR FileSizeBytes >= 0`.

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `ApplicationID` → `dbo.TherapistApplications.ApplicationID` (submitted with)

## Personal wellness

### Tables

#### `dbo.MoodEntries`

Private mood check-ins owned by a user.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `MoodEntryID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `UserID` | `int` | NOT NULL | FK |  |
| `MoodValue` | `nvarchar(10)` | NOT NULL | — |  |
| `Reflection` | `nvarchar(1000)` | NULL | — |  |
| `RecordedAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |

**Primary key:** `MoodEntryID`.
**CHECK documented:** `CK_MoodEntries_MoodValue` — `MoodValue IN (N'Great', N'Good', N'Okay', N'Low', N'Anxious')`.

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `UserID` → `dbo.Users.UserID` (owned by)

#### `dbo.JournalEntries`

Private journal entries; family members must never access them.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `JournalEntryID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `UserID` | `int` | NOT NULL | FK |  |
| `EntryDate` | `date` | NOT NULL | — |  |
| `Title` | `nvarchar(150)` | NULL | — |  |
| `EntryText` | `nvarchar(max)` | NOT NULL | — |  |
| `CreatedAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |
| `UpdatedAt` | `datetime2` | NULL | — |  |

**Primary key:** `JournalEntryID`.

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `UserID` → `dbo.Users.UserID` (owned by (private))


#### `dbo.ActivityEntries`

User-owned activities used to calculate a rolling seven-day Activity Summary.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `ActivityEntryID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `UserID` | `int` | NOT NULL | FK |  |
| `ActivityName` | `nvarchar(150)` | NOT NULL | — |  |
| `ActivityDate` | `date` | NOT NULL | — |  |
| `IsCompleted` | `bit` | NOT NULL | — | DEFAULT (0) |
| `CompletedAt` | `datetime2` | NULL | — |  |
| `RecordedAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |

**Primary key:** `ActivityEntryID`.

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `UserID` → `dbo.Users.UserID` (owned by)


## Connections & requests

### Tables

#### `dbo.FamilyConnections`

A Family Member's request or connection to a Personal User.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `ConnectionID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `FamilyUserID` | `int` | NOT NULL | FK |  |
| `PersonalUserID` | `int` | NOT NULL | FK |  |
| `ConnectionStatus` | `nvarchar(20)` | NOT NULL | — |  |
| `RequestedAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |
| `RespondedAt` | `datetime2` | NULL | — |  |

**Primary key:** `ConnectionID`.
**CHECK documented:** `CK_FamilyConnections_Status` — `ConnectionStatus IN (N'Pending', N'Accepted', N'Rejected', N'Cancelled', N'Revoked')`.
**CHECK documented:** `CK_FamilyConnections_NotSelf` — `FamilyUserID <> PersonalUserID`.

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `FamilyUserID` → `dbo.Users.UserID` (requested by family member)
- `PersonalUserID` → `dbo.Users.UserID` (requested for personal user)

#### `dbo.SharingCategories`

The only family-shareable categories: Mood Summary and Activity Summary.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `SharingCategoryID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `CategoryName` | `nvarchar(40)` | NOT NULL | UQ |  |

**Primary key:** `SharingCategoryID`.
**Unique constraint documented:** `UQ_SharingCategories_CategoryName` on `CategoryName`.
**CHECK documented:** `CK_SharingCategories_CategoryName` — `CategoryName IN (N'Mood Summary', N'Activity Summary')`.

#### `dbo.FamilySharingConsentHistory`

Append-only consent events; current consent is the latest event per connection and category.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `ConsentEventID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `ConnectionID` | `int` | NOT NULL | FK |  |
| `SharingCategoryID` | `int` | NOT NULL | FK |  |
| `ConsentAction` | `nvarchar(10)` | NOT NULL | — |  |
| `ChangedAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |
| `ChangedByUserID` | `int` | NOT NULL | FK |  |

**Primary key:** `ConsentEventID`.
**CHECK documented:** `CK_FamilySharingConsentHistory_Action` — `ConsentAction IN (N'Enabled', N'Revoked')`.

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `ConnectionID` → `dbo.FamilyConnections.ConnectionID` (consent for connection)
- `SharingCategoryID` → `dbo.SharingCategories.SharingCategoryID` (consent for category)
- `ChangedByUserID` → `dbo.Users.UserID` (changed by personal user)

#### `dbo.ConsultationRequests`

A request for therapist follow-up, not a confirmed appointment.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `ConsultationRequestID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `PersonalUserID` | `int` | NOT NULL | FK |  |
| `TherapistUserID` | `int` | NOT NULL | FK |  |
| `Topic` | `nvarchar(120)` | NULL | — |  |
| `Message` | `nvarchar(1000)` | NULL | — |  |
| `PreferredDateTime` | `datetime2` | NULL | — |  |
| `RequestStatus` | `nvarchar(20)` | NOT NULL | — | DEFAULT (N'Pending') |
| `CreatedAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |
| `UpdatedAt` | `datetime2` | NULL | — |  |

**Primary key:** `ConsultationRequestID`.
**CHECK documented:** `CK_ConsultationRequests_Status` — `RequestStatus IN (N'Pending', N'Accepted', N'Declined', N'Withdrawn')`.
**CHECK documented:** `CK_ConsultationRequests_NotSelf` — `PersonalUserID <> TherapistUserID`.

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `PersonalUserID` → `dbo.Users.UserID` (requested by)
- `TherapistUserID` → `dbo.Users.UserID` (requested with therapist)

## AI conversations

### Tables

#### `dbo.ChatSessions`

Private AI conversation sessions owned by one Personal User.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `ChatSessionID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `PersonalUserID` | `int` | NOT NULL | FK |  |
| `CreatedAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |
| `EndedAt` | `datetime2` | NULL | — |  |

**Primary key:** `ChatSessionID`.
**CHECK documented:** `CK_ChatSessions_EndAfterCreation` — `EndedAt IS NULL OR EndedAt >= CreatedAt`.

**Indexes documented:**
- `IX_ChatSessions_PersonalUser_CreatedAt`: documented on `PersonalUserID`, `CreatedAt`; index type is not specified in the model

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `PersonalUserID` → `dbo.Users.UserID` (owned by Personal User)

#### `dbo.ChatMessages`

User and AI messages in a private chat session.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `ChatMessageID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `ChatSessionID` | `int` | NOT NULL | FK |  |
| `SenderType` | `nvarchar(10)` | NOT NULL | — |  |
| `MessageContent` | `nvarchar(max)` | NOT NULL | — |  |
| `SentAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |

**Primary key:** `ChatMessageID`.
**CHECK documented:** `CK_ChatMessages_SenderType` — `SenderType IN (N'User', N'AI')`.

**Indexes documented:**
- `IX_ChatMessages_Session_SentAt`: documented on `ChatSessionID`, `SentAt`; index type is not specified in the model

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `ChatSessionID` → `dbo.ChatSessions.ChatSessionID` (contains messages)

## Support groups

### Tables

#### `dbo.SupportGroups`

A support group with one assigned, approved Therapist Leader.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `SupportGroupID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `GroupName` | `nvarchar(120)` | NOT NULL | — |  |
| `Description` | `nvarchar(1000)` | NULL | — |  |
| `LeaderTherapistID` | `int` | NOT NULL | FK |  |
| `GroupStatus` | `nvarchar(10)` | NOT NULL | — | DEFAULT (N'Active') |
| `CreatedAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |

**Primary key:** `SupportGroupID`.
**CHECK documented:** `CK_SupportGroups_Status` — `GroupStatus IN (N'Active', N'Closed')`.

**Indexes documented:**
- `IX_SupportGroups_Status`: documented on `GroupStatus`; index type is not specified in the model
- `IX_SupportGroups_Leader`: documented on `LeaderTherapistID`; index type is not specified in the model

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `LeaderTherapistID` → `dbo.Users.UserID` (led by Therapist)

#### `dbo.SupportGroupMemberships`

One membership period for a Personal User in a support group; rejoining creates a new period.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `MembershipID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `SupportGroupID` | `int` | NOT NULL | FK |  |
| `PersonalUserID` | `int` | NOT NULL | FK |  |
| `MembershipStartAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |
| `MembershipEndAt` | `datetime2` | NULL | — |  |

**Primary key:** `MembershipID`.
**CHECK documented:** `CK_SupportGroupMemberships_EndAfterStart` — `MembershipEndAt IS NULL OR MembershipEndAt > MembershipStartAt`.

**Indexes documented:**
- `UX_SupportGroupMemberships_Active_Group_User`: UNIQUE on `SupportGroupID`, `PersonalUserID`; filter `MembershipEndAt IS NULL`; index type is not specified in the model
- `IX_SupportGroupMemberships_Group_User_Period`: documented on `SupportGroupID`, `PersonalUserID`, `MembershipStartAt`, `MembershipEndAt`; index type is not specified in the model

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `SupportGroupID` → `dbo.SupportGroups.SupportGroupID` (membership in group)
- `PersonalUserID` → `dbo.Users.UserID` (Personal User member)

#### `dbo.SupportGroupMessages`

Messages sent by a group member during a membership period or by that group's Therapist Leader.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `SupportGroupMessageID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `SupportGroupID` | `int` | NOT NULL | FK |  |
| `MembershipID` | `int` | NULL | FK |  |
| `TherapistLeaderUserID` | `int` | NULL | FK |  |
| `MessageContent` | `nvarchar(max)` | NOT NULL | — |  |
| `SentAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |

**Primary key:** `SupportGroupMessageID`.
**CHECK documented:** `CK_SupportGroupMessages_OneSender` — `(MembershipID IS NOT NULL AND TherapistLeaderUserID IS NULL) OR (MembershipID IS NULL AND TherapistLeaderUserID IS NOT NULL)`.

**Indexes documented:**
- `IX_SupportGroupMessages_Group_SentAt`: documented on `SupportGroupID`, `SentAt`; index type is not specified in the model
- `IX_SupportGroupMessages_Membership_SentAt`: documented on `MembershipID`, `SentAt`; index type is not specified in the model
- `IX_SupportGroupMessages_Leader_SentAt`: documented on `TherapistLeaderUserID`, `SentAt`; index type is not specified in the model

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `SupportGroupID` → `dbo.SupportGroups.SupportGroupID` (posted in group)
- `MembershipID` → `dbo.SupportGroupMemberships.MembershipID` (sent by member (optional))
- `TherapistLeaderUserID` → `dbo.Users.UserID` (sent by Therapist Leader (optional))

## Therapist sessions

### Tables

#### `dbo.TherapistSessions`

A scheduled or completed therapist appointment linked to an accepted consultation request.

| Column | SQL Server type | Nullability | Keys | Identity / default |
|---|---|---|---|---|
| `TherapistSessionID` | `int` | NOT NULL | PK | IDENTITY(1,1) |
| `ConsultationRequestID` | `int` | NOT NULL | FK |  |
| `SessionStartAt` | `datetimeoffset(0)` | NOT NULL | — |  |
| `SessionEndAt` | `datetimeoffset(0)` | NOT NULL | — |  |
| `SessionStatus` | `nvarchar(20)` | NOT NULL | — | DEFAULT (N'Scheduled') |
| `CreatedAt` | `datetime2` | NOT NULL | — | DEFAULT (SYSDATETIME()) |
| `UpdatedAt` | `datetime2` | NULL | — |  |

**Primary key:** `TherapistSessionID`.
**CHECK documented:** `CK_TherapistSessions_EndAfterStart` — `SessionEndAt > SessionStartAt`.
**CHECK documented:** `CK_TherapistSessions_Status` — `SessionStatus IN (N'Scheduled', N'Completed', N'Cancelled')`.

**Indexes documented:**
- `IX_TherapistSessions_Request_Start`: documented on `ConsultationRequestID`, `SessionStartAt`; index type is not specified in the model
- `IX_TherapistSessions_Start_Status`: documented on `SessionStartAt`, `SessionStatus`; index type is not specified in the model

**Foreign keys / points to (relationship names are not recorded in the data model):**
- `ConsultationRequestID` → `dbo.ConsultationRequests.ConsultationRequestID` (scheduled from request)

## Relationships and cardinality

Notation below follows the relationship metadata in `database-data.js`: source columns are documented FKs; each source table can have many rows per referenced target row. A nullable source FK means each source row can reference zero or one target row. Parent-side optionality and exact SQL FK names are not independently verified.

| FK-side table.column | Referenced table.column | Cardinality (referenced table → FK-side table) | Label |
|---|---|---|---|
| `Users.RoleID` | `Roles.RoleID` | 1 parent per child; 0..M children per parent | has role |
| `TherapistApplications.TherapistUserID` | `Users.UserID` | 1 parent per child; 0..M children per parent | submitted by |
| `TherapistApplicationStatusHistory.ApplicationID` | `TherapistApplications.ApplicationID` | 1 parent per child; 0..M children per parent | records status for |
| `TherapistApplicationStatusHistory.ChangedByAdminUserID` | `Users.UserID` | 0..1 parent per child; 0..M children per parent | reviewed by (optional) |
| `TherapistCredentials.ApplicationID` | `TherapistApplications.ApplicationID` | 1 parent per child; 0..M children per parent | submitted with |
| `MoodEntries.UserID` | `Users.UserID` | 1 parent per child; 0..M children per parent | owned by |
| `JournalEntries.UserID` | `Users.UserID` | 1 parent per child; 0..M children per parent | owned by (private) |
| `ActivityEntries.UserID` | `Users.UserID` | 1 parent per child; 0..M children per parent | owned by |
| `FamilyConnections.FamilyUserID` | `Users.UserID` | 1 parent per child; 0..M children per parent | requested by family member |
| `FamilyConnections.PersonalUserID` | `Users.UserID` | 1 parent per child; 0..M children per parent | requested for personal user |
| `FamilySharingConsentHistory.ConnectionID` | `FamilyConnections.ConnectionID` | 1 parent per child; 0..M children per parent | consent for connection |
| `FamilySharingConsentHistory.SharingCategoryID` | `SharingCategories.SharingCategoryID` | 1 parent per child; 0..M children per parent | consent for category |
| `FamilySharingConsentHistory.ChangedByUserID` | `Users.UserID` | 1 parent per child; 0..M children per parent | changed by personal user |
| `ConsultationRequests.PersonalUserID` | `Users.UserID` | 1 parent per child; 0..M children per parent | requested by |
| `ConsultationRequests.TherapistUserID` | `Users.UserID` | 1 parent per child; 0..M children per parent | requested with therapist |
| `ChatSessions.PersonalUserID` | `Users.UserID` | 1 parent per child; 0..M children per parent | owned by Personal User |
| `ChatMessages.ChatSessionID` | `ChatSessions.ChatSessionID` | 1 parent per child; 0..M children per parent | contains messages |
| `SupportGroups.LeaderTherapistID` | `Users.UserID` | 1 parent per child; 0..M children per parent | led by Therapist |
| `SupportGroupMemberships.SupportGroupID` | `SupportGroups.SupportGroupID` | 1 parent per child; 0..M children per parent | membership in group |
| `SupportGroupMemberships.PersonalUserID` | `Users.UserID` | 1 parent per child; 0..M children per parent | Personal User member |
| `SupportGroupMessages.SupportGroupID` | `SupportGroups.SupportGroupID` | 1 parent per child; 0..M children per parent | posted in group |
| `SupportGroupMessages.MembershipID` | `SupportGroupMemberships.MembershipID` | 0..1 parent per child; 0..M children per parent | sent by member (optional) |
| `SupportGroupMessages.TherapistLeaderUserID` | `Users.UserID` | 0..1 parent per child; 0..M children per parent | sent by Therapist Leader (optional) |
| `TherapistSessions.ConsultationRequestID` | `ConsultationRequests.ConsultationRequestID` | 1 parent per child; 0..M children per parent | scheduled from request |

## Documented constraints and indexes

The project owner reports that Primary Keys, Unique Constraints, Foreign Keys, indexes, and CHECK constraints were reviewed in SSMS, and all inspected Foreign Keys are enabled and trusted. The precise definitions shown here still come from the documentation model because the catalog export was not supplied. Index type and clustered-index choices are not specified by the model. SQL Server permissions, triggers, stored procedures, views, and role/status authorization mechanisms are not established by the reported review.

## Business-rule limits

Foreign keys establish row references, not user roles or authorization. The schema review does not prove Admin-only therapist review, approved-therapist session scheduling, Personal User-only ownership, private journal/chat reads, consent enforcement, or membership-period message filtering. Those remain application/controlled-process requirements and are not claimed as SQL-enforced here.

