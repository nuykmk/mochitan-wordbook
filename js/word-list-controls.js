// 単語一覧ページのデータ表示・ページネーション制御
// - book_idに対応するbook_X.csvとenglish_word_courses.csvを連携
// - 表示対象の単語リストをCSV＋JSONから整形
// - 100件単位でページ分割して表示
// - Swiperやフィルタ、表示切替、音声再生も統合対応



document.addEventListener('DOMContentLoaded', () => {
  // ソートドロップダウン開閉
  // ✅ .sort-dropdown が存在しない場合はスキップ（例：トップページなど）
  // この警告はページによっては仕様上出るものです（エラーではありません）
  const sortDropdown = document.querySelector(".sort-dropdown");
  if (!sortDropdown) {
    console.info("⚠️ .sort-dropdown が見つかりません。word-list-controls.js の処理をスキップします。");
    return;
    }
  const sortButton = sortDropdown.querySelector('.sort-dropdown__button');
  const sortIcon = sortDropdown.querySelector('.sort-icon');
  const sortMenu = sortDropdown.querySelector('.sort-dropdown__menu');
  const sortItems = sortDropdown.querySelectorAll('.sort-dropdown__item');

  const toggleMenu = () => {
    sortDropdown.classList.toggle('is-open');
  };

  sortButton.addEventListener('click', toggleMenu);
  sortIcon.addEventListener('click', toggleMenu);

  sortItems.forEach(item => {
    item.addEventListener('click', () => {
      sortItems.forEach(i => i.classList.remove('is-active'));
      item.classList.add('is-active');
      sortButton.textContent = item.textContent;

      sortDropdown.classList.remove('is-open');

      const selectedSort = item.dataset.sort;
      sortWordList(selectedSort); 
    });
  });

  // ドロップダウン以外をクリックしたら閉じる
  document.addEventListener('click', (e) => {
    if (!sortDropdown.contains(e.target)) {
      sortDropdown.classList.remove('is-open');
    }
  });

  

});

// ✅ ソート関数（ドロップダウンで選択された項目に応じて並び替え）
function sortWordList(sortType) {
  // ソート処理（新しい配列にすることで元の配列は破壊しない）
  let sorted = [...window.wordDataArray];

  switch (sortType) {
    case "az":
      sorted.sort((a, b) => a.english.localeCompare(b.english));
      break;

    case "za":
      sorted.sort((a, b) => b.english.localeCompare(a.english));
      break;

    case "importance":
      // 重要度が高い順（1が高い）
      sorted.sort((a, b) => Number(a.importance) - Number(b.importance));
      break;

    case "random":
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
      break;

    default:
      console.warn("⚠️ 未定義のソート方法:", sortType);
      return;
  }

  // 並び替えた配列を元データに上書き
  window.wordDataArray = sorted;

    // ✅ ページ1に戻って再描画（goToPageを使う）
  if (typeof window.goToPage === "function") {
  
    // （✅ 並び替え結果そのままで再描画）
    window.goToPage(1, { skipReload: true });
  } else {
    console.error("❌ goToPage関数が未定義です");
  }

}

// 表示切替＋印刷モード
document.addEventListener("DOMContentLoaded", () => {
  const toggleButtons = document.querySelectorAll('.display-toggle__btn');

  // ✅ 表示切替ロジックを関数化（あとからも呼べるように）
  function toggleView(mode) {
    const jaTargets = document.querySelectorAll('.js-hide-ja');
    const enTargets = document.querySelectorAll('.js-hide-en');

    switch (mode) {
      case 'all':
        jaTargets.forEach(el => el.classList.remove('is-hidden-ja'));
        enTargets.forEach(el => el.classList.remove('is-hidden-en'));
        break;
      case 'ja':
        jaTargets.forEach(el => el.classList.add('is-hidden-ja'));
        enTargets.forEach(el => el.classList.remove('is-hidden-en'));
        break;
      case 'en':
        enTargets.forEach(el => el.classList.add('is-hidden-en'));
        jaTargets.forEach(el => el.classList.remove('is-hidden-ja'));
        break;
    }
  }

  // ✅ ボタンクリックイベントで切り替え
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleButtons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const mode = btn.dataset.mode;
      toggleView(mode);
    });
  });

  // ✅ 印刷ボタン → ?print=true で別タブを開く


  document.querySelector('.print-button__btn')?.addEventListener('click', () => {
    let retries = 0;
  
    const tryPrint = () => {
      if (!window.allWords || window.allWords.length === 0) {
        if (retries++ < 20) {
          setTimeout(tryPrint, 300); 
        } else {
          alert("データがまだ読み込まれていません。少し待ってから再度お試しください。");
        }
        return;
      }
  
      document.body.setAttribute('data-print-mode', 'true');
      window.renderWordList(window.allWords);
      window.applyDisplayMode?.(); 
  
      window.print();
      window.onafterprint = () => {
        window.goToPage(window.currentPage);
        document.body.removeAttribute('data-print-mode');
      };
    };
  
    tryPrint();
  });

  // ✅ 初期状態で「全表示」を適用（またはURLパラメータに応じて切り替え）
  toggleView('all');
});

