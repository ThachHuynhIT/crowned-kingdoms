# G5 — Cân bằng, âm thanh, juice, mobile, PWA và art sáu vua

- **Ngày:** 2026-11-09
- **Trạng thái:** đặc tả để review; chỉ lập kế hoạch, chưa triển khai hay đo nghiệm thu.
- **Nguồn chuẩn:** `docs/superpowers/specs/2026-10-16-crowned-kingdoms-design.md` §1, §8.10, §10.1, §10.10, §11–14; `docs/ART_STYLE.md`; `CLAUDE.md`, `AGENTS.md`.
- **Kế hoạch:** `docs/superpowers/plans/2026-11-09-g5-balance-polish.md`.

## 1. Phạm vi và điểm xuất phát

G5 hoàn thành toàn bộ “Done khi” §1 của spec tổng: công cụ cân bằng và greedy bot, tinh chỉnh số, WebAudio sinh bằng code, SettingsScene, juice, mobile, PWA; bổ sung art isometric cho `grove`, `tide`, `forge`, `clock`, `moon`, `nomad`. Không tạo cơ chế chơi mới. Không làm lại G4: vua khoá hiển thị ẩn danh “Vua của ?”, trần tăng tốc đánh có thể vượt +40%, `nomad_p2` mở plot 10 và 14.

Nền hiện có, đã đối chiếu mã:

- `src/data/rules.ts`: `ALL_KINGS` là mảng id đã sắp; `RULES_FULL` có 30 năm, calendar `full`, `autoStart: false`. `PLAYABLE_KINGS` nằm ở `src/data/kings/index.ts`, được `src/game/cards/registry.ts` dùng để dựng `CONTENT`; không giả định registry export hai hằng này.
- `src/game/sim/headless.ts`: `runHeadless(opts, content = CONTENT)` mặc định `RULES_G1`, trả `{ state, commands }`; `HeadlessOptions` chưa có difficulty/perk. `Bot` trong `bots/random.ts` là `(state, content, rng) => RunCommand`. Bot random lọc nước đi bằng reducer; scripted dùng `stateRefusal`, bật tự bắn và chọn lính/tháp trước.
- `src/game/run/battleSetup.ts`: `buildBattleSetup(state, content)` trả `BattleSetup` gồm `throne`, `structures`, `waves`; lính ở `StructureSetup.spawn`, các triệu hồi có trường riêng; nhịp đòn tính theo tick.
- `src/game/meta/profile.ts` có ba volume; `DEFAULT_VOLUME = 100` thực sự ở `src/data/meta.ts`. `decodeMeta` sửa từng trường, giữ profile mới hơn ở chế độ chỉ đọc. `src/platform/session.ts` đã tuần tự hoá ghi meta, kết thúc ván bằng `coordinator.endRun`, trả `credited`; không thiết kế lại phần đó.
- `RealmScene.update` giữ runner trước `controller.update`, rút `drainEvents` sau update để không bỏ frame cuối. `BattleEvent.hit` hiện chỉ có `id`, `dmg`, chưa có nguồn đòn. `UnitRenderer` hiện fade chết 180 ms; chưa phải death pop bốn frame.
- `src/render/imageArt.ts`: Wheat có `IMAGE_BUILDINGS`, bốn `PLOT_STATES`, `IMAGE_PLOTS`; chưa có ảnh isometric sáu vua mới. `IMAGE_ART_SCALE = 0.5` là mật độ ảnh; kết hợp `ISO_SPRITE_SCALE`, không thay bằng scale sprite lẻ tuỳ ý.
- `index.html` đã có `viewport-fit=cover`, `touch-action: none`, `overscroll-behavior: none`; thiếu áp dụng safe-area. `vite.config.ts` dùng `base: './'`; Vitest chỉ thu `src/**/*.test.ts`, cần khai báo rõ test công cụ mới.

