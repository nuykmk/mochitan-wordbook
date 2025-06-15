// hamburgerメニュー
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("js-hamburger");
  const nav = document.querySelector(".header__nav");
  const spMenu = document.getElementById("js-hamburger-menu");

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("is-open");
    nav.classList.toggle("is-open");
    spMenu.classList.toggle("is-open");
  });
});

// 単語数カウント
document.addEventListener('DOMContentLoaded', () => {
  const wordCount = document.querySelectorAll('.word-card').length;
  const countElement = document.querySelector('.hero__count');
  if (countElement) {
    const icon = countElement.querySelector('.hero__count-icon');
    countElement.innerHTML = '';
    if (icon) countElement.appendChild(icon); // アイコンを再挿入
    countElement.insertAdjacentText('beforeend', `${wordCount}単語`);
  }
});

// 検索バー
// document.addEventListener("DOMContentLoaded", () => {
//   const searchBar = document.querySelector(".search-bar");
//   if (!searchBar) return;

//   // 最初は表示クラスを付ける
//   searchBar.classList.add("is-visible");

//   let lastScroll = window.pageYOffset;

//   window.addEventListener("scroll", () => {
//     const currentScroll = window.pageYOffset;

//     if (currentScroll > lastScroll) {
//       // 下スクロール → 非表示
//       searchBar.classList.remove("is-visible");
//     } else {
//       // 上スクロール → 表示
//       searchBar.classList.add("is-visible");
//     }

//     lastScroll = currentScroll;
//   });
// });

// TOPボタン
// ページがスクロールされたら実行
const backToTop = document.getElementById("backToTop");
const footer = document.getElementById("footer");

window.addEventListener("scroll", () => {

  if (!backToTop || !footer) return;
  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;
  const footerTop = footer.getBoundingClientRect().top + scrollY;

  // 300px以上スクロールして、かつfooterの上じゃないときだけ表示
  if (scrollY > 300 && scrollY + windowHeight < footerTop) {
    backToTop.style.display = "block";
  } else {
    backToTop.style.display = "none";
  }
});


// 音声
document.addEventListener('DOMContentLoaded', () => {
  const audioButtons = document.querySelectorAll('.word-card__sound');

  audioButtons.forEach(button => {
    button.addEventListener('click', () => {
      const audioSrc = button.getAttribute('data-audio');
      const audio = new Audio(audioSrc);
      audio.play();
    });
  });
});


