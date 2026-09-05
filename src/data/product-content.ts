export type ProductReleaseHighlight = {
  version: string;
  releaseDate: string;
  summary: string;
  highlights: string[];
  sourceLabel: string;
  sourceUrl: string;
  checkedAt: string;
};

export const productOverviews: Record<string, string> = {
  nodejs: 'Node.js は、Chrome と同系統の V8 JavaScript エンジンを利用して、JavaScript をブラウザ外で実行するためのランタイムです。Web API、CLI、ビルドツールなどのサーバーサイド開発で広く利用され、メジャーバージョンごとに Current / LTS のライフサイクルが設定されます。',
  python: 'Python は、読みやすい構文と豊富な標準ライブラリを特徴とする汎用プログラミング言語です。Web開発、データ分析、AI・機械学習、自動化など幅広い用途で利用され、各マイナーバージョンに保守期間が設定されています。',
  php: 'PHP は、主にWebアプリケーションやWebサイトのサーバーサイド処理で利用されるプログラミング言語です。WordPress や Laravel など多くのWebシステムで使われており、各リリース系列には Active Support と Security Support の期間があります。',
  postgresql: 'PostgreSQL は、SQL標準への高い適合性と拡張性を持つオープンソースのリレーショナルデータベースです。業務システムやWebサービスで広く利用され、各メジャーバージョンは長期間の保守対象になります。',
  mysql: 'MySQL は、Webサービスや業務システムで広く利用されているリレーショナルデータベースです。Community Edition や商用サポートを含む複数の提供形態があり、利用している系列とOracleのサポート方針を合わせて確認することが重要です。',
  ubuntu: 'Ubuntu は Canonical が開発・支援する Linux ディストリビューションです。サーバー、クラウド、デスクトップで利用され、長期サポート版の LTS と通常リリースでサポート期間が異なります。',
  windows: 'Windows は Microsoft が提供するクライアント向けオペレーティングシステムです。機能更新ごとにサポート期限が設定され、エディションやサービスチャネルによって終了日が異なる場合があります。',
  'windows-server': 'Windows Server は Microsoft が提供するサーバー向けオペレーティングシステムです。Active Directory、ファイルサービス、仮想化など企業インフラで利用され、バージョンごとにメインストリームおよび延長サポートの期限があります。',
  kubernetes: 'Kubernetes は、コンテナ化されたアプリケーションの配置・スケーリング・運用を自動化するオープンソースのオーケストレーション基盤です。マイナーバージョンごとに比較的短いサポート期間が設定されるため、継続的なアップグレード計画が重要です。',
  'docker-engine': 'Docker Engine は、コンテナイメージの実行や管理を行うコンテナランタイムと関連ツールの基盤です。アプリケーションの開発・配布・運用で広く使われ、リリース系列によって機能やサポート状況が変わります。',
  nginx: 'nginx は、高性能なWebサーバー、リバースプロキシ、ロードバランサーとして利用されるソフトウェアです。Web配信やAPIゲートウェイの前段で広く利用され、mainline と stable のリリース系列があります。',
  redis: 'Redis は、メモリ上のデータを高速に読み書きするキーバリューストアです。キャッシュ、セッション管理、キュー、リアルタイム処理などで利用され、メジャーバージョンごとにサポート期間があります。',
  mongodb: 'MongoDB は、JSONに近いドキュメント形式でデータを扱うドキュメント指向データベースです。柔軟なスキーマを活かしたWebサービスやデータ基盤で利用され、メジャーバージョンごとにサポート期限が設定されます。',
  java: 'Java は、JVM 上で動作するアプリケーションを開発するためのプログラミング言語・実行環境のエコシステムです。企業システムやサーバーアプリケーションで広く利用され、LTSの位置付けや保守期間は利用するJDKベンダーによって異なります。',
  dotnet: '.NET は Microsoft が開発するクロスプラットフォームのアプリケーション開発基盤です。C# などを使ってWeb、API、デスクトップ、クラウドアプリケーションを構築でき、LTS と STS のリリース系列があります。',
  go: 'Go は Google で開発が始まった、シンプルな構文と高速なコンパイル、並行処理機能を特徴とするプログラミング言語です。クラウド基盤、CLI、ネットワークサービスなどで広く利用され、最新2系列を中心に保守されます。',
  ruby: 'Ruby は、オブジェクト指向を中心に設計された動的プログラミング言語です。Ruby on Rails を使ったWeb開発などで広く利用され、各系列は通常保守とセキュリティ保守を経てEOLになります。',
  laravel: 'Laravel は PHP 向けのWebアプリケーションフレームワークです。ルーティング、ORM、キュー、認証などWeb開発に必要な機能を統合しており、メジャーバージョンごとにバグ修正とセキュリティ修正の期限があります。',
  django: 'Django は Python 向けのフルスタックWebアプリケーションフレームワークです。ORM、管理画面、認証などを標準で備え、通常版と長期サポート版の LTS で保守期間が異なります。',
  nextjs: 'Next.js は React を基盤としたWebアプリケーションフレームワークです。サーバーレンダリング、静的生成、ルーティング、サーバー機能などを統合し、メジャーバージョンごとに Active / Maintenance LTS のサポート方針があります。'
};

