import { backendState, expect, loginAs, test } from './support';

test.describe('justificaciones: coordinación de apoyo docente', () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAs(context, 'coordinator');
    await page.goto('/dashboard/justifications');
    await expect(page.getByRole('heading', { name: 'Justificaciones entrantes' })).toBeVisible();
  });

  test('abre una entrante, la acepta y queda registrada en el backend', async ({ page }) => {
    await page.getByRole('button', { name: /Cálculo I · NRC 1234/ }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Martes, 15 de septiembre de 2026')).toBeVisible();
    await expect(dialog.getByText('Bloque A (08:10 - 09:40), Bloque C2 (13:10 - 14:30)')).toBeVisible();
    await expect(dialog.getByText('Ana Profesora')).toBeVisible();
    await expect(page.getByText('No hay nuevas justificaciones entrantes.')).toBeVisible();

    const accept = dialog.getByRole('button', { name: 'Aceptar' });
    await expect(accept).toBeDisabled();
    await dialog.getByLabel('Motivo de la inasistencia').selectOption('MEDICAL');
    await accept.click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Justificación aprobada y notificada.')).toBeVisible();
    const state = await backendState();
    expect(state.inbox).toHaveLength(0);
    expect(state.justifications.find((item) => item.id === 'j-inbox-1')).toMatchObject({
      status: 'ACCEPTED',
      reasonCategory: 'MEDICAL',
    });
  });

  test('rechazar exige un motivo y lo notifica', async ({ page }) => {
    await page.getByRole('button', { name: /Cálculo I · NRC 1234/ }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Motivo de la inasistencia').selectOption('PERSONAL');

    const reject = dialog.getByRole('button', { name: 'Rechazar' });
    await expect(reject).toBeDisabled();
    await dialog.getByLabel(/Motivo del rechazo/).fill('El certificado no corresponde a la fecha');
    await reject.click();

    await expect(page.getByText('Justificación rechazada y notificada.')).toBeVisible();
    const state = await backendState();
    expect(state.justifications.find((item) => item.id === 'j-inbox-1')).toMatchObject({
      status: 'REJECTED',
      rejectionReason: 'El certificado no corresponde a la fecha',
    });
  });

  test('abre la evidencia en una pestaña nueva con la URL firmada', async ({ page, context }) => {
    await page.getByRole('button', { name: /Física II · NRC 5678/ }).click();

    const popup = context.waitForEvent('page');
    await page.getByRole('dialog').getByRole('button', { name: 'Abrir evidencia' }).click();
    const evidence = await popup;

    await expect(evidence).toHaveURL(/\/evidence\/justifications\/forms\/antiguo\.pdf\?X-Amz-Signature=e2e$/);
    expect(await evidence.evaluate(() => window.opener)).toBeNull();
  });

  test('las justificaciones resueltas no permiten volver a decidir', async ({ page }) => {
    await page.getByRole('button', { name: /Física II · NRC 5678/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Motivo médico')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Aceptar' })).toHaveCount(0);
  });
});

test.describe('justificaciones: gestión de secretaría', () => {
  test('el histórico muestra la fecha real y filtra por día', async ({ context, page }) => {
    await loginAs(context, 'secretary');
    await page.goto('/dashboard/justifications/management');

    const row = page.getByRole('row', { name: /Física II/ });
    await expect(row).toBeVisible();
    await expect(row.getByText('01-09-2026')).toBeVisible();

    await page.getByLabel('Desde').fill('2026-09-01');
    await page.getByLabel('Hasta').fill('2026-09-01');
    await expect(page.getByRole('row', { name: /Física II/ })).toBeVisible();
  });

  test('secretaría descarga la evidencia de un registro', async ({ context, page }) => {
    await loginAs(context, 'secretary');
    await page.goto('/dashboard/justifications/management');

    await page.getByRole('row', { name: /Física II/ }).click();
    const popup = context.waitForEvent('page');
    await page.getByRole('dialog').getByRole('button', { name: 'Abrir evidencia' }).click();

    await expect(await popup).toHaveURL(/antiguo\.pdf/);
  });
});
