import { Card, CardContent } from '@/components/ui';
import { LearningHeatmap } from '@/features/metrics';
import type { HeatmapDay } from '@/features/metrics';
import styles from '../AdminMetricsPage.module.css';

interface AdminMetricsHeatmapProps {
  data: HeatmapDay[];
}

export function AdminMetricsHeatmap({ data }: AdminMetricsHeatmapProps) {
  return (
    <Card className={styles.chartCard} data-testid="admin-metrics-heatmap">
      <CardContent className={styles.chartCardContent}>
        <LearningHeatmap data={data} title="全ユーザー学習アクティビティ" />
      </CardContent>
    </Card>
  );
}
