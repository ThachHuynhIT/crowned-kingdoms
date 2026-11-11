# HiDPI rendering: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans để triển khai từng task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Canvas vẽ ở D pixel thiết bị/CSS px, chữ sắc nét, giữ nguyên layout và tương tác logical; D1 giống hiện tại.

**Architecture:** Scale.NONE với một display runtime sở hữu backing/CSS/input scale; module toán thuần trong src/ui chuyển logical/backing và bù tâm camera Realm; HUD dùng origin 0. Mọi scene dùng adapter camera/layout, text đăng ký density; Realm giữ view logical và snap translation ở device pixels.

**Tech Stack:** Phaser 4 local types, TypeScript strict, Vite, Vitest, browser CDP/Playwright.

**Spec:** `docs/superpowers/specs/2026-11-11-hidpi-rendering-design.md` (đọc cùng plan).

## Global Constraints

- Phiên này chỉ viết hai file spec/plan, không code, commit hoặc node/npm/npx. Checkbox và lệnh dưới là việc triển khai tương lai.
- Sau task cuối giữ D thực hữu hạn > 0; trước đó HIDPI_ENABLED=false giữ D1, DEV ?density=2 kiểm từng nhóm. Không đổi quyết định sản phẩm: không cap/round D; backing `max(1,round(logical*D))`, CSS đúng hộp #game, ratio theo từng trục. D không hợp lệ fallback 1, box 0 giữ snapshot hợp lệ trước.
- Logical/CSS px: 1280×720, 375×812, breakpoint width ≥ 768, target ≥ 44×44, DRAG_SLOP 8, long-press 400 ms. Không đổi fontSize/UI scale/size sprite để bù density.
- Giữ nearest, pixelArt, integer sprite scale, createPanel/createButton/FONT_UI, atlas frame names và native art. Chỉ world camera zoom logical; giữ realmZoomLimits hiện tại, không nâng max desktop chỉ vì trần tổng quát là 3.
- Không sửa src/game|data|core/save hoặc EventBus schema. Không thêm import ngược layer, Math.random/Date.now vào simulation. Mọi helper mới thuần ở src/ui, không ở game/core.
- Reset fields trong create vì scene tái sử dụng; bind Preload ngay preload. scene.launch bắt đầu frame sau: đọc metrics hiện hành và launch data ban đầu, không dựa event đã phát.
- Khi triển khai trên phase branch `feature/enhance-hd-graphics` theo CLAUDE Naming; không tạo branch/commit trong phiên tài liệu. PR vào develop, không đẩy trực tiếp main/develop.

## Review Focus

1. D1→2→1 và ScaleManager.refresh tự phát: CSS/displayScale không drift — Task 2 browser runtime test.
2. D lẻ/viewport lẻ/tâm camera: matrix và inverse đúng từng trục — Task 1 tests, Task 6 browser.
3. Pointer p.y/down/distance và local/getBounds: giữ slop, vị trí chọn/drop — Task 3 tests và thao tác browser.
4. Loading/direct Text/pool/container và modal đang mở: density mới nhưng wrap/bounds giữ nguyên — Task 2/3/6 browser và text registry tests.
5. Scene reuse, launch next frame, sleep/wake, đổi D giữa pinch/drag: không leak/command ngoài ý muốn — Task 2 lifecycle test và Task 6 browser.

## Gate và bằng chứng chung

**Gate G đóng từng phase:** `npm run lint && npm run typecheck && npm test && npm run build` phải exit 0; chạy thêm browser D1 và D2 theo Browser B bên dưới. Không chuyển phase với lỗi chưa xử lý. Git Bash Windows: mỗi npm command thêm `< /dev/null`; PowerShell dùng lệnh nguyên văn. Không chạy trong phiên viết plan này.

**Browser B:** mở preview cấu hình **dev-check** của `.claude/launch.json` (Vite port **5176**), không dev/dev-lan. In-app preview không đặt được deviceScaleFactor. Dùng hai phương pháp:

1. **Chính trong migration:** URL `http://localhost:5176/?density=1` và `http://localhost:5176/?density=2` ở dev-check; override DEV ép D2 cả trên màn D1. Kiểm layout/input/độ nét render path bằng CSS rect, canvas backing và metrics runtime; DPR của browser vẫn là DPR máy. Đây không phải bằng chứng DPR thật. Ảnh preview có kích thước theo màn host, không mặc định ảnh D2 là 2560×1440 dù backing là kích thước đó. Trước Task 2 chưa có override: Phase 1 chỉ lưu baseline DPR thật sẵn có, nếu cần D2 dùng phương pháp 2, ghi rõ còn mờ.
2. **DPR thật cho ma trận cuối khi HIDPI_ENABLED=true:** Playwright MCP `browser_run_code_unsafe`, dùng `const ctx = await page.context().browser().newContext({ viewport: {width:1280,height:720}, deviceScaleFactor: 2 }); const hidpiPage = await ctx.newPage(); await hidpiPage.goto('http://localhost:5176');` (không query density). Lặp factor1, mobile viewport375×812 và touch context phù hợp; đóng context sau đo. Kiểm window.devicePixelRatio thật và metrics/backing tương ứng. Chỉ phương pháp này cho ảnh native D2 2560×1440 / 750×1624. Khi cần đổi DPR không reload, dùng CDP session qua Playwright `ctx.newCDPSession(hidpiPage)` rồi `session.send('Emulation.setDeviceMetricsOverride', {width:1280,height:720,deviceScaleFactor:2,mobile:false})`, đổi factor1→2→1 cùng page; không sửa JS getter. Đổi override DEV qua navigation không chứng minh lifecycle không reload.

