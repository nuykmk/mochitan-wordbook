// 単語モーダルの制御用スクリプト
// - 一覧でカードをクリックした際にモーダルを開く
// - 単語詳細情報（CSV＋JSON）を読み込んでモーダル内に展開
// - 音声再生、前後ナビゲーション、スワイプ対応など


document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("wordModal");
  const titleEl = modal.querySelector(".word-modal__title-text");
  const pronEl = modal.querySelector(".word-modal__pronunciation-text");
  const meaningsEl = modal.querySelector(".word-modal__meanings");
  const imageEl = modal.querySelector(".word-modal__image");
  const exampleEnEl = modal.querySelector(".word-modal__example-en");
  const exampleJaEl = modal.querySelector(".word-modal__example-ja");
  const relatedEl = modal.querySelector(".word-modal__related");
  const usageEl = modal.querySelector(".word-modal__usage");
  const nuanceEl = modal.querySelector(".word-modal__nuance");
  const englishDefEl = modal.querySelector(".word-modal__english-def");
  const soundBtn = modal.querySelector(".word-modal__sound");
  const prevBtn = modal.querySelector(".word-modal__nav-btn");
  const nextBtn = modal.querySelector(".word-modal__nav-btn-right");

  const dictionaryPath = 'data/dictionary_new/';

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
  const posOrder = { "動": 1, "名": 2, "形": 3 };

  function sortMeanings(meanings) {
    return meanings.sort((a, b) => {
      const orderA = posOrder[a.part_of_speech] || 99;
      const orderB = posOrder[b.part_of_speech] || 99;
      return orderA - orderB;
    });
  }

  window.openWordModal = async (word) => {
    const wordId = word.id;
    modal.dataset.currentId = wordId;

    // 🔹スクロール位置をリセット
    setTimeout(() => {
      const scrollArea = document.querySelector(".word-modal__scroll-area");
      if (scrollArea) scrollArea.scrollTop = 0;
    }, 0);

    try {
      const res = await fetch(`${dictionaryPath}${wordId}.json`);
      if (!res.ok) throw new Error("404 Not Found");
      const json = await res.json();

      // タイトルと発音
      titleEl.textContent = word.english;
      pronEl.textContent = word.pronunciation || json.pronunciation || "";

      // 意味セクション
      const mainMeaning = word.translation
        ? [{ translation: `<strong>${word.translation}</strong>`, part_of_speech: word.part_of_speech }]
        : [];
      const extra = (json.other_translations || []).map(m => ({
        translation: m.translation,
        part_of_speech: m.part_of_speech
      }));
      const combined = [...mainMeaning, ...extra];
      // ✅ メイン訳の品詞を最上位に、残りは品詞優先順位に従って並べる
      // ✅ 品詞順の優先度
      const posOrder = { "動": 1, "名": 2, "形": 3 };
      const mainPOS = posMap[word.part_of_speech] || word.part_of_speech || ""; 
      // const mainPOS = word.part_of_speech || "";

      // ✅ combinedをgroupedにまとめる
      const grouped = {};
      combined.forEach(m => {
        const pos = posMap[m.part_of_speech] || m.part_of_speech || "";
        if (!grouped[pos]) grouped[pos] = [];
        grouped[pos].push(m.translation);
        });

      // ✅ 優先順＋メイン品詞で並び替え
      const sortedGrouped = Object.entries(grouped).sort(([a], [b]) => {
        const aOrder = a === mainPOS ? -1 : (posOrder[a] || 999);
        const bOrder = b === mainPOS ? -1 : (posOrder[b] || 999);
        return aOrder - bOrder;
      });
      

      // ✅ 出力
      meaningsEl.innerHTML = sortedGrouped
        .map(([pos, list]) => `<li><span class="word-card__part-of-speech">${pos}</span> ${list.join("、")}</li>`)
        .join("");

      // 画像
      imageEl.src = `Img/${word.course}/${word.english}.jpg`;
      imageEl.alt = `${word.english}のイラスト`;

      // 例文
      const example = (word.example || '').replace(/\|/g, '');
      const highlighted = example.replace(
        new RegExp(`\\b${word.english}\\b`, 'gi'),
        `<span class="highlight">$&</span>`
      );
      exampleEnEl.innerHTML = `
        ${highlighted}
        <button class="word-modal__example-sound word-modal__sound"
                data-audio="wordsound/${word.sound}_1.mp3"
                aria-label="例文の音声再生">
          <img src="image/btn_sound.png" alt="発音再生">
        </button>`;
      exampleJaEl.textContent = word.example_translation || "";


      // 関連語（派生語・対義語を統合して表示）
      relatedEl.innerHTML = "";
      let hasRelated = false;

      // ✅ 派生語（◇）
      if ((json.derivatives || []).length > 0) {
        hasRelated = true;
        json.derivatives.forEach(d => {
          const jpPos = posMap[d.part_of_speech] || d.part_of_speech;
          relatedEl.innerHTML += `<p class="word-modal__related-item">(${jpPos}) ${d.english}：${d.translation}</p>`;
        });
      }

      // ✅ 対義語（↔︎）
      if ((json.antonyms || []).length > 0) {
        hasRelated = true;
        json.antonyms.forEach(a => {
          const jpPos = posMap[a.part_of_speech] || a.part_of_speech;
          relatedEl.innerHTML += `<p class="word-modal__related-item">↔︎(${jpPos}) ${a.english}：${a.translation}</p>`;
        });
      }

      // ✅ セクションの表示制御
      if (hasRelated) {
        relatedEl.closest(".word-modal__section").style.display = "block";
      } else {
        relatedEl.closest(".word-modal__section").style.display = "none";
      }



      // 使い方（phrases）- ✅ p.englishの存在チェック付き
      usageEl.innerHTML = "";
      if ((json.phrases || []).length > 0) {
        usageEl.closest(".word-modal__section").style.display = "block";
        json.phrases.forEach(p => {
          const raw = p.english || "";
        
          // ✅ |...|で囲まれた部分を検出
          const replaced = raw.replace(/\|(.+?)\|/g, (match, inner) => {
            // 英単語を含む場合だけハイライト（活用形でも許容）
            if (inner.toLowerCase().includes(word.english.toLowerCase())) {
              return `<span class="highlight">${inner}</span>`;
            }
            return inner; 
          });
        
          // ✅ 句読点の直前にスペースが入らないよう調整
          const clean = replaced.replace(/\s+([.,!?;:])/g, "$1");
        
          usageEl.innerHTML += `
            <li>
              <p class="word-modal__usage-en">${clean}</p>
              <p class="word-modal__usage-ja">${p.translation}</p>
            </li>`;
        });
        // json.phrases.forEach(p => {
        //   const raw = p.english || "";
        //   const en = raw.includes(`|${word.english}|`)
        //     ? raw.replace(new RegExp(`\\|${word.english}\\|`, 'g'), `<span class="highlight">${word.english}</span>`).replace(/\|/g, '')
        //     : raw;

        //   usageEl.innerHTML += `
        //     <li>
        //       <p class="word-modal__usage-en">${en}</p>
        //       <p class="word-modal__usage-ja">${p.translation}</p>
        //     </li>`;
        // });
      } else {
        usageEl.closest(".word-modal__section").style.display = "none";
      }

      // ニュアンス
      if ((json.synonyms || []).length > 0 && json.synonyms[0]?.description) {
        nuanceEl.closest(".word-modal__section").style.display = "block";
        nuanceEl.textContent = json.synonyms[0].description;
      } else {
        nuanceEl.closest(".word-modal__section").style.display = "none";
      }

      // 英英定義
      englishDefEl.textContent = json.english_meaning || "";

      // 音声ボタン
      soundBtn.setAttribute("data-audio", `wordsound/${word.sound}_1.mp3`);

      // 前後ナビゲーション
      const cards = [...document.querySelectorAll(".word-card")];
      const ids = cards.map(c => c.dataset.id);
      const currentIndex = ids.indexOf(wordId);
      const prevWord = window.wordDataArray?.find(w => w.id === ids[currentIndex - 1]);
      const nextWord = window.wordDataArray?.find(w => w.id === ids[currentIndex + 1]);
      prevBtn.innerHTML = prevWord ? `&lt; ${prevWord.english}` : "";
      nextBtn.innerHTML = nextWord ? `${nextWord.english} &gt;` : "";

      // モーダル表示
      modal.setAttribute("aria-hidden", "false");
      modal.classList.add("is-open");
      // ✅ 検索モードのオーバーレイがあれば削除

    } catch (err) {
      console.error("❌ JSON 読み込み失敗:", err);
    }
  };

  // ✅ 前後切り替え（グレーアウト演出付き）
