# HiDPI rendering — thiết kế

**Ngày:** 11/11/2026. **Phase:** `enhance-hd-graphics`, bước 1. **Trạng thái:** đề xuất để review, chưa triển khai.

## 1. Mục tiêu và phạm vi

Máy thứ hai của chủ dự án có `window.devicePixelRatio = 2`, hiện mờ từ UI tới thế giới vì backing canvas chỉ bằng số CSS px. Vẽ ở mật độ thiết bị D để trình duyệt không phóng canvas 1× lên D×. Mọi kích thước người chơi thấy giữ nguyên: logical px = CSS px trong hộp `#game`, desktop 1280×720, mobile 375×812, desktop khi **width ≥ 768 logical px**, vùng chạm ≥ 44×44 logical px. D = 1 phải giống bản hiện tại cả hình và tương tác.

Giữ `pixelArt: true`, nearest-neighbour, scale nguyên của sprite và nine-slice, khung generated `ui`/Kenney, FONT_UI và glyph tiếng Việt. HUD không zoom theo nghĩa logical; zoom D của camera là chuyển đơn vị sang backing store. Không tạo art, xuất lại atlas, sửa gameplay, `src/game`, `src/data`, `src/core`, EventBus contract, save hoặc migration. Art mật độ cao là bước 2.

Nguồn ràng buộc: `CLAUDE.md` (layers, Pixel art, UI, Logic ↔ UI, Naming), `docs/ART_STYLE.md` mục Hiển thị; format theo spec/plan merchant 10/11. Đọc thêm ROADMAP: implementation phải giữ các giới hạn camera hiện có, không phục hồi giá trị lịch sử từ prose cũ. Cụ thể `realmZoomLimits` hiện giới hạn desktop khác phone; bước này không sửa luật zoom. Yêu cầu overview → 3× là trần chung, không phải lệnh nâng max desktop hiện tại lên 3.

## 2. API đã kiểm tại repo

Các số dòng sau là baseline trước triển khai, trong `node_modules/phaser/types/phaser.d.ts`; không suy API từ Phaser 3 hoặc từ ví dụ skill:

| Vị trí | Chữ ký / hợp đồng được dùng |
| --- | --- |
| `:96295` ScaleConfig | `zoom?: Phaser.Scale.ZoomType \| number` — zoom CSS, không phải độ phân giải renderer |
| `:128955` | `Phaser.Scale.RESIZE: number`; mode tự resize theo parent, không có hệ số DPR |
| `:128442,128449,128457,128484` | `gameSize: Phaser.Structs.Size`, `baseSize: Phaser.Structs.Size`, `displaySize: Phaser.Structs.Size`, `displayScale: Phaser.Math.Vector2` — game/canvas/CSS và tỉ lệ input là các đại lượng khác nhau |
| `:128600,128625,128632,128708` | `setGameSize(width: number, height: number): this`; `resize(width: number, height: number): this`; `setZoom(value: number): this`; `updateBounds(): void`. `resize` được tài liệu hóa cho NONE |
| `:3292,3357,3524,3569` BaseCamera | `setOrigin(x?: number, y?: number): this`; `getWorldPoint<O extends Phaser.Math.Vector2>(x: number, y: number, output?: O): O`; `setSize(width: number, height?: number): this`; `setZoom(x?: number, y?: number): this` (hai trục độc lập) |
| `:86032,86040` Pointer | `worldX: number`, `worldY: number` thuộc camera tương tác gần nhất, không phải screen logical |
| `:86339,86346,86050–86070` Pointer | `x: number`, `y: number`, `downX/downY/upX/upY: number` là tọa độ screen trong game sau ScaleManager, trước camera; distance cũng cùng đơn vị. Không mặc định chúng là CSS px |
| `:99354,72639` Text | `TextStyle.resolution?: number`; `Text.setResolution(value: number): this`. Đổi mật độ texture chữ, không nhân fontSize hoặc chiều rộng layout |

GameConfig Phaser 4 **không có global `resolution`**. Comment TextStyle còn nhắc “game resolution” không phải bằng chứng tồn tại config đó. Không thêm key giả hoặc ép kiểu bỏ typecheck.

