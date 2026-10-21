/* =========================================================
   个人主页交互脚本
   1. 顶部导航：滚动状态 / 滚动进度 / 滑动指示块 / 移动端菜单
   2. 内容动效：卡片依次淡入 / 技能条生长 / 卡片 3D 倾斜 + 柔光
   3. 占位链接保护
   ========================================================= */

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ===== 1. 顶部导航 ===== */
const header = document.querySelector('.site-header');
const navLinks = document.getElementById('navLinks');
const navToggle = document.getElementById('navToggle');
const progressBar = document.getElementById('scrollProgress');
const sections = document.querySelectorAll('main section[id]');
const links = document.querySelectorAll('.nav-link');

/* 1.1 滚动状态 + 进度条（rAF 节流） */
let ticking = false;

function onScroll() {
  if (ticking) return;
  ticking = true;

  requestAnimationFrame(() => {
    const doc = document.documentElement;
    const top = window.scrollY || doc.scrollTop;

    header.classList.toggle('is-scrolled', top > 8);

    const max = doc.scrollHeight - doc.clientHeight;
    const ratio = max > 0 ? Math.min(top / max, 1) : 0;
    progressBar.style.transform = `scaleX(${ratio})`;

    ticking = false;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

/* 1.2 滑动指示块：把当前项的位置写入 .nav-links 的自定义属性 */
function syncIndicator(link) {
  if (!link) return;
  navLinks.style.setProperty('--pill-x', `${link.offsetLeft}px`);
  navLinks.style.setProperty('--pill-y', `${link.offsetTop}px`);
  navLinks.style.setProperty('--pill-w', `${link.offsetWidth}px`);
  navLinks.style.setProperty('--pill-h', `${link.offsetHeight}px`);
  navLinks.classList.add('has-active');
}

function setActive(link) {
  if (link && link.classList.contains('active')) return;

  links.forEach(l => {
    const active = l === link;
    l.classList.toggle('active', active);
    if (active) {
      l.setAttribute('aria-current', 'true');
    } else {
      l.removeAttribute('aria-current');
    }
  });

  syncIndicator(link);
}

/* 1.3 滚动高亮当前区块 */
const navObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      setActive(document.querySelector(`.nav-link[href="#${entry.target.id}"]`));
    });
  },
  { rootMargin: '-40% 0px -55% 0px' } // 视口中部为判定带
);
sections.forEach(s => navObserver.observe(s));

// 滚动到页面底部时高亮最后一项（最后一个区块可能无法进入判定带）
window.addEventListener('scroll', () => {
  const doc = document.documentElement;
  if (window.scrollY + window.innerHeight >= doc.scrollHeight - 4) {
    setActive(links[links.length - 1]);
  }
}, { passive: true });

// 位置变化（窗口缩放、字体加载）后重新贴合指示块
const activeLink = () => document.querySelector('.nav-link.active');
window.addEventListener('resize', () => {
  const link = activeLink();
  if (link) syncIndicator(link);
});

/* 1.4 移动端菜单 */
function closeMenu() {
  navLinks.classList.remove('open');
  navToggle.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', '打开菜单');
}

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
});

// 点击菜单项后自动收起（移动端）
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', closeMenu);
});

// Esc 关闭 / 点击菜单外部关闭 / 回到桌面宽度时关闭
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) {
    closeMenu();
    navToggle.focus();
  }
});

document.addEventListener('click', e => {
  if (!navLinks.classList.contains('open')) return;
  if (navLinks.contains(e.target) || navToggle.contains(e.target)) return;
  closeMenu();
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 767) closeMenu();
});

/* ===== 2. 内容动效 ===== */

/* 2.1 网格子项编号，用于依次淡入 */
document.querySelectorAll('.grid').forEach(grid => {
  Array.from(grid.children).forEach((el, i) => {
    el.style.setProperty('--i', i);
  });
});

/* 2.2 技能条延迟（同一卡片内依次生长） */
document.querySelectorAll('.skill-list').forEach(list => {
  Array.from(list.children).forEach((li, i) => {
    li.style.setProperty('--d', `${i * 110}ms`);
  });
});

/* 2.3 进入视口淡入（同一网格内错开 80ms） */
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const index = Number(el.style.getPropertyValue('--i') || 0);

      if (!prefersReduced && index) {
        el.style.transitionDelay = `${index * 80}ms`;
        // 动画结束后清掉延迟，避免影响后续 hover 动效
        el.addEventListener('transitionend', function done(ev) {
          if (ev.propertyName !== 'transform') return;
          el.style.transitionDelay = '';
          el.removeEventListener('transitionend', done);
        });
      }

      el.classList.add('visible');
      revealObserver.unobserve(el); // 只播一次
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* 2.4 卡片：跟随鼠标的柔光 + 轻微 3D 倾斜 */
if (canHover && !prefersReduced) {
  const MAX_TILT_X = 4;  // 上下倾斜角度上限
  const MAX_TILT_Y = 6;  // 左右倾斜角度上限

  document.querySelectorAll('.card').forEach(card => {
    let raf = null;
    let px = 0;
    let py = 0;

    card.addEventListener('pointermove', e => {
      const rect = card.getBoundingClientRect();
      px = e.clientX - rect.left;
      py = e.clientY - rect.top;

      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        card.style.setProperty('--mx', `${px}px`);
        card.style.setProperty('--my', `${py}px`);

        const rx = ((py / rect.height) - 0.5) * -2 * MAX_TILT_X;
        const ry = ((px / rect.width) - 0.5) * 2 * MAX_TILT_Y;
        card.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
        card.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      });
    });

    card.addEventListener('pointerenter', () => {
      if (card.classList.contains('visible') || !card.classList.contains('reveal')) {
        card.classList.add('is-tilting');
      }
    });

    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

/* ===== 3. 占位链接保护：未替换真实链接时给出提示 ===== */
// 项目按钮 href 为 "#" 时视为占位；替换为真实链接后此逻辑自动失效
document.querySelectorAll('a.btn[href="#"]').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    alert('成果链接待填写：请把该按钮的 href 替换为真实项目链接。');
  });
});
