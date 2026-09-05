export type JapanCommercialSupportSource = {
  label: string;
  url: string;
};

export type JapanCommercialSupport = {
  provider: string;
  service: string;
  summary: string;
  details: string[];
  sources: JapanCommercialSupportSource[];
  checkedAt: string;
  caveat?: string;
};

export const japanCommercialSupportByProduct: Record<string, JapanCommercialSupport> = {
  ubuntu: {
    provider: 'Canonical',
    service: 'Ubuntu Pro + サポート',
    summary: 'Canonicalは日本向け公式ページでUbuntu Proを案内しており、Ubuntu LTSのセキュリティ保守延長と、追加の企業向け技術サポートを提供しています。',
    details: [
      'Expanded Security Maintenance（ESM）により、Ubuntuの対象パッケージに対する長期の脆弱性対応を提供。',
      'Ubuntu Pro + サポートでは、電話とチケットによる24時間体制の技術サポートを利用可能。',
      'Ubuntu OSだけでなく、OpenStack、Ceph、Kubernetes、PostgreSQLなど対象範囲の広いオープンソーススタックを支援。'
    ],
    sources: [
      { label: 'Ubuntu Pro エンタープライズ向けサポート', url: 'https://jp.ubuntu.com/pro' }
    ],
    checkedAt: '2026-09-05'
  },
  mysql: {
    provider: 'Oracle Japan',
    service: 'MySQL Enterprise Edition / Oracle Support',
    summary: 'MySQL Enterprise Editionにはテクニカルサポートが含まれ、日本オラクルはMySQL向けの国内サポート窓口を案内しています。',
    details: [
      'MySQL Enterprise Editionは、高度な機能、管理ツール、テクニカルサポートを含む商用製品。',
      '日本のMySQLサポート窓口としてMy Oracle Supportと国内電話窓口が案内されている。',
      '契約内容、対象バージョン、価格、SLAは導入前にOracleの最新条件を確認する必要がある。'
    ],
    sources: [
      { label: 'MySQL Enterprise Edition', url: 'https://www.oracle.com/jp/mysql/enterprise/' },
      { label: 'Oracle 日本 製品別サポート窓口', url: 'https://www.oracle.com/jp/support/support-services-list/' }
    ],
    checkedAt: '2026-09-05'
  },
  java: {
    provider: 'Oracle Japan',
    service: 'Java SE Universal Subscription',
    summary: 'Oracle Java SE Universal Subscriptionは、Oracle Java SEの商用ライセンスとサポートをまとめて提供するサブスクリプションです。',
    details: [
      'デスクトップ、サーバー、クラウドで利用するJava SEのライセンスとサポートを提供。',
      'My Oracle Support（MOS）への24時間365日のアクセスと、複数言語でのサポートが含まれる。',
      '古いJava系列を継続利用する場合は、Oracle Java SE Support Roadmapで対象期間を確認する必要がある。'
    ],
    sources: [
      { label: 'Java SE Universal Subscription FAQ', url: 'https://www.oracle.com/jp/java/technologies/java-se-subscription-faq.html' },
      { label: 'Oracle Java SE Support ロードマップ', url: 'https://www.oracle.com/jp/java/technologies/java-se-support-roadmap.html' }
    ],
    checkedAt: '2026-09-05'
  },
  windows: {
    provider: 'Microsoft',
    service: 'Windows 10 Extended Security Updates（ESU）',
    summary: 'Windows 10の通常サポート終了後も継続利用が必要な組織向けに、Microsoftは有償のExtended Security Updates（ESU）を提供しています。',
    details: [
      'Windows 10 version 22H2を対象に、サポート終了後も重要・緊急のセキュリティ更新を受け取れる有料プログラム。',
      '商用・教育機関の登録済みPCは、通常サポート終了後から最大3年間のセキュリティ更新を受けられる。',
      'ESUには新機能や一般的なテクニカルサポートは含まれないため、Windows 11への移行を代替する恒久的な保守契約ではない。'
    ],
    sources: [
      { label: 'Windows 10 Extended Security Updates（ESU）', url: 'https://learn.microsoft.com/ja-jp/windows/whats-new/extended-security-updates' }
    ],
    checkedAt: '2026-09-05',
    caveat: 'この情報はWindows製品全体ではなく、主にWindows 10のサポート終了後対応に関するものです。Windows 11の通常サポートとは扱いが異なります。'
  },
  'windows-server': {
    provider: 'Microsoft',
    service: 'Windows Server Extended Security Updates（ESU）',
    summary: 'Microsoftは、通常サポートが終了した対象Windows Serverを一定期間継続運用するためのExtended Security Updates（ESU）を提供しています。',
    details: [
      '対象となる旧Windows Serverについて、サポート終了後も重要・緊急のセキュリティ更新を一定期間提供。',
      'Azure Arc経由では従量課金型のESUを利用でき、ボリュームライセンスによる年単位購入の選択肢も案内されている。',
      'ESUは移行猶予を確保するための仕組みであり、新機能提供や通常の製品ライフサイクル延長とは異なる。'
    ],
    sources: [
      { label: 'Windows Server 拡張セキュリティ更新プログラム', url: 'https://www.microsoft.com/ja-jp/windows-server/extended-security-updates' },
      { label: '製品ライフサイクル FAQ - ESU', url: 'https://learn.microsoft.com/ja-jp/lifecycle/faq/extended-security-updates' }
    ],
    checkedAt: '2026-09-05'
  },
  nginx: {
    provider: 'F5',
    service: 'F5 NGINX 商用サポート',
    summary: 'F5はNGINXの商用製品向けにサポート窓口、商用ソフトウェア更新、製品ドキュメントを提供しています。',
    details: [
      'MyF5やテクニカルサポート窓口からF5 NGINX製品の問い合わせやサポートケースを利用可能。',
      'NGINX Commercial製品向けのソフトウェア更新と製品ドキュメントが提供される。',
      'F5の一般サポートポリシーでは、無償のオープンソース版は原則として商用サポート義務の対象外とされている。'
    ],
    sources: [
      { label: 'F5 Global Support - NGINX', url: 'https://www.f5.com/ja_jp/support' },
      { label: 'F5 Support Policies', url: 'https://www.f5.com/ja_jp/company/policies/support-policies' }
    ],
    checkedAt: '2026-09-05',
    caveat: 'nginx Open SourceそのものにF5の商用サポートが自動で付くわけではありません。利用するF5 NGINX商用製品と契約条件を確認してください。'
  }
};
