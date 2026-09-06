import {
  analyzePublicGitHubRepository,
  resolveImportCandidates,
  type GitHubImportProgress,
  type ImportCatalogProduct,
  type ImportResolution
} from '@/lib/github-import';
import {
  TRACKED_PRODUCTS_STORAGE_KEY,
  parseTrackedProducts,
  serializeTrackedProducts,
  setTrackedProduct
} from '@/lib/tracked-products';

const form = document.querySelector<HTMLFormElement>('[data-github-import-form]');
const input = document.querySelector<HTMLInputElement>('[data-github-repository-url]');
const submit = document.querySelector<HTMLButtonElement>('[data-github-import-submit]');
const status = document.querySelector<HTMLElement>('[data-github-import-status]');
const results = document.querySelector<HTMLElement>('[data-github-import-results]');
const repositoryLink = document.querySelector<HTMLAnchorElement>('[data-github-import-repository-link]');
const readyWrap = document.querySelector<HTMLElement>('[data-github-import-ready-wrap]');
const readyList = document.querySelector<HTMLElement>('[data-github-import-ready]');
const saveButton = document.querySelector<HTMLButtonElement>('[data-github-import-save]');
const saveMessage = document.querySelector<HTMLElement>('[data-github-import-save-message]');
const noReady = document.querySelector<HTMLElement>('[data-github-import-no-ready]');
const conflictsWrap = document.querySelector<HTMLElement>('[data-github-import-conflicts-wrap]');
const conflictsList = document.querySelector<HTMLElement>('[data-github-import-conflicts]');
const unmatchedWrap = document.querySelector<HTMLElement>('[data-github-import-unmatched-wrap]');
const unmatchedList = document.querySelector<HTMLElement>('[data-github-import-unmatched]');
const warningsWrap = document.querySelector<HTMLElement>('[data-github-import-warnings-wrap]');
const warningsList = document.querySelector<HTMLElement>('[data-github-import-warnings]');

let resolution: ImportResolution | null = null;
let catalogPromise: Promise<ImportCatalogProduct[]> | null = null;

const progressText: Record<GitHubImportProgress, string> = {
  repository: '公開リポジトリを確認しています。',
  manifests: 'バージョン指定ファイルを確認しています。',
  sbom: 'GitHub Dependency GraphのSBOMを生成・確認しています。',
  complete: '解析結果を整理しています。'
};

const errorText = (code: string) => ({
  invalid_repository_url: 'GitHubの公開リポジトリURLを入力してください。',
  repository_not_found: '公開リポジトリが見つかりません。URLまたは公開設定を確認してください。',
  private_repository_not_supported: 'privateリポジトリは現在対応していません。',
  repository_lookup_failed: 'GitHubからリポジトリ情報を取得できませんでした。',
  github_rate_limited: 'GitHub REST APIの未認証レート制限に達しました。時間を空けてから再度お試しください。',
  github_request_failed: 'GitHub APIへ接続できませんでした。ネットワーク状態を確認してください。'
} as Record<string, string>)[code] ?? '解析に失敗しました。URLとGitHubの状態を確認して再度お試しください。';

const warningText = (code: string) => ({
  manifest_list_unavailable: 'リポジトリ直下のファイル一覧を取得できなかったため、マニフェスト補完を省略しました。',
  manifest_fetch_partial: '一部のバージョン指定ファイルを取得できませんでした。',
  sbom_unavailable: 'このリポジトリではDependency GraphのSBOMを取得できませんでした。マニフェスト検出結果のみ表示しています。',
  sbom_generate_failed: 'SBOM生成要求を完了できませんでした。マニフェスト検出結果のみ表示しています。',
  sbom_fetch_failed: '生成したSBOMを取得できませんでした。マニフェスト検出結果のみ表示しています。',
  sbom_parse_failed: 'SBOMを解析できませんでした。マニフェスト検出結果のみ表示しています。',
  sbom_pending_timeout: 'SBOM生成が今回の確認回数内に完了しませんでした。再解析すると取得できる場合があります。',
  sbom_too_large: 'SBOMがMVPの解析上限を超えたため、SBOM解析を省略しました。',
  github_rate_limited: '解析途中でGitHub REST APIの未認証レート制限に達しました。',
  github_request_failed: '解析途中でGitHub APIへの接続に失敗しました。'
} as Record<string, string>)[code] ?? `解析の一部を完了できませんでした（${code}）。`;

function loadCatalog(): Promise<ImportCatalogProduct[]> {
  if (!catalogPromise) {
    catalogPromise = fetch('/my-eol-data.json')
      .then((response) => {
        if (!response.ok) throw new Error('catalog_fetch_failed');
        return response.json() as Promise<{ products?: ImportCatalogProduct[] }>;
      })
      .then((data) => data.products ?? []);
  }
  return catalogPromise;
}

function makeMeta(text: string) {
  const p = document.createElement('p');
  p.className = 'muted';
  p.textContent = text;
  return p;
}

function clearResults() {
  resolution = null;
  if (results) results.hidden = true;
  if (readyList) readyList.replaceChildren();
  if (conflictsList) conflictsList.replaceChildren();
  if (unmatchedList) unmatchedList.replaceChildren();
  if (warningsList) warningsList.replaceChildren();
  if (saveMessage) saveMessage.hidden = true;
}

