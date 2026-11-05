CREATE DATABASE NafasDB;

USE NafasDB;
GO

CREATE TABLE dbo.Roles
(
    RoleID int IDENTITY(1,1) NOT NULL,
    RoleName nvarchar(30) NOT NULL,

    CONSTRAINT PK_Roles
        PRIMARY KEY (RoleID),

    CONSTRAINT UQ_Roles_RoleName
        UNIQUE (RoleName),

    CONSTRAINT CK_Roles_RoleName
        CHECK (RoleName IN (N'Personal User', N'Family Member', N'Therapist', N'Admin'))
);
GO

SELECT name
FROM sys.tables
WHERE name = N'Roles';

USE NafasDB;
GO

CREATE TABLE dbo.Users
(
    UserID int IDENTITY(1,1) NOT NULL,
    RoleID int NOT NULL,
    Email nvarchar(254) NOT NULL,
    PasswordHash nvarchar(255) NOT NULL,
    DisplayName nvarchar(100) NOT NULL,
    AccountStatus nvarchar(20) NOT NULL
        CONSTRAINT DF_Users_AccountStatus DEFAULT (N'Active'),
    CreatedAt datetime2 NOT NULL
        CONSTRAINT DF_Users_CreatedAt DEFAULT (SYSDATETIME()),
    UpdatedAt datetime2 NULL,

    CONSTRAINT PK_Users
        PRIMARY KEY (UserID),

    CONSTRAINT FK_Users_Roles
        FOREIGN KEY (RoleID) REFERENCES dbo.Roles(RoleID),

    CONSTRAINT UQ_Users_Email
        UNIQUE (Email),

    CONSTRAINT CK_Users_AccountStatus
        CHECK (AccountStatus IN (N'Active', N'Suspended', N'Closed'))
);
GO

USE NafasDB;
GO

SELECT name
FROM sys.tables
WHERE name = N'Users';

USE NafasDB;
GO

CREATE TABLE dbo.TherapistApplications
(
    ApplicationID int IDENTITY(1,1) NOT NULL,
    TherapistUserID int NOT NULL,
    ApplicationNumber int NOT NULL,
    ProfessionalTitle nvarchar(100) NOT NULL,
    Specialization nvarchar(120) NOT NULL,
    ExperienceSummary nvarchar(1500) NULL,
    SubmittedAt datetime2 NOT NULL
        CONSTRAINT DF_TherapistApplications_SubmittedAt DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_TherapistApplications
        PRIMARY KEY (ApplicationID),

    CONSTRAINT FK_TherapistApplications_Users
        FOREIGN KEY (TherapistUserID) REFERENCES dbo.Users(UserID),

    CONSTRAINT UQ_TherapistApplications_User_ApplicationNumber
        UNIQUE (TherapistUserID, ApplicationNumber),

    CONSTRAINT CK_TherapistApplications_ApplicationNumber
        CHECK (ApplicationNumber > 0)
);
GO

USE NafasDB;
GO

SELECT name
FROM sys.tables
WHERE name = N'TherapistApplications';

USE NafasDB;
GO

CREATE TABLE dbo.TherapistApplicationStatusHistory
(
    ApplicationStatusHistoryID int IDENTITY(1,1) NOT NULL,
    ApplicationID int NOT NULL,
    ApplicationStatus nvarchar(20) NOT NULL,
    ChangedAt datetime2 NOT NULL
        CONSTRAINT DF_TherapistApplicationStatusHistory_ChangedAt
        DEFAULT (SYSDATETIME()),
    ChangedByAdminUserID int NULL,
    ReviewNotes nvarchar(1000) NULL,

    CONSTRAINT PK_TherapistApplicationStatusHistory
        PRIMARY KEY (ApplicationStatusHistoryID),

    CONSTRAINT FK_TherapistApplicationStatusHistory_Applications
        FOREIGN KEY (ApplicationID)
        REFERENCES dbo.TherapistApplications(ApplicationID),

    CONSTRAINT FK_TherapistApplicationStatusHistory_AdminUsers
        FOREIGN KEY (ChangedByAdminUserID)
        REFERENCES dbo.Users(UserID),

    CONSTRAINT CK_TherapistApplicationStatusHistory_Status
        CHECK (ApplicationStatus IN (N'Pending', N'Approved', N'Rejected')),

    CONSTRAINT CK_TherapistApplicationStatusHistory_Reviewer
        CHECK
        (
            (ApplicationStatus = N'Pending' AND ChangedByAdminUserID IS NULL)
            OR
            (ApplicationStatus IN (N'Approved', N'Rejected')
             AND ChangedByAdminUserID IS NOT NULL)
        )
);
GO
USE NafasDB;
GO

