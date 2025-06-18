// 検索バーと検索結果の制御
// - 英単語部分一致による検索処理（CSVから）
// - 結果を一覧として表示、クリックでモーダル表示
// - 入力イベントによる検索候補の表示も対応予定
// - モーダルを共通で使えるように word-detail.js に依存


// 検索結果なしモーダル制御
function showNoResultModal(keyword) {
  const modal = document.getElementById("js-no-result-modal");
  const keywordSpan = document.getElementById("js-no-result-keyword");
  keywordSpan.textContent = keyword;
  modal.classList.add("is-open");

  // 閉じるボタン
  document.getElementById("js-close-no-result").addEventListener("click", () => {
    modal.classList.remove("is-open");
    document.getElementById("search-input").value = ""; // ← これでリセット
  });

  // 検索条件リセット
  document.getElementById("js-clear-search").addEventListener("click", () => {
    document.getElementById("search-input").value = "";
    modal.classList.remove("is-open");
  });
}


// ✅ グローバル変数（CSVデータ用）
let searchWords = [];
let selectedIndex = -1;


// ✅ スクロールに応じた検索バー表示制御（TP-04＋TP-37）
document.addEventListener("DOMContentLoaded", () => {
  const searchBar = document.querySelector(".search-bar");
  if (!searchBar) return;
  searchBar.classList.add("is-visible");

  let lastScroll = window.pageYOffset;
  let scrollBuffer = 0;

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;
    const scrollDelta = currentScroll - lastScroll;
    scrollBuffer += scrollDelta;
    
    const suggestionOpen = document.querySelector("#js-search-results")?.children.length > 0;

    // 🔹 ページ先頭なら必ず表示（追加_14対応）
    if (currentScroll <= 0) {
      searchBar.classList.add("is-visible");
      scrollBuffer = 0;
      lastScroll = currentScroll;
      return;
    }

    // ✅ TP-04: 検索候補が出ていたら常に表示
    if (suggestionOpen) {
      searchBar.classList.add("is-visible");
      scrollBuffer = 0;
      lastScroll = currentScroll;
      return;
    }


    // ある程度スクロールしたときだけ非表示（TP-37対応）
    if (scrollDelta > 0) {
      // ✅ 下スクロール：累積カウント
      scrollBuffer += scrollDelta;
  
      if (scrollBuffer > 150) {
        searchBar.classList.remove("is-visible");
        scrollBuffer = 0;
      }
    } else if (scrollDelta < 0) {
      // ✅ 上スクロール：即表示・リセット
      searchBar.classList.add("is-visible");
      scrollBuffer = 0;
    }

    lastScroll = currentScroll;
  });
});

// ✅ 検索処理のセットアップ
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("search-input");
  const resultsBox = document.getElementById("js-search-results");
  const form = document.querySelector(".search-bar__form");

  // ✅ 検索結果描画関数（ハイライト・品詞表示対応）
  const renderResults = (value) => {
    const keyword = value.trim();
    if (!keyword) {
      resultsBox.innerHTML = "";
      toggleOverlay(false); 
      return;
    }
  
    const lowerKeyword = keyword.toLowerCase();


    // ✅ 完全一致・先頭一致を含むが、単語ごとに最小IDだけを残す
  const matchedWords = searchWords.filter(w =>
  w.english.toLowerCase().startsWith(lowerKeyword)
  );

  // ✅ 重複英単語を除外（IDが最小の1件だけ残す）
  const uniqueWords = Object.values(
    matchedWords.reduce((acc, word) => {
      const key = word.english.toLowerCase();
      if (!acc[key] || Number(word.id) < Number(acc[key].id)) {
        acc[key] = word;
      }
      return acc;
    }, {})
  );

  // ✅ 完全一致の単語が先頭に来るように並び替え
  const filtered = uniqueWords.sort((a, b) => {
    const aIsExact = a.english.toLowerCase() === lowerKeyword ? -1 : 1;
    const bIsExact = b.english.toLowerCase() === lowerKeyword ? -1 : 1;
    return aIsExact - bIsExact;
  });


    const posMap = {
      verb: "動",
      noun: "名",
      adjective: "形",
      adverb: "副",
      preposition: "前",
      conjunction: "接",
      interjection: "間投",       
      pronoun: "代",
      auxiliary: "助",            
      auxiliary_verb: "助動",     
      article: "冠",
      phrase: "句",
      idiom: "熟",
      number: "数",               
      ordinal_number: "序数"      
    };
  
    resultsBox.innerHTML = filtered.map(w => {
      const regex = new RegExp(`(${keyword})`, 'i');
      const highlighted = w.english.replace(regex, '<span class="search-bar__highlight">$1</span>');
      const part = posMap[w.part_of_speech] || "";
      return `
        <div class="search-bar__result-item" data-id="${w.id}">
          <div class="search-bar__english-line">
            <strong class="search-bar__english">${highlighted}</strong>
          </div>
          <div class="search-bar__translation-line">
            ${part ? `<span class="search-bar__part">${part}</span>` : ""}
            <span class="search-bar__translation">${w.translation || ""}</span>
          </div>
        </div>
      `;
    }).join("");
    toggleOverlay(filtered.length > 0); 
  };

  // ✅ 入力時に検索候補を表示
  input.addEventListener("input", (e) => {
    renderResults(e.target.value);
    selectedIndex = -1;
  });
  // ✅ TP-06: フォーカス時にも現在の値で候補を再表示
