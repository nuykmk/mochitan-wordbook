// トップページ（index.html）用：単語帳カードの一覧表示
// - book_list.csvからTier1（コース）ごとに分類
// - 各単語帳のタイトル・画像・リンクを動的に生成

document.addEventListener("DOMContentLoaded", () => {
  const bookListContainer = document.getElementById("book-list");
  if (!bookListContainer) return;

  Papa.parse("data/book_list.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const books = results.data;
      const grouped = {};

      books.forEach((book, idx) => {
        const course = book.Tier1?.trim();
        const title = book.Tier3?.trim();
        const id = book.ID?.trim();

        if (!course || !title) return;
// 
        if (!grouped[course]) grouped[course] = [];
        grouped[course].push({ ...book, ID: id, Tier3: title });
      });

      Object.entries(grouped).forEach(([course, items]) => {
        const section = document.createElement("section");
        section.className = "course-section";

        const heading = document.createElement("h2");
        heading.className = "course-section__heading";
        heading.textContent = course;
        section.appendChild(heading);

        const itemsWrapper = document.createElement("div");
        itemsWrapper.className = "course-section__items";

        items.forEach((book, index) => {
          const id = book.ID || `${course}-${index}`;
          const imagePath = `data/book_image/book_${id}.png`; 
          const title = book.Tier3;

          const article = document.createElement("article");
          article.className = "book-card";

          article.innerHTML = `
            <a href="word-list.html?book=${id}" class="book-card__link">
              <div class="book-card__img-wrapper">
                
                <img src="${imagePath}" alt="${title}の画像" class="book-card__img" />
                
              </div>
              <div class="book-card__body">
                <h4 class="book-card__title">${title}</h4>
              </div>
            </a>
          `;

          itemsWrapper.appendChild(article);
        });

        section.appendChild(itemsWrapper);
        bookListContainer.appendChild(section);
      });

    },
    error: function (err) {
      console.error("❌ book_list.csvの読み込みエラー", err);
    },
  });
});