Đối chiếu thêm source thực: `node_modules/phaser/src/scale/ScaleManager.js:831–888` (`resize`), `:1030–1095` (`updateScale`): NONE áp zoom vào CSS, RESIZE ghi đè game/base/display theo parent. `BaseCamera.js` và công thức `screenToWorld` hiện tại chứng minh phải bù tâm camera khi viewport nhân D. Các skill scale/cameras/text/input/config là hướng dẫn, chữ ký local là nguồn chuẩn.

## 3. So sánh và quyết định

| Cách | Đánh giá |
| --- | --- |
| Giữ RESIZE, thêm `resolution: D` hoặc `zoom: 1/D` | Loại: config resolution không tồn tại; nhánh RESIZE tự đặt canvas bằng parent, zoom không tạo backing D× |
| NONE, backing CSS×D, `scale.zoom = 1/D`, camera nhân D | API hợp lệ, ít can thiệp. Nhưng backing bắt buộc nguyên; với D lẻ, `round(WD)/D` khác W, và zoom scalar không bù riêng hai trục. Chỉ dùng cách này sẽ để CSS hoặc layout lệch nhẹ, có thể đổi breakpoint |
| **NONE, backing nguyên, CSS chính xác do một coordinator sở hữu, camera nhân tỉ lệ backing/CSS từng trục** | **Chọn.** Là biến thể đầy đủ của cách trên; giữ hộp CSS đúng W×H, kể cả D lẻ và safe-area. Không sửa Phaser, không monkey-patch Pointer hoặc renderer |

`scale.zoom = 1` trong cách chọn. Module runtime được phép duy nhất ghi canvas CSS và đồng bộ public `displaySize`/`displayScale` vì NONE là custom scaling. Không để từng scene tự chỉnh CSS. Đổi mode ở main là cần thiết; phần theo dõi responsive được coordinator thay thế, không mất resize.

## 4. Hệ tọa độ và hợp đồng helper

Module thuần mới `src/ui/displayMetrics.ts` không import Phaser/DOM/game. `DisplayMetrics` chứa `logical: Size`, `backing: Size`, `density: number`, `ratio: Point`. Với W,H đo từ content box `#game` (đã trừ safe-area), D hữu hạn > 0:

- `Bw = max(1, round(W * D))`, `Bh = max(1, round(H * D))`.
- `rx = Bw / W`, `ry = Bh / H`; logical luôn chính W,H, không suy ngược bằng backing/D.
- `gameSize/baseSize/canvas.width,height = Bw,Bh`; `displaySize` và canvas CSS = W,H. Có sai số lượng tử hóa tối đa 0,5 backing px mỗi cạnh so với WD,HD; đây là giới hạn canvas nguyên, không phải đổi layout.
- Pointer screen `p` của Phaser → logical `{x: p.x/rx, y: p.y/ry}`. Tọa độ DOM còn phải qua offset canvas/ScaleManager; không chia clientX trực tiếp. Logical → backing nhân theo trục.
- `getBounds()` của object/container trả world coordinates của scene, không tự nhân D. UI world = logical: giữ nguyên bounds cho tooltip và HandView. Callback localX/localY đã qua camera giữ nguyên. Chỉ `getWorldPoint` nhận screen backing; kết quả là world, **không chia D lần nữa**. Không dùng `pointer.worldX/worldY` chung giữa Realm/HUD.

Helper thuần: `makeDisplayMetrics(logical: Size, density: number): DisplayMetrics`; `toLogicalPoint(point: Point, metrics: DisplayMetrics): Point`; `toBackingPoint(point: Point, metrics: DisplayMetrics): Point`; `cameraBackingView(view: CameraView, metrics: DisplayMetrics): { zoom: Point; scroll: Point }`; `snapTranslation(value: number, ratio: number): number`. Size rỗng khi minimize không tạo metrics mới; runtime giữ bản hợp lệ cuối. D không hợp lệ dùng 1.

### Camera của mọi scene

Viewport luôn `(0,0,Bw,Bh)`. HUD/menu dùng `camera.setOrigin(0,0)`, `setZoom(rx,ry)`, scroll `(0,0)`: q chiếu thành `(rx*q.x, ry*q.y)`, nên vẫn đúng q CSS px, không cần bù tâm. Realm giữ origin `(0.5,0.5)` của model hiện tại. Riêng Realm, với view logical `{zoom: z, scroll: s}`:

```
camera.zoomX = rx * z; camera.zoomY = ry * z
camera.scrollX = s.x + (W - Bw) / 2
camera.scrollY = s.y + (H - Bh) / 2
```