Mỗi phương pháp chụp desktop1280×720/mobile375×812 cùng seed/state/font/zoom. So rect logical/wrap trước; downsample chỉ để overlay layout, không đánh giá nét glyph. Baseline D1 lấy trước triển khai cùng máy; loại animation/time/FPS DOM khỏi diff có ghi mask. Lưu ảnh, DPR thật, D hiệu dụng, CSS/backing và log gate. Task 2 kiểm D1 toàn app và D2 loading; Task 3a/3b/3c kiểm D1/D2 các màn vừa chuyển; task cuối đủ Task 6 và DPR thật. Không yêu cầu consumer chưa migrate pass D2.
## Bản đồ file và call site từ tìm kiếm tĩnh

Đã tìm `scale.width`, `scale.height`, `gameSize`, `resize`, `Scale.Events`, `cameras.main`, `setZoom`, `pointer.x/y`, `worldX/Y`, `displaySize`, `getBounds`; mở rộng destructuring `.scale`, `p.x/y`, `getDistance`, downX/downY, Text và texture. Dòng bên dưới là baseline 11/11, có thể dịch sau sửa. Các nhóm ghi nhiều dòng đều phải rà toàn file, không chỉ literal đầu tiên. Tất cả `resize` kích thước widget không phải resize canvas: giữ logical.

| File:dòng hiện tại | Thay đổi / giữ nguyên có chủ đích | Task |
| --- | --- | --- |
| `src/main.ts:18–36,52–55`; `index.html:40–52` | NONE, cài runtime trước scene, giữ #game safe-area/image-rendering pixelated; sửa comment upscale, không đổi art CSS | 2 |
| `src/scenes/BootScene.ts` | Không đọc size/pointer hiện tại; bind camera/lifecycle chung, không đổi session/audio | 2 |
| `src/scenes/PreloadScene.ts:24–31` | Destructure scale → logicalSize, adapter trước label ngay preload, label relayout khi resize | 2 |
| `src/scenes/MainMenuScene.ts:79–80,107,129–146,197,247,255` | PixelScale/layout/ground/footer lấy logical; camera adapter, title trực tiếp qua text helper | 3 |
| `src/scenes/KingSelectScene.ts:59,206,238,296,445,490,584–598,634` | Logical screen/carousel/swipe và density text; listener adapter | 3 |
| `src/scenes/CrownsScene.ts:86,117,227,322–329,359` | Logical layout, pointer kéo danh sách, camera và cleanup | 3 |
| `src/scenes/SettingsScene.ts:147,287,334` | Logical layout, camera/lifecycle | 3 |
| `src/scenes/SavesScene.ts:74,82–83,189–196` | Logical layout cả hai đường, camera/lifecycle | 3 |
| `src/scenes/RunEndScene.ts:64,101,125,149` | Logical layout, camera/lifecycle | 3 |
| `src/scenes/HelpScene.ts:39–58,96` | Camera trước tạo modal, bind layout/cleanup đúng pause session | 3 |
| `src/scenes/PlanningHudScene.ts:214,240,389,420,438–446,515,695` | Logical size/breakpoint/hand wheel; trực tiếp Text qua helper | 3 |
| `src/scenes/PlanningHudScene.ts:985–1014,1033–1080,1163,1215–1223,1302,1314` | Pointer/distance → logical một lần, pick/inspect/reserved rect, view model logical, toasts và info layout, adapter cleanup | 3 |
| `src/scenes/BattleHudScene.ts:242,363,424,444,500–519,679–724,881–890,952,990` | Logical sizes/pointer/distance/aim; lineStyle giữ nguyên, HUD camera density, cleanup | 3 |
| `src/scenes/RealmScene.ts:232,292,644–718,757–816` | Camera/world input: logical gesture/hand exclusion/bus inspect; raw pointer chỉ ở getWorldPoint, unproject world không chia D | 3 |
| `src/scenes/RealmScene.ts:825,839,883,895–950` | PICK_SLOP lấy logical z; snap ratio, cameraBackingView, logical realm:view; resize/shake/ease và cleanup | 3 |
| `src/ui/theme.ts:33–56,182,213,226,328–330` | addDisplayText registry, addUiText dùng nó, uiScale logical; getBounds giữ logical; distance dùng helper, button resize subscription adapter | 2/3 |
| `src/ui/Tooltip.ts:37–43,73–87` | Pointer và screen logical, hủy tooltip khi metrics đổi | 3 |
| `src/ui/cards/CardView.ts:96–103,192–218` | Logical down/move/drop/scroll/slop và clip; resize subscription, không đổi bounds | 3 |
| `src/ui/help/HelpModal.ts:49–58,75,180` | Cả p passed vào inside và p.y drag → logical; logical modal size | 3 |
| `src/ui/help/HelpCardBrowser.ts:31–35,105` | Chuyển p trong contains, drag/startY và row scroll sang logical | 3 |
| `src/ui/modals/DeckModal.ts:51–68,154,178` | Logical p.x/y/drag/size; wheel dy giữ nguyên | 3 |
| `src/ui/modals/RewardModal.ts:63,189–194,243–254` | Density header, logical screen/breakpoint/scroll/drag | 3 |
| `src/ui/modals/overlay.ts:24,29` | create/fit overlay phủ đúng logical W,H, không nhân D hai lần | 3 |
| `src/ui/modals/CalendarModal.ts:111`; `CouncilModal.ts:71,110,239,307`; `QuestModal.ts:94`; `BlessingModal.ts:154,248–256` | Logical destructuring; Council tap distance logical ở cả ba callback; Blessing containment/drag/slop p.y logical | 3 |
| `src/ui/info/InspectionView.ts:196–209` | inside(pointer), wheel containment và drag p.y logical | 3 |
| `src/ui/planning/HandView.ts:84` | getBounds vẫn logical, không chuyển backing | 3 |
| `src/ui/planning/DecreeQuestPanel.ts:125`; `EndlessPanel.ts:104,131–137`; `src/ui/kingSelect/PerkDialog.ts:111` | Destructure scale → logicalSize; EndlessPanel drag p.y/delta logical | 3 |
| `src/ui/kingSelect/KingPortraitView.ts:50` | TAP_PX so khoảng cách logical, giữ animation integer portrait scale | 3 |
| `src/ui/hud/HealthBarView.ts:39` | Direct Text qua density helper | 3 |
| `src/render/BoardRenderer.ts:140,144,175,180–181,229` | lineStyle/worldX/Y giữ world, text label dùng helper world | 3 |
| `src/render/FxRenderer.ts:355,428`; `src/render/IsoWallRenderer.ts:68–70` | World text pool density; lineStyle giữ world width | 3 |
| `src/ui/realm/cameraModel.ts:55–61`; `realmLayout.ts` overview/screenToWorld/cameraScroll; `cameraBounds.ts` | snapView thêm ratio; phần còn lại giữ logical và luật/clamp hiện có | 1/3 |
| `src/ui/hud/layout.ts:151–152`; `src/ui/menuLayout.ts` | pointer trong toán là Point logical, không Phaser Pointer; giữ số layout | 1 |
| `src/ui/kingSelectLayout.ts` | **Không tồn tại trong checkout**; thay bằng các module `src/ui/kingSelect/carouselLayout.ts`, `detailLayout.ts`, `lockedCardLayout.ts`; giữ toán logical | 1/3 |
| `src/dev/registerPreview.ts:8–26`; `src/dev/fpsOverlay.ts:7–31`; `src/dev/DevJumpPanel.ts` | DOM giữ CSS, giữ window.game thật; thêm hook metrics DEV, overlay bổ sung D/backing/logical đọc nguồn chung | 4 |
| `src/render/*Art.ts`, `atlas.ts`, `pixel.ts` | Native art/generated canvas và hash giữ nguyên; không có RenderTexture/snapshot Phaser consumer để migrate | 4 audit |

