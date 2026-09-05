export type ProductDescription = {
  summary: string;
  details?: string;
};

export type ProductReleaseHighlight = {
  version: string;
  title: string;
  releaseDate?: string;
  checkedAt: string;
  sourceLabel: string;
  sourceUrl: string;
  compatibilityLabel?: string;
  compatibilityUrl?: string;
  highlights: string[];
};

export const productDescriptions: Record<string, ProductDescription> = {
  nodejs: {
    summary: 'Node.js は、Chrome の V8 JavaScript エンジンを利用してサーバーサイドで JavaScript を実行するためのランタイムです。Web API、CLI、バッチ処理など幅広い用途で使われます。',
    details: 'メジャーバージョンごとに Current、Active LTS、Maintenance LTS といった段階で保守されるため、本番運用では LTS 系列を中心に更新計画を立てるのが一般的です。'
  },
  python: {
    summary: 'Python は、読みやすい構文と豊富な標準ライブラリを特徴とする汎用プログラミング言語です。Web 開発、データ分析、AI、業務自動化など幅広い分野で利用されています。',
    details: '各マイナーバージョンは機能追加後にバグ修正・セキュリティ修正の期間へ移行するため、利用中の Python 本体だけでなく依存パッケージの対応状況も確認して更新します。'
  },
  php: {
    summary: 'PHP は、Web サーバー上で動作することを主用途とするオープンソースのスクリプト言語です。WordPress や Laravel をはじめ、多くの Web サイト・Web アプリケーションで利用されています。',
    details: 'マイナーバージョンごとに Active Support と Security Support の期限があり、フレームワークや拡張モジュールの対応状況と合わせて更新する必要があります。'
  },
  postgresql: {
    summary: 'PostgreSQL は、SQL と高度な拡張機能を備えたオープンソースのオブジェクトリレーショナルデータベースです。業務システムから大規模 Web サービスまで幅広く利用されています。',
    details: 'メジャーバージョン間の更新ではストレージ形式や拡張機能の互換性確認が必要になるため、EOL だけでなく公式のアップグレード手順も確認します。'
  },
  mysql: {
    summary: 'MySQL は、Web アプリケーションや業務システムで広く利用されているオープンソースのリレーショナルデータベースです。現在は Oracle が開発・提供しています。',
    details: 'LTS 系列と Innovation 系列などでサポート方針が異なるため、運用目的に合った系列を選び、公式ライフサイクル情報と照合することが重要です。'
  },
  ubuntu: {
    summary: 'Ubuntu は Canonical が提供する Debian 系 Linux ディストリビューションです。デスクトップだけでなく、クラウドやサーバー用途でも広く利用されています。',
    details: '長期運用では LTS リリースが中心となり、標準サポート終了後の延長保守は契約やサービス条件によって扱いが異なります。'
  },
  windows: {
    summary: 'Windows は Microsoft が提供するデスクトップ向けオペレーティングシステムです。個人利用から企業端末まで幅広く利用されています。',
    details: '同じ Windows 11 でもバージョンやエディションによってサポート終了日が異なるため、実際に利用しているエディションとリリースを確認する必要があります。'
  },
  'windows-server': {
    summary: 'Windows Server は Microsoft が提供するサーバー向けオペレーティングシステムです。Active Directory、ファイルサーバー、Hyper-V など企業インフラで利用されます。',
    details: 'メインストリームサポートと延長サポートなど複数の保守段階があるため、サーバーの役割とエディションを確認して更新計画を立てます。'
  },
  kubernetes: {
    summary: 'Kubernetes は、コンテナ化したアプリケーションの配置、スケーリング、更新を自動化するオープンソースのコンテナオーケストレーション基盤です。',
    details: 'マイナーバージョンのサポート期間が比較的短いため、クラスター本体だけでなく CNI、CSI、Ingress、各種アドオンの互換性も継続的に確認する必要があります。'
  },
  'docker-engine': {
    summary: 'Docker Engine は、コンテナイメージの実行・管理を行うためのコンテナランタイムと関連機能を提供する Docker の中核コンポーネントです。',
    details: '更新時は Engine 本体だけでなく Compose、containerd、ホスト OS、利用中の API バージョンとの互換性も確認します。'
  },
  nginx: {
    summary: 'nginx は、高性能な Web サーバー、リバースプロキシ、ロードバランサーとして利用されるオープンソースソフトウェアです。',
    details: 'mainline と stable のリリース系列があり、利用しているモジュールや TLS 設定を含めて更新影響を確認する必要があります。'
  },
  redis: {
    summary: 'Redis は、主にメモリ上でデータを扱う高速なデータストアです。キャッシュ、セッション、キュー、ランキングなど低遅延が求められる用途で利用されます。',
    details: 'メジャー更新ではコマンド仕様、永続化、レプリケーション、クライアントライブラリの互換性を確認してから移行します。'
  },
  mongodb: {
    summary: 'MongoDB は、JSON に近い BSON 形式のドキュメントを保存するドキュメント指向データベースです。柔軟なスキーマを持つアプリケーションで広く利用されています。',
    details: 'メジャー更新では Feature Compatibility Version、ドライバー、レプリカセットやシャーディング構成のアップグレード順序を確認する必要があります。'
  },
  java: {
    summary: 'Java は、Java Virtual Machine（JVM）上で動作するアプリケーションを開発するためのプログラミング言語・プラットフォームです。企業システムを中心に幅広く利用されています。',
    details: 'OpenJDK を基盤に複数ベンダーが JDK を提供しており、実際の無償・有償サポート期間は利用する JDK ベンダーによって異なります。'
  },
  dotnet: {
    summary: '.NET は Microsoft が中心となって開発するクロスプラットフォームのアプリケーション開発基盤です。Web、API、デスクトップ、クラウド、モバイルなどに利用できます。',
    details: 'LTS と STS のリリースがあり、ASP.NET Core、Entity Framework Core、C# など周辺技術の変更も合わせて確認して更新します。'
  },
  go: {
    summary: 'Go は Google で開発が始まった、シンプルな構文と高速なコンパイル、並行処理機能を特徴とする静的型付けのコンパイル言語です。',
    details: 'Go は原則として最新の2つのメジャーリリースをサポートする方針のため、固定EOL日ではなく新しいリリースの公開時期を意識して更新します。'
  },
  ruby: {
    summary: 'Ruby は、簡潔で表現力の高い構文を特徴とするオブジェクト指向の動的プログラミング言語です。Ruby on Rails をはじめとする Web 開発でも広く利用されています。',
    details: '通常保守とセキュリティ保守の期間があるため、Ruby 本体に加えて利用中の gem やフレームワークの対応状況も確認して更新します。'
  },
  laravel: {
    summary: 'Laravel は PHP 向けの Web アプリケーションフレームワークです。ルーティング、ORM、認証、キューなど Web 開発に必要な機能を統合して提供します。',
    details: 'メジャーバージョン更新では PHP の最低要件や依存パッケージ、非推奨 API の変更があるため、公式 Upgrade Guide に沿って段階的に確認します。'
  },
  django: {
    summary: 'Django は Python で Web アプリケーションを構築するためのフルスタック Web フレームワークです。ORM、管理画面、認証、セキュリティ機能などを標準で備えています。',
    details: 'LTS リリースと通常リリースがあり、Django 本体だけでなく対応する Python バージョンやサードパーティパッケージも確認して更新します。'
  },
  nextjs: {
    summary: 'Next.js は React をベースにした Web アプリケーションフレームワークです。サーバーレンダリング、静的生成、ルーティング、サーバー機能などを統合して提供します。',
    details: 'メジャー更新では React、Node.js、ビルド方式、App Router など周辺仕様の変更が影響するため、公式 Upgrade Guide と codemod を確認して移行します。'
  }
};