Chứng minh theo trục x: phép chiếu camera backing là `rx*z*(q - scrollX - Bw/2) + Bw/2`; chia rx được `z*(q - s.x - W/2) + W/2`, đúng phép chiếu cũ. HUD origin 0 có cùng phép chiếu khi z=1, s=(0,0). D=1 giữ nguyên phép chiếu và tương tác. Với origin giữa của Realm, không chỉ gọi `setZoom(D)` với scroll=0 vì sẽ lệch tâm. Không lấy camera.zoom vật lý làm logical zoom để tính PICK_SLOP, pan hoặc hit test.

Áp cho Boot (không UI nhưng cùng lifecycle), Preload **ngay trong preload trước tạo label**, MainMenu, KingSelect, Crowns, Realm, PlanningHud, BattleHud, RunEnd, Saves, Settings và Help. Scene adapter `src/ui/displayRuntime.ts` cấu hình camera trước layout, gọi lại khi metrics đổi; reset subscription/gesture fields khi scene reuse, cleanup shutdown/destroy. Dữ liệu launch ban đầu vẫn truyền qua launch data, không chờ một resize/event `realm:view` có thể đã phát trước frame scene bắt đầu.

### Realm và snapView

Giữ mô hình logical của `cameraModel`, `realmLayout`, `cameraBounds`, zoom/pan/overview/phase/ease hiện tại. Mở `snapView(view, screen, ratio?: Point)` mặc định `{x:1,y:1}`; trong mỗi trục đặt `t=(1-z)*half-z*scroll`, `t'=round(t*r)/r`, trả `scroll'=((1-z)*half-t')/z`. Translation backing `r*t'` nguyên, sai lệch ≤ 0,5 device px. Không làm tròn zoom hoặc state mô phỏng. D lẻ vẫn nearest; độ rộng pixel nguồn không đều là đánh đổi đã được ART_STYLE chấp nhận.

`RealmScene.applyView` và `drawView` dùng cùng metrics và snap kể cả shake; phát `realm:view` với **logical zoom và scroll đã snap**, không phát zoom vật lý. Giữ hợp đồng shake hiện tại: offset tạm khi vẽ, không đưa shake vào view bền hoặc bus. HUD `worldToScreen`/`screenToWorld` vẫn logical. Input Realm có thể dùng raw pointer với camera.getWorldPoint rồi unproject, hoặc helper logical với model; không trộn hai đường. `buildingAt` lấy z từ logical view, không `camera.zoom` đã nhân density.

## 5. Một nguồn D và resize

**Rollout và override:** chỉ một hàm thuần `effectiveDensity(deviceDpr: number, override?: string): number` trong `src/ui/displayMetrics.ts` quyết định D: override là chuỗi số thập phân dương hữu hạn (trim trước khi parse, gồm D lẻ); thiếu/rỗng/sai định dạng/NaN/Infinity/0/âm → deviceDpr hợp lệ, deviceDpr không hợp lệ → 1. Runtime có `HIDPI_ENABLED = false` trong thời gian migration. Nó chỉ truyền giá trị query `density` vào helper khi `import.meta.env.DEV`; production luôn bỏ qua query. DEV override hợp lệ được ưu tiên cả khi cờ false; nếu override không hợp lệ, helper fallback về deviceDpr, rồi cờ false buộc kết quả không-override về 1. Khi cờ true, fallback dùng D thiết bị. Như vậy URL thường của production/dev dùng D1 trong migration, còn `?density=2` ép D2 ngay trên màn D1. Không đọc query/DPR ở consumer. Test riêng parsing/fallback và runtime policy bỏ qua query trong production, cả trước/sau bật cờ.

Task 2 có thể nghiệm thu độc lập ở D1; Task 3a/3b/3c chuyển từng nhóm consumer, mỗi nhóm đóng bằng gate và browser D1/DEV `?density=2` cho màn vừa đổi. Chưa chuyển màn nào thì không đòi màn đó pass D2. Chỉ task cuối bật `HIDPI_ENABLED = true` rồi chạy toàn ma trận, gồm DPR thật; cờ tạm không thay quyết định sản phẩm dùng D thực không cap.

