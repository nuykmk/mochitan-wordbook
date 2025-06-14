document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const courseParam = params.get("course"); 
  if (!courseParam) return;

  Papa.parse("data/book_list.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const books = results.data;

      // ✅ Tier1 pathから最初の該当データを取得
    const courseRow = books.find(book =>
      book.Tier1?.trim() === courseParam
    );

      // ✅ パンくずリスト書き換え
      const breadcrumbList = document.querySelector(".breadcrumb__list");
      if (breadcrumbList && courseRow?.Tier1) {
      breadcrumbList.innerHTML = `
        <a href="index.html" class="breadcrumb__item"><>単語帳 一覧<</a>
        <a href="course.html?course=${encodeURIComponent(courseParam)}" aria-current="page">${courseRow.Tier1}</a>        `;
      }

      // ✅ ヒーローセクションをCSVから動的に反映
      if (courseRow) {
      const courseName = courseRow.Tier1?.trim() || "このコース";
      const description = courseRow.book_description?.trim() || "";
      const titleEl = document.querySelector(".hero__title");
      const textEl = document.querySelector(".hero__text");
      if (titleEl) titleEl.textContent = `${courseName}の単語帳一覧`;
      if (textEl) textEl.textContent = description;
      }
      const courseBooks = books.filter(book => {
        const tier1 = book.Tier1?.trim();
        return tier1 && tier1 === courseParam;
      });


      const container = document.getElementById("course-list");
      if (!container) return;
      container.innerHTML = "";

      if (courseParam === "その他") {
        const section = document.createElement("section");
        section.className = "course-category";

        const heading = document.createElement("h2");
        heading.className = "course-category__heading";
        heading.textContent = "その他の単語帳";
        section.appendChild(heading);

        const wrapper = document.createElement("div");
        wrapper.className = "course-category__items";

        courseBooks.forEach(book => {
          const id = book.ID?.trim();
          const title = book.Tier3?.trim();
          if (!id || !title) return;

          const imagePath = `data/book_image/book_${id}.png`;
          const article = document.createElement("article");
          article.className = "book-card";
          article.innerHTML = `
            <a href="word-list.html?book=${id}" class="book-card__link">
              <div class="book-card__img-wrapper">
                <img src="${imagePath}" alt="${title}" class="book-card__img" loading="lazy" />
              </div>
              <div class="book-card__body">
                <h4 class="book-card__title">${title}</h4>
              </div>
            </a>
          `;
          wrapper.appendChild(article);
        });
        section.appendChild(wrapper);
        container.appendChild(section);
      } else {
        const grouped = {};
        courseBooks.forEach(book => {
          const category = book.Tier2?.trim();
          const title = book.Tier3?.trim();
          const id = book.ID?.trim();
          if (!category || !title || !id) return;

          if (!grouped[category]) grouped[category] = [];
          grouped[category].push({ ...book, ID: id, Tier3: title });
        });

        Object.entries(grouped).forEach(([category, items]) => {
          const section = document.createElement("section");
          section.className = "course-category";

          const heading = document.createElement("h2");
          heading.className = "course-category__heading";
          heading.textContent = category;
          section.appendChild(heading);

          const wrapper = document.createElement("div");
          wrapper.className = "course-category__items";

          items.forEach(book => {
            const id = book.ID;
            const title = book.Tier3;
            const imagePath = `data/book_image/book_${id}.png`; 

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
            wrapper.appendChild(article);
          });

          section.appendChild(wrapper);
          container.appendChild(section);
        });
      }

      
    }
  });
});