SELECT name
FROM sys.tables
WHERE name = N'TherapistApplicationStatusHistory';

USE NafasDB;
GO

CREATE TABLE dbo.TherapistCredentials
(
    CredentialID int IDENTITY(1,1) NOT NULL,
    ApplicationID int NOT NULL,
    CredentialType nvarchar(30) NOT NULL,
    CredentialName nvarchar(200) NOT NULL,
    IssuingOrganization nvarchar(200) NULL,
    CredentialReference nvarchar(100) NULL,
    IssueDate date NULL,
    FileReference nvarchar(500) NULL,
    FileName nvarchar(255) NULL,
    ContentType nvarchar(100) NULL,
    FileSizeBytes bigint NULL,
    UploadedAt datetime2 NOT NULL
        CONSTRAINT DF_TherapistCredentials_UploadedAt DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_TherapistCredentials
        PRIMARY KEY (CredentialID),

    CONSTRAINT FK_TherapistCredentials_Applications
        FOREIGN KEY (ApplicationID)
        REFERENCES dbo.TherapistApplications(ApplicationID),

    CONSTRAINT CK_TherapistCredentials_CredentialType
        CHECK (CredentialType IN (N'Qualification', N'Certificate')),

    CONSTRAINT CK_TherapistCredentials_FileSize
        CHECK (FileSizeBytes IS NULL OR FileSizeBytes >= 0)
);
GO

USE NafasDB;
GO

SELECT name
FROM sys.tables
WHERE name = N'TherapistCredentials';

USE NafasDB;
GO

CREATE TABLE dbo.MoodEntries
(
    MoodEntryID int IDENTITY(1,1) NOT NULL,
    UserID int NOT NULL,
    MoodValue nvarchar(10) NOT NULL,
    Reflection nvarchar(1000) NULL,
    RecordedAt datetime2 NOT NULL
        CONSTRAINT DF_MoodEntries_RecordedAt DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_MoodEntries
        PRIMARY KEY (MoodEntryID),

    CONSTRAINT FK_MoodEntries_Users
        FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID),

    CONSTRAINT CK_MoodEntries_MoodValue
        CHECK (MoodValue IN (N'Great', N'Good', N'Okay', N'Low', N'Anxious'))
);
GO

USE NafasDB;
GO

SELECT name
FROM sys.tables
WHERE name = N'MoodEntries';

USE NafasDB;
GO


-- 7. Private journal entries
CREATE TABLE dbo.JournalEntries
(
    JournalEntryID int IDENTITY(1,1) NOT NULL,
    UserID int NOT NULL,
    EntryDate date NOT NULL,
    Title nvarchar(150) NULL,
    EntryText nvarchar(max) NOT NULL,
    CreatedAt datetime2 NOT NULL
        CONSTRAINT DF_JournalEntries_CreatedAt DEFAULT (SYSDATETIME()),
    UpdatedAt datetime2 NULL,

    CONSTRAINT PK_JournalEntries
        PRIMARY KEY (JournalEntryID),

    CONSTRAINT FK_JournalEntries_Users
        FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID)
);
GO

-- 8. Activity entries
CREATE TABLE dbo.ActivityEntries
(
    ActivityEntryID int IDENTITY(1,1) NOT NULL,
    UserID int NOT NULL,
    ActivityName nvarchar(150) NOT NULL,
    ActivityDate date NOT NULL,
    IsCompleted bit NOT NULL
        CONSTRAINT DF_ActivityEntries_IsCompleted DEFAULT (0),
    CompletedAt datetime2 NULL,
    RecordedAt datetime2 NOT NULL
        CONSTRAINT DF_ActivityEntries_RecordedAt DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_ActivityEntries
        PRIMARY KEY (ActivityEntryID),

    CONSTRAINT FK_ActivityEntries_Users
        FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID)
);
GO