`src/ui/displayRuntime.ts` là một instance mỗi Phaser.Game. Main đo metrics ban đầu để truyền width/height backing vào config; `callbacks.preBoot(game)` cài runtime và normalizer scale RESIZE ngay, **chưa truy cập canvas hoặc gọi resize tại preBoot**. `Game.js:360–376` gọi preBoot → scale.preBoot → tạo canvas/renderer → BOOT. `ScaleManager.boot` gán scale.canvas rồi resize, nên normalizer đầu tiên lúc đó mới dùng canvas. Không cài qua postBoot: READY đã khởi động SceneManager trước đó. Chỉ runtime này đọc `window.devicePixelRatio` (cả hàm lấy metrics ban đầu của nó). Snapshot chỉ ở bộ nhớ, không lưu run/meta.

API runtime: `readInitialDisplayMetrics(parent: HTMLElement): DisplayMetrics` đo box/D trước new Game; `installDisplayRuntime(game: Phaser.Game, parent: HTMLElement, initial: DisplayMetrics): () => void` dùng lại snapshot đó; `displayMetrics(scene: Phaser.Scene): DisplayMetrics`; `logicalSize(scene: Phaser.Scene): Size`; `logicalPointer(scene: Phaser.Scene, pointer: Phaser.Input.Pointer): Point`; `bindSceneDisplay(scene: Phaser.Scene, relayout: () => void, kind?: 'hud' | 'realm'): () => void`; `setWorldTextZoom(scene: Phaser.Scene, logicalZoom: number): void`. `RealmScene.drawView` gọi setWorldTextZoom với shown.zoom sau mỗi apply/ease; runtime so bucket, chỉ cập nhật khi bucket đổi. Helper world Text mới đọc bucket hiện hành của scene, không chờ bus event; shutdown reset bucket. bindSceneDisplay dùng camera density mặc định cho HUD; kind realm chỉ set viewport, để drawView áp cameraBackingView từ logical view.

Đo content box bằng ResizeObserver, dùng window resize + focus + visibilitychange để kiểm lại D; đăng ký `matchMedia('(resolution: <D>dppx)')` và **đăng ký lại sau mỗi lần D đổi**. Check D tại game pre-step là fallback so sánh rẻ để không bỏ sót chuyển monitor/browser zoom; không đo DOM mỗi frame. Gom thay đổi về một lần trước render, không tạo vòng lặp ResizeObserver. Không dùng visualViewport.scale làm D: pinch game do camera xử lý; browser zoom đổi CSS viewport/D thì đọc lại cả hai.

Transaction metrics: publish snapshot mới → `scale.resize(Bw,Bh)` → chuẩn hóa CSS W/H, `displaySize.setSize(W,H)`, `scale.updateBounds()`, `displayScale.set(Bw/canvasBounds.width, Bh/canvasBounds.height)` → adapter camera → refresh resolution chữ → layout. Listener normalize `Scale.Events.RESIZE` đăng ký từ preBoot trước CameraManager/scene listeners để cả refresh tự động cũng khôi phục CSS/displayScale. Listener chỉ normalize và đánh dirty, không gọi resize/refresh hoặc relayout trong khi dispatch; guard reentry và metrics không đổi. Runtime flush adapter/text/layout sau khi scale.resize trả về (native CameraManager đã resize), hoặc ở PRE_STEP đầu tiên sau refresh tự phát. PRE_STEP runtime đăng ký sớm tại preBoot trước InputManager boot; browser test phải xác minh thứ tự này và input frame chuyển D. Scene bind lần đầu áp snapshot ngay trước tạo UI, không chờ flush. Các scene dùng subscription adapter, không raw scale.on hoặc event trung gian setZoom. Input luôn dùng snapshot và camera đã flush; frame thay metrics hủy gesture cũ trước xử lý pointer. D đổi không đổi CSS size vẫn phải refresh text/snap/layout.

NONE refresh có thể ghi displaySize về backing: normalizer phải chạy với **mọi** scale resize/refresh, không chỉ callback ResizeObserver. Không chỉ sửa `canvas.style` vì sẽ để input sai. Khi D từ 2 về 1 phải xóa/ghi đè CSS kích thước cũ, khôi phục displayScale và camera; không để font/camera tích lũy nhân D qua mỗi lần resize. Đổi metrics hủy gesture đang kéo/long-press/pinch và tooltip bám pointer để không dùng down point của hệ cũ. Không gửi lệnh game khi hủy.

