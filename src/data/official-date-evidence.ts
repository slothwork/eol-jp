import {
  officialSourceReviews,
  type OfficialComparisonStatus,
  type OfficialSourceReview
} from './official-source-reviews.ts';

export type OfficialDateEvidence = {
  release: string;
  officialEol: string;
  sourceUrl: string;
  precision: 'day' | 'month';
};

export type ResolvedOfficialSourceReview = OfficialSourceReview & {
  evidence?: OfficialDateEvidence[];
};

type ReviewOverride = {
  comparisonStatus: OfficialComparisonStatus;
  comparisonCheckedAt: string;
  note: string;
  evidence: OfficialDateEvidence[];
};

const comparisonOverrides: Record<string, ReviewOverride> = {
  mysql: {
    comparisonStatus: 'partial',
    comparisonCheckedAt: '2026-09-05',
    note: 'Oracle Lifetime Support PolicyでMySQL Database 8.0のExtended Support終了が2026年4月、8.4が2032年4月であることを確認し、スナップショットのEOL月と一致しました。公式表は月粒度のため日付単位の完全一致とは扱いません。',
    evidence: [
      {
        release: '8.4',
        officialEol: '2032-04-01',
        sourceUrl: 'https://www.oracle.com/assets/lsp-tech-chart-069290.pdf',
        precision: 'month'
      },
      {
        release: '8.0',
        officialEol: '2026-04-01',
        sourceUrl: 'https://www.oracle.com/assets/lsp-tech-chart-069290.pdf',
        precision: 'month'
      }
    ]
  },
  ubuntu: {
    comparisonStatus: 'partial',
    comparisonCheckedAt: '2026-09-05',
    note: 'Ubuntu 24.04 LTSのStandard Security Maintenance終了日（2029-05-31）は公式24.04リリースノートと一致しました。26.04など公式Release cycleが月粒度で示す系列やUbuntu Pro/ESMは別フェーズのため、全系列の完全一致とは扱いません。',
    evidence: [
      {
        release: '24.04',
        officialEol: '2029-05-31',
        sourceUrl: 'https://documentation.ubuntu.com/release-notes/24.04/',
        precision: 'day'
      }
    ]
  },
  windows: {
    comparisonStatus: 'partial',
    comparisonCheckedAt: '2026-09-05',
    note: 'Windows 11 Home/Proの24H2・23H2についてMicrosoft Lifecycleの終了日と一致を確認しました。Windows製品データにはEnterprise/Education/IoTなど別エディションも含まれ、サポート期間が異なるため部分照合とします。',
    evidence: [
      {
        release: '11-24h2-w',
        officialEol: '2026-10-13',
        sourceUrl: 'https://learn.microsoft.com/en-us/lifecycle/products/windows-11-home-and-pro',
        precision: 'day'
      },
      {
        release: '11-23h2-w',
        officialEol: '2025-11-11',
        sourceUrl: 'https://learn.microsoft.com/en-us/lifecycle/products/windows-11-home-and-pro',
        precision: 'day'
      }
    ]
  },
  'windows-server': {
    comparisonStatus: 'matched',
    comparisonCheckedAt: '2026-09-05',
    note: 'Windows Server 2025・2022のExtended support end dateをMicrosoft公式Release Informationと照合し、スナップショットのEOL日と一致することを確認しました。',
    evidence: [
      {
        release: '2025',
        officialEol: '2034-11-14',
        sourceUrl: 'https://learn.microsoft.com/en-us/windows/release-health/windows-server-release-info',
        precision: 'day'
      },
      {
        release: '2022',
        officialEol: '2031-10-14',
        sourceUrl: 'https://learn.microsoft.com/en-us/windows/release-health/windows-server-release-info',
        precision: 'day'
      }
    ]
  },
  kubernetes: {
    comparisonStatus: 'matched',
    comparisonCheckedAt: '2026-09-05',
    note: '1.33・1.34・1.35のEnd of Life日をKubernetes公式Releasesと照合し、スナップショットと一致することを確認しました。',
    evidence: [
      {
        release: '1.35',
        officialEol: '2027-02-28',
        sourceUrl: 'https://kubernetes.io/releases/',
        precision: 'day'
      },
      {
        release: '1.34',
        officialEol: '2026-10-27',
        sourceUrl: 'https://kubernetes.io/releases/',
        precision: 'day'
      },
      {
        release: '1.33',
        officialEol: '2026-06-28',
        sourceUrl: 'https://kubernetes.io/releases/',
        precision: 'day'
      }
    ]
  },
  redis: {
    comparisonStatus: 'matched',
    comparisonCheckedAt: '2026-09-05',
    note: 'Redis Open Sourceの8.2・8.0・7.4・7.2・6.2について公式Version ManagementのEOL日とスナップショットが一致することを確認しました。Redis Cloud/Redis Softwareの別ライフサイクルとは分離して扱います。',
    evidence: [
      {
        release: '8.2',
        officialEol: '2030-09-01',
        sourceUrl: 'https://redis.io/docs/latest/operate/oss_and_stack/install/version-mgmt/',
        precision: 'day'
      },
      {
        release: '8.0',
        officialEol: '2026-12-01',
        sourceUrl: 'https://redis.io/docs/latest/operate/oss_and_stack/install/version-mgmt/',
        precision: 'day'
      },
      {
        release: '7.4',
        officialEol: '2029-12-01',
        sourceUrl: 'https://redis.io/docs/latest/operate/oss_and_stack/install/version-mgmt/',
        precision: 'day'
      },
      {
        release: '7.2',
        officialEol: '2029-12-01',
        sourceUrl: 'https://redis.io/docs/latest/operate/oss_and_stack/install/version-mgmt/',
        precision: 'day'
      },
      {
        release: '6.2',
        officialEol: '2027-04-01',
        sourceUrl: 'https://redis.io/docs/latest/operate/oss_and_stack/install/version-mgmt/',
        precision: 'day'
      }
    ]
  },
  mongodb: {
    comparisonStatus: 'matched',
    comparisonCheckedAt: '2026-09-05',
    note: 'MongoDB Enterprise AdvancedのMongoDB Server欄を基準に、8.3・8.2・8.0・7.0のEOL日とスナップショットが一致することを確認しました。Atlas Auto UpgradeやOps Managerの期限とは分離しています。',
    evidence: [
      {
        release: '8.3',
        officialEol: '2029-10-31',
        sourceUrl: 'https://www.mongodb.com/legal/support-policy/lifecycles',
        precision: 'day'
      },
      {
        release: '8.2',
        officialEol: '2026-07-31',
        sourceUrl: 'https://www.mongodb.com/legal/support-policy/lifecycles',
        precision: 'day'
      },
      {
        release: '8.0',
        officialEol: '2029-10-31',
        sourceUrl: 'https://www.mongodb.com/legal/support-policy/lifecycles',
        precision: 'day'
      },
      {
        release: '7.0',
        officialEol: '2027-08-31',
        sourceUrl: 'https://www.mongodb.com/legal/support-policy/lifecycles',
        precision: 'day'
      }
    ]
  },
  go: {
    comparisonStatus: 'not-comparable',
    comparisonCheckedAt: '2026-09-05',
    note: 'Go公式は各メジャー版を「より新しいメジャー版が2つ出るまで」サポートするイベント駆動の方針です。固定EOL日の公式一覧ではないため、一律の日付一致判定は行いません。',
    evidence: []
  },
  ruby: {
    comparisonStatus: 'partial',
    comparisonCheckedAt: '2026-09-05',
    note: 'Ruby 3.3（2027-03-31予定）と3.1（2025-03-26）は公式Maintenance Branchesと一致しました。一方、Ruby 3.2は公式が2026-04-01、スナップショットが2026-03-31で1日差があり、4.0・3.4は公式EOLがTBDのため、全体は部分照合とします。',
    evidence: [
      {
        release: '3.3',
        officialEol: '2027-03-31',
        sourceUrl: 'https://www.ruby-lang.org/en/downloads/branches/',
        precision: 'day'
      },
      {
        release: '3.1',
        officialEol: '2025-03-26',
        sourceUrl: 'https://www.ruby-lang.org/en/downloads/branches/',
        precision: 'day'
      }
    ]
  },
  laravel: {
    comparisonStatus: 'matched',
    comparisonCheckedAt: '2026-09-05',
    note: 'Laravel 11・12・13のSecurity Fixes Untilを公式Release Notesと照合し、スナップショットのEOL日と一致することを確認しました。',
    evidence: [
      {
        release: '13',
        officialEol: '2028-03-17',
        sourceUrl: 'https://laravel.com/docs/releases',
        precision: 'day'
      },
      {
        release: '12',
        officialEol: '2027-02-24',
        sourceUrl: 'https://laravel.com/docs/releases',
        precision: 'day'
      },
      {
        release: '11',
        officialEol: '2026-03-12',
        sourceUrl: 'https://laravel.com/docs/releases',
        precision: 'day'
      }
    ]
  },
  django: {
    comparisonStatus: 'partial',
    comparisonCheckedAt: '2026-09-05',
    note: 'Django 4.2・5.0・5.1のExtended Support終了日は公式表と日単位で一致しました。現行5.2 LTS・6.0・6.1は公式が月粒度で示すため、EOL月のみ一致確認とし部分照合にします。',
    evidence: [
      {
        release: '6.1',
        officialEol: '2027-12-01',
        sourceUrl: 'https://www.djangoproject.com/download/',
        precision: 'month'
      },
      {
        release: '6.0',
        officialEol: '2027-04-01',
        sourceUrl: 'https://www.djangoproject.com/download/',
        precision: 'month'
      },
      {
        release: '5.2',
        officialEol: '2028-04-01',
        sourceUrl: 'https://www.djangoproject.com/download/',
        precision: 'month'
      },
      {
        release: '5.1',
        officialEol: '2025-12-03',
        sourceUrl: 'https://www.djangoproject.com/download/',
        precision: 'day'
      },
      {
        release: '5.0',
        officialEol: '2025-04-02',
        sourceUrl: 'https://www.djangoproject.com/download/',
        precision: 'day'
      },
      {
        release: '4.2',
        officialEol: '2026-04-07',
        sourceUrl: 'https://www.djangoproject.com/download/',
        precision: 'day'
      }
    ]
  },
  nextjs: {
    comparisonStatus: 'not-comparable',
    comparisonCheckedAt: '2026-09-05',
    note: 'Next.js公式Support PolicyはActive LTS / Maintenance LTSのルールと対象メジャーを示しますが、固定EOL日の一覧を公開していません。リリース発生とポリシーから導出されるため、一律の日付一致判定は行いません。',
    evidence: []
  }
};

export const resolvedOfficialSourceReviews: Record<string, ResolvedOfficialSourceReview> = Object.fromEntries(
  Object.entries(officialSourceReviews).map(([slug, review]) => [
    slug,
    comparisonOverrides[slug] ? { ...review, ...comparisonOverrides[slug] } : review
  ])
);