Ngoài phạm vi: multiplayer, endless, native wrapper, nhạc thu âm/file audio, thư viện PWA, art mới cho Stone/Arcane, thay chân dung/tranh thẻ, lính isometric mới. Art lính hiện tại giữ nguyên; G5 không mở thêm cổng mẫu lính.

## 2. Cân bằng và phép đo

### 2.1 Greedy thuần, có luật hoà rõ ràng

Thêm `greedyBot: Bot`, `estimatePower(setup: BattleSetup): number` tại `src/game/sim/bots/greedy.ts`. Liệt kê target theo handIndex, plot, first/second tăng dần; hỏi `applyCommand` để lọc cả từ chối do state. Không sửa input; không dùng RNG cho heuristic. Điểm = sức mạnh sau nước đi trừ sức mạnh trước nước đi, dùng cùng `buildBattleSetup`.

DPS = `dmg × 10 / interval`; interval không dương hoặc không có đòn → 0. Cộng `count × stats.hp × DPS(stats)` cho `spawn`, `startSummon`, `spawnAtThrone`; cộng `hp × (DPS(attack) × (multiAttack ?? 1) + pulseDps)` cho tháp và Ngai; `pulseDps = pulse.dmg × 10 / everyTicks`, vắng attack/pulse thì thành phần đó bằng 0. Duyệt throne đúng một lần, structures theo plot; không cộng waves địch. Không giả lập tương lai cho `summonEvery`, `soulSummon`, ramp, DOT, hồi máu hay splash: đây là giới hạn heuristic công khai, không tự đổi luật trận để bù.

Planning: bật autoFire một lần như scripted; đã chơi thì startBattle. Chọn play điểm cao nhất kể cả điểm 0, hoà theo thứ tự ổn định. Chỉ chọn freeMove nếu tăng điểm dương; lượt miễn phí hữu hạn. Khi không còn play hợp lệ, thử mua ô thấp nhất hợp lệ nếu việc đó mở được play; thử reroll tối đa 2 lần/năm nếu đủ vàng; sau đó discard lá đầu, hoặc startBattle nếu reducer cho phép. Không vòng lặp free reroll/freeMove. Reward/conquest: ước lượng card bằng play giả trên bản sao planning có lá đó, không thêm vào deck thật; lá không chơi được điểm 0, hoà index nhỏ nhất. Council và quest dùng chính sách ổn định của scripted (các lựa chọn phụ vẫn hợp lệ); năm cuối vẫn đóng hết pendingOffers theo luật. Thêm `src/data/balance.ts` giữ `GREEDY_MAX_REROLLS = 2`, cấu hình phép đo, không rải số gameplay trong bot.

### 2.2 CLI và thống kê

`tools/balance.ts` chạy bằng devDependency `tsx`, script `balance: tsx tools/balance.ts`. Giao diện: `npm run balance -- --king <id|all> --runs N --bot greedy|random|scripted --difficulty d`. Mặc định all/500/greedy/0; N nguyên dương, d nguyên 0–5; id/cờ sai thoát khác 0, không ghi kết quả dở thành số đo thành công.

Mọi bot chạy `RULES_FULL`. Truyền difficulty/perk qua `newRun` options, không sửa state sau khởi tạo. Đợt chuẩn: mỗi vua seed 1…500, cùng bộ seed cho bảng trước/sau, không perk, `unlockedCards: []`; greedy bật tự bắn, không can thiệp tay. Ghi cấu hình autoFire của từng bot để không đánh đồng so sánh random với greedy.