### Tests có số canvas/camera/layout cố định

| File / dòng hoặc nhóm | Xử lý |
| --- | --- |
| `src/ui/realm/cameraModel.test.ts:28–29,41,60,95,108,118–129,242,262,327` | Giữ DESKTOP/MOBILE và limits baseline hiện tại; thêm ratio matrix và snap tests, expected cũ chạy mặc định ratio1 |
| `src/ui/realm/realmLayout.test.ts`, `src/ui/hud/layout.test.ts`, `src/ui/menuLayout.test.ts` | Giữ 1280/720/375/812 logical và expected, thêm integration đầu vào metrics logical |
| `src/ui/kingSelect/carouselLayout.test.ts`, `detailLayout.test.ts`, `lockedCardLayout.test.ts` | Giữ expected logical; chạy qua density matrix 1/1.25/1.5/1.75/2/3 từ helper |
| `src/ui/settings/settingsLayout.test.ts`, `src/ui/help/helpLayout.test.ts`, `src/ui/saves/savesLayout.test.ts`, `src/ui/crowns/crownsLayout.test.ts` | Giữ layout reference, breakpoint không chuyển backing |
| `src/ui/info/inspectionLayout.test.ts`, `inspectionReserved.test.ts`, `src/ui/modals/modalLayout.test.ts`, `blessingModel.test.ts`, `src/ui/planning/handLayoutModel.test.ts` | Size/pointer/rect vẫn logical; reserved rect/drop/clip parity |
| `src/render/RangeRenderer.test.ts:127–132`; `src/render/uiArt.test.ts:147–149` | Giữ cameraScroll và menuPixelScale logical, art hash không đổi |
| `src/render/codeFx.test.ts`, `MountainWallRenderer.test.ts`, `EnemyPortalRenderer.test.ts` | canvas ở đây là native art/mock texture, không nhân expected theo D |

Không tìm thấy test Phaser canvas backing hiện có trong src/scenes/dev. Không thay hàng loạt literal 1280/720 hoặc camera zoom để làm xanh. Khi thực thi chạy lại rg toàn src/test: mọi call site mới xuất hiện phải phân loại trong bảng, kể cả tên biến `p` hoặc destructuring không khớp search ban đầu.

## Phase 1 — Toán thuần và baseline

### Task 1: Metrics, chuyển tọa độ, camera và snapping thuần

