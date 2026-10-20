/* ===== 1. 移动端汉堡菜单 ===== */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', open);
});

// 点击菜单项后自动收起（移动端）
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ===== 2. 导航高亮：滚动时高亮当前区块 ===== */
const sections = document.querySelectorAll('main section[id]');
const links = document.querySelectorAll('.nav-link');

// IntersectionObserver：区块进入视口中部时，高亮对应导航项
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => {
        link.classList.toggle(
          'active',
          link.getAttribute('href') === '#' + entry.target.id
        );
      });
    });
  },
  { rootMargin: '-40% 0px -55% 0px' } // 视口中部为判定带
);
sections.forEach(s => observer.observe(s));

/* ===== 3. 卡片进入视口淡入 ===== */
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target); // 只播一次
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ===== 4. 占位链接保护：未替换真实链接时给出提示 ===== */
// 项目按钮 href 为 "#" 时视为占位；替换为真实链接后此逻辑自动失效
document.querySelectorAll('a.btn[href="#"]').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    alert('成果链接待填写：请把该按钮的 href 替换为真实项目链接。');
  });
});