Thêm collector thuần ở `src/game/sim/stats.ts`, hook optional `onCommand(before, command, after)` gọi đúng một lần sau lệnh thành công trong headless. Không thêm telemetry vào RunState/save. `RunStats`: seed, kingId, difficulty, won, yearReached (`state.year`), completedYears, commands, picks/offered theo cardId, battlesReached/lost theo năm. Pick rate card = số lần pickOffer chọn card / số lần card được đưa ra ở reward/conquest/questReward; bỏ qua và duplicate offer không làm tăng numerator; không tính draw/play là pick. Offer được đếm một lần khi trở thành offer hiện hành. Loss rate năm = trận thua ở năm / số trận đã thực sự chơi ở năm, không chia tổng runs; ghi cả tử/mẫu, mẫu 0 để trống rate. Win rate dùng won thật, sống qua năm 30 kể cả boss còn sống vẫn thắng ván.

In summary mỗi vua + bảng card/year; CSV ổn định thứ tự tại `tools/out/balance-<bot>-gai-<d>-{runs,summary,cards,years}.csv`, UTF-8, escape quote/comma/newline, tạo thư mục; gitignore `tools/out/`. Lần chạy khác ghi đè có chủ đích; báo cáo giữ snapshot và revision/config để tái lập. Bảng CSV không chứa wall-clock trong stats deterministic; CLI có thể đo elapsed riêng.

### 2.3 Tuning

Mục tiêu bắt buộc: greedy, Gai 0, **500 runs/vua**, cả chín vua trong **35–65%**, max − min **≤ 15 điểm phần trăm**, không crash/lệnh bất hợp lệ. P1 ghi baseline chưa cần đạt; P2 mới chốt bảng đạt. Chỉ đổi số ở `src/data/*`, giữ mọi id/luật/định nghĩa thắng. Mỗi số đổi có test giá trị và hiệu ứng tương ứng; golden hash chỉ cập nhật sau khi giải thích thay đổi, vẫn kiểm hai world cùng setup từng tick. Không sửa bot giữa bảng trước/sau; nếu phải sửa lỗi bot, đo lại cả baseline.

Báo cáo `docs/balance/2026-11-09-g5-balance-report.md`: revision, seed, bot, rules, perk/meta/autoFire, công thức metric, baseline/final chín dòng, từng số cũ → mới và lý do, pick/loss tables, lệnh, thời gian, đường dẫn CSV và sai số lấy mẫu (không coi khoảng ước lượng là thay thế tiêu chí). Chưa đo thì ghi “chưa đo”, không dựng số. 4.500 × ~65 ms ≈ 292,5 s (~4,9 phút) là **ước lượng sàn từ số G4**, greedy duyệt nhiều setup và run thắng dài hơn: dự trù 10–30 phút/đợt, đo 10 runs/vua để hiệu chỉnh ETA; có progress từng vua. Chỉ smoke 9 × 3 seed (chạy lại so stats) trong npm test, không 4.500 run.

## 3. Âm thanh và sự kiện trình bày

WebAudio không phụ thuộc Phaser: `src/audio/sfx.ts` sinh PCM từ square/triangle/noise + ADSR + frequency sweep; `music.ts` lập lịch nốt; `AudioManager.ts` quản lý context, gain và vòng đời. Tham số thuần trong `src/data/sfx.ts`, `src/data/music.ts`, kiểm finite/positive/envelope, waveform noise dùng seed cục bộ, không chạm RNG ván.

21 id cố định: `ui_click`, `ui_hover`, `card_draw`, `card_play`, `reroll`, `coin`, `plot_unlock`, `level_up`, `battle_horn`, `hit_light`, `hit_heavy`, `arrow`, `cannon`, `fire`, `magic`, `death_pop`, `boulder_whoosh`, `boulder_impact`, `throne_hit`, `victory`, `defeat`. Hai loop: planning 90 BPM ngũ cung trưởng (C/D/E/G/A), sáo + dây gảy; battle 120 BPM trống + kèn. Crossfade 600 ms. Tối đa 4 voice/id, voice thứ năm bỏ qua; onended giải phóng slot, stop/destroy cũng vậy. Gain master × music/sfx, giá trị 0–100 chia 100. Không tạo AudioContext/buffer trước lần pointerdown/click đầu tiên; sau unlock sinh buffer một lần/context, resume context nếu bị suspend; không phát bù hàng trăm âm bị chặn trước unlock. Mute không tạo voice mới. Background suspend lịch nhạc, foreground tiếp tục một loop, không chồng scheduler. Đóng game dọn listener, timer, source, context.

