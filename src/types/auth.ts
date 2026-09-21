export type UserRoleCode =
  | 'SYSTEM_ADMIN'
  | 'ACADEMIC_SECRETARY'
  | 'ACADEMIC_PROCESS_ANALYST'
  | 'TEACHING_SUPPORT_COORDINATOR';

export type PermissionCode =
  | 'DASHBOARD_VIEW'
  | 'USERS_MANAGE'
  | 'ROLES_MANAGE'
  | 'PERMISSIONS_MANAGE'
  | 'SETTINGS_MANAGE'
  | 'AUDIT_LOG_VIEW'
  | 'ACADEMIC_RECORDS_VIEW'
  | 'ACADEMIC_RECORDS_MANAGE'
  | 'JUSTIFICATIONS_VIEW'
  | 'JUSTIFICATIONS_CREATE'
  | 'ACADEMIC_WORKLOAD_MANAGE'
  | 'SCHEDULES_MANAGE'
  | 'TEACHING_ASSISTANTS_MANAGE'
  | 'TITULATION_VIEW'
  | 'TITULATION_MANAGE'
  | 'REPORTS_VIEW'
  | 'REPORTS_EXPORT';

export interface ActiveSession {
  email: string;
  roles: string[];
  avatarUrl?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  roles: UserRoleCode[];
  permissions: PermissionCode[];
}