## 6. D lẻ, chữ, Graphics và texture

**Mặc định chọn D thực, không round D, không cap 2 hoặc 3**: 1.25, 1.5, 1.75, 2, 3 đều dùng đúng mật độ, chỉ round backing dimensions. Cap 2 trên màn D3 sẽ lại upscale trái quyết định đã chốt. D > 3 vẫn đúng quy tắc; giới hạn GPU cấp phát là failure phải báo/đo, không âm thầm hạ chất lượng hoặc đổi save. Không thêm setting trong bước này.

Chữ HUD tạo bằng helper `addDisplayText(scene,x,y,text,style)` mới ở theme; style giữ fontSize, wrap width, padding, shadow theo logical và FONT_UI. Helper đăng ký từng Text (kể cả con Container) vào runtime, setResolution `max(rx,ry)` trước đo/layout, unregister khi destroy. `addUiText` đi qua helper; chuyển cả các `.add.text` trực tiếp, không chỉ textStyle. D đổi update tất cả text còn sống **rồi** layout, kể cả modal đang mở. Không nhân fontSize, không setScale(1/D), không phụ thuộc resolution=0.

Text thế giới ở BoardRenderer/FxRenderer cũng phải nét: helper nhận tùy chọn world, D > 1 dùng resolution `max(rx,ry) * max(1,ceil(z))`, z là logical view, bucket thay đổi mới rebuild; update text sống và text mới trong pool. D=1 giữ resolution 1 để output giống cũ. Không tạo texture mỗi frame trong camera ease hoặc shake; tối đa bucket 1/2/3 trong giới hạn zoom. FONT_UI cho player text, FONT_DEBUG chỉ debug. Độ nét glyph kiểm browser, unit test không chứng minh raster thật.

Graphics lineWidth vẫn logical/world như cũ: camera chuyển thành D pixel; không nhân lineStyle thêm D. UI vector đặt logical integer như cũ, translation snap device; không tự đổi đường logical 1 px thành hairline 1 device px. Nearest của sprite/UI atlas không đổi; antialias của chữ Canvas là raster glyph hiện hữu, không bật smoothing cho art.

Search `RenderTexture|renderTexture|dynamicTexture|snapshot(` trong src không có consumer Phaser hiện tại (hàm snapshot trong test game là dữ liệu). Generated PixelCanvas/atlas là art native: không nhân kích thước hay đổi hash. Không thêm render texture trung gian trong bước 1. Nếu thêm trong tương lai, texture màn hình phải cấp phát backing, camera cùng phép đổi, display logical; snapshot/crop renderer dùng backing, phải ghi rõ đơn vị và giải phóng khi đổi D. Screenshot browser ở device pixels không phải ảnh logical 1280×720.

## 7. Dev hooks và hiệu năng

Giữ `window.game` là Phaser.Game thật. `game.scale.width/height`, camera.zoom/scroll đọc trực tiếp nay là backing; không giả mạo chúng để giữ script cũ. Thêm DEV-only `window.displayMetrics()` trả bản copy metrics và logical realm view để automation có đơn vị rõ; browser CDP click vẫn CSS px, còn preview_eval gọi camera/getWorldPoint phải chuyển backing. `registerPreview`/DevJumpPanel là DOM, giữ CSS và thao tác nhảy năm; không nhân D. `fpsOverlay` là DOM CSS 12px, browser tự raster D; không setScale hay nhân font.

Fill rate/framebuffer tăng xấp xỉ D²: D2 = 4×, D3 = 9×; atlas art không tăng. Một RGBA8 target desktop: D1 1280×720 ≈ 3,52 MiB, D2 2560×1440 ≈ 14,06 MiB, D3 3840×2160 ≈ 31,64 MiB. Mobile 375×812: ≈ 1,16 / 4,65 / 10,45 MiB. Đây chỉ một color buffer, chưa depth, buffers trình duyệt, text canvas/texture hoặc GPU copies; không gọi là tổng VRAM. World text bucket 3 tăng diện tích texture tối đa 9 lần nữa so với cùng D bucket1, cần kiểm pool/bộ nhớ.

