// モーダル共通制御（開閉イベントや背景クリック）
// - 閉じるボタンや背景クリックでモーダルを閉じる
// - 検索・一覧のどちらからでも共通で使う

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.querySelector(".word-modal");
  const overlay = document.querySelector(".word-modal__overlay");
  const closeBtn = document.querySelector(".word-modal__close");
  const closeBtnBottom = document.querySelector(".word-modal__close-btn");
  // ✅ イベント委任で .word-card をクリック → モーダル開く
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".word-card__details, .search-bar__result-item");
    const modal = document.querySelector(".word-modal");

    if (card && modal) {
      modal.classList.add("is-open");
      document.body.classList.add("no-scroll");
    }
  });

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  
    // 🔽 検索バー関連もリセット
    const input = document.getElementById("search-input");
    const resultsBox = document.getElementById("js-search-results");
    const searchOverlay = document.getElementById("search-overlay");
  
    if (input) input.value = "";
    if (resultsBox) resultsBox.innerHTML = "";
    if (searchOverlay) searchOverlay.style.display = "none";
  };

  // 閉じる処理（×ボタン）
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  // 閉じる処理（下部ボタン）
  if (closeBtnBottom) {
    closeBtnBottom.addEventListener("click", closeModal);
  }

  // オーバーレイクリックで閉じる（モーダルの外をクリックしたときのみ）
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