function moveModal(direction) {

  const cards = [...document.querySelectorAll(".word-card")];
  const ids = cards.map(c => c.dataset.id);
  const currentId = modal.dataset.currentId;
  const currentIndex = ids.indexOf(currentId);
  const targetId = direction === "next" ? ids[currentIndex + 1] : ids[currentIndex - 1];
  if (!targetId) return;

  // 🔹 存在していれば暗転実行
  const fadeLayer = document.querySelector(".word-modal__fade-layer");
  if (fadeLayer) {
    fadeLayer.classList.add("is-active");
  }

  const targetWord = window.wordDataArray.find(w => w.id === targetId);
  if (targetWord) {
    setTimeout(() => {
      window.openWordModal(targetWord);

      // 🌟 エフェクト解除（300ms後）
      if (fadeLayer) {
        fadeLayer.classList.remove("is-active");
      }
    }, 300);
  }
}

  prevBtn.addEventListener("click", () => moveModal("prev"));
  nextBtn.addEventListener("click", () => moveModal("next"));

  // スワイプ
  let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

modal.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
});

modal.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;

  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;

  // ✅ 横移動が大きく、かつ縦移動が小さいときのみスワイプと判定
  if (Math.abs(diffX) > 50 && Math.abs(diffY) < 30) {
    if (diffX > 0) moveModal("prev");
    else moveModal("next");
  }
});



  // 音声再生
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".word-modal__sound");
    if (!btn) return;
    const audioSrc = btn.getAttribute("data-audio");
    if (!audioSrc) return;
    const audio = new Audio(audioSrc);
    audio.play().catch(err => console.error("🔈 再生エラー:", err));
  });
});