Đo bằng `?fps` ở dev-check, cùng seed/năm/battle speed, cùng máy và viewport, tắt tab/animation ngoài; warm-up 10 giây rồi ghi 30 cửa sổ 1 giây của fps/p95/max tại D1/2/3. Ghi renderer, GPU/thiết bị, backing/CSS/D, zoom, số unit, tình trạng world text; so với baseline cũ D1. Overlay đo rAF, không khẳng định GPU time hoặc simulation benchmark. Mục tiêu 60Hz: p95 ≤ 20 ms, không tụt kéo dài dưới 50fps; nếu baseline máy đã thấp hơn ghi riêng và so tương đối, không che hồi quy bằng đổi battle. Kiểm allocation trong DevTools và sau 20 lần đổi D/scene/modal: không còn text canvas/listener/observer tăng vô hạn. Không cap tự động để làm đẹp số đo.

## 8. Nghiệm thu

- D1 ảnh baseline trước/sau cùng browser/font/seed/state khớp; mọi menu, loading, Realm+HUD, help/settings/saves/crowns/run end không lệch. D2/D3 ảnh sắc hơn; rect logical, breakpoint, line wrap và vùng chạm bằng D1 (dung sai raster biên ≤ 1 device pixel, không cho phép đổi dòng/chuyển bố cục).
- 1280×720 D2 backing 2560×1440; 375×812 D2 backing 750×1624; D3 tương ứng 3840×2160, 1125×2436. 767/768/769 CSS px vẫn đúng breakpoint ở mọi D. D1.25/1.5/1.75 với size lẻ không có mép trắng hoặc lệch input.
- Hover, long-press 400 ms, slop 8 logical px, swipe, deck/help/reward scroll, kéo thẻ, chọn nhà có alpha, wheel/pinch/pan, can thiệp giữ đúng vị trí ở overview/zoom tối đa, normal/Endless. Wheel delta là DOM delta, không chia D.
- Chuyển D1→2→1 không reload, khi modal mở/scene sleep rồi wake/resize/orientation/safe-area: không double layout command, không gesture nhảy, text mới và text pool đều đúng density; `scene.launch` không mất view ban đầu.
- Gate mỗi phase: `npm run lint && npm run typecheck && npm test && npm run build`, cộng browser D1/D2 tại dev-check theo plan. Phiên viết tài liệu không chạy các lệnh này.

## Risks

- Custom NONE sizing dễ bị ScaleManager refresh ghi đè CSS/input: normalizer và browser transaction test là điều kiện bắt buộc, không chỉ test helper.
- Bù tâm sai hoặc nhân D hai lần làm HUD lệch, PICK_SLOP nhỏ đi, modal chặn sai: chứng minh matrix, browser kiểm góc/cạnh và input.
- D lẻ sai khác hai trục vì round: dùng rx/ry riêng cả camera/input/snap, không đổi breakpoint dựa backing.
- D3 và text world làm tăng fill rate/bộ nhớ; đo thật trước nghiệm thu, không hứa cùng FPS chỉ từ lý thuyết. Nếu điện thoại D3 không đạt p95 ≤ 20 ms, báo số đo, thiết bị và baseline cho chủ dự án trước mọi thay đổi; chủ dự án quyết định, không tự cap D hoặc hạ chất lượng.
- Resolution có thể đổi chiều cao Text do rounding Phaser: so bounds/wrap ở D1/D2, giữ logical metrics ổn định trong helper nếu phát hiện bằng chứng; không sửa font hoặc layout để giấu lỗi.

## Review Focus

1. Scale refresh tự phát và monitor/browser zoom: displaySize, CSS, displayScale, camera phải cùng snapshot, không recursion.
2. Tâm camera D2, viewport lẻ và D1 round-trip: HUD góc trái vẫn (0,0), world projection và inverse khớp model.
3. Mọi đường input kể cả p.y/getDistance/downX/downY, object local callbacks và getBounds: không bỏ sót hoặc chuyển hai lần.
4. Text trực tiếp, Text trong Container/pool, Preload và modal đang mở: không còn texture 1× upscaled, không đổi wrap hoặc glyph tiếng Việt.
5. Scene reuse/launch/sleep/wake và D đổi giữa gesture: không leak, không dùng view cũ, không phát command do resize.

## Câu hỏi mở

Không có quyết định sản phẩm còn bỏ ngỏ. NONE/custom sizing và giữ D thực không cap là đề xuất kỹ thuật của tài liệu này; cần reviewer xác minh qua gate/browser khi triển khai. Chưa có số đo hoặc ảnh nghiệm thu.
