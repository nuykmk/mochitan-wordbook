// 検索バーと検索結果の制御
// - 英単語部分一致による検索処理（CSVから）
// - 結果を一覧として表示、クリックでモーダル表示
// - 入力イベントによる検索候補の表示も対応予定
// - モーダルを共通で使えるように word-detail.js に依存


document.addEventListener("DOMContentLoaded", () => {
  let retryCount = 0;
  const maxRetries = 10;
  const retryDelay = 200; // ms

  const checkAndRenderSwiper = () => {
    if (window.recommendSwiperBooks && Array.isArray(window.recommendSwiperBooks)) {
      renderSwiper();
    } else if (retryCount < maxRetries) {
      retryCount++;
      setTimeout(checkAndRenderSwiper, retryDelay);
    } else {
      console.warn("⚠️ recommendSwiperBooks が未定義のため、Swiper を表示できませんでした");
    }
  };

  checkAndRenderSwiper();
});

function renderSwiper() {
  const swiperWrapper = document.querySelector('.swiper-wrapper');
  if (!swiperWrapper || !window.recommendSwiperBooks) return;

  window.recommendSwiperBooks.forEach(book => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    slide.innerHTML = `
      <article class="book-card">
        <a href="word-list.html?book=${book.id}" class="book-card__link">
          <div class="book-card__img-wrapper">
            <img src="${book.image}" alt="${book.title}の画像" class="book-card__img" />
          </div>
          <div class="book-card__body">
            <h4 class="book-card__title">${book.title}</h4>
          </div>
        </a>
      </article>
    `;
    swiperWrapper.appendChild(slide);

  });

  const swiper = new Swiper('.swiper', {
    slidesPerView: 'auto',
    spaceBetween: 16,
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    on: {
      init(swiper) {
        updateCustomPagination(swiper);
      },
      slideChange(swiper) {
        updateCustomPagination(swiper);
      }
    }
  });
}

function updateCustomPagination(swiper) {
  const current = swiper.realIndex + 1;
  const total = swiper.slides.length;
  const el = document.querySelector('.swiper-pagination-custom');
  if (el) el.textContent = `${current} / ${total}`;
}