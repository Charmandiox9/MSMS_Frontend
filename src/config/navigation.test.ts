import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_SECTIONS,
  getFilteredNavigation,
  isRouteAllowed,
} from './navigation';

describe('Navigation configuration and filtering', () => {
  it('should include all sections for SYSTEM_ADMIN', () => {
    const filtered = getFilteredNavigation(DASHBOARD_SECTIONS, 'SYSTEM_ADMIN');
    const sectionKeys = filtered.map((section) => section.key);

    expect(sectionKeys).toContain('main');
    expect(sectionKeys).toContain('academic');
    expect(sectionKeys).toContain('analysis');
    expect(sectionKeys).toContain('system');

    const systemSection = filtered.find((s) => s.key === 'system');
    const systemItemKeys = systemSection?.items.map((i) => i.key);
    expect(systemItemKeys).toContain('users');
    expect(systemItemKeys).toContain('audit');
    expect(systemItemKeys).toContain('settings');
  });

  it('should omit system administration for ACADEMIC_SECRETARY', () => {
    const filtered = getFilteredNavigation(
      DASHBOARD_SECTIONS,
      'ACADEMIC_SECRETARY'
    );
    const sectionKeys = filtered.map((section) => section.key);

    expect(sectionKeys).not.toContain('system');
    expect(sectionKeys).not.toContain('analysis');
    expect(sectionKeys).toContain('main');
    expect(sectionKeys).toContain('academic');

    const academicSection = filtered.find((s) => s.key === 'academic');
    const itemKeys = academicSection?.items.map((i) => i.key);
    expect(itemKeys).toContain('academicInformation');
    expect(itemKeys).not.toContain('academicWorkload');
    expect(itemKeys).not.toContain('justifications');
  });

  it('should provide analysis and relevant academic sections for ACADEMIC_PROCESS_ANALYST', () => {
    const filtered = getFilteredNavigation(
      DASHBOARD_SECTIONS,
      'ACADEMIC_PROCESS_ANALYST'
    );
    const sectionKeys = filtered.map((section) => section.key);

    expect(sectionKeys).toContain('main');
    expect(sectionKeys).toContain('academic');
    expect(sectionKeys).toContain('analysis');
    expect(sectionKeys).not.toContain('system');

    const academicSection = filtered.find((s) => s.key === 'academic');
    const itemKeys = academicSection?.items.map((i) => i.key);
    expect(itemKeys).toContain('justifications');
    expect(itemKeys).toContain('academicInformation');
    expect(itemKeys).toContain('titulation');
  });

  it('should provide workload and justifications for TEACHING_SUPPORT_COORDINATOR', () => {
    const filtered = getFilteredNavigation(
      DASHBOARD_SECTIONS,
      'TEACHING_SUPPORT_COORDINATOR'
    );
    const sectionKeys = filtered.map((section) => section.key);

    expect(sectionKeys).toContain('main');
    expect(sectionKeys).toContain('academic');
    expect(sectionKeys).not.toContain('analysis');
    expect(sectionKeys).not.toContain('system');

    const academicSection = filtered.find((s) => s.key === 'academic');
    const itemKeys = academicSection?.items.map((i) => i.key);
    expect(itemKeys).toContain('justifications');
    expect(itemKeys).toContain('academicWorkload');
    expect(itemKeys).toContain('titulation');
    expect(itemKeys).toContain('academicInformation');
  });

  it('should only return public/unrestricted items when role is null', () => {
    const filtered = getFilteredNavigation(DASHBOARD_SECTIONS, null);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].key).toBe('main');
    expect(filtered[0].items[0].key).toBe('dashboard');
  });

  it('should correctly evaluate isRouteAllowed for authorized and unauthorized roles', () => {
    expect(
      isRouteAllowed('/dashboard/users', DASHBOARD_SECTIONS, 'SYSTEM_ADMIN')
    ).toBe(true);
    expect(
      isRouteAllowed(
        '/dashboard/users',
        DASHBOARD_SECTIONS,
        'ACADEMIC_SECRETARY'
      )
    ).toBe(false);
    expect(
      isRouteAllowed(
        '/dashboard/reports',
        DASHBOARD_SECTIONS,
        'ACADEMIC_PROCESS_ANALYST'
      )
    ).toBe(true);
    expect(
      isRouteAllowed(
        '/dashboard/reports',
        DASHBOARD_SECTIONS,
        'TEACHING_SUPPORT_COORDINATOR'
      )
    ).toBe(false);
    expect(
      isRouteAllowed('/dashboard', DASHBOARD_SECTIONS, null)
    ).toBe(true);
  });
});