ESLint `src/audio/**`: chỉ runtime import `src/data`, `src/core`, module audio; cho phép **type-only** `GameEvents` từ `src/game/events.ts`; cấm runtime import game và mọi game internals khác, Phaser/scenes/render/ui/platform. Scene làm adapter. Một app presentation bus (`EventBus<GameEvents>`) do Boot/registry giữ cho menu/settings/audio; bus run vẫn được tạo lại mỗi Realm. `bindAudio` tháo listener bus cũ khi đổi ván; không tạo AudioManager lại mỗi HUD.

Thêm payload trình bày qua GameEvents: `presentation:sfx { id: SfxId }`, `presentation:music { track: MusicId | null }`, `presentation:settings { settings: AudioSettings }`, `presentation:battle { events: readonly BattleEvent[] }`. Type dữ liệu ở data, GameEvents chỉ import type. Scene/adapter phát sự kiện, game không import audio. Thành công UI command suy từ state đã nhận/checkpoint, không phát card_play/coin trên ui:command có thể bị từ chối. Metadata trình bày bổ sung vào BattleEvent: hit có sourceId và damageType; thêm attack với sourceId cho âm bắn ngay lúc đòn thực sự xảy ra. Nguồn -1 không được suy thành boss. Chỉ thêm event, không sửa queueDamage/hit rules, RNG/hash/state/save. Realm rút events đúng một lần kể cả frame cuối rồi fan-out audio/FX. Plan Task 6 (Claude, TDD) sở hữu battle telemetry, GameEvents và mapper thuần `src/scenes/audioCues.ts`, kiểm hash từng tick khi drain/không drain và giao event frame cuối đúng một lần. Task 7 (Codex, Claude review) wiring bridge/Settings UI và đóng P3; juice Task 8, mobile/PWA Task 9–10, catalog/adoption Task 11–12, acceptance Task 13.

Ánh xạ: UI click/hover ở primitive; draw từ hand delta đầu năm; play/reroll/unlock/level-up/gold từ transition thành công; battle:started horn + battle loop, battle:ended victory/defeat + planning loop; boulder drop/impact tương ứng whoosh/impact; hit < 50 light, ≥ 50 heavy, hit Ngai throne_hit; death death_pop; attack vật lý đạn thường arrow, `tide_cannon`/bombardier cannon, fire damage fire, magic damage magic (ưu tiên cannon trước damageType trước arrow; melee chỉ âm hit). Mỗi event chỉ một âm attack theo ưu tiên, throne_hit thay light/heavy; cap chặn spam. Giữ event tick theo thứ tự; không đọc/ghi world từ audio.

## 4. Settings và lưu

`AudioSettings` ở `src/data/settings.ts`: `{ master: number; music: number; sfx: number; screenShake: boolean }`; DEFAULT_SCREEN_SHAKE=true, VOLUME_STEP=10, SETTINGS_BUTTON=48. `MetaProfile.settings` dùng kiểu này, volume mặc định vẫn `DEFAULT_VOLUME` từ data/meta. Giữ `META_SAVE_VERSION = 1`: bổ sung trường optional trên disk, decodeMeta default thiếu/hỏng screenShake về true, giữ nguyên mọi trường tiến trình và ba volume hợp lệ cũ (không ép volume cũ thành bội 10). UI chỉ chọn các nấc 0/10/…/100: volume cũ 25 giữ nguyên khi tải, lần bấm + đầu thành 30, bấm − thành 20; dùng ceil(value/10)×10 cho + và floor(value/10)×10 cho − khi lệch nấc, còn đúng nấc thì ±10, kẹp 0–100. Slider drag snap round(value/10)×10. Không đổi RunState v6, không cần run migrator; nếu thực thi phát sinh đổi RunState phải thêm migrator + fixture trước.

