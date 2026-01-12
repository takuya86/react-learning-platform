/**
 * P5-2.1: Improvement Lifecycle Service
 *
 * 改善施策のライフサイクル判定ロジック
 * - 最低評価回数チェック
 * - 効果指標とROIに基づく継続/クローズ/再設計の判定
 * - 自動クローズ・ラベル付与用のコメント生成
 */

export type LifecycleDecision = 'CONTINUE' | 'CLOSE_NO_EFFECT' | 'REDESIGN_REQUIRED';

export interface ImprovementStatus {
  improvementId: string; // lesson_slug or issue_number
  priorityScore: number;
  effectivenessDelta: number; // after - before
  roi: number;
  evaluationCount: number;
  lastEvaluatedAt: string | null;
}

export interface LifecycleResult {
  decision: LifecycleDecision;
  reason: string;
  shouldClose: boolean;
  shouldAddLabel: boolean;
  labelToAdd: string | null;
}

/**
 * 改善施策のライフサイクルステージを判定する
 *
 * 判定ルール (spec-lock):
 * 1. 評価回数が2回未満の場合は継続監視
 * 2. 効果なし & ROIなし → クローズ
 * 3. 効果あり but ROIマイナス → 再設計必要
 * 4. それ以外は継続監視
 */
export function determineLifecycle(status: ImprovementStatus): LifecycleResult {
  // 最低2回評価するまで待つ
  if (status.evaluationCount < 2) {
    return {
      decision: 'CONTINUE',
      reason: '評価回数が不足',
      shouldClose: false,
      shouldAddLabel: false,
      labelToAdd: null,
    };
  }

  // 効果なし & ROIなし → クローズ
  if (status.effectivenessDelta <= 0 && status.roi <= 0) {
    return {
      decision: 'CLOSE_NO_EFFECT',
      reason: '効果指標の改善が見られない',
      shouldClose: true,
      shouldAddLabel: false,
      labelToAdd: null,
    };
  }

  // 効果あり but ROIマイナス → 再設計必要
  if (status.effectivenessDelta > 0 && status.roi < 0) {
    return {
      decision: 'REDESIGN_REQUIRED',
      reason: '効果はあるがROIが負',
      shouldClose: false,
      shouldAddLabel: true,
      labelToAdd: 'needs-redesign',
    };
  }

  return {
    decision: 'CONTINUE',
    reason: '継続監視',
    shouldClose: false,
    shouldAddLabel: false,
    labelToAdd: null,
  };
}

/**
 * クローズ時のコメントを生成する
 *
 * @param status - 改善施策のステータス
 * @returns マークダウン形式のクローズコメント
 */
export function buildCloseComment(status: ImprovementStatus): string {
  return `## 🔒 自動クローズ

この改善は以下の理由により自動クローズされました。

- 評価回数: ${status.evaluationCount}回
- 効果指標の改善が見られない
- ROIが正または中立に転じなかった

本判断は自動評価によるものであり、設計の失敗を責める意図はありません。

---
_Auto-closed by P5-2 Improvement Lifecycle_`;
}

/**
 * 再設計必要時のコメントを生成する
 *
 * @param status - 改善施策のステータス
 * @param result - ライフサイクル判定結果
 * @returns マークダウン形式の再設計コメント
 */
export function buildRedesignComment(status: ImprovementStatus, result: LifecycleResult): string {
  return `## ⚠️ 再設計が必要です

この改善について、以下の状況が検出されました:

- 評価回数: ${status.evaluationCount}回
- 効果指標の改善: ${status.effectivenessDelta > 0 ? 'あり' : 'なし'} (Δ = ${status.effectivenessDelta.toFixed(2)})
- ROI: ${status.roi.toFixed(2)} (負の値)

効果は見られるものの、投資対効果が負の状態です。
実装コストや運用コストの見直しをご検討ください。

ラベル \`${result.labelToAdd}\` を付与しました。

---
_Auto-labeled by P5-2 Improvement Lifecycle_`;
}
