// ✅ word-list-pagination.js
// 単語一覧ページのデータ表示・ページネーション制御
// - book_idに対応するbook_X.csvとenglish_word_courses.csvを連携
// - 表示対象の単語リストをCSV＋JSONから整形
// - 100件単位でページ分割して表示
// - Swiperやフィルタ、表示切替、音声再生も統合対応


document.addEventListener("DOMContentLoaded", loadAndRenderWordList);


// ✅ URLパラメータ取得関数
function getBookIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('book');
}

function getCourseFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('course');
}

// ✅ 品詞マッピング（日本語表記用）
const partOfSpeechMap = {
  verb: "動", noun: "名", adjective: "形",
  adverb: "副", preposition: "前", conjunction: "接",
  interjection: "感", pronoun: "代", auxiliary: "助",
  article: "冠", phrase: "句", idiom: "熟"
};

// ✅ titleタグ と meta description を更新する関数
function updateMetaTags(bookName, bookDescription) {
  // <title> を変更
  document.title = `${bookName} | モチタン英単語帳`;

  // <meta name="description"> がなければ作成
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.name = "description";
    document.head.appendChild(metaDescription);
  }

  // 内容を設定
  metaDescription.content = bookDescription || `${bookName}の英単語一覧ページです。`;
}

// ✅ パンクズ/ヒーローセクションの更新
function updateHeroSectionFromBookList(bookId) {
  if (!bookId) return;
  Papa.parse("data/book_list.csv", {
    download: true,
    header: true,
    complete: function (results) {
      const match = results.data.find(item => item.ID === bookId);
      if (!match) return;
      // ✅ ヒーローセクションの更新
      document.querySelector(".hero__title").textContent = match.book_name || "";
      document.querySelector(".hero__text").textContent = (match.book_description || '').replace(/\s/g, '');

      // ✅ メタタグ更新もここで！
      updateMetaTags(match.book_name, match.book_description);

       // ✅ パンクズ現在地を更新
      const breadcrumbList = document.querySelector(".breadcrumb__list");
      if (breadcrumbList && match.Tier1 && match.book_name) {
          breadcrumbList.innerHTML = `
          <li class="breadcrumb__item"><a href="index.html">単語帳 一覧</a></li>
          <li class="breadcrumb__item">
            <a href="course.html?course=${encodeURIComponent(match.Tier1)}">${match.Tier1}</a>
          </li>
          <li class="breadcrumb__item">
            <a href="word-list.html" class="breadcrumb__current" aria-current="page">${match.book_name}</a>
          </li>
        `;
      }
    }
  });
}