export const productReleaseHighlights: Record<string, ProductReleaseHighlight[]> = {
  nodejs: [{
    version: '26',
    title: 'Node.js 26 の主な変更',
    releaseDate: '2026-05-05',
    checkedAt: '2026-09-05',
    sourceLabel: 'Node.js 26.0.0 公式リリースノート',
    sourceUrl: 'https://nodejs.org/en/blog/release/v26.0.0',
    highlights: [
      'Temporal API がデフォルトで有効化され、従来の Date より高機能な日時処理を利用しやすくなりました。',
      'V8 JavaScript エンジンが 14.6、Undici が 8.0 系へ更新されています。',
      'プラットフォームの整理に伴う非推奨化・削除も含まれるため、既存アプリケーションは移行前に互換性確認が必要です。'
    ]
  }],
  python: [{
    version: '3.14',
    title: 'Python 3.14 の主な変更',
    releaseDate: '2025-10-07',
    checkedAt: '2026-09-05',
    sourceLabel: 'Python 3.14 公式 What’s New',
    sourceUrl: 'https://docs.python.org/ja/3.14/whatsnew/3.14.html',
    highlights: [
      'テンプレート文字列リテラル（t-string）が追加されました。',
      'アノテーションの遅延評価が導入され、型注釈の評価方法が変更されています。',
      '標準ライブラリに subinterpreters と Zstandard 対応の compression.zstd が追加され、asyncio のイントロスペクションも強化されています。'
    ]
  }],
  php: [{
    version: '8.5',
    title: 'PHP 8.5 の主な変更',
    checkedAt: '2026-09-05',
    sourceLabel: 'PHP 8.5.0 公式リリース案内',
    sourceUrl: 'https://www.php.net/releases/8_5_0.php',
    compatibilityLabel: 'PHP 8.5 公式移行ガイド',
    compatibilityUrl: 'https://www.php.net/manual/ja/migration85.php',
    highlights: [
      'URI を扱うための新しい URI 拡張が追加されました。',
      '値を処理の連鎖へ渡しやすくする pipe operator（|>）が追加されました。',
      'Clone With や #[\\NoDiscard] 属性などが追加される一方、下位互換性のない変更や新たな非推奨項目も含まれます。'
    ]
  }],
  postgresql: [{
    version: '18',
    title: 'PostgreSQL 18 の主な変更',
    releaseDate: '2025-09-25',
    checkedAt: '2026-09-05',
    sourceLabel: 'PostgreSQL 18 公式リリースノート',
    sourceUrl: 'https://www.postgresql.org/docs/18/release-18.html',
    highlights: [
      '非同期 I/O（AIO）サブシステムが導入され、シーケンシャルスキャン、bitmap heap scan、VACUUM などの性能改善が期待できます。',
      'pg_upgrade がオプティマイザ統計を保持するようになり、メジャーアップグレード後の再分析負荷を軽減しやすくなりました。',
      '複合 B-tree インデックスをより多くのケースで利用できる skip scan、uuidv7()、OAuth 認証などが追加されています。'
    ]
  }],
  dotnet: [{
    version: '10',
    title: '.NET 10 の主な変更',
    checkedAt: '2026-09-05',
    sourceLabel: 'Microsoft 公式 .NET 10 の新機能',
    sourceUrl: 'https://learn.microsoft.com/ja-jp/dotnet/core/whats-new/dotnet-10/overview',
    compatibilityLabel: 'Microsoft 公式 .NET 10 Breaking Changes',
    compatibilityUrl: 'https://learn.microsoft.com/en-us/dotnet/core/compatibility/10',
    highlights: [
      '.NET 10 は3年間サポートされる LTS リリースで、JIT、NativeAOT、スタック割り当てなどランタイム最適化が強化されています。',
      'JSON シリアライズ、暗号化、WebSocket などライブラリ API が拡張され、SDK ではコンテナ生成や dotnet test 周辺の機能が強化されています。',
      'C# 14 では field-backed property、extension block、null-conditional assignment などの言語機能が追加されています。'
    ]
  }]
};
