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

// ✅ スクロールに応じた検索バー表示切替
document.addEventListener("DOMContentLoaded", () => {
  const searchBar = document.querySelector(".search-bar");
  if (!searchBar) return;
  searchBar.classList.add("is-visible");

  let lastScroll = window.pageYOffset;
  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > lastScroll) {
      searchBar.classList.remove("is-visible");
    } else {
      searchBar.classList.add("is-visible");
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
  
    // 🔍 部分一致したものを抽出
    let filtered = searchWords.filter(w =>
      w.english.toLowerCase().includes(keyword.toLowerCase())
    );
  
    // ✅ 完全一致する単語が複数ある場合 → 最小IDの1件のみに絞る
    const exactMatches = filtered.filter(w => w.english.toLowerCase() === keyword.toLowerCase());
    if (exactMatches.length > 1) {
      const minIdWord = exactMatches.reduce((min, w) =>
        Number(w.id) < Number(min.id) ? w : min, exactMatches[0]
      );
      filtered = filtered.filter(w => w.english.toLowerCase() !== keyword.toLowerCase());
      filtered.unshift(minIdWord);
    }
  
    const posMap = {
      verb: "動", noun: "名", adjective: "形", adverb: "副",
      preposition: "前", conjunction: "接", interjection: "感",
      pronoun: "代", auxiliary: "助", article: "冠", phrase: "句", idiom: "熟"
    };
  
    resultsBox.innerHTML = filtered.slice(0, 10).map(w => {
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
        if (overlay) overlay.style.display = "none";
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
  overlay.style.display = show ? "block" : "none";
}