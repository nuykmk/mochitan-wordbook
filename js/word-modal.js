// モーダル共通制御（開閉イベントや背景クリック）
// - 閉じるボタンや背景クリックでモーダルを閉じる
// - 検索・一覧のどちらからでも共通で使う


// ✅ スクロール位置保存用の変数
let scrollY = 0;

// ✅ グローバル関数として外に定義（他からも呼べるように！）
function closeModal() {
  const modal = document.querySelector(".word-modal");
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");

  // ✅ スクロール解除と元の位置へ戻す！
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  window.scrollTo(0, scrollY);

  // 🔽 検索バー関連もリセット
  const input = document.getElementById("search-input");
  const resultsBox = document.getElementById("js-search-results");
  const searchOverlay = document.getElementById("search-overlay");

  if (input) input.value = "";
  if (resultsBox) resultsBox.innerHTML = "";
  if (searchOverlay) toggleOverlay(false);
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.querySelector(".word-modal");
  const overlay = document.querySelector(".word-modal__overlay");
  const closeBtn = document.querySelector(".word-modal__close");
  const closeBtnBottom = document.querySelector(".word-modal__close-btn");


  // ✅ イベント委任で .word-card or 検索候補をクリック → モーダル開く
document.addEventListener("click", (e) => {
  if (e.target.closest(".word-card__sound")) return;

  const card = e.target.closest(".word-card, .search-bar__result-item");
  if (!card || !modal) return;

  // ✅ wordId を取得（data-id属性）
  const wordId = card.dataset.id;
  if (!wordId) return;

  // ✅ wordData を取得（事前にマージ済みの全データ配列）
  const wordData = (window.wordDataArray || []).find(w => w.id === wordId);

  // ✅ openWordModal が存在し、かつ wordData がある場合のみ呼び出し
  if (wordData && typeof window.openWordModal === "function") {
    window.openWordModal(wordData);
  } else {
    // 🔕 警告削除（または開発中だけ表示したいならコメントアウトでも可）
    // console.warn("❌ wordData が取得できない、または openWordModal が未定義");
    return;
  }

  // ✅ スクロール固定
  scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";

  // ✅ モーダル表示
  modal.classList.add("is-open");

});

  // ✅ 閉じる処理（×ボタン）
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  // ✅ 閉じる処理（下部ボタン）
  if (closeBtnBottom) closeBtnBottom.addEventListener("click", closeModal);

  // ✅ オーバーレイクリックで閉じる
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });
  }
});


// ✅ .word-modal__sound または .word-card__sound の音声ボタンをクリックしたら再生
document.addEventListener('click', (e) => {
  const soundBtn = e.target.closest('.word-modal__sound, .word-card__sound');
  if (soundBtn) {
    const audioSrc = soundBtn.getAttribute('data-audio');
    if (audioSrc) {
      new Audio(audioSrc).play();
    }
  }
});