**Create:** `src/ui/displayMetrics.ts`, `src/ui/displayMetrics.test.ts`.
**Modify/Test:** `src/ui/realm/cameraModel.ts`, `src/ui/realm/cameraModel.test.ts`.
**Read:** `src/ui/hud/layout.ts`, `src/ui/realm/realmLayout.ts`, `cameraBounds.ts`, tất cả test layout trong bảng.

**Interfaces:** đúng các chữ ký mục 4 spec. `snapView(view: CameraView, screen: Size, ratio?: Point): CameraView`, default ratio1. Thêm `logicalPressDistance(current: Point, down: Point, metrics: DisplayMetrics): number` tính độ dài sau chuyển từng trục; adapter pointer dùng current/up đúng trạng thái isDown.

- [ ] Viết test `density_preserves_logical_box`: W,H = (1280,720), (375,812), (767,811), (768,813), (769,815); D = 1,1.25,1.5,1.75,2,3; assert logical bằng đầu vào, backing round, ratio đúng; D2 desktop = 2560×1440, mobile = 750×1624; invalid D NaN/Infinity/0/âm → 1. makeDisplayMetrics chỉ nhận box dương, runtime xử lý box 0.
- [ ] Viết `pointer_round_trip_and_slop`: logical (44,88) → backing → logical bằng ban đầu; delta (8,0) và (0,8) = 8 ở mọi D, (6,8)=10; ratio hai trục lệch do rounding vẫn đúng. Không dùng getDistance()/D scalar ở D lẻ.
- [ ] Viết `camera_matrix_matches_logical_projection`: HUD origin/corners và world q/project tại z=1,33/32,1.7,3, scroll âm/dương, cả hai size; công thức camera backing chia ratio khớp worldToScreen tới 1e-6. D1 Realm zoom/scroll bằng input; D2 HUD origin0/scroll0, góc và tâm vẫn đúng CSS. Kiểm Realm bù tâm riêng. Inverse khớp screenToWorld, không nhân D vào input world.
- [ ] Viết `snap_translation_is_device_integer`: `r*t` nguyên trong 1e-6, sai lệch ≤0.5 device px, idempotent, input không mutate; ratio1 khớp toàn bộ expected cũ. Thêm test pan/zoom nhiều bước vẫn tích lũy view unsnapped và bus projection dùng snapped view.
- [ ] Chạy đỏ `npm test -- src/ui/displayMetrics.test.ts src/ui/realm/cameraModel.test.ts`; triển khai helper/snap tối thiểu; chạy lại xanh. Giữ các limits thật trong checkout, không thay max desktop.
- [ ] **Đóng Phase 1:** Gate G exit0 và Browser B D1/D2 desktop/mobile để lưu baseline. Runtime chưa đổi nên D2 còn mờ là baseline đã biết, không gọi đây là nghiệm thu độ nét; D1 và hành vi phải không hồi quy. Lưu số CSS/backing hiện tại để đối chiếu Phase2.

## Phase 2 — Runtime D1 và migration theo nhóm

### Task 2: Runtime, boot, camera lifecycle và registry Text

**Create:** `src/ui/displayRuntime.ts`, `src/ui/displayRuntime.test.ts`.
**Modify:** `src/main.ts`, `index.html`, `src/ui/theme.ts`, `src/scenes/BootScene.ts`, `src/scenes/PreloadScene.ts`.
**Interfaces:** runtime API mục 5 spec, gồm `setWorldTextZoom(scene: Phaser.Scene, logicalZoom: number): void`; `addDisplayText(scene: Phaser.Scene, x: number, y: number, text: string | string[], style: Phaser.Types.GameObjects.Text.TextStyle, kind?: 'hud' | 'world'): Phaser.GameObjects.Text` trong theme. Runtime text registry nhận Text và kind, cập nhật resolution khi density/world zoom bucket đổi; helper tạo chữ không được import scenes/platform. World Text mới đọc bucket hiện hành, shutdown reset bucket; Realm drawView là producer của setWorldTextZoom.

