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


