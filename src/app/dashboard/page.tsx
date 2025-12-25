'use client';

import { DashboardUI } from './DashboardUI';
import { useDashboardLogic } from './useDashboardLogic';

export default function DashboardPage() {
  const dashboardProps = useDashboardLogic();
  return <DashboardUI {...dashboardProps} />;
}