- [ ] Viết tests effectiveDensity trong src/ui/displayMetrics.test.ts: override 2/1.25/chuỗi có whitespace; thiếu/rỗng/sai/NaN/Infinity/0/âm fallback device; device sai fallback1. Trong src/ui/displayRuntime.test.ts kiểm DEV override khi cờ false, fallback invalid giữ D1 khi cờ false, production bỏ qua param cả khi cờ false/true và cờ true dùng device. Chạy đỏ trước triển khai policy spec §5.
- [ ] Viết tests runtime với mock nhỏ của public scale/camera/Text và event emitter, không mock thành test gọi lại chính implementation: `refresh_normalizes_css_before_consumers` assert resize/refresh tự phát đều CSS/displaySize logical, displayScale đúng bounds, không reentry; `density_round_trip_not_cumulative` D1→2→1 camera/text đúng cuối; `zero_box_retains_last_metrics` không allocate canvas 0.
- [ ] Viết `runtime_observers_and_scene_bindings_dispose`: matchMedia đổi D đăng ký lại, listener cũ remove; resize+media cùng frame chỉ relayout một lần; shutdown rồi create/wake dùng metrics mới không nhân handler. `live_text_registry_tracks_container_and_destroy` text trong container nhận density, destroyed text không bị gọi, D1 resolution1. Test giới hạn lifecycle này không thay browser thật.
- [ ] Chạy đỏ `npm test -- src/ui/displayRuntime.test.ts src/ui/displayMetrics.test.ts`; cài coordinator qua callbacks.preBoot, chỉ đăng ký listener trước scale.preBoot/BOOT, không truy cập canvas sớm. Main lấy initial backing từ runtime theo effectiveDensity và HIDPI_ENABLED=false để tạo config NONE; chỉ runtime đọc query khi DEV. Adapter HUD phải setOrigin(0,0), setZoom(rx,ry), scroll0 ngay từ Task 2; chỉ Realm dùng cameraBackingView bù tâm. Giữ cờ false tới Task 6. Normalizer đầu tiên chạy trong scale.boot sau gán canvas; không dùng postBoot/import DEV để cài. Normalize bằng public fields/APIs đã cite, updateBounds/displayScale, không private `_resetZoom` hoặc global config resolution. Flush camera/text/layout sau dispatch scale resize hoàn tất; PRE_STEP sớm xử lý refresh tự phát trước input, test thứ tự thật với Preload và pointer frame đổi D.
- [ ] Bind camera và label Preload từ preload (không đợi create), Boot reset/unsubscribe đúng lifecycle; addUiText qua addDisplayText, uiScale lấy logicalSize. D đổi registry update Text trước layout; world bucket 1/2/3, D1 giữ1. Hủy gestures qua callback adapter khi metrics đổi.
- [ ] Chạy lại test xanh, Gate G exit0; Browser B D1 desktop/mobile toàn app so baseline, D2 qua ?density=2 chỉ loading/Preload đã bind. Force scale.refresh/resize và kiểm CSS/pointer ở loading. Không yêu cầu menu chưa chuyển pass D2. Runtime tại URL thường dùng D1 nên Task 2 có thể land độc lập sau gate; chưa bật cờ.

### Task 3: Scenes, widget, input và direct Text (3a → 3b → 3c)

**Modify:** toàn bộ scene/UI/render trong bảng call site Task3 (phân nhóm cụ thể 3a/3b/3c bên dưới); test `src/ui/displayMetrics.test.ts`, `src/ui/displayRuntime.test.ts`, `src/ui/realm/cameraModel.test.ts`; tạo `src/ui/displayLayoutParity.test.ts` cho tích hợp helper với layout thuần. Không tạo module dưới game/core.

**Consumes:** logicalSize/logicalPointer, metrics immutable, cameraBackingView, addDisplayText và bindSceneDisplay Task1–2. **Produces:** mọi callback model/bus inspect/drop dùng logical, realm:view vẫn API cũ, UI world bounds vẫn logical.

- [ ] Viết `density_layout_parity` trước migration: qua makeDisplayMetrics cung cấp logical cho layoutMenu/uiScaleFor/isDesktop, handWindow, help/deck/reward layout và carousel/detail; assert cùng kết quả D1 ở D2/D3 và D lẻ; 767/768/769 giữ breakpoint và mọi target ≥44. Chạy đỏ test bằng adapter thực sẽ được consumer dùng, không nhân expected theo D.
- [ ] Viết test `press_release_uses_up_position`: release getDistance semantics dùng upX/upY khi !isDown, giữ slop/400ms; `metrics_change_cancels_interaction` callback hủy pinch/drag/longpress không phát game intent; `world_text_bucket_reuses_resolution` z=1.1→1.2 cùng bucket không rebuild, z qua2 cập nhật đúng, D1 không đổi. Chạy `npm test -- src/ui/displayMetrics.test.ts src/ui/displayRuntime.test.ts src/ui/displayLayoutParity.test.ts` để thấy đỏ trước sửa adapter.
- [ ] Chuyển menu/KingSelect/Crowns/Settings/Saves/RunEnd/Help theo bảng, camera trước dựng UI; giữ logical pixel art scale và glyph. Tránh để textStyle đọc window.DPR: caller scene có metrics qua helper. Giữ createPanel/createButton và theme skin, không rectangle nền mới.
- [ ] Chuyển PlanningHud/BattleHud/Realm. Mỗi handler đọc logicalPointer một lần rồi dùng Point; p.x/y truyền thẳng vào inside cũng phải đổi. getDistance/down/up chuyển logical; wheel delta dy không chia D. CardView drop callback tiếp tục logical. Không sửa hit area local do Phaser đã inverse camera. Realm getWorldPoint nhận raw backing pointer, output unproject như cũ; PICK_SLOP lấy logical z; mỗi lần vẽ apply cameraBackingView từ view snap ratio, kể cả ease/shake.
- [ ] Chuyển mọi modal/widget trong bảng, kể cả CouncilModal ba slop callback, KingPortraitView, InspectionView, HelpModal/DeckModal/HelpCardBrowser/BlessingModal/EndlessPanel p alias; giữ getBounds/HandView logical. Migrate scale listener sang adapter đảm bảo normalize→camera/text→layout; dispose cả listener cũ, không đăng ký đôi với scale.on. Overlay phủ đúng logical box và tiếp tục chặn input bên dưới.
- [ ] Chuyển các Text trực tiếp MainMenu, Preload, KingSelect, PlanningHud, BattleHud, RewardModal, HealthBarView, BoardRenderer, FxRenderer; helper theo dõi cả pooled text và container children. Không sửa texture art, font family, word-wrap width hoặc font size để bù D. Giữ Graphics lineStyle logical/world, renderer không nhân thêm D.
- [ ] Chạy test mục tiêu tới xanh rồi `npm test -- src/ui src/render`; dùng rg lần nữa theo danh sách search của task + destructuring scale/pointer alias/distance để đối chiếu bảng: mọi raw use còn lại có lý do backing/world/native-art. Đọc types local migration/scenes/text/input skills trước sửa Phaser.
Các checklist chung ở trên được thực hiện theo từng nhóm dưới, không gom thành một migration phải xong toàn bộ mới kiểm. Mọi nhóm giữ HIDPI_ENABLED=false; production D1 hoạt động, từng nhóm đủ điều kiện commit riêng sau gate (chỉ khi phiên triển khai được phép commit). D2 đi thẳng vào màn đã chuyển qua dev hooks/launch data, không phụ thuộc thao tác qua màn chưa chuyển. Nếu màn vừa chuyển phụ thuộc widget dùng chung thuộc nhóm sau, chuyển phần dependency cần thiết ngay trong nhóm hiện tại và chạy regression D1 cho mọi caller; không để dependency chưa migrate phá gate D2 của màn vừa đổi.

