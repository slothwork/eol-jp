export const featuredSlugs = [
  'nodejs', 'python', 'php', 'postgresql', 'mysql', 'ubuntu', 'windows',
  'windows-server', 'kubernetes', 'docker-engine', 'nginx', 'redis', 'mongodb',
  'java', 'dotnet', 'go', 'ruby', 'laravel', 'django', 'nextjs'
];

export const productSummaries: Record<string, string> = {
  nodejs: 'Node.js の各メジャーバージョンについて、Active LTS・Maintenance LTS・EOLの期限を日本語で確認できます。',
  python: 'Python の各バージョンの通常サポート終了日とセキュリティサポート終了日を確認できます。',
  php: 'PHP の各ブランチについて、Active Support と Security Support の終了時期を確認できます。',
  postgresql: 'PostgreSQL の各メジャーバージョンのサポート期限と最新マイナーバージョンを確認できます。',
  kubernetes: 'Kubernetes の各マイナーバージョンのActive Support・Maintenance Support・EOLを確認できます。',
  ubuntu: 'Ubuntu のLTS・通常リリースについて、標準サポート終了時期を確認できます。'
};

export const categoryLabels: Record<string, string> = {
  app: 'アプリケーション',
  database: 'データベース',
  device: 'デバイス',
  framework: 'フレームワーク / ランタイム',
  lang: 'プログラミング言語',
  os: 'OS',
  'server-app': 'サーバー / インフラ',
  service: 'クラウド / サービス',
  standard: '標準規格'
};
