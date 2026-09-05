export type OfficialSourceCoverage =
  | 'direct-dates'
  | 'policy-only'
  | 'vendor-dependent'
  | 'release-status-only';

export type OfficialComparisonStatus = 'pending' | 'matched' | 'partial' | 'not-comparable';

export type OfficialSourceReview = {
  sourceLabel: string;
  sourceUrl: string;
  coverage: OfficialSourceCoverage;
  sourceCheckedAt: string;
  comparisonStatus: OfficialComparisonStatus;
  comparisonCheckedAt?: string;
  note?: string;
};

/**
 * 主要製品について、endoflife.dateとは独立したベンダー/プロジェクト公式ソースを管理する。
 * sourceCheckedAt は「公式ページが確認できた日」であり、EOL日が一致したことを意味しない。
 * comparisonStatus='matched' を付けるのは、サイトのスナップショットと公式日付を人手で照合した場合だけ。
 */
export const officialSourceReviews: Record<string, OfficialSourceReview> = {
  nodejs: {
    sourceLabel: 'Node.js Release Working Group — Release schedule',
    sourceUrl: 'https://github.com/nodejs/Release#release-schedule',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'matched',
    comparisonCheckedAt: '2026-09-05',
    note: '20.x・22.x・24.x・26.xのEOL日を公式Release scheduleと照合し、スナップショットと一致することを確認しました。'
  },
  python: {
    sourceLabel: 'Python Developer’s Guide — Status of Python versions',
    sourceUrl: 'https://devguide.python.org/versions/',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'partial',
    comparisonCheckedAt: '2026-09-05',
    note: '3.12・3.13・3.14のEOL月は公式DevGuideと一致しています。公式表はYYYY-MM粒度で、スナップショットは月末日まで保持するため、日付単位の完全一致とは扱いません。予定はリリースマネージャーにより変更される場合があります。'
  },
  php: {
    sourceLabel: 'PHP — Supported Versions',
    sourceUrl: 'https://www.php.net/supported-versions.php',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'matched',
    comparisonCheckedAt: '2026-09-05',
    note: '8.2・8.3・8.4・8.5のSecurity Support Untilを公式表と照合し、スナップショットのEOL日と一致することを確認しました。'
  },
  postgresql: {
    sourceLabel: 'PostgreSQL — Versioning Policy',
    sourceUrl: 'https://www.postgresql.org/support/versioning/',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'matched',
    comparisonCheckedAt: '2026-09-05',
    note: '14・15・16・17・18のFinal Release日を公式Versioning Policyと照合し、スナップショットのEOL日と一致することを確認しました。'
  },
  mysql: {
    sourceLabel: 'MySQL — Innovation and LTS release model',
    sourceUrl: 'https://dev.mysql.com/doc/refman/8.4/en/mysql-releases.html',
    coverage: 'policy-only',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'pending',
    note: '具体的な保守期限はOracle Lifetime Support Policyも合わせて確認します。'
  },
  ubuntu: {
    sourceLabel: 'Ubuntu — Release cycle',
    sourceUrl: 'https://ubuntu.com/about/release-cycle',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'pending',
    note: 'Standard Security MaintenanceとUbuntu Pro/ESMの期限を区別して確認します。'
  },
  windows: {
    sourceLabel: 'Microsoft Lifecycle — Windows 11 Home and Pro',
    sourceUrl: 'https://learn.microsoft.com/en-us/lifecycle/products/windows-11-home-and-pro',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'pending',
    note: 'エディションとサービスチャネルで期限が異なるため、対象バージョンごとに照合します。'
  },
  'windows-server': {
    sourceLabel: 'Microsoft — Windows Server release information',
    sourceUrl: 'https://learn.microsoft.com/en-us/windows/release-health/windows-server-release-info',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'pending',
    note: 'Mainstream supportとExtended supportを分けて確認します。'
  },
  kubernetes: {
    sourceLabel: 'Kubernetes — Releases',
    sourceUrl: 'https://kubernetes.io/releases/',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'pending'
  },
  'docker-engine': {
    sourceLabel: 'Docker Docs — Docker Engine release notes',
    sourceUrl: 'https://docs.docker.com/engine/release-notes/',
    coverage: 'release-status-only',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'not-comparable',
    comparisonCheckedAt: '2026-09-05',
    note: 'Docker Engineの公開資料はリリースノート中心で、全系列のEOL日を一覧化した公式表としては扱いません。'
  },
  nginx: {
    sourceLabel: 'nginx.org — Download / release information',
    sourceUrl: 'https://nginx.org/en/download.html',
    coverage: 'release-status-only',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'not-comparable',
    comparisonCheckedAt: '2026-09-05',
    note: 'mainline/stableの公開状況は確認できますが、全系列のEOL日を示す公式ライフサイクル表とは区別します。'
  },
  redis: {
    sourceLabel: 'Redis — Redis Open Source version management',
    sourceUrl: 'https://redis.io/docs/latest/operate/oss_and_stack/install/version-mgmt/',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'pending',
    note: 'Redis Open SourceとRedis Cloud/Redis Softwareのライフサイクルを混同しないように確認します。'
  },
  mongodb: {
    sourceLabel: 'MongoDB — Software Lifecycle Schedules',
    sourceUrl: 'https://www.mongodb.com/legal/support-policy/lifecycles',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'pending',
    note: 'AtlasとEnterprise Advanced/MongoDB Serverで対象表が異なるため、MongoDB Server欄を基準に確認します。'
  },
  java: {
    sourceLabel: 'Oracle — Java SE Support Roadmap',
    sourceUrl: 'https://www.oracle.com/java/technologies/java-se-support-roadmap.html',
    coverage: 'vendor-dependent',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'not-comparable',
    comparisonCheckedAt: '2026-09-05',
    note: 'Javaの実際の保守期間はOracle/OpenJDK/Temurinなど利用JDKベンダーに依存するため、一律の一致判定をしません。'
  },
  dotnet: {
    sourceLabel: '.NET — Official support policy',
    sourceUrl: 'https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'matched',
    comparisonCheckedAt: '2026-09-05',
    note: '.NET 8・9・10のEnd of supportを公式表と照合し、スナップショットのEOL日と一致することを確認しました。'
  },
  go: {
    sourceLabel: 'Go — Release History / Release Policy',
    sourceUrl: 'https://go.dev/doc/devel/release',
    coverage: 'policy-only',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'pending',
    note: 'Goは「新しいメジャーリリースが2つ出るまで」をサポートする方針のため、固定EOL日ではなくリリース発生で期限が決まります。'
  },
  ruby: {
    sourceLabel: 'Ruby — Maintenance Branches',
    sourceUrl: 'https://www.ruby-lang.org/en/downloads/branches/',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'pending',
    note: '一部ブランチは保守期限/EOLがTBDのため、未定値は推測しません。'
  },
  laravel: {
    sourceLabel: 'Laravel — Release Notes / Support Policy',
    sourceUrl: 'https://laravel.com/docs/releases',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'pending'
  },
  django: {
    sourceLabel: 'Django — Supported versions / release roadmap',
    sourceUrl: 'https://www.djangoproject.com/download/',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'pending',
    note: '2028年からの年次リリース移行を含め、既存LTSの約束と新方針を分けて確認します。'
  },
  nextjs: {
    sourceLabel: 'Next.js — Support Policy',
    sourceUrl: 'https://nextjs.org/support-policy',
    coverage: 'direct-dates',
    sourceCheckedAt: '2026-09-05',
    comparisonStatus: 'pending'
  }
};

export const officialSourceCoverageLabels: Record<OfficialSourceCoverage, string> = {
  'direct-dates': '公式ページに期限を直接掲載',
  'policy-only': 'サポート方針を掲載（期限は条件依存）',
  'vendor-dependent': 'ベンダーによって期限が異なる',
  'release-status-only': 'リリース状況は確認可能（公式EOL表なし）'
};

export const officialComparisonStatusLabels: Record<OfficialComparisonStatus, string> = {
  pending: '日付照合待ち',
  matched: '公式日付と一致確認済み',
  partial: '一部のみ一致確認済み',
  'not-comparable': '一律比較対象外'
};
