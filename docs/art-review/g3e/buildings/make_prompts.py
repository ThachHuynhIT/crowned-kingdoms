"""Write one Codex prompt per building of a group and a runner script (sequential, one image per run).

    python docs/art-review/g3e/buildings/make_prompts.py wheat

Prompts land in docs/art-review/g3e/buildings/<group>/<id>/prompt.md (provenance); the AI source goes next to it as
source.png. Groups are one king each (plan: playable kings first)."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
B = ROOT / 'docs/art-review/g3e/buildings'

COMMON = """Tạo MỘT ảnh pixel art bằng công cụ tạo ảnh (imagegen) và lưu đúng một file PNG vào `{out}` (sao chép vào đó nếu ảnh tạo ra nằm ngoài repo; tạo thư mục nếu chưa có). Không sửa file khác, không commit, không chạy node/npm.

Ảnh tham chiếu: `docs/art-review/g3e/ai-v1/source-sheet.webp` (nhà tranh, ô cỏ: chuẩn phong cách) và `docs/art-review/g3e/batch-01-barracks/source.png` (trại lính). Giữ ĐÚNG phong cách: pixel art fantasy ấm áp, "pixel" lớn khoảng 7×7 điểm ảnh, ánh sáng từ TRÊN-TRÁI, viền tối nâu đỏ 1 pixel quanh công trình, không anti-aliasing, không làm mờ, không chữ.

Góc nhìn XÉO 3/4 như Stardew Valley (thấy mặt trước và một phần mái, hơi từ trên xuống), giống nhà tranh và trại lính tham chiếu.
Ảnh 1024×1024, nền ĐEN PHẲNG #000000 hoàn toàn (KHÔNG quầng sáng, KHÔNG bóng đổ lên nền, KHÔNG nền đất/cỏ dưới chân, KHÔNG viền ô). MỘT công trình duy nhất đứng giữa ảnh theo chiều ngang, rộng khoảng 440–460 px, chân công trình chạm một đường nằm ngang ở khoảng y = 900 (chiều cao tối đa khoảng 560 px). Trong công trình KHÔNG có điểm đen thuần.

CÔNG TRÌNH: {name} — {desc}
Chủ đề kiến trúc của {king_name}: {theme}
Khi xong, in đường dẫn file đã lưu và kích thước ảnh.
"""

GROUPS = {
    'wheat': dict(king_name='vua Lúa Mì', theme='nông trại ấm áp, gỗ sáng màu, mái rơm vàng, bao lúa, hàng rào gỗ, tông vàng và nâu đất.', items=[
        ('building_wheat_field', 'Ruộng Lúa', 'một thửa ruộng lúa chín vàng gọn gàng, có hàng rào gỗ thấp và một cổng nhỏ; công trình THẤP (cao khoảng 250 px), kinh tế.'),
        ('building_wheat_granary', 'Kho Thóc', 'kho thóc bằng gỗ dựng trên cột cao, mái rơm, bao lúa chất ở cửa, thang gỗ nhỏ; hỗ trợ.'),
        ('building_wheat_peasant_horde', 'Khởi Nghĩa Nông Dân', 'trại nông dân nổi dậy: lều vải thô, cờ đỏ rách, chĩa ba và liềm dựng thành giá, xe rơm; sinh quân.'),
        ('building_wheat_reapers', 'Đội Thợ Gặt', 'nhà kho thợ gặt bằng gỗ có liềm lớn treo trước cửa, bó lúa dựng quanh, mái rơm; sinh quân.'),
        ('building_wheat_scarecrow', 'Bù Nhìn Gác', 'tháp gác nông trại: bù nhìn lớn đội mũ rơm đứng trên bục gỗ cao có mái nhỏ, ngực treo ná/cung; công trình CAO, tháp bắn.'),
        ('building_wheat_windmill', 'Cối Xay Gió', 'cối xay gió gỗ và đá với bốn cánh quạt vải, cửa nhỏ, bao bột; kinh tế.'),
    ]),
}


def main(group):
    cfg = GROUPS[group]
    runner = ['#!/bin/bash', f'cd "{ROOT.as_posix()}"']
    for ident, name, desc in cfg['items']:
        d = B / group / ident
        d.mkdir(parents=True, exist_ok=True)
        out = (d / 'source.png').relative_to(ROOT).as_posix()
        text = COMMON.format(out=out, name=name, desc=desc, king_name=cfg['king_name'], theme=cfg['theme'])
        (d / 'prompt.md').write_text(text, encoding='utf-8')
        prompt = (d / 'prompt.md').relative_to(ROOT).as_posix()
        runner.append(f'codex exec --sandbox workspace-write -C "$PWD" -i docs/art-review/g3e/ai-v1/source-sheet.webp '
                      f'-i docs/art-review/g3e/batch-01-barracks/source.png - < {prompt} > .superpowers/codex-b-{ident}.out 2>&1')
        runner.append(f'if [ -s {out} ]; then echo "{ident} ok" >> .superpowers/b-{group}.log; else echo "{ident} MISSING" >> .superpowers/b-{group}.log; fi')
    runner.append(f'echo done >> .superpowers/b-{group}.log')
    path = ROOT / f'.superpowers/b-{group}.sh'
    path.write_text('\n'.join(runner) + '\n', encoding='utf-8', newline='\n')
    print(path)


if __name__ == '__main__':
    main(sys.argv[1])