### Task 3a: Menu và màn ngoài ván

**Modify:** MainMenuScene, KingSelectScene, CrownsScene, SettingsScene, SavesScene, RunEndScene, HelpScene trong src/scenes; src/ui/help/HelpModal.ts, HelpCardBrowser.ts; src/ui/kingSelect/PerkDialog.ts, KingPortraitView.ts; phần button/input dùng chung trong src/ui/theme.ts. Tests trước: density_layout_parity cho menu/carousel/detail/help và press/release/slop trong các test Task 3. Dùng HUD origin0/scroll0, logical size/pointer, text helper và adapter lifecycle; chuyển các modal thuộc các màn này cùng nhóm.

- [ ] Chạy targeted tests Task 3 tới xanh rồi Gate G exit0. Browser B D1 và ?density=2 desktop/mobile: menu, carousel/detail/perk, Crowns scroll, Settings, Saves, RunEnd, Help/modal/browser thẻ; glyph/wrap, nút, tooltip và cleanup. Giữ cờ false, ghi bằng chứng trước khi sang 3b.

### Task 3b: Planning, thẻ và modal trong ván

**Modify:** src/scenes/PlanningHudScene.ts; src/ui/cards/CardView.ts; src/ui/planning/HandView.ts, DecreeQuestPanel.ts, EndlessPanel.ts; src/ui/modals/DeckModal.ts, RewardModal.ts, CalendarModal.ts, CouncilModal.ts, QuestModal.ts, BlessingModal.ts, overlay.ts; src/ui/info/InspectionView.ts; src/ui/Tooltip.ts; phần theme còn lại. Tests trước: layout parity hand/modal, press release, metrics_change_cancels_interaction và drag/drop logical trong test Task 3. Hoàn thành helper/widget dùng chung cho nhóm này, HUD origin0, camera/text/layout và gesture cleanup.

- [ ] Gate G exit0 sau targeted tests. Browser B D1 và ?density=2 desktop/mobile cho PlanningHud/hand, mọi modal vừa liệt kê, inspection, tooltip hover/400ms, scroll/slop, clip/overlay/drop callback logical. Khi Realm chưa chuyển, xác minh drop/inspect bằng logical intent/fixture và rect HUD; kiểm pick trên world thật ở 3c. Không nhận màn Realm chưa chuyển là pass D2. Giữ cờ false, ghi bằng chứng trước 3c.

### Task 3c: Realm và battle

**Modify:** src/scenes/RealmScene.ts, BattleHudScene.ts; src/render/BoardRenderer.ts, FxRenderer.ts, IsoWallRenderer.ts (audit giữ stroke); src/ui/hud/HealthBarView.ts; src/ui/realm/cameraModel.ts. Tests trước: ratio snap/projection/inverse, world_text_bucket_reuses_resolution và world pick/gesture từ checklist Task 3. Realm giữ bù tâm, HUD origin0; camera ratio/snap và world text bucket cùng snapshot. Rà toàn bộ bảng và search lại để không sót consumer.

- [ ] Chạy targeted tests, npm test -- src/ui src/render rồi Gate G exit0. Browser B D1/?density=2 desktop/mobile: Realm planning/battle, normal/Endless, world text, pan/wheel/pinch/shake, alpha pick/drop thật, aim và modal/tooltip trên world; so D1 baseline. **Đóng Phase 2:** tất cả consumer đã chuyển, gate/browser từng nhóm có bằng chứng, cờ vẫn false.

## Phase 3 — Dev tools, hồi quy và đo hiệu năng

### Task 4: Hook metrics và chuẩn bị kiểm browser/performance

**Modify:** `src/dev/registerPreview.ts`, `src/dev/fpsOverlay.ts`; phần bằng chứng hai tài liệu này khi triển khai.
**Read/Test:** `src/dev/DevJumpPanel.ts`, `src/render/RangeRenderer.test.ts`, `src/render/uiArt.test.ts`, toàn bộ nhóm test số cố định trong bảng. Không thay art/tests hash để thích nghi DPR.

