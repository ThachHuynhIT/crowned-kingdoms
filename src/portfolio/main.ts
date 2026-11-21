/** Progressive enhancements only; this entry never boots Phaser or touches game saves. */
export {};

interface KingStory {
  name: string;
  trait: string;
  description: string;
  strength: string;
  style: string;
}

const kings: Record<string, KingStory> = {
  wheat: {
    name: 'Vua Lúa Mì',
    trait: 'Đồng ruộng & đoàn quân',
    description:
      'Một vương quốc lớn lên từ những mùa gặt. Biến ruộng đồng thành nguồn vàng, rồi dẫn đội quân nông dân đông đảo bảo vệ từng tấc đất.',
    strength: 'Kinh tế và quân số',
    style: 'Tích lũy, phát triển, áp đảo',
  },
  stone: {
    name: 'Vua Đá Núi',
    trait: 'Thành lũy & sức bền',
    description:
      'Kiên định như núi đá. Dựng những tòa tháp bền chắc, để người đá chịu đòn ở tuyến đầu và dùng hỏa lực pháo bào mòn đội quân xâm lược.',
    strength: 'Phòng thủ và hỏa lực',
    style: 'Chậm rãi, bền bỉ, vững vàng',
  },
  arcane: {
    name: 'Vua Phép Thuật',
    trait: 'Tinh tú & bùa phép',
    description:
      'Mỗi công trình là một nguồn ma lực. Chồng bùa, nuôi dưỡng pháp sư và tìm ra những kết hợp phép thuật khiến cả chiến trường đổi chiều.',
    strength: 'Bùa và phép thuật',
    style: 'Kết hợp, cường hóa, bùng nổ',
  },
  grove: {
    name: 'Vua Rừng Xanh',
    trait: 'Cổ thụ & muông thú',
    description:
      'Thời gian đứng về phía khu rừng. Nuôi dưỡng những công trình mạnh dần theo năm, gọi thú rừng và dùng sức sống của cây để giữ vững đội hình.',
    strength: 'Phát triển và hồi phục',
    style: 'Nuôi dưỡng, kiên nhẫn, vươn lên',
  },
  tide: {
    name: 'Vua Thuỷ Triều',
    trait: 'Sóng biển & chiến lợi phẩm',
    description:
      'Mang tinh thần biển cả vào từng trận đánh. Pháo nổ đẩy lùi kẻ địch, còn chiến lợi phẩm tiếp sức cho đội quân cướp biển tiến về phía trước.',
    strength: 'Pháo và đẩy lùi',
    style: 'Dồn ép, cướp bóc, tiến công',
  },
  forge: {
    name: 'Vua Lò Rèn',
    trait: 'Sắt thép & ngọn lửa',
    description:
      'Sức mạnh được rèn qua từng lần nâng cấp. Xây công trình cấp cao, tôi luyện đội quân và để ngọn lửa thiêu đốt những kẻ dám áp sát ngai vàng.',
    strength: 'Nâng cấp và thiêu đốt',
    style: 'Rèn đúc, đầu tư, áp lực',
  },
  clock: {
    name: 'Vua Đồng Hồ',
    trait: 'Bánh răng & thời gian',
    description:
      'Một vương quốc vận hành như cỗ máy lên dây cót. Quân lính và tháp tăng nhịp đánh theo thời gian, biến trận chiến kéo dài thành lợi thế.',
    strength: 'Tốc độ đánh tăng dần',
    style: 'Lắp ghép, lên dây, tăng tốc',
  },
  moon: {
    name: 'Vua Ánh Trăng',
    trait: 'Linh hồn & triệu hồi',
    description:
      'Quyền năng luôn có cái giá của nó. Gom Hồn qua hiến tế, gọi những bóng ma và đánh đổi sự an toàn để chạm tới một sức mạnh khác thường.',
    strength: 'Hiến tế và triệu hồi',
    style: 'Đánh đổi, mạo hiểm, biến hóa',
  },
  nomad: {
    name: 'Vua Du Mục',
    trait: 'Thảo nguyên & kỵ binh',
    description:
      'Không có đội hình nào phải đứng yên mãi. Dời công trình qua từng năm, tìm vị trí thuận lợi và mở đường cho kỵ binh tung đòn xung phong.',
    strength: 'Di chuyển và xung phong',
    style: 'Linh hoạt, sắp đặt, đột kích',
  },
};

const kingButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-king]')];
const portrait = document.querySelector<HTMLImageElement>('#king-portrait');
const fields = {
  name: document.querySelector('#king-name'),
  trait: document.querySelector('#king-trait'),
  description: document.querySelector('#king-description'),
  strength: document.querySelector('#king-strength'),
  style: document.querySelector('#king-style'),
};

function selectKing(button: HTMLButtonElement): void {
  const id = button.dataset.king;
  const story = id ? kings[id] : undefined;
  if (!story || !portrait) return;
  for (const [key, element] of Object.entries(fields)) {
    if (element) element.textContent = story[key as keyof KingStory];
  }
  portrait.src = new URL(`../assets/art/ai-v1/portraits/${id}-144.png`, document.baseURI).href;
  portrait.alt = `Chân dung ${story.name}`;
  for (const item of kingButtons) item.setAttribute('aria-pressed', String(item === button));
}

for (const [index, button] of kingButtons.entries()) {
  button.addEventListener('click', () => selectKing(button));
  button.addEventListener('keydown', (event) => {
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % kingButtons.length;
        break;
      case 'ArrowLeft':
        next = (index - 1 + kingButtons.length) % kingButtons.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = kingButtons.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const target = kingButtons[next];
    if (target) {
      target.focus();
      selectKing(target);
    }
  });
}

const menuToggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
const navigation = document.querySelector<HTMLElement>('#navigation');
if (menuToggle && navigation) {
  const closeMenu = (): void => {
    menuToggle.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };
  menuToggle.hidden = false;
  document.documentElement.classList.add('js');
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });
  navigation.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuToggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (
      event.target instanceof Node &&
      !navigation.contains(event.target) &&
      !menuToggle.contains(event.target)
    )
      closeMenu();
  });
  window.matchMedia('(min-width: 768px)').addEventListener('change', (event) => {
    const focusedMenuButton = document.activeElement === menuToggle;
    const focusedNavigation = navigation.contains(document.activeElement);
    closeMenu();
    if (focusedMenuButton && event.matches) navigation.querySelector('a')?.focus();
    else if (focusedNavigation && !event.matches) menuToggle.focus();
  });
}
