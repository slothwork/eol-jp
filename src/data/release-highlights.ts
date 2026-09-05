import {
  productReleaseHighlights as initialProductReleaseHighlights,
  type ProductReleaseHighlight
} from './product-content';

export const productReleaseHighlights: Record<string, ProductReleaseHighlight[]> = {
  ...initialProductReleaseHighlights,
  mysql: [
    {
      version: '9.7',
      releaseDate: '2026-04-21',
      summary: 'MySQL 9.7 は、JSON Duality Views、レプリケーション制御、データマスキング、InnoDB周辺などを更新したInnovationリリースです。',
      highlights: [
        'Community Server の JSON Duality Views が DML に対応し、insert・update・delete をビュー経由で実行可能。',
        'JSON Duality Views のDMLで自動増分カラムを扱えるようになり、JSONとリレーショナルデータの連携を強化。',
        'replica_allow_higher_version_source を追加し、上位バージョンのソースから下位バージョンのレプリカへの複製可否を制御可能。',
        'Dynamic Data Masking Policy の対象SQLやロール・ユーザー判定関数を拡張し、データ保護機能を強化。',
        '一部の旧システム変数が削除・非推奨化されているため、9.6以前からの更新では公式Upgrade情報の確認が必要。'
      ],
      sourceLabel: 'MySQL 9.7.0 Release Notes',
      sourceUrl: 'https://dev.mysql.com/doc/relnotes/mysql/9.7/en/news-9-7-0.html',
      checkedAt: '2026-09-05'
    }
  ],
  windows: [
    {
      version: '11 25H2',
      releaseDate: '2025-09-30',
      summary: 'Windows 11 version 25H2 は、24H2までの継続的な機能更新をまとめ、企業向け管理やCopilot+ PC機能を拡張した年次機能更新です。',
      highlights: [
        'Windows 11 24H2 からは enablement package を利用して25H2へ更新でき、既存の累積更新に含まれる機能を有効化。',
        'Enterprise / Education ではポリシーを使ってプリインストール済みMicrosoft Storeアプリを削除できる管理機能を追加。',
        'Improved Windows Search、Click to Do、File ExplorerのAI actionsなど、24H2以降に段階提供された機能を25H2へ統合。',
        'Quick machine recovery など回復・管理機能を拡張し、IT管理者向けの運用性を改善。',
        '26H1は新しい特定ハードウェア向けで既存端末の機能更新ではないため、既存環境の一般的な更新先としては25H2が引き続き重要。'
      ],
      sourceLabel: 'Windows 11 version 25H2 - What’s new',
      sourceUrl: 'https://learn.microsoft.com/en-us/windows/whats-new/whats-new-windows-11-version-25h2',
      checkedAt: '2026-09-05'
    }
  ],
  'windows-server': [
    {
      version: '2025',
      releaseDate: '2024-11-01',
      summary: 'Windows Server 2025 は、セキュリティ、Active Directory、SMB、仮想化、ストレージ、ハイブリッド管理を強化した長期サポートのサーバーOSです。',
      highlights: [
        '要件を満たす環境では Credential Guard が既定で有効になり、資格情報保護を強化。',
        'SMB over QUIC を Standard / Datacenter でも利用可能にし、暗号化された低遅延のファイル共有接続を拡張。',
        'SMB暗号化、NTLMブロック、認証レート制限、ファイアウォール規則などSMBのセキュリティ機能を強化。',
        'NVMeストレージのIOPSとCPU効率、Storage Replica、ReFSの重複除去・圧縮などストレージ性能を改善。',
        'Windows Server 2012 R2以降からWindows Server 2025への直接インプレースアップグレードをサポート。'
      ],
      sourceLabel: 'Windows Server 2025 - What’s new',
      sourceUrl: 'https://learn.microsoft.com/en-us/windows-server/get-started/whats-new-windows-server-2025',
      checkedAt: '2026-09-05'
    }
  ],
  'docker-engine': [
    {
      version: '29',
      releaseDate: '2025-11-10',
      summary: 'Docker Engine 29 は、containerd image storeの標準化やnftables対応を進める一方、API要件や旧機能の削除を含む互換性確認が重要なメジャーリリースです。',
      highlights: [
        '新規インストールでは containerd image store が既定となり、イメージ管理基盤を標準化。',
        'Docker daemon の firewall-backend で nftables を選べる実験的サポートを追加。',
        'Docker daemon が要求する最小APIバージョンを v1.44（Docker 25.0相当）へ引き上げ。',
        'Docker Content Trust をCLI本体から削除し、必要な場合は別プラグインとして利用する方式へ変更。',
        'docker image load / save の --platform が複数プラットフォーム選択に対応するなどマルチプラットフォーム操作を改善。'
      ],
      sourceLabel: 'Docker Engine 29 release notes',
      sourceUrl: 'https://docs.docker.com/engine/release-notes/29/',
      checkedAt: '2026-09-05'
    }
  ],
  nginx: [
    {
      version: '1.30',
      releaseDate: '2026-04-14',
      summary: 'nginx 1.30 は、1.29系mainlineで導入されたHTTP、TLS、ロードバランシング、ネットワーク機能をstableへ取り込んだリリースです。',
      highlights: [
        'HTTP 103 Early Hints をサポートし、ブラウザへ先行してリソースヒントを送信可能。',
        'バックエンドとの通信でHTTP/2を利用できる機能と、TLSのEncrypted ClientHello対応をstableへ統合。',
        'upstreamのsticky sessionsを追加し、同一クライアントを同じバックエンドへ誘導する構成を支援。',
        'Multipath TCP をサポートし、複数ネットワーク経路を利用できる通信構成へ対応。',
        'proxyの既定HTTPバージョンをHTTP/1.1へ変更し、keep-aliveを既定で活用する方向へ更新。'
      ],
      sourceLabel: 'nginx news: 2026 - nginx 1.30.0 stable',
      sourceUrl: 'https://nginx.org/2026.html',
      checkedAt: '2026-09-05'
    }
  ]
};