-- 9. Family sharing categories
CREATE TABLE dbo.SharingCategories
(
    SharingCategoryID int IDENTITY(1,1) NOT NULL,
    CategoryName nvarchar(40) NOT NULL,

    CONSTRAINT PK_SharingCategories
        PRIMARY KEY (SharingCategoryID),

    CONSTRAINT UQ_SharingCategories_CategoryName
        UNIQUE (CategoryName),

    CONSTRAINT CK_SharingCategories_CategoryName
        CHECK (CategoryName IN (N'Mood Summary', N'Activity Summary'))
);
GO

-- 10. Family connections
CREATE TABLE dbo.FamilyConnections
(
    ConnectionID int IDENTITY(1,1) NOT NULL,
    FamilyUserID int NOT NULL,
    PersonalUserID int NOT NULL,
    ConnectionStatus nvarchar(20) NOT NULL,
    RequestedAt datetime2 NOT NULL
        CONSTRAINT DF_FamilyConnections_RequestedAt DEFAULT (SYSDATETIME()),
    RespondedAt datetime2 NULL,

    CONSTRAINT PK_FamilyConnections
        PRIMARY KEY (ConnectionID),

    CONSTRAINT FK_FamilyConnections_FamilyUser
        FOREIGN KEY (FamilyUserID) REFERENCES dbo.Users(UserID),

    CONSTRAINT FK_FamilyConnections_PersonalUser
        FOREIGN KEY (PersonalUserID) REFERENCES dbo.Users(UserID),

    CONSTRAINT CK_FamilyConnections_Status
        CHECK (ConnectionStatus IN
            (N'Pending', N'Accepted', N'Rejected', N'Cancelled', N'Revoked')),

    CONSTRAINT CK_FamilyConnections_NotSelf
        CHECK (FamilyUserID <> PersonalUserID)
);
GO

-- 11. Family sharing consent history
CREATE TABLE dbo.FamilySharingConsentHistory
(
    ConsentEventID int IDENTITY(1,1) NOT NULL,
    ConnectionID int NOT NULL,
    SharingCategoryID int NOT NULL,
    ConsentAction nvarchar(10) NOT NULL,
    ChangedAt datetime2 NOT NULL
        CONSTRAINT DF_FamilySharingConsentHistory_ChangedAt DEFAULT (SYSDATETIME()),
    ChangedByUserID int NOT NULL,

    CONSTRAINT PK_FamilySharingConsentHistory
        PRIMARY KEY (ConsentEventID),

    CONSTRAINT FK_FamilySharingConsentHistory_Connections
        FOREIGN KEY (ConnectionID)
        REFERENCES dbo.FamilyConnections(ConnectionID),

    CONSTRAINT FK_FamilySharingConsentHistory_Categories
        FOREIGN KEY (SharingCategoryID)
        REFERENCES dbo.SharingCategories(SharingCategoryID),

    CONSTRAINT FK_FamilySharingConsentHistory_Users
        FOREIGN KEY (ChangedByUserID) REFERENCES dbo.Users(UserID),

    CONSTRAINT CK_FamilySharingConsentHistory_Action
        CHECK (ConsentAction IN (N'Enabled', N'Revoked'))
);
GO

-- 12. Consultation requests (not confirmed appointments)
CREATE TABLE dbo.ConsultationRequests
(
    ConsultationRequestID int IDENTITY(1,1) NOT NULL,
    PersonalUserID int NOT NULL,
    TherapistUserID int NOT NULL,
    Topic nvarchar(120) NULL,
    Message nvarchar(1000) NULL,
    PreferredDateTime datetime2 NULL,
    RequestStatus nvarchar(20) NOT NULL
        CONSTRAINT DF_ConsultationRequests_RequestStatus DEFAULT (N'Pending'),
    CreatedAt datetime2 NOT NULL
        CONSTRAINT DF_ConsultationRequests_CreatedAt DEFAULT (SYSDATETIME()),
    UpdatedAt datetime2 NULL,

    CONSTRAINT PK_ConsultationRequests
        PRIMARY KEY (ConsultationRequestID),

    CONSTRAINT FK_ConsultationRequests_PersonalUser
        FOREIGN KEY (PersonalUserID) REFERENCES dbo.Users(UserID),

    CONSTRAINT FK_ConsultationRequests_TherapistUser
        FOREIGN KEY (TherapistUserID) REFERENCES dbo.Users(UserID),

    CONSTRAINT CK_ConsultationRequests_Status
        CHECK (RequestStatus IN
            (N'Pending', N'Accepted', N'Declined', N'Withdrawn')),

    CONSTRAINT CK_ConsultationRequests_NotSelf
        CHECK (PersonalUserID <> TherapistUserID)
);
GO