`GameSession.updateSettings(patch: Partial<AudioSettings>): Promise<UnlockResult>` dùng chung queue meta hiện có, đọc profile mới nhất, ghi xong mới publish; lỗi trả saveFailed và UI giữ giá trị trước đó, newer readOnly từ chối. `discardRun(): Promise<{ persistent: boolean }>` flush checkpoint rồi clear chỉ store run; không settle, không ghi/xoá meta, không mất mastery/unlocks/settings. Outcome lấy `isPersistent()` sau clear từ kho trình duyệt (store test không probe thì chỉ cam kết trong phiên). `createSaveStore` hiện nuốt lỗi đĩa và chuyển RAM: persistent=false phải nói rõ chỉ bỏ ván trong phiên này, bản lưu trên thiết bị có thể còn khi tải lại; không hứa xoá đĩa thành công. Trong ván: trước khi xoá chặn input/update, await controller.whenIdle, gọi `controller.dispose()` và đóng HUD để không còn checkpoint đến muộn; rồi clear và về menu. Clear reject giữ overlay và thông báo. Nếu clear resolve nhưng outcome persistent=false, hiện thông báo “Đã bỏ ván trong phiên này; chưa xác nhận xoá được bản lưu trên thiết bị” và nút về menu; không tự chuyển màn với lời báo xoá vĩnh viễn. Test mở một phiên mới trên cùng IndexedDB sau lỗi xoá phải ghi nhận bản cũ có thể vẫn còn.

SettingsScene có ba slider và −/+ 48×48, toggle rung, nút “Xoá ván đang chơi”. Bước xác nhận thứ nhất hiện cảnh báo, bước thứ hai nút “Xác nhận xoá”; Huỷ/Esc/đóng reset confirm. Nút disabled khi không có run hoặc đang ghi. Mở từ MainMenu và hai HUD. Overlay chặn click xuyên, giữ state/seed; battle pause bằng speed 0 và đóng khôi phục đúng speed cũ (kể cả 0), không ghi speed thành checkpoint. Truyền initial settings/owner/bus/speed qua launch data vì scene.launch chạy frame sau. Mỗi create reset mọi field, shutdown tháo listeners. UI dùng FONT_UI, createPanel/createButton/ContentBox/Tooltip.

## 5. Juice chỉ trình bày

Tham số `src/data/juice.ts`: SHAKE_PX=2, SHAKE_MS=150, HIT_FLASH_FRAMES=2, DEATH_POP_FRAMES=4, CARD_FLY_MS=250, FLOAT_DAMAGE_MIN=50; lựa chọn triển khai: DEATH_FRAME_MS=45, PLOT_BOUNCE_MS=150, PLOT_BOUNCE_PX=2, COIN_FLY_MS=400. Frame hit là render frame, không sim tick. Death pop là bốn frame FX sinh bằng code vào atlas sprites, không fade toàn sprite thay thế. Pool FX và số nổi (tối đa 64 mỗi loại; gộp gold cùng transition), dọn khi restart.

Rung chỉ khi boulder impact hoặc hit có sourceId là boss; tắt settings rung thì offset tức thì về 0. Sequence offsets nguyên, biên ±2 pixel màn hình, thời gian thực 150 ms; không dùng camera.shake với biên theo world. Lấy snapView gốc rồi cộng dịch màn hình nguyên (scroll delta = −offset/zoom), snapView lần cuối; publish realm:view đúng view đang vẽ để input không lệch, không ghi rung vào user view/pan. Test zoom 1.29375, 1.3, 3 và chuyển pha. White flash hai render frame có restore tint; death bốn frame giữ vị trí chân cuối. Không rotate/scale sprite lẻ, không thay world.hp/position.

