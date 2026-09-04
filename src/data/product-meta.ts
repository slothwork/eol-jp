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
  mysql: 'MySQL の各リリース系列について、サポート期限・EOL・最新リリースを確認できます。アップグレード計画時は Oracle の公式ライフサイクル情報も合わせて確認してください。',
  ubuntu: 'Ubuntu のLTS・通常リリースについて、標準サポート終了時期を確認できます。',
  windows: 'Windows の各バージョンについて、サポート終了日とライフサイクルを確認できます。エディションやサービスチャネルによる違いは Microsoft の公式情報も確認してください。',
  'windows-server': 'Windows Server の各バージョンについて、サポート期限・EOLを確認できます。運用中のエディションやサポートフェーズと照合して更新計画に利用できます。',
  kubernetes: 'Kubernetes の各マイナーバージョンのActive Support・Maintenance Support・EOLを確認できます。',
  'docker-engine': 'Docker Engine のリリース系列ごとのサポート状況とEOLを確認できます。更新時は Docker のリリースノートと互換性情報も合わせて確認してください。',
  nginx: 'nginx の各リリース系列について、サポート状況・EOL・最新リリースを確認できます。安定版とmainlineの運用方針も公式情報で確認してください。',
  redis: 'Redis の各メジャーバージョンについて、サポート期限・EOL・最新リリースを確認できます。更新前にクライアントや永続化方式との互換性も確認してください。',
  mongodb: 'MongoDB の各メジャーバージョンについて、サポート期限・EOLを確認できます。アップグレード時は Feature Compatibility Version と公式移行手順も確認してください。',
  java: 'Java の各リリースについて、サポート期限・LTSの位置付けを確認できます。実際の保守期間は利用しているJDKベンダーのサポート方針も確認してください。',
  dotnet: '.NET の各メジャーバージョンについて、LTS・STSとサポート終了日を確認できます。更新時は ASP.NET Core や依存ライブラリの互換性も確認してください。',
  go: 'Go の各リリース系列について、サポート状況・EOL・最新リリースを確認できます。利用中バージョンの更新判断に使えます。',
  ruby: 'Ruby の各メジャー・マイナーバージョンについて、通常保守とセキュリティ保守の期限を確認できます。',
  laravel: 'Laravel の各メジャーバージョンについて、バグ修正・セキュリティ修正のサポート期限を確認できます。PHP要件と公式アップグレードガイドも合わせて確認してください。',
  django: 'Django の各リリースについて、通常版・LTSのサポート期限とEOLを確認できます。Python対応バージョンと公式リリースノートも合わせて確認してください。',
  nextjs: 'Next.js の各メジャーバージョンについて、サポート状況・EOL・最新リリースを確認できます。アップグレード時は React やNode.js要件、公式移行ガイドも確認してください。'
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