export const productReleaseHighlights: Record<string, ProductReleaseHighlight[]> = {
  nodejs: [
    {
      version: '24',
      releaseDate: '2025-05-06',
      summary: 'Node.js 24 は V8・npm・HTTPクライアントなどの基盤更新に加え、Web標準APIや非同期コンテキスト周辺の改善を含むメジャーリリースです。',
      highlights: [
        'V8 13.6 へ更新され、Float16Array、RegExp.escape、WebAssembly Memory64 など新しいJavaScript機能に対応。',
        'npm 11 と Undici 7 を同梱し、パッケージ管理とHTTPクライアント基盤を更新。',
        'URLPattern がグローバルで利用可能になり、AsyncLocalStorage は AsyncContextFrame を既定で利用。',
        'url.parse() など一部APIの非推奨化・削除が進んでいるため、22系からの移行では互換性確認が必要。'
      ],
      sourceLabel: 'Node.js 24.0.0 release notes',
      sourceUrl: 'https://nodejs.org/en/blog/release/v24.0.0',
      checkedAt: '2026-09-05'
    }
  ],
  python: [
    {
      version: '3.14',
      releaseDate: '2025-10-07',
      summary: 'Python 3.14 は言語機能、標準ライブラリ、対話環境を幅広く更新したリリースです。',
      highlights: [
        'テンプレート文字列リテラル（t-strings）を追加。',
        'アノテーションの遅延評価を導入し、型注釈の扱いを改善。',
        '標準ライブラリに subinterpreters と Zstandard 圧縮サポートを追加。',
        'REPLの構文ハイライトや asyncio のイントロスペクション機能を改善。'
      ],
      sourceLabel: 'Python 3.14 What’s New',
      sourceUrl: 'https://docs.python.org/ja/3/whatsnew/3.14.html',
      checkedAt: '2026-09-05'
    }
  ],
  php: [
    {
      version: '8.5',
      releaseDate: '2025-11-20',
      summary: 'PHP 8.5 は言語構文、標準関数、URL処理、Web向けAPIなどを拡張したリリースです。',
      highlights: [
        'パイプ演算子（|>）を追加し、関数呼び出しの連結を簡潔に記述可能。',
        '#[NoDiscard] 属性と (void) キャストを追加し、戻り値を意図的に無視するかどうかを表現可能。',
        'RFC 3986 / WHATWG URL を扱う常時有効の URI 拡張を追加。',
        'array_first() / array_last()、partitioned cookie 対応など標準APIを拡充。',
        '互換性のない変更や非推奨化も含むため、本番移行前に公式移行ガイドで確認が必要。'
      ],
      sourceLabel: 'PHP 8.5 Migration Guide',
      sourceUrl: 'https://www.php.net/manual/ja/migration85.php',
      checkedAt: '2026-09-05'
    }
  ],
  postgresql: [
    {
      version: '18',
      releaseDate: '2025-09-25',
      summary: 'PostgreSQL 18 はI/O性能、インデックス利用、認証、SQL機能などを強化したメジャーリリースです。',
      highlights: [
        '非同期I/O（AIO）サブシステムを導入し、シーケンシャルスキャンやVACUUMなどの性能改善を可能に。',
        '複合B-treeインデックスをより多くの条件で利用できる skip scan を追加。',
        '時系列順のUUIDを生成する uuidv7() を追加。',
        '仮想生成列をサポートし、生成列の既定方式として利用。',
        'OAuth認証や、INSERT / UPDATE / DELETE / MERGE の RETURNING で OLD / NEW を参照する機能を追加。'
      ],
      sourceLabel: 'PostgreSQL 18 release notes',
      sourceUrl: 'https://www.postgresql.org/docs/18/release-18.html',
      checkedAt: '2026-09-05'
    }
  ],
  dotnet: [
    {
      version: '10',
      releaseDate: '2025-11-11',
      summary: '.NET 10 は3年間サポートされるLTSリリースで、ランタイム、ライブラリ、SDK、ASP.NET Coreなど広い範囲が更新されています。',
      highlights: [
        'JITのインライン化、仮想呼び出し最適化、スタック割り当てなどランタイム性能を改善。',
        'NativeAOTやAVX10.2対応など、ネイティブ実行・コード生成機能を強化。',
        '暗号、JSONシリアライズ、ネットワーク、診断など標準ライブラリのAPIを拡充。',
        'SDKでは dotnet test の Microsoft.Testing.Platform 対応やCLI操作性を改善。',
        'ASP.NET Core、EF Core、.NET MAUI、C# 14など関連スタックも同時に更新。'
      ],
      sourceLabel: '.NET 10 の新機能',
      sourceUrl: 'https://learn.microsoft.com/ja-jp/dotnet/core/whats-new/dotnet-10/overview',
      checkedAt: '2026-09-05'
    }
  ]
};
