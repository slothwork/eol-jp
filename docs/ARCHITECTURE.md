# Architecture

## Decision

MVPは完全静的サイトとする。EOLデータは日次同期で十分であり、アクセスごとのAPI呼び出しやDBは不要。

## Data pipeline

1. GitHub Actions scheduleが `scripts/sync-eol.mjs` を実行。
2. `https://endoflife.date/api/v1/products/full` を取得。
3. UIで使う安定した内部schemaへ正規化。
4. 前回snapshotと比較し、EOL日・通常サポート日・latest変更をchange logへ保存。
5. JSON差分があればmainへcommit。
6. Cloudflare Pagesがcommitを検知しAstroをbuild。

## Why committed snapshots

- API障害がサイト閲覧へ波及しない。
- API Betaの破壊的変更をsync jobで検知できる。
- いつどのEOL日が変わったかGit履歴で追跡できる。
- Cloudflare Pagesは静的配信のみで低コスト。

## Internal normalized schema

```text
Snapshot
  schemaVersion
  generatedAt
  sourceUrl
  products[]
    slug
    label
    category
    versionCommand
    links
    releases[]
      name
      releaseDate
      isLts
      eoasFrom
      eolFrom
      isEol
      isMaintained
      latest{name,date,link}
```

## Failure policy

sync jobでAPI取得またはschema validationが失敗した場合はexit 1にし、既存snapshotを上書きしない。本番サイトは直前の正常snapshotで継続する。