Card clone từ vị trí tay bay tới plot 250 ms sau play thành công, plot nảy 2 px/150 ms chỉ renderer. Gold delta dương sinh coins bay về counter đúng HUD sau resize, số nổi `+N`; damage chỉ khi ≥ 50. Replay/resume initial state không giả thành gain/play; không đóng băng mô phỏng chờ tween. Test hashWorld mọi tick bật/tắt juice bằng cùng setup/inputs và kiểm snapshot state không đổi.

## 6. Mobile, hiệu năng và PWA

Safe-area bằng CSS `env(safe-area-inset-top/right/bottom/left, 0px)` trên container #game, Phaser RESIZE theo content box thực tế; bỏ width/height window cố định khi resize. Tính bố cục bằng canvas local coords, tránh trừ insets lần hai; desktop breakpoint theo CSS viewport width ≥ 768 ngay cả content width bị inset thu nhỏ. Các model nhận layout mode riêng khi cần. Giữ nền kín viewport, no overscroll/pull-to-refresh; không chặn gesture pinch/pan do game xử lý. Landscape thấp: menu/settings/crowns/modal cuộn trong vùng nội dung, nút đóng luôn tới được, target ≥ 44; không co nút để ép vừa.

Đo desktop ≥ 60 fps, mobile/throttle CPU 4× ≥ 30 fps, stress tối đa theo BATTLE caps, cùng scene có audio+juice; báo cáo mean/p95 frame time, dropped frames, thời lượng 60 s sau warm-up 5 s, browser/device/DPR/viewport/throttle. Node stepBattle mục tiêu trung bình ≤ 0.5 ms/tick, benchmark test ≤ 2 ms/tick; ghi riêng test threshold và số thực đo. Tối ưu pool/render nếu cần, không tăng tick interval hay giảm quân để đạt. Một atlas sprites ≤ 4096 mỗi chiều; kiểm sau P6 lần nữa.

PWA tự viết: `public/manifest.webmanifest`, template `public/sw.js`, registration `src/platform/pwa.ts`, build generator `tools/buildPwa.ts`, icons `tools/icons.ts`. Manifest relative start_url/scope './', display standalone, tiếng Việt, icon PNG 192/512 và maskable 512. Icons sinh bằng code từ motif crown có sẵn, nearest và không gọi imagegen. Build hook trong vite.config chạy sau bundle, liệt kê **mọi file dist runtime** (hashed JS/CSS, public art/portrait/ui/card, icons, manifest, index), chèn URL relative + content digest vào dist/sw.js. Không cache source docs, không cache chính sw.js; không hardcode /assets. Register production only bằng URL dựa import.meta.env.BASE_URL và document.baseURI; scope nằm trong base, hỗ trợ root, './' và '/crowned-kingdoms/'.

Install cache đầy đủ all-or-nothing; cache mới thiếu một response → install fail và giữ worker cũ. Navigation network-first, fallback cached index trong scope; static cache-first theo danh sách version; bỏ qua cross-origin/non-GET, không cache API/IndexedDB. Worker mới waiting, không skipWaiting/clients.claim tự động giữa run; thông báo “Có bản cập nhật — tải lại khi về menu”, chỉ kích hoạt/reload ở menu khi người chơi chọn. Activate xoá cache của app cùng scope/version cũ, không xoá cache ứng dụng khác. Offline sau một lần online tải đầy đủ: cold reload, chơi ván, tải meta/run, mọi art có; lần đầu offline chưa cài không cam kết. HTTPS hoặc localhost. Cache không thay cơ chế save và không tự xoá IndexedDB.

## 7. Art sáu vua, duyệt độc lập

P6 chỉ world throne/building và bốn skin open/locked/throne/built cho từng vua. Catalog lấy từ registry: throne + card kind troop/tower/economy/support, không tome/enchantment. Mỗi vua có **hai cổng mẫu riêng**: một throne/building, một plot skin. Tổng 12 cổng mẫu; các group tiếp theo cũng cần owner review trước adoption. Không có phase logic/audio/mobile nào phụ thuộc owner art approvals; P7 chỉ kết luận toàn G5 khi P6 đủ.

