document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector("#sidebar .sidebar__list");
  if (!sidebar) return;

  // ✅ 重複実行防止（サイドバーが2回出るのを防ぐ）
  if (window.sidebarLoaded) return;
  window.sidebarLoaded = true;

  Papa.parse("data/book_list.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const books = results.data;

      const courseMap = new Map(); 
      books.forEach(book => {
        const course = book.Tier1?.trim();
        const title = book.Tier3?.trim();
        let path = book.tier1_path?.trim();

        // ✅ スラッシュ先頭を除去
        path = path?.replace(/^\//, '');

        if (!course || !title || !path) return;

        if (!courseMap.has(course)) {
          courseMap.set(course, { count: 0, path });
        }
        courseMap.get(course).count += 1;
      });

      const total = Array.from(courseMap.values()).reduce((sum, obj) => sum + obj.count, 0);
      const allLi = document.createElement("li");
      allLi.innerHTML = `<a href="index.html"><span class="sidebar__name">全カテゴリ</span><span class="sidebar__count">(${total})</span></a>`;
      sidebar.appendChild(allLi);



    for (const [course, { count, path }] of courseMap.entries()) {
      const li = document.createElement("li");
      // ✅ 「全カテゴリー」リンクにだけ対応（course パラメータが存在しないとき）
    if (!window.location.search.includes("course=")) {
        const allCategoryLink = document.querySelector('#sidebar a[href="index.html"]');
    if (allCategoryLink) {
      allCategoryLink.classList.add("is-active");
    }
}
    
      const currentParam = new URLSearchParams(window.location.search).get("course");
      const isActive = course === currentParam;
    
      li.innerHTML = `
        <a href="course.html?course=${encodeURIComponent(course)}" class="${isActive ? "is-active" : ""}">
          <span class="sidebar__name">${course}</span>
          <span class="sidebar__count">(${count})</span>
        </a>
      `;
      sidebar.appendChild(li);
    }

    },
    error: err => {
      console.error("❌ サイドバーCSV読み込みエラー:", err);
    }
  });
});