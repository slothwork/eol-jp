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

export type ProductMigrationGuide = {
  label: string;
  url: string;
  note?: string;
};

export const productMigrationGuides: Record<string, ProductMigrationGuide> = {
  nodejs: {
    label: 'Node.js 公式 Migration Guides',
    url: 'https://nodejs.org/en/blog/migrations'
  },
  python: {
    label: 'Python 公式 What’s New / Porting情報',
    url: 'https://docs.python.org/3/whatsnew/index.html'
  },
  php: {
    label: 'PHP 公式 移行ガイド',
    url: 'https://www.php.net/manual/ja/migration85.php'
  },
  postgresql: {
    label: 'PostgreSQL 公式 Upgrading a PostgreSQL Cluster',
    url: 'https://www.postgresql.org/docs/current/upgrading.html'
  },
  mysql: {
    label: 'MySQL 公式 Upgrading MySQL',
    url: 'https://dev.mysql.com/doc/refman/8.4/en/upgrading.html'
  },
  ubuntu: {
    label: 'Ubuntu 公式 Release Upgrade Guide',
    url: 'https://documentation.ubuntu.com/server/how-to/software/upgrade-your-release/'
  },
  windows: {
    label: 'Microsoft 公式 Windowsアップグレード・移行ガイド',
    url: 'https://learn.microsoft.com/ja-jp/windows/deployment/upgrade/windows-upgrade-and-migration-considerations'
  },
  'windows-server': {
    label: 'Microsoft 公式 Windows Server Upgrade Path',
    url: 'https://learn.microsoft.com/en-us/windows-server/get-started/install-upgrade-migrate'
  },
  kubernetes: {
    label: 'Kubernetes 公式 kubeadmアップグレードガイド',
    url: 'https://kubernetes.io/ja/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/'
  },
  'docker-engine': {
    label: 'Docker 公式 Docker Engine Install / Upgrade',
    url: 'https://docs.docker.com/engine/install/'
  },
  nginx: {
    label: 'nginx 公式 Executable Upgrade',
    url: 'https://nginx.org/en/docs/control.html#upgrade'
  },
  redis: {
    label: 'Redis 公式 Upgrade Redis Open Source',
    url: 'https://redis.io/docs/latest/operate/oss_and_stack/install/upgrade/'
  },
  mongodb: {
    label: 'MongoDB 公式 Versioning / Upgrade Path',
    url: 'https://www.mongodb.com/docs/manual/reference/versioning/'
  },
  java: {
    label: 'Oracle JDK Migration Guide',
    url: 'https://docs.oracle.com/en/java/javase/26/migrate/index.html',
    note: 'JDKベンダーによって移行手順やサポート条件が異なるため、実際に利用しているJDKベンダーの資料も確認してください。'
  },
  dotnet: {
    label: 'Microsoft 公式 .NET Upgrade Overview',
    url: 'https://learn.microsoft.com/en-us/dotnet/core/porting/'
  },
  go: {
    label: 'Go 公式 Release History / Release Notes',
    url: 'https://go.dev/doc/devel/release'
  },
  laravel: {
    label: 'Laravel 公式 Upgrade Guide',
    url: 'https://laravel.com/docs/13.x/upgrade'
  },
  django: {
    label: 'Django 公式 Upgrade Guide',
    url: 'https://docs.djangoproject.com/en/6.0/howto/upgrade-version/'
  },
  nextjs: {
    label: 'Next.js 公式 Upgrade Guides',
    url: 'https://nextjs.org/docs/app/guides/upgrading'
  }
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