Mở rộng `docs/art-review/g3e/buildings/make_prompts.py` bằng chế độ `g5-iso`, đọc nguyên khối `iso_template()` từ ART_STYLE. Mỗi prompt buộc Codex đọc tài liệu, đính kèm `docs/art-review/style-references/harvester-house-front-approved.png` và PNG Wheat cùng loại: `public/assets/art/ai-v1/iso/wheat_throne.png` cho throne/building, `public/assets/art/ai-v1/iso/plots/wheat_open.png` cùng built/locked/throne tương ứng cho plots; thêm iso-building-approved/iso-plot-* để giữ hình học. File thiếu → từ chối chạy. Chỉ style từ ảnh chính diện, **không** lấy camera chính diện; world isometric 2:1, cửa mặt phải, mái đúng trục, sáng trên-trái. Đất trống không luống, cọc thấp, built lát đá toàn ô. Nền nguồn đen phẳng theo production override, key thành alpha 0/255.

Lưu `docs/art-review/g5/<king>/<asset>/{prompt.md,source.png,native.png}`, catalog.json, sample-review.md, group-review.md và contact sheet từng vua. Catalog khai native size/foot/projection theo metadata, giữ mật độ Wheat chung (Reapers rộng 64 art px), plots rộng 128 và căn widest row qua centre_plot; không tự đặt mọi nhà cùng kích thước. Thu/cắt dùng `keyed`, `reduce`, `centre_plot` từ make_assets.py hoặc helper trích tương đương, alpha snap cuối; kiểm native thực tế trước đăng ký. Không giới hạn RGB/số màu; không kế thừa checklist palette 32 màu cũ của ASSET_MANIFEST trái ART_STYLE mới hơn.

**STOP mỗi mẫu:** tạo đúng một ảnh cho đúng một king/kind → Claude kiểm → đưa owner xem nguồn và native → chờ owner nói duyệt. Không chạy group runner khi review còn pending/rejected. Sau duyệt mới vẽ phần còn lại của group; Claude review hình học/pixel/foot/đọc nhỏ, owner duyệt group; chưa duyệt không publish. Các cổng không được suy ra từ approval Wheat.

Adoption: PNG đến `public/assets/art/ai-v1/iso/<king>/...`; explicit BUILDINGS_APPROVED/PLOTS_APPROVED ở imageArt.ts, chỉ entry đã duyệt mới vào IMAGE_BUILDINGS/IMAGE_PLOTS/IMAGE_ART_FILES. Mỗi adopted PNG ghi manifest schema (projection iso_2_1, size, origin custom, provenance, anchor; plot có anchor centre giải thích trong notes) + CREDITS. Nạp lỗi vẫn code fallback; giữ frame names qua atlas, neo chân và y-sort cho nhà, plots neo tâm. Không thêm ảnh reference/concept vào atlas. Kiểm cả 6 vua trong browser hai kích thước, reload/offline sau build mới, atlas ≤ 4096.

## 8. Pha, rủi ro, câu hỏi mở

P1 tooling → P2 tuning → P3 audio/settings → P4 juice → P5 mobile/PWA → P6 art → P7 acceptance/docs. P6 bị STOP không giữ P1–P5/P7 audit độc lập; acceptance toàn bộ vẫn đợi art. Mỗi phase gate Git Bash lint/typecheck/test/build exit 0; phần nhìn thấy có browser 1280×720 và 375×812, console sạch. Dùng duy nhất nhánh `g5-balance-polish` (từ `g4-kings-meta`) và một PR vào `develop` cho toàn G5. Mở PR dạng draft khi P1 đóng, cập nhật cuối mỗi phase; mỗi phase có commit riêng và section Pn trong PR body kèm evidence. Owner chọn lúc merge; không merge nếu chưa có owner yes, không push trực tiếp `main`/`develop`. Nếu PR #14 (`g4-kings-meta`) còn mở khi mở G5 PR, ghi dependency trong PR body. Sau #14 merge, merge `develop` vào nhánh và kiểm diff không còn các commit G4.