input.addEventListener("focus", () => {
  renderResults(input.value); 
});

  // ✅ 矢印キー＆Enterキー対応（入力欄にフォーカス中）
  input.addEventListener("keydown", (e) => {
    setTimeout(() => {
      const items = [...resultsBox.querySelectorAll(".search-bar__result-item")];
      if (items.length === 0) return;
  
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          items[selectedIndex].click();
          return;
        }
      }
  
      // 選択状態更新
      items.forEach((item, idx) => {
        item.classList.toggle("is-active", idx === selectedIndex);
      });
    }, 0);
  });

  // ✅ 検索結果クリック時にモーダル表示
  resultsBox.addEventListener("click", (e) => {
    const item = e.target.closest(".search-bar__result-item");
    if (item) {
      const id = item.dataset.id;
      const word = searchWords.find(w => String(w.id) === String(id));
  
      if (word) {
        fetch(`data/dictionary_new/${word.id}.json`)
          .then(res => res.ok ? res.json() : {})
          .then(json => {
            openWordModal({ ...word, json }); 
          })
          .catch(err => {
            console.error("❌ JSON取得失敗:", err);
            openWordModal({ ...word, json: {} });
          });
  
        input.value = word.english;
        resultsBox.innerHTML = "";
        const overlay = document.getElementById("search-overlay");
        if (overlay) toggleOverlay(false);
      }
    }
  });

  // ✅ 検索フォーム送信（Enter or ボタン）
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const keyword = input.value.trim().toLowerCase();
    if (!keyword) return;
    const matches = searchWords.filter(w => w.english.toLowerCase() === keyword);
    if (matches.length) {
      const sorted = matches.sort((a, b) => Number(a.id) - Number(b.id));
      openWordModal(sorted[0]);
      document.body.classList.add("no-scroll");
    } else {
      showNoResultModal(keyword);
    }
    resultsBox.innerHTML = "";
  });

  // ✅ CSV読み込み（最初に一度だけ）
  Papa.parse("data/english_word_courses.csv", {
    download: true,
    header: true,
    complete: function(results) {
    searchWords = results.data.map(row => ({
      id: row.id,
      english: row.english,
      translation: row.translation,
      part_of_speech: row.part_of_speech,
      course: row.course,
      book: row.book || "",
      example: row.example || "",
      example_translation: row.example_translation || "",
      sound: row.sound || ""
    }));

    }
  });
});

// ✅ 検索結果なしモーダル制御
function showNoResultModal(keyword) {
  const modal = document.getElementById("js-no-result-modal");
  const keywordSpan = document.getElementById("js-no-result-keyword");
  keywordSpan.textContent = keyword;
  modal.classList.add("is-open");

  document.getElementById("js-close-no-result").addEventListener("click", () => {
    modal.classList.remove("is-open");
  });

  document.getElementById("js-clear-search").addEventListener("click", () => {
    document.getElementById("search-input").value = "";
    modal.classList.remove("is-open");
  });
  // 背景クリックで閉じる
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("is-open");
    document.getElementById("search-input").value = "";
  }
});
}

// 🔍 検索候補の表示時にオーバーレイ表示切替
function toggleOverlay(show) {
  const overlay = document.getElementById("search-overlay");
  if (!overlay) return;
  overlay.classList.toggle("is-visible", show);
}
// ✅ TP-05: オーバーレイクリックで検索候補を閉じる
const overlay = document.getElementById("search-overlay");
if (overlay) {
  overlay.addEventListener("click", () => {
    const resultsBox = document.getElementById("js-search-results");
    resultsBox.innerHTML = "";
    toggleOverlay(false); 
  });
}