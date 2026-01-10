import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import type { BacklogEntry, BacklogStatus, Difficulty } from '@/domain/types';
import {
  getAllBacklogEntries,
  getAllBacklogTags,
  getTopGenerationCandidates,
  getBacklogStats,
  generateBacklogJson,
} from '@/data/backlog';
import { getAllLessons } from '@/lib/lessons';
import styles from './AdminBacklogPage.module.css';

const STATUS_OPTIONS: { value: BacklogStatus; label: string }[] = [
  { value: 'pending', label: '未生成' },
  { value: 'generated', label: '生成済み' },
  { value: 'published', label: '公開済み' },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: '初級' },
  { value: 'intermediate', label: '中級' },
  { value: 'advanced', label: '上級' },
];

const statusVariants: Record<BacklogStatus, 'default' | 'warning' | 'success'> = {
  pending: 'default',
  generated: 'warning',
  published: 'success',
};

const difficultyVariants: Record<Difficulty, 'success' | 'warning' | 'danger'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'danger',
};

export function AdminBacklogPage() {
  const initialEntries = useMemo(() => getAllBacklogEntries(), []);
  const allTags = useMemo(() => getAllBacklogTags(), []);
  const existingLessons = useMemo(() => getAllLessons(), []);
  const publishedSlugs = useMemo(
    () => new Set(existingLessons.map((l) => l.id)),
    [existingLessons]
  );

  // State for entries (editable)
  const [entries, setEntries] = useState<BacklogEntry[]>(initialEntries);
  const [hasChanges, setHasChanges] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<BacklogStatus[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered entries
  const filteredEntries = useMemo(() => {
    let result = entries;

    if (statusFilter.length > 0) {
      result = result.filter((e) => statusFilter.includes(e.status));
    }

    if (difficultyFilter.length > 0) {
      result = result.filter((e) => difficultyFilter.includes(e.difficulty));
    }

    if (tagFilter.length > 0) {
      result = result.filter((e) => e.tags.some((tag) => tagFilter.includes(tag)));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.slug.toLowerCase().includes(query) ||
          e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [entries, statusFilter, difficultyFilter, tagFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => getBacklogStats(entries), [entries]);

  // Top 5 candidates
  const topCandidates = useMemo(
    () => getTopGenerationCandidates(entries, publishedSlugs, 5),
    [entries, publishedSlugs]
  );

  // Status update handler
  const handleStatusChange = useCallback((slug: string, newStatus: BacklogStatus) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.slug !== slug) return entry;

        const updated = { ...entry, status: newStatus };

        if (newStatus === 'generated' && !entry.generatedAt) {
          updated.generatedAt = new Date().toISOString();
        }

        if (newStatus === 'published' && !entry.publishedAt) {
          updated.publishedAt = new Date().toISOString();
        }

        return updated;
      })
    );
    setHasChanges(true);
  }, []);

  // Toggle filter
  const toggleFilter = useCallback(<T,>(value: T, current: T[], setter: (v: T[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  }, []);

  // Download JSON
  const handleDownload = useCallback(() => {
    const json = generateBacklogJson(entries);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lessons.backlog.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [entries]);

  // Reset changes
  const handleReset = useCallback(() => {
    setEntries(initialEntries);
    setHasChanges(false);
  }, [initialEntries]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>レッスン Backlog 管理</h1>
            <p className={styles.subtitle}>週次生成パイプライン用のレッスン管理</p>
          </div>
          <Link to="/admin" className={styles.backLink}>
            ← 管理ページに戻る
          </Link>
        </div>
      </header>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <Card>
          <CardContent>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>合計</span>
              <span className={styles.statValue}>{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>未生成</span>
              <span className={styles.statValue}>{stats.byStatus.pending}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>生成済み</span>
              <span className={styles.statValue}>{stats.byStatus.generated}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>公開済み</span>
              <span className={styles.statValue}>{stats.byStatus.published}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Candidates */}
      <Card className={styles.candidatesCard}>
        <CardHeader>
          <CardTitle>次の生成候補 Top 5</CardTitle>
        </CardHeader>
        <CardContent>
          {topCandidates.length === 0 ? (
            <p className={styles.emptyText}>生成可能な候補がありません</p>
          ) : (
            <ol className={styles.candidatesList}>
              {topCandidates.map((entry, index) => (
                <li key={entry.slug} className={styles.candidateItem}>
                  <span className={styles.candidateRank}>{index + 1}</span>
                  <div className={styles.candidateInfo}>
                    <span className={styles.candidateTitle}>{entry.title}</span>
                    <Badge variant={difficultyVariants[entry.difficulty]} size="small">
                      {DIFFICULTY_OPTIONS.find((d) => d.value === entry.difficulty)?.label}
                    </Badge>
                  </div>
                  <span className={styles.candidateSlug}>{entry.slug}</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <CardHeader>
          <CardTitle>フィルタ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.filterGroups}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>ステータス</label>
              <div className={styles.filterOptions}>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`${styles.filterChip} ${statusFilter.includes(opt.value) ? styles.active : ''}`}
                    onClick={() => toggleFilter(opt.value, statusFilter, setStatusFilter)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>難易度</label>
              <div className={styles.filterOptions}>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`${styles.filterChip} ${difficultyFilter.includes(opt.value) ? styles.active : ''}`}
                    onClick={() => toggleFilter(opt.value, difficultyFilter, setDifficultyFilter)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>タグ</label>
              <div className={styles.filterOptions}>
                {allTags.slice(0, 10).map((tag) => (
                  <button
                    key={tag}
                    className={`${styles.filterChip} ${tagFilter.includes(tag) ? styles.active : ''}`}
                    onClick={() => toggleFilter(tag, tagFilter, setTagFilter)}
                  >
                    {tag}
                  </button>
                ))}
                {allTags.length > 10 && (
                  <span className={styles.moreText}>+{allTags.length - 10} more</span>
                )}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>検索</label>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="slug, タイトル, 説明で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className={styles.actions}>
        <div className={styles.actionsLeft}>
          <span className={styles.resultCount}>{filteredEntries.length} 件表示</span>
        </div>
        <div className={styles.actionsRight}>
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset}>
                変更を破棄
              </Button>
              <Button onClick={handleDownload}>JSON をダウンロード</Button>
            </>
          )}
        </div>
      </div>

      {/* Entries List */}
      <div className={styles.entriesList}>
        {filteredEntries.map((entry) => (
          <div
            key={entry.slug}
            className={styles.entryCard}
            data-testid={`backlog-entry-${entry.slug}`}
          >
            <div className={styles.entryHeader}>
              <h3 className={styles.entryTitle}>{entry.title}</h3>
              <div className={styles.entryBadges}>
                <Badge variant={difficultyVariants[entry.difficulty]} size="small">
                  {DIFFICULTY_OPTIONS.find((d) => d.value === entry.difficulty)?.label}
                </Badge>
                <Badge variant={statusVariants[entry.status]} size="small">
                  {STATUS_OPTIONS.find((s) => s.value === entry.status)?.label}
                </Badge>
              </div>
            </div>

            <div className={styles.entryMeta}>
              <span className={styles.entrySlug}>{entry.slug}</span>
              <span className={styles.entryDuration}>約 {entry.estimatedMinutes} 分</span>
            </div>

            <p className={styles.entryDescription}>{entry.description}</p>

            <div className={styles.entryTags}>
              {entry.tags.map((tag) => (
                <span key={tag} className={styles.entryTag}>
                  {tag}
                </span>
              ))}
            </div>

            {entry.prerequisites.length > 0 && (
              <div className={styles.entryPrereqs}>
                <span className={styles.prereqLabel}>前提:</span>
                {entry.prerequisites.map((prereq) => (
                  <span
                    key={prereq}
                    className={`${styles.prereqItem} ${publishedSlugs.has(prereq) ? styles.satisfied : ''}`}
                  >
                    {prereq}
                  </span>
                ))}
              </div>
            )}

            <div className={styles.entryFooter}>
              <div className={styles.entryDates}>
                {entry.generatedAt && (
                  <span className={styles.entryDate}>
                    生成: {new Date(entry.generatedAt).toLocaleDateString('ja-JP')}
                  </span>
                )}
                {entry.publishedAt && (
                  <span className={styles.entryDate}>
                    公開: {new Date(entry.publishedAt).toLocaleDateString('ja-JP')}
                  </span>
                )}
              </div>

              <div className={styles.statusSelect}>
                <label className={styles.statusLabel}>ステータス変更:</label>
                <select
                  value={entry.status}
                  onChange={(e) => handleStatusChange(entry.slug, e.target.value as BacklogStatus)}
                  className={styles.statusDropdown}
                  data-testid={`status-select-${entry.slug}`}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Notice */}
      {hasChanges && (
        <Card className={styles.noticeCard}>
          <CardContent>
            <div className={styles.notice}>
              <h4 className={styles.noticeTitle}>変更後の注意事項</h4>
              <ol className={styles.noticeList}>
                <li>「JSON をダウンロード」ボタンでファイルを取得</li>
                <li>
                  プロジェクトルートの <code>lessons.backlog.json</code> を上書き
                </li>
                <li>
                  ターミナルで <code>npm run validate:lessons -- --strict</code> を実行して検証
                </li>
                <li>問題なければコミット</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