**Interfaces:** DEV-only `window.displayMetrics(): DisplayMetrics & { realmView?: CameraView }` trả copy, không expose mutable runtime state. window.game vẫn Phaser.Game, scale/camera numbers thực là backing. `startFpsOverlay` nhận accessor metrics tùy chọn từ main hoặc đăng ký DEV, không tự đọc một nguồn D khác.

- [ ] Thêm test `dev_metrics_snapshot_is_copy` trong `src/ui/displayRuntime.test.ts` cho accessor snapshot runtime mà hook gọi; sửa hook DEV và nhãn overlay thêm D, logical/backing. DOM overlay giữ CSS 12px, không nhân density; DevJumpPanel giữ CSS và target logic. Chạy `npm test -- src/ui/displayRuntime.test.ts` trước/sau sửa accessor.

### Task 5: Đồng bộ tài liệu ràng buộc

**Modify khi triển khai, không trong phiên sửa plan:** CLAUDE.md, AGENTS.md (giữ đồng bộ theo quy tắc repo), docs/ART_STYLE.md, docs/ROADMAP.md. Chỉ thay các câu bị mâu thuẫn; giữ phần còn lại. Không cần test code mới; kiểm diff/prose theo spec. Wording chính xác cần đưa vào:

- **CLAUDE.md / AGENTS.md, Pixel art:** thay cụm về zoom/snap bằng: “Every camera carries device density D (backing px per CSS px), set only by `src/ui/displayRuntime.ts`; the world camera alone has free logical zoom, its translation snapped to whole device pixels (`snapView`). ‘HUD never zooms’ means no logical zoom. Layout code reads `logicalSize`/`logicalPointer`, never `scale.width/height` or `pointer.x/y` directly.” Các ngoại lệ raw backing input chỉ nằm trong adapter và đường Realm getWorldPoint đã mô tả ở spec, không dùng làm layout.
- **Preview:** “`.claude/launch.json` defines `dev` (Vite :5173) and `dev-check` (:5176). `window.game` is exposed for `preview_eval`; its scale/camera numbers use backing coordinates (camera zoom is the backing/logical ratio times logical zoom). DEV-only `window.displayMetrics()` exposes logical/backing metrics and logical realm view; `?density=<n>` overrides density only in DEV.”
- **UI:** thêm: “Create all new Text through `addUiText`/`addDisplayText` so the density registry tracks it; do not call raw `add.text` outside the helper.”
- **docs/ART_STYLE.md, Hiển thị:** thay câu snap/HUD/text bằng: “Phép dịch camera snap về pixel thiết bị nguyên (`snapView`); HUD không có zoom logical, mọi camera mang mật độ D do displayRuntime đặt. Texture chữ FONT_UI rasterise qua `resolution` theo mật độ thiết bị (một texture px cho một device px ở HUD, có sai số lượng tử backing); không upscale texture chữ 1× để bù D, không đổi fontSize hoặc scale texture để bù mật độ. Chữ world dùng bucket zoom theo spec HiDPI §6 để tránh upscale; D1 giữ baseline. D lẻ vẫn nearest sampling cho art; không đổi luật world zoom hoặc scale nguyên của sprite. Kiểm độ rõ/glyph tiếng Việt bằng browser.”
- **docs/ROADMAP.md:** thêm entry: “`enhance-hd-graphics` — bước 1: HiDPI rendering. Canvas theo DPR thực, chữ theo density registry, giữ nguyên layout/input logical và nearest art; không xuất lại art (bước 2). Spec: `superpowers/specs/2026-11-11-hidpi-rendering-design.md`; plan: `superpowers/plans/2026-11-11-hidpi-rendering.md`. Chỉ đánh dấu hoàn tất sau gate và ma trận browser DPR thật D1/D2, D lẻ và đo D3; ghi liên kết bằng chứng.”

- [ ] Đọc lại các đoạn đích và kiểm CLAUDE/AGENTS đồng bộ, không còn câu “whole screen pixels”/HUD/text mâu thuẫn trong đoạn đích. Gate G và Browser B D1/?density=2 smoke menu/Realm desktop/mobile trước task cuối.

### Task 6 (cuối): Bật DPR thật và nghiệm thu toàn ma trận

**Modify:** src/ui/displayRuntime.ts (chỉ lật HIDPI_ENABLED=true); tests policy ở src/ui/displayRuntime.test.ts nếu cần kiểm default đã bật; bằng chứng trong hai tài liệu này. Không đổi công thức hoặc consumer lúc lật cờ; regression phải sửa rồi gate lại. Chạy tests policy trước/sau lật cờ. Từ đây URL thường dùng DPR thật; production luôn bỏ qua query, DEV override vẫn dùng để chẩn đoán. Tất cả checklist còn lại là Task 6; Task 4 chỉ chuẩn bị hook.

