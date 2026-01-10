# ブランチ保護設定ガイド

GitHubでmainブランチを保護し、CIが通らないとマージできないようにする設定です。

## 設定手順

### 1. リポジトリ設定を開く

1. GitHubでリポジトリを開く
2. **Settings** → **Branches** をクリック

### 2. ブランチ保護ルールを追加

1. **Add branch ruleset** または **Add rule** をクリック
2. **Branch name pattern** に `main` を入力

### 3. 保護設定（推奨）

以下にチェックを入れる:

- [x] **Require a pull request before merging**
  - PRなしで直接pushできなくなる

- [x] **Require status checks to pass before merging**
  - CIが通らないとマージできない
  - **Required checks** に以下を追加:
    - `test-and-build` (ci.yml のジョブ名)

- [x] **Require branches to be up to date before merging**
  - mainとの差分がある場合は更新が必要

- [x] **Do not allow bypassing the above settings**
  - 管理者もルールを回避できない

### 4. 保存

**Save changes** または **Create** をクリック

---

## 設定後の動作

| 操作             | 許可    |
| ---------------- | ------- |
| mainへ直接push   | ❌ 拒否 |
| PRを作成         | ✅ 可能 |
| CI失敗時にマージ | ❌ 拒否 |
| CI成功時にマージ | ✅ 可能 |

---

## GitHub CLIでの設定（オプション）

```bash
# ブランチ保護ルールを表示
gh api repos/{owner}/{repo}/branches/main/protection

# ※ 設定はWeb UIの方が分かりやすいため推奨
```

---

## トラブルシューティング

### 「Required status checks」にジョブが表示されない

1. 一度PRを作成してCIを実行する
2. CIが完了すると選択肢に表示される

### 緊急時にルールをバイパスしたい

1. Settings → Branches → main のルールを編集
2. 一時的に **Allow specified actors to bypass** を有効化
3. 作業後に必ず元に戻す