USE NafasDB;
GO

-- 13. Chat Sessions
IF OBJECT_ID(N'dbo.ChatSessions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ChatSessions
    (
        ChatSessionID int IDENTITY(1,1) NOT NULL,
        PersonalUserID int NOT NULL,

        CreatedAt datetime2 NOT NULL
            CONSTRAINT DF_ChatSessions_CreatedAt
            DEFAULT (SYSDATETIME()),

        EndedAt datetime2 NULL,

        CONSTRAINT PK_ChatSessions
            PRIMARY KEY (ChatSessionID),

        CONSTRAINT FK_ChatSessions_Users
            FOREIGN KEY (PersonalUserID)
            REFERENCES dbo.Users(UserID),

        CONSTRAINT CK_ChatSessions_EndAfterCreation
            CHECK (EndedAt IS NULL OR EndedAt >= CreatedAt)
    );
END;
GO


-- 14. Chat Messages
IF OBJECT_ID(N'dbo.ChatMessages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ChatMessages
    (
        ChatMessageID int IDENTITY(1,1) NOT NULL,
        ChatSessionID int NOT NULL,
        SenderType nvarchar(10) NOT NULL,
        MessageContent nvarchar(max) NOT NULL,

        SentAt datetime2 NOT NULL
            CONSTRAINT DF_ChatMessages_SentAt
            DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_ChatMessages
            PRIMARY KEY (ChatMessageID),

        CONSTRAINT FK_ChatMessages_ChatSessions
            FOREIGN KEY (ChatSessionID)
            REFERENCES dbo.ChatSessions(ChatSessionID),

        CONSTRAINT CK_ChatMessages_SenderType
            CHECK (SenderType IN (N'User', N'AI'))
    );
END;
GO


-- 15. Support Groups
IF OBJECT_ID(N'dbo.SupportGroups', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SupportGroups
    (
        SupportGroupID int IDENTITY(1,1) NOT NULL,
        GroupName nvarchar(120) NOT NULL,
        Description nvarchar(1000) NULL,
        LeaderTherapistID int NOT NULL,

        GroupStatus nvarchar(10) NOT NULL
            CONSTRAINT DF_SupportGroups_GroupStatus
            DEFAULT (N'Active'),

        CreatedAt datetime2 NOT NULL
            CONSTRAINT DF_SupportGroups_CreatedAt
            DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_SupportGroups
            PRIMARY KEY (SupportGroupID),

        CONSTRAINT FK_SupportGroups_LeaderUser
            FOREIGN KEY (LeaderTherapistID)
            REFERENCES dbo.Users(UserID),

        CONSTRAINT CK_SupportGroups_Status
            CHECK (GroupStatus IN (N'Active', N'Closed'))
    );
END;
GO


-- 16. Support Group Memberships
IF OBJECT_ID(N'dbo.SupportGroupMemberships', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SupportGroupMemberships
    (
        MembershipID int IDENTITY(1,1) NOT NULL,
        SupportGroupID int NOT NULL,
        PersonalUserID int NOT NULL,

        MembershipStartAt datetime2 NOT NULL
            CONSTRAINT DF_SupportGroupMemberships_StartAt
            DEFAULT (SYSDATETIME()),

        MembershipEndAt datetime2 NULL,

        CONSTRAINT PK_SupportGroupMemberships
            PRIMARY KEY (MembershipID),

        CONSTRAINT FK_SupportGroupMemberships_Groups
            FOREIGN KEY (SupportGroupID)
            REFERENCES dbo.SupportGroups(SupportGroupID),

        CONSTRAINT FK_SupportGroupMemberships_Users
            FOREIGN KEY (PersonalUserID)
            REFERENCES dbo.Users(UserID),

        CONSTRAINT CK_SupportGroupMemberships_EndAfterStart
            CHECK
            (
                MembershipEndAt IS NULL
                OR MembershipEndAt > MembershipStartAt
            )
    );
END;
GO


-- 17. Support Group Messages
IF OBJECT_ID(N'dbo.SupportGroupMessages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SupportGroupMessages
    (
        SupportGroupMessageID int IDENTITY(1,1) NOT NULL,
        SupportGroupID int NOT NULL,
        MembershipID int NULL,
        TherapistLeaderUserID int NULL,
        MessageContent nvarchar(max) NOT NULL,

        SentAt datetime2 NOT NULL
            CONSTRAINT DF_SupportGroupMessages_SentAt
            DEFAULT (SYSDATETIME()),

        CONSTRAINT PK_SupportGroupMessages
            PRIMARY KEY (SupportGroupMessageID),

        CONSTRAINT FK_SupportGroupMessages_Groups
            FOREIGN KEY (SupportGroupID)
            REFERENCES dbo.SupportGroups(SupportGroupID),

        CONSTRAINT FK_SupportGroupMessages_Memberships
            FOREIGN KEY (MembershipID)
            REFERENCES dbo.SupportGroupMemberships(MembershipID),

        CONSTRAINT FK_SupportGroupMessages_LeaderUsers
            FOREIGN KEY (TherapistLeaderUserID)
            REFERENCES dbo.Users(UserID),

        CONSTRAINT CK_SupportGroupMessages_OneSender
            CHECK
            (
                (MembershipID IS NOT NULL AND TherapistLeaderUserID IS NULL)
                OR
                (MembershipID IS NULL AND TherapistLeaderUserID IS NOT NULL)
            )
    );
END;
GO


-- 18. Therapist Sessions
IF OBJECT_ID(N'dbo.TherapistSessions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TherapistSessions
    (
        TherapistSessionID int IDENTITY(1,1) NOT NULL,
        ConsultationRequestID int NOT NULL,
        SessionStartAt datetimeoffset(0) NOT NULL,
        SessionEndAt datetimeoffset(0) NOT NULL,

        SessionStatus nvarchar(20) NOT NULL
            CONSTRAINT DF_TherapistSessions_SessionStatus
            DEFAULT (N'Scheduled'),

        CreatedAt datetime2 NOT NULL
            CONSTRAINT DF_TherapistSessions_CreatedAt
            DEFAULT (SYSDATETIME()),

        UpdatedAt datetime2 NULL,

        CONSTRAINT PK_TherapistSessions
            PRIMARY KEY (TherapistSessionID),

        CONSTRAINT FK_TherapistSessions_ConsultationRequests
            FOREIGN KEY (ConsultationRequestID)
            REFERENCES dbo.ConsultationRequests(ConsultationRequestID),

        CONSTRAINT CK_TherapistSessions_EndAfterStart
            CHECK (SessionEndAt > SessionStartAt),

        CONSTRAINT CK_TherapistSessions_Status
            CHECK
            (
                SessionStatus IN
                (N'Scheduled', N'Completed', N'Cancelled')
            )
    );
END;
GO


-- Indexes

CREATE NONCLUSTERED INDEX IX_ChatSessions_PersonalUser_CreatedAt
ON dbo.ChatSessions (PersonalUserID, CreatedAt);
GO

CREATE NONCLUSTERED INDEX IX_ChatMessages_Session_SentAt
ON dbo.ChatMessages (ChatSessionID, SentAt);
GO

CREATE NONCLUSTERED INDEX IX_SupportGroups_Status
ON dbo.SupportGroups (GroupStatus);
GO

CREATE NONCLUSTERED INDEX IX_SupportGroups_Leader
ON dbo.SupportGroups (LeaderTherapistID);
GO

CREATE UNIQUE NONCLUSTERED INDEX UX_SupportGroupMemberships_Active_Group_User
ON dbo.SupportGroupMemberships (SupportGroupID, PersonalUserID)
WHERE MembershipEndAt IS NULL;
GO

CREATE NONCLUSTERED INDEX IX_SupportGroupMemberships_Group_User_Period
ON dbo.SupportGroupMemberships
    (SupportGroupID, PersonalUserID, MembershipStartAt, MembershipEndAt);
GO

CREATE NONCLUSTERED INDEX IX_SupportGroupMessages_Group_SentAt
ON dbo.SupportGroupMessages (SupportGroupID, SentAt);
GO

CREATE NONCLUSTERED INDEX IX_SupportGroupMessages_Membership_SentAt
ON dbo.SupportGroupMessages (MembershipID, SentAt);
GO

CREATE NONCLUSTERED INDEX IX_SupportGroupMessages_Leader_SentAt
ON dbo.SupportGroupMessages (TherapistLeaderUserID, SentAt);
GO

CREATE NONCLUSTERED INDEX IX_TherapistSessions_Request_Start
ON dbo.TherapistSessions (ConsultationRequestID, SessionStartAt);
GO

CREATE NONCLUSTERED INDEX IX_TherapistSessions_Start_Status
ON dbo.TherapistSessions (SessionStartAt, SessionStatus);
GO

USE NafasDB;
GO

USE NafasDB;
GO

SELECT
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc
    ON fk.object_id = fkc.constraint_object_id
ORDER BY TableName, ForeignKeyName;

USE NafasDB;
GO

SELECT
    OBJECT_NAME(parent_object_id) AS TableName,
    name AS ConstraintName,
    definition AS ConstraintRule
FROM sys.check_constraints
ORDER BY TableName;


USE NafasDB;
GO

SELECT
    s.name AS SchemaName,
    t.name AS TableName,
    c.column_id AS ColumnOrder,
    c.name AS ColumnName,
    ty.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable,
    c.is_identity AS IsIdentity,
    dc.definition AS DefaultDefinition
FROM sys.tables AS t
JOIN sys.schemas AS s
    ON s.schema_id = t.schema_id
JOIN sys.columns AS c
    ON c.object_id = t.object_id
JOIN sys.types AS ty
    ON ty.user_type_id = c.user_type_id
LEFT JOIN sys.default_constraints AS dc
    ON dc.parent_object_id = c.object_id
    AND dc.parent_column_id = c.column_id
WHERE t.is_ms_shipped = 0
ORDER BY s.name, t.name, c.column_id;

USE NafasDB;
GO

SELECT
    s.name AS SchemaName,
    t.name AS TableName,
    kc.name AS ConstraintName,
    kc.type_desc AS ConstraintType,
    c.name AS ColumnName,
    ic.key_ordinal AS KeyColumnOrder
FROM sys.key_constraints AS kc
JOIN sys.tables AS t
    ON t.object_id = kc.parent_object_id
JOIN sys.schemas AS s
    ON s.schema_id = t.schema_id
JOIN sys.indexes AS i
    ON i.object_id = kc.parent_object_id
    AND i.index_id = kc.unique_index_id
JOIN sys.index_columns AS ic
    ON ic.object_id = i.object_id
    AND ic.index_id = i.index_id
JOIN sys.columns AS c
    ON c.object_id = ic.object_id
    AND c.column_id = ic.column_id
WHERE ic.key_ordinal > 0
ORDER BY t.name, kc.name, ic.key_ordinal;


USE NafasDB;
GO

SELECT
    fk.name AS ForeignKeyName,
    pt.name AS ParentTable,
    pc.name AS ParentColumn,
    rt.name AS ReferencedTable,
    rc.name AS ReferencedColumn,
    fk.delete_referential_action_desc AS OnDeleteAction,
    fk.update_referential_action_desc AS OnUpdateAction,
    fk.is_disabled AS IsDisabled,
    fk.is_not_trusted AS IsNotTrusted
FROM sys.foreign_keys AS fk
JOIN sys.foreign_key_columns AS fkc
    ON fkc.constraint_object_id = fk.object_id
JOIN sys.tables AS pt
    ON pt.object_id = fk.parent_object_id
JOIN sys.columns AS pc
    ON pc.object_id = fkc.parent_object_id
    AND pc.column_id = fkc.parent_column_id
JOIN sys.tables AS rt
    ON rt.object_id = fk.referenced_object_id
JOIN sys.columns AS rc
    ON rc.object_id = fkc.referenced_object_id
    AND rc.column_id = fkc.referenced_column_id
ORDER BY pt.name, fk.name;