| Rủi ro | Giảm thiểu và bằng chứng |
|---|---|
| Heuristic đánh giá thấp kinh tế/summon; tuning overfit | Công bố giới hạn, seed cố định, random/scripted cross-check ngoài target; không đổi rule/bot để ép bảng |
| 4.500 greedy runs rất chậm | Smoke nhỏ, pilot ETA, progress, đo dài ngoài npm test |
| Audio unlock/scheduler trùng sau restart | Một manager/app, bind/unbind run bus, test context/voice/cleanup |
| Delete bị checkpoint đến muộn làm sống lại ván | Freeze input/update → await whenIdle → stop controller → flush/clear; integration race test |
| Rung ở zoom lẻ gây blur/input lệch | Offset màn hình nguyên, snapView cuối, publish view thật; test projection round-trip |
| Service worker giữ JS/art cũ hoặc base sai | Digest từ output thật, offline test subpath, waiting worker, all-or-nothing install |
| Art approvals kéo dài, atlas tràn | Mẫu riêng 12 cổng, nhóm độc lập, fallback, đo atlas sau từng vua |

**Câu hỏi mở:** không có quyết định sản phẩm nào còn chặn plan. Các con số tuning cuối và thời lượng chạy là kết quả đo ở P1–P2, không được bịa trước.

## 9. Ma trận nghiệm thu toàn game

| §1 Done | Bằng chứng phải có ở P7 |
|---|---|
| 1: trọn 30 năm, 9 vua, thắng/thua, save/meta | fullRun 9 × 3 greedy/random, kịch bản thắng năm 30 và thua hết mạng, resumeIntegration mọi pha; browser qua boss/hội đồng, unlock/settings còn sau reload |
| 2: đủ nội dung | registry/data tests đếm 9 Ngai + 81 thẻ vua + 12 neutral + 27 perk + 9 banner + 18 decrees + 13 quests + 3 boss + royal_boulder, coverage handler/effect |
| 3: deterministic + headless | hashWorld từng tick với inputs, đổi inputs làm hash khác, đảo insertion order, stats cùng seed giống nhau; juice/audio bật/tắt không đổi hash |
| 4: hiệu năng | benchmark chuẩn, report FPS desktop/mobile/throttle 4× có max entities/projectiles và art cuối |
| 5: mọi màn §10 | screenshot Boot/Preload/menu/king select/Realm + hai HUD/reward/conquest/council/quest/deck/calendar/run end/crowns/settings, 1280×720 & 375×812, thêm landscape/notch; chạm ≥ 44 |
| 6: pixel look/art/UI | 6 group approval, manifest/CREDITS, atlas ≤ 4096, nearest/scale/alpha/foot/depth, code fallback, FONT_UI tiếng Việt |
| 7: balance | report final 500 × 9, 35–65%, spread ≤ 15 pp, CSV tái lập, không crash |
| 8: gate + CI | lệnh đầy đủ exit 0, CI xanh của revision bàn giao; chưa có CI thì ghi pending, chưa tuyên bố Done |

P7 cập nhật đồng bộ CLAUDE.md/AGENTS.md, ROADMAP.md, GDD.md, HANDOFF.md bằng thực tế và evidence; xoá các ghi chú lỗi cũ đã sửa (atomic endRun, credited, lastLife) chỉ sau kiểm regression, không làm lại chúng. Báo cáo acceptance riêng `docs/balance/2026-11-09-g5-acceptance.md` lưu links/revision/ảnh/metrics, không ghi “pass” thay cho dữ liệu.



