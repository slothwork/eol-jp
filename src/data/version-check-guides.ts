export const versionCheckGuides: Record<string, {
  command: string; example: string; series: string; note: string; source: string; reviewedAt: string;
}> = {
  nodejs: {
    command: 'node --version', example: 'v22.0.0', series: '22',
    note: '先頭のvを除いた最初の数字がメジャー系列です。バージョン管理ツールを使っている場合は、対象プロジェクトの環境を選択してから確認します。',
    source: 'https://nodejs.org/api/cli.html#-v---version', reviewedAt: '2026-09-28'
  },
  python: {
    command: 'python --version', example: 'Python 3.12.0', series: '3.12',
    note: '先頭2つの数字を系列と照合します。普段python3で起動する環境ではpython3 --versionを使い、仮想環境を使う場合は対象の環境で確認します。',
    source: 'https://docs.python.org/3/using/cmdline.html#cmdoption-version', reviewedAt: '2026-09-28'
  },
  php: {
    command: 'php --version', example: 'PHP 8.3.0', series: '8.3',
    note: '先頭2つの数字を系列と照合します。このコマンドはCLI版の確認です。Webサーバー・PHP-FPMで動くPHPとは異なる場合があるため、実際の稼働環境も確認します。',
    source: 'https://www.php.net/manual/ja/features.commandline.options.php', reviewedAt: '2026-09-28'
  }
};