- [ ] Chạy Browser B toàn bộ scenes: loading, MainMenu, KingSelect carousel/detail/perk, Crowns, Saves, Settings, Help, RunEnd, Realm+PlanningHud/BattleHud, normal/Endless, reward/deck/calendar/council/quest/blessing. Mỗi cặp D1/D2 chụp desktop1280×720 và mobile375×812; thêm 767/768/769, size lẻ769×815 tại D1.25/1.5/1.75, phone D3. Kiểm rect/wrap/font tiếng Việt, không chỉ nhìn screenshot tổng thể.
- [ ] Chuột/touch: hover + tooltip longpress400ms/slop8, swipe, scroll help/deck/reward/Crowns/inspection, hand ngang, drop lên plot, chọn nhà trước/sau tại zoom thấp/cao, pan/wheel/pinch/aim can thiệp; vị trí logical từ dev hook khớp click CDP CSS. Overlay không cho click xuyên. Kiểm graphics stroke/clip/nine-slice không đổi độ dày logical.
- [ ] CDP qua Playwright session (Browser B phương pháp 2) đổi D1→2→1 trong menu/modal/planning/battle, window resize/orientation/safe-area, browser zoom và chuyển monitor thật nếu có; hủy gesture giữa drag/pinch, không gửi command. Stop/start scene 20 lần, Help launch frame sau, scene ngủ rồi wake: subscription/text density không cũ, không leak hoặc duplicate intent. Force ScaleManager.refresh sau mỗi D để bắt lỗi normalize.
- [ ] Đo `?fps` qua dev-check D1/D2/D3 cùng seed/year/speed/zoom, warmup10s + 30 samples1s. Ghi fps/p95/max, thiết bị/renderer/GPU, backing, số unit và world text bucket. Mục tiêu 60Hz p95≤20ms, không kéo dài <50fps; báo baseline thấp riêng. Kiểm DevTools allocations trước/sau20 vòng D/scene; rAF không phải GPU profiler. Nếu điện thoại D3 không đạt p95≤20ms, báo số đo, thiết bị và baseline cho chủ dự án trước khi thay đổi bất cứ điều gì; chủ dự án quyết định. Không tự cap D/ngầm giảm art hoặc sửa gameplay.
- [ ] Rerun các tests trong bảng (full suite tại gate), xác nhận không còn runtime RenderTexture/snapshot consumer bỏ sót; native PixelCanvas/art hash giữ nguyên. Ghi D2 4×/D3 9× pixel và ước tính buffer theo spec như dự toán, số đo thật ghi riêng.
- [ ] **Đóng Phase 3:** Gate G exit0 + Browser B đầy đủ D1/D2 và D lẻ/D3 bổ sung. Reviewer kiểm Review Focus với ảnh/log; chỉ gọi hoàn tất khi có bằng chứng. Không commit/PR/merge nếu phiên triển khai chưa được ủy quyền cho các thao tác đó.

## Risks

- Listener order của ScaleManager/CameraManager: Task2 phải chứng minh boot/refresh thật, không chỉ emitter mock; camera adapter chạy sau auto resize, trước layout/render.
- Custom CSS bị refresh đè hoặc displayScale sai offset safe-area: so canvasBounds và click cạnh ở mỗi D; normalization không gọi refresh đệ quy.
- Camera scalar `.zoom` đọc lại như logical hoặc worldX/Y dùng từ HUD sai camera: rà raw usages, projection/inverse test và browser pick tại zoom khác nhau.
- Glyph/layout do Text resolution thay rounding: so bounds/wrap trước/sau setResolution; nếu cần giữ metric logical ổn định, bổ sung regression đúng lỗi trước sửa, không đổi layout cố định.
- D3 fill-rate và world Text pool: đo p95/allocation thực; không dùng emulator desktop làm bằng chứng hiệu năng điện thoại thật. Nếu p95 điện thoại D3 vượt20ms, báo số đo và baseline cho chủ dự án trước mọi thay đổi; chủ dự án quyết định, không silent cap.

## Câu hỏi mở

Không có. Các lựa chọn kỹ thuật mặc định nằm trong spec; số đo, ảnh và tính đúng lifecycle chờ thực thi kiểm chứng.

## Bằng chứng triển khai

Chưa triển khai. Phiên viết tài liệu chỉ đọc filesystem/types/source và tìm kiếm tĩnh; không chạy node/npm/npx, lint/typecheck/test/build hoặc browser. Khi thực thi ghi revision baseline/đích, Gate G và Browser B từng phase, ảnh D1 trước/sau và D2 desktop/mobile, ma trận input/lifecycle, số đo D1/2/3 cùng hạn chế thiết bị. Không đánh dấu checkbox bằng suy luận từ types hoặc mock.

### Phase 1 (11/11/2026)

- Task 1 xong: `src/ui/displayMetrics.ts` (+ test 108 ca: hộp logical giữ nguyên, backing làm tròn, tỉ lệ từng trục, đổi toạ độ khứ hồi, slop 8 logical ở mọi D, camera Realm bù tâm khớp mô hình logical tới 1e-6, HUD gốc 0) và `snapView(view, screen, ratio?)` (ratio 1 = snap cũ; ratio D: dịch camera nguyên pixel thiết bị, ≤ 0,5 px, idempotent).
- Gate G: lint, typecheck, 3010 test, build đều xanh.
- Baseline Browser B (Playwright, dev-check :5176, `.superpowers/hidpi-baseline/`): menu, chọn vua, Realm lập kế hoạch ở D1/D2 × 1280×720 / 375×812. Số đo hiện tại: canvas = CSS ở mọi D (D2 1280×720: canvas 1280×720 trên màn 2560×1440 → trình duyệt phóng ×2, chữ nhoè — đúng lỗi cần sửa). D1 là ảnh đối chiếu cho Phase 2.