function renderReady(next: ImportResolution) {
  if (!readyWrap || !readyList || !noReady) return;
  readyList.replaceChildren();
  readyWrap.hidden = next.ready.length === 0;
  noReady.hidden = next.ready.length !== 0;

  let tracked = parseTrackedProducts(null);
  try { tracked = parseTrackedProducts(localStorage.getItem(TRACKED_PRODUCTS_STORAGE_KEY)); } catch { /* localStorage unavailable */ }

  next.ready.forEach((candidate, index) => {
    const article = document.createElement('article');
    article.className = 'history-item github-import-candidate';

    const choice = document.createElement('label');
    choice.className = 'github-import-choice';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.dataset.githubImportCandidate = candidate.slug;
    checkbox.setAttribute('aria-label', `${candidate.label} ${candidate.version} をマイEOLへ保存`);

    const content = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = `${candidate.label} ${candidate.version}`;
    const detected = makeMeta(`検出バージョン: ${candidate.detectedVersions.join(' / ')}`);
    const sources = makeMeta(`検出元: ${candidate.sources.join(' / ')}`);
    content.append(title, detected, sources);

    const current = tracked.products[candidate.slug];
    if (current) {
      const existing = makeMeta(current.version === candidate.version
        ? `マイEOL: ${current.version} を保存済み`
        : `マイEOL: ${current.version} を保存中（保存すると ${candidate.version} に更新）`);
      existing.classList.add('github-import-existing');
      content.append(existing);
    }

    choice.htmlFor = `github-import-candidate-${index}`;
    checkbox.id = `github-import-candidate-${index}`;
    choice.append(checkbox, content);
    article.append(choice);
    readyList.append(article);
  });
}

function renderConflicts(next: ImportResolution) {
  if (!conflictsWrap || !conflictsList) return;
  conflictsList.replaceChildren();
  conflictsWrap.hidden = next.conflicts.length === 0;
  next.conflicts.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'history-item';
    const title = document.createElement('strong');
    title.textContent = item.label;
    article.append(
      title,
      makeMeta(`検出バージョン: ${item.detectedVersions.join(' / ')}`),
      makeMeta(`対応候補系列: ${item.matchedVersions.join(' / ')}`),
      makeMeta(`検出元: ${item.sources.join(' / ')}`)
    );
    conflictsList.append(article);
  });
}

function renderUnmatched(next: ImportResolution) {
  if (!unmatchedWrap || !unmatchedList) return;
  unmatchedList.replaceChildren();
  unmatchedWrap.hidden = next.unmatched.length === 0;
  next.unmatched.forEach((item) => {
    const article = document.createElement('article');
    article.className = 'history-item';
    const title = document.createElement('strong');
    title.textContent = `${item.label} ${item.detectedVersion}`;
    article.append(title, makeMeta(`検出元: ${item.source}`));
    unmatchedList.append(article);
  });
}

function renderWarnings(codes: string[]) {
  if (!warningsWrap || !warningsList) return;
  warningsList.replaceChildren();
  warningsWrap.hidden = codes.length === 0;
  for (const code of codes) {
    const li = document.createElement('li');
    li.textContent = warningText(code);
    warningsList.append(li);
  }
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const repositoryUrl = input?.value.trim() ?? '';
  clearResults();
  if (submit) submit.disabled = true;
  if (status) status.textContent = progressText.repository;

  try {
    const catalogLoad = loadCatalog();
    const analysis = await analyzePublicGitHubRepository(repositoryUrl, (progress) => {
      if (status) status.textContent = progressText[progress];
    });
    const catalog = await catalogLoad;
    resolution = resolveImportCandidates(analysis.detections, catalog);

    if (repositoryLink) {
      repositoryLink.href = analysis.repository.htmlUrl;
      repositoryLink.textContent = `${analysis.repository.owner}/${analysis.repository.repo} をGitHubで確認 →`;
    }
    renderReady(resolution);
    renderConflicts(resolution);
    renderUnmatched(resolution);
    renderWarnings(analysis.warnings);
    if (results) results.hidden = false;
    if (status) {
      const detected = analysis.detections.length;
      const ready = resolution.ready.length;
      status.textContent = `${detected}件のバージョン情報を検出し、${ready}製品を安全に保存できる候補として整理しました。`;
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : 'unknown_error';
    if (status) status.textContent = errorText(code);
  } finally {
    if (submit) submit.disabled = false;
  }
});

saveButton?.addEventListener('click', () => {
  if (!resolution || !saveMessage) return;
  const selected = new Set(
    [...document.querySelectorAll<HTMLInputElement>('[data-github-import-candidate]:checked')]
      .map((checkbox) => checkbox.dataset.githubImportCandidate ?? '')
      .filter(Boolean)
  );
  const candidates = resolution.ready.filter((candidate) => selected.has(candidate.slug));
  if (candidates.length === 0) {
    saveMessage.hidden = false;
    saveMessage.textContent = '保存する候補を1件以上選択してください。';
    return;
  }

  try {
    let state = parseTrackedProducts(localStorage.getItem(TRACKED_PRODUCTS_STORAGE_KEY));
    for (const candidate of candidates) state = setTrackedProduct(state, candidate.slug, candidate.version);
    localStorage.setItem(TRACKED_PRODUCTS_STORAGE_KEY, serializeTrackedProducts(state));
    saveMessage.hidden = false;
    saveMessage.textContent = `${candidates.length}製品をマイEOLへ保存しました。利用中バージョンとして反映されています。`;
    renderReady(resolution);
  } catch {
    saveMessage.hidden = false;
    saveMessage.textContent = 'このブラウザへ保存できませんでした。ストレージ設定を確認してください。';
  }
});
