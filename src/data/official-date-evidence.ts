import {
  officialSourceReviews,
  type OfficialComparisonStatus,
  type OfficialSourceReview
} from './official-source-reviews';

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
        release: '11 24H2 (W)',
        officialEol: '2026-10-13',
        sourceUrl: 'https://learn.microsoft.com/en-us/lifecycle/products/windows-11-home-and-pro',
        precision: 'day'
      },
      {
        release: '11 23H2 (W)',
        officialEol: '2025-11-11',
        sourceUrl: 'https://learn.microsoft.com/en-us/lifecycle/products/windows-11-home-and-pro',
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
  }
};

export const resolvedOfficialSourceReviews: Record<string, ResolvedOfficialSourceReview> = Object.fromEntries(
  Object.entries(officialSourceReviews).map(([slug, review]) => [
    slug,
    comparisonOverrides[slug] ? { ...review, ...comparisonOverrides[slug] } : review
  ])
);
