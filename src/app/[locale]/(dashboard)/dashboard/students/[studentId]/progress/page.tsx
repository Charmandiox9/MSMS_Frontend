import StudentProgressPage from '@/components/dashboard/StudentProgressPage';

export default async function StudentProgressRoute({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <StudentProgressPage studentId={studentId} />;
}