// ✅ 単語一覧＋ページネーションの初期化（Swiper用recommendSwiperBooksも生成）
async function loadAndRenderWordList() {
  const wordListContainer = document.getElementById("js-word-list");
  const paginationTop = document.getElementById("js-pagination-top");
  const paginationBottom = document.getElementById("js-pagination-bottom");
  const toggleButtons = document.querySelectorAll(".display-toggle__btn");
  const dictionaryPath = 'data/dictionary_new/';

  const bookId = getBookIdFromURL();
  // ✅ book ID が指定されていない場合はスキップ（例：index.html などで正常）
  // この警告は特定のページでは仕様上発生します（エラーではありません）
  if (!bookId) {
  console.info("⚠️ book ID が指定されていないため、loadAndRenderWordList をスキップします。");
  return;
  }
  const courseParam = getCourseFromURL();
  updateHeroSectionFromBookList(bookId);

  let allWords = [];
  let currentPage = 1;
  const perPage = 100;
  const maxVisiblePages = 5;

    // ✅ book_X.csv を先に読み込んでID一覧取得
    if (!bookId) {
      console.error("❌ book ID が指定されていません。");
      return;
    }
  
    const bookCsvPath = `data/book_word_list/book_${bookId}.csv`;
    let bookWordIds = [];
  
    await new Promise(resolve => {
      Papa.parse(bookCsvPath, {
        download: true,
        header: true,
        complete: function (results) {
          bookWordIds = results.data.map(row => row.id).filter(Boolean);
          resolve();
        }
      });
    });

  // ✅ book_idに紐づく単語ID一覧を読み込み（book_X.csv）
  const bookCSVPath = `data/book_word_list/book_${bookId}.csv`;
  bookWordIds = await new Promise((resolve) => {
    Papa.parse(bookCSVPath, {
      download: true,
      header: true,
      complete: (results) => {
        const ids = results.data.map(row => row.id).filter(Boolean);
        resolve(ids);
      }
    });
  });

  // ✅ 全単語一覧CSVを読み込み
  Papa.parse("data/english_word_courses.csv", {
    download: true,
    header: true,
    complete: async function (results) {
    const filtered = results.data.filter(w => bookWordIds.includes(w.id));
    allWords = (courseParam
      ? filtered.filter(w => w.course === courseParam)
      : filtered
    )
    .map(w => ({
      id: w.id,
      english: w.english,
      translation: w.translation,
      part_of_speech: w.part_of_speech,
      course: w.course || "",
      importance: Number(w.importance) || 9999,
      example: w.example || "",
      example_translation: w.example_translation || "",
      sound: w.sound || ""
    }));

      window.wordDataArray = allWords;

      document.querySelector('.hero__count').innerHTML =
        `<img src="image/words_count_icon.png" class="hero__count-icon">${allWords.length}単語`;

      // ✅ Swiper表示用にrecommendSwiperBooksを生成
      generateRecommendSwiperBooks(bookId);

      await goToPage(currentPage);
    }
  });

  // ✅ Swiper用の推薦単語帳スライドを準備してwindowに格納
  function generateRecommendSwiperBooks(currentBookId) {
    Papa.parse("data/book_list.csv", {
      download: true,
      header: true,
      complete: (results) => {
        const books = results.data;
        const currentBook = books.find(book => book.ID === currentBookId);
        if (!currentBook) return;

        const currentTier1 = currentBook.Tier1;
        const sameCourseBooks = books.filter(b => b.Tier1 === currentTier1);
        // ✅ 見出し（おすすめスライダーのタイトル）を書き換え（Tier1ごとにメッセージを変更）
        const heading = document.querySelector(".recommend-swiper__heading");
          if (heading && currentTier1) {
            let message = "";
            switch (currentTier1) {
              case "中学":
                message = "中学英語の学習にこちらもおすすめ！";
              break;
              case "高校":
                message = "大学受験に向けてこちらもおすすめ！";
              break;
              case "TOEIC":
                message = "TOEIC対策にこちらもおすすめ！";
              break;
              case "英検":
                message = "英検対策にこちらもおすすめ！";
              break;
              default:
                message = `${currentTier1}の学習にこちらもおすすめ！`;
              }
              heading.textContent = message;
          }

        // ✅ Tier2_order→Tier3_orderの順にソート（null/空欄は999として扱う）
        const filteredBooks = sameCourseBooks
          .filter(book => book.ID && book.book_name) 
          .map(book => ({
            id: book.ID,
            title: book.book_name,
            image: `data/book_image/book_${book.ID}.png`,
            tier1: book.Tier1,
            tier2_order: parseInt(book.Tier2_order || 999),
            tier3_order: parseInt(book.Tier3_order || 999)
          }))
          .sort((a, b) => {
            if (a.tier2_order !== b.tier2_order) return a.tier2_order - b.tier2_order;
            return a.tier3_order - b.tier3_order;
          });

        // ✅ Swiper表示用データをwindowに格納
        window.recommendSwiperBooks = filteredBooks;

      }
    });
  }





  // ✅ 単語本体のCSV読み込み（english_word_courses.csv）
  Papa.parse("data/english_word_courses.csv", {
    download: true,
    header: true,
    complete: async function (results) {
      const filtered = results.data.filter(w => bookWordIds.includes(w.id));
      allWords = (courseParam
        ? filtered.filter(w => w.course === courseParam)
        : filtered
      ).map(w => ({
        id: w.id,
        english: w.english,
        translation: w.translation,
        part_of_speech: w.part_of_speech,
        course: w.course || "",
        importance: Number(w.importance) || 9999,
        example: w.example || "",
        example_translation: w.example_translation || "",
        sound: w.sound || ""
      }));
      window.wordDataArray = allWords;

      document.querySelector('.hero__count').innerHTML =
        `<img src="image/words_count_icon.png" class="hero__count-icon">${allWords.length}単語`;

      await goToPage(currentPage);
    }
  });

  // 指定ページに切り替え
  async function goToPage(page, options = {}) {
    currentPage = page;
  
    const start = (page - 1) * perPage;
    const pageWords = window.wordDataArray.slice(start, start + perPage);
  
    // ✅ skipReload: true の場合は JSON を取得せずに描画する
    if (options.skipReload) {
      renderWordList(pageWords); 
      renderPagination(currentPage, Math.ceil(window.wordDataArray.length / perPage));
      return;
    }
  
    // ✅ それ以外は従来通り JSON を取得して描画
    const wordDataWithJson = await Promise.all(
      pageWords.map(async word => {
        const path = `${dictionaryPath}${word.id}.json`;
        try {
          const res = await fetch(path);
          if (!res.ok) throw new Error("404");
          const json = await res.json();
          return { ...word, json };
        } catch {
          return { ...word, json: {} };
        }
      })
    );
  
    renderWordList(wordDataWithJson);
    renderPagination(currentPage, Math.ceil(allWords.length / perPage));
  }

  // 単語リストをHTMLに出力
  function renderWordList(data) {
    wordListContainer.innerHTML = '';

    data.forEach((word, index) => {
      // 発音：[xxx]の形式に整形
      let pronunciation = "";
      if (word.json?.pronunciation) {
        const match = word.json.pronunciation.match(/(?:\[.*?\])?\s*([^\s;\|]+)/);
        if (match) pronunciation = `[${match[1]}]`;
      }

      const meaningsByPOS = {};

      // main訳を最初に分類
      if (word.translation) {
        const pos = partOfSpeechMap[word.part_of_speech] || word.part_of_speech;
        meaningsByPOS[pos] = meaningsByPOS[pos] || [];
        meaningsByPOS[pos].push(`<span class="highlight">${word.translation}</span>`);
      }

      // other_translationsを追加
      (word.json?.other_translations || []).forEach(item => {
        const pos = partOfSpeechMap[item.part_of_speech] || item.part_of_speech;
        if (item.translation) {
          meaningsByPOS[pos] = meaningsByPOS[pos] || [];
          meaningsByPOS[pos].push(item.translation);
        }
      });

      // 意味HTMLを生成
      const partOfSpeechAreaHTML = `
        <div class="part-of-speech__area">
          ${Object.entries(meaningsByPOS).map(([pos, list]) => `
            <div class="word-card__main-meaning">
              <span class="word-card__part-of-speech">${pos}</span>
              <span class="word-card__translation js-hide-ja">${list.join("、")}</span>
            </div>
          `).join('')}
        </div>`;

      // フレーズ（phrases）
      const phrasesHTML = (word.json?.phrases || []).map(p => {
        const phraseText = p.english?.replace(new RegExp(`\\|${word.english}\\|`, 'g'), `<span class="highlight">${word.english}</span>`).replace(/\|/g, '') || p.english;
        return `
        <div class="word-card__phrase">
          <span><span class="word-card__icon">◆</span><span class="word-card__phrase-text js-hide-en">${phraseText}</span></span>
          <span class="word-card__phrase-translation js-hide-ja">${p.translation}</span>
        </div>`;
      }).join('');

      // 派生語（derivatives）
      const derivativesHTML = (word.json?.derivatives || []).map(d => `
        <div class="word-card__derivative">
          <span><span class="word-card__icon">◇</span><span class="word-card__derivative-word js-hide-en">${d.english}</span></span>
          <span><span class="word-card__derivative-pos">${partOfSpeechMap[d.part_of_speech] || d.part_of_speech}</span><span class="word-card__derivative-meaning js-hide-ja">${d.translation}</span></span>
        </div>`).join('');

      // 対義語（antonyms）
      const antonymsHTML = (word.json?.antonyms || []).map(a => `
        <div class="word-card__antonym">
          <span><span class="word-card__icon">↔︎</span><span class="word-card__antonym-word js-hide-en">${a.english}</span></span>
          <span><span class="word-card__antonym-pos">${partOfSpeechMap[a.part_of_speech] || a.part_of_speech}</span><span class="word-card__antonym-meaning js-hide-ja">${a.translation}</span></span>
        </div>`).join('');

      // 例文（ハイライト付）
      const example = (word.example || '').replace(/\|/g, '').replace(new RegExp(`\\b(${word.english})\\b`, 'gi'), '<span class="word-card__highlight js-hide-en">$1</span>');

      const imagePath = `Img/${word.course}/${word.english}.jpg`;

      // カード全体を構築
      const card = document.createElement("article");
      card.className = "word-card";
      card.dataset.id = word.id;
      card.dataset.importance = word.importance;
      card.innerHTML = `
        <div class="word-card__inner">
          <div class="word-card__info">
            <div class="word-card__index">${index + 1 + (currentPage - 1) * perPage}</div>
            <div class="word-area">
              <h3 class="word-card__english js-hide-en">${word.english}</h3>
              <p class="word-card__pronunciation js-hide-en">${pronunciation}</p>
            </div>
            <button class="word-card__sound" data-audio="wordsound/${word.sound}_1.mp3">
              <img src="image/btn_sound.png" alt="発音再生">
            </button>
          </div>
          <div class="word-card__details">
            ${partOfSpeechAreaHTML}
            ${phrasesHTML}
            ${derivativesHTML}
            ${antonymsHTML}
            <div class="word-card__example">
              <p class="word-card__example-en"><span class="word-card__example-prefix">(例)</span>${example}</p>
              <p class="word-card__example-ja js-hide-ja">${word.example_translation || ''}</p>
            </div>
          </div>
          <div class="word-card__image-area">
            <img src="${imagePath}" alt="${word.english}のイラスト" class="word-card__image">
          </div>
        </div>`;

      wordListContainer.appendChild(card);
    });
  }
  // ✅ ページネーション表示
  function renderPagination(current, total) {
    [paginationTop, paginationBottom].forEach(container => {
      container.innerHTML = '';
      const ul = document.createElement("ul");
      ul.className = "pagination__list";

      const prev = document.createElement("li");
      prev.innerHTML = `<button class="pagination__arrow" ${current === 1 ? "disabled" : ''}>&lt;</button>`;
      prev.querySelector("button").addEventListener("click", () => goToPage(current - 1));
      ul.appendChild(prev);

      const startPage = Math.floor((current - 1) / maxVisiblePages) * maxVisiblePages + 1;
      const endPage = Math.min(startPage + maxVisiblePages - 1, total);

      for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#";
        a.className = "pagination__link";
        if (i === current) a.classList.add("is-current");
        a.textContent = `[${(i - 1) * perPage + 1}-${Math.min(i * perPage, allWords.length)}]`;
        a.addEventListener("click", e => {
          e.preventDefault();
          goToPage(i);
        });
        li.appendChild(a);
        ul.appendChild(li);
      }

      if (endPage < total) {
        const dots = document.createElement("li");
        dots.textContent = "...";
        ul.appendChild(dots);
      }

      const next = document.createElement("li");
      next.innerHTML = `<button class="pagination__arrow" ${current === total ? "disabled" : ''}>&gt;</button>`;
      next.querySelector("button").addEventListener("click", () => goToPage(current + 1));
      ul.appendChild(next);

      container.appendChild(ul);
    });
  }

 // ✅ 音声再生ボタン
  document.addEventListener("click", e => {
    const btn = e.target.closest(".word-card__sound");
    if (!btn) return;
    const audioSrc = btn.dataset.audio;
    if (!audioSrc) return;
    const audio = new Audio(audioSrc);
    audio.play().catch(err => console.error("🔈 再生エラー", err));
  });

   // ✅ 表示切り替え（全表示・日本語・英語のみ）
  toggleButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      toggleButtons.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      applyDisplayMode(btn.dataset.mode);
    });
  });

  function applyDisplayMode(mode) {
    const ja = document.querySelectorAll(".js-hide-ja");
    const en = document.querySelectorAll(".js-hide-en");
    if (mode === "ja") {
      ja.forEach(el => el.classList.add("is-hidden-ja"));
      en.forEach(el => el.classList.remove("is-hidden-en"));
    } else if (mode === "en") {
      en.forEach(el => el.classList.add("is-hidden-en"));
      ja.forEach(el => el.classList.remove("is-hidden-ja"));
    } else {
      ja.forEach(el => el.classList.remove("is-hidden-ja"));
      en.forEach(el => el.classList.remove("is-hidden-en"));
    }
  }

  // ✅ モーダル表示トリガー
  document.addEventListener("click", e => {
    // ✅ .word-card__details をクリックしたときだけ反応する
  const details = e.target.closest(".word-card__details");
  if (details) {
    const card = details.closest(".word-card");
    if (card) {
      const id = card.dataset.id;
      const word = window.wordDataArray.find(w => w.id === id);
      if (word) {
        openWordModal(word);
      }
    }
  }
  });
  window.goToPage = goToPage;
}
