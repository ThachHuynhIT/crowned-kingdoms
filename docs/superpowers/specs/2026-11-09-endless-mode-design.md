# Vô tận — Thiết kế Endless mode

Ngày: 09/11/2026 · Add-on sau G4, ngoài phạm vi G0–G5 của spec gốc §1.

Nguồn ràng buộc: `CLAUDE.md`, `AGENTS.md`, `docs/GDD.md`, `docs/ROADMAP.md`, spec tổng `2026-10-16-crowned-kingdoms-design.md` và thiết kế isometric `2026-11-06-iso-board-redesign-design.md`. Khi tài liệu cũ khác mã hiện hành, dùng RunState v6 và hình học/camera hiện hành làm baseline; ví dụ mạng đầu ván là 2, tối đa 4, không lấy con số 3 cũ trong GDD. Plan thực thi: `../plans/2026-11-09-endless-mode.md`.

## 1. Mục tiêu và phạm vi

Thêm lựa chọn **Vô tận** tại Chọn vua: phát triển cùng vương quốc qua năm 30, mở một vòng đất, chọn phúc lành vĩnh viễn và đối mặt các thập niên có luật khác nhau. Đây là ván riêng từ năm 1, không chuyển một ván thường đang chơi sang Endless. Dùng nguyên vua, perk, Gai và thẻ meta đã mở. Chủ dự án đã chốt phạm vi; các giá trị cân bằng và hợp đồng kỹ thuật dưới đây là lựa chọn triển khai của bản thiết kế này.

Chế độ **30 năm** giữ nguyên luật, RNG, lịch, giá, hình học, trace trận và điểm. Không thêm art, âm thanh, leaderboard, prestige, nhiều vòng đất, cấp công trình trên 5 hoặc tăng trần lính. Tái dùng skin ô đã có. Không thực thi code trong phiên lập tài liệu.

## 2. Chọn chế độ và mở khoá

Trang chi tiết vua có hai nút `30 năm` / `Vô tận`, mặc định `30 năm` mỗi lần vào scene. Khi khoá, vẫn hiện `Vô tận` cùng lời giải thích **“Thắng một ván 30 năm để mở Vô tận.”** Chọn chế độ giữ vua, perk, Gai, seed. Biến chế độ chơi đặt tên `runMode`, tránh đụng `mode = carousel | detail` đang có.

Meta thêm `endlessUnlocked: boolean`, mặc định false, chỉ chuyển true khi settle ván `mode='normal'`, `rules.calendar='full'`, `rules.years=30`, `won=true`, `stats.completedYears=30`. Sống qua năm 30 của Endless không tính thắng, không mở Gai, không tăng wins. Unlock ghi trong giao dịch `endRun` hiện tại cùng điểm và xoá save; thông báo **“Đã mở chế độ Vô tận”**. Không ghi meta tại năm 30 của Endless.

`META_SAVE_VERSION` tăng 1 → 2. Hồ sơ v1 thiếu bằng chứng loại ván của các wins cũ: không suy đoán rằng mọi thắng là thắng 30 năm; migrate giữ nguyên toàn bộ tiến trình và đặt flag false. Người chơi cũ cần thắng một ván đầy đủ sau cập nhật. Hồ sơ v2 thiếu/hỏng flag sửa riêng về false; hồ sơ bản mới hơn vẫn chỉ đọc, không downgrade. Không ghi hồ sơ ngay lúc đọc. Không dùng tổng wins làm điều kiện unlock thay flag.

`RealmData` cho ván mới thêm mode; Realm chọn `RULES_FULL` hoặc `RULES_ENDLESS`. Kiểm unlock lại tại điểm bắt đầu ván qua session, không chỉ disable nút. Không có session dùng profile mặc định nên Endless khoá. Headless gọi luật trực tiếp để kiểm thử, không cần meta. Resume đọc mode từ save, không kiểm lại quyền meta và không tạo ván mới.

## 3. Vòng năm không có mốc chiến thắng

RunState thêm `mode: 'normal' | 'endless'`. `RULES_FULL` giữ nguyên literal. `RULES_ENDLESS = { years: 30, calendar: 'endless', autoStart: false }`: `years=30` là độ dài mẫu lịch, **không** là hạn kết thúc. Không dùng Infinity hay một hạn năm giả. `newRun` suy mode từ rules; mặc định G1 và các call site cũ không đổi.

Endless chỉ kết thúc khi mạng ≤ 0: `phase='ended'`, `won=false`; không có chiến thắng cuối lịch. Năm 30 vẫn có thưởng trận, hội đồng và phúc lành nếu còn mạng. Thua trận còn mạng vẫn nhận hội đồng/phúc lành đúng mốc. Hết mạng chấm dứt ngay, không cấp phúc lành cứu ván sau thất bại. Tiếp tục dùng tăng trưởng, phí duy trì, thu nhập, draw/discard, quest settlement và giới hạn quân hiện tại.

Điểm sống sót = `stats.completedYears - 1` khi kết thúc vì trận thua cuối; mọi trận hoàn thành, kể cả thua còn mạng, đã tăng completedYears như hiện tại. Ví dụ thua mạng cuối ở năm 31: **“Sống sót: 30 năm”**, bên dưới **“Kết thúc ở năm 31”**. Không lấy số trận thắng làm số năm sống sót.

### Lịch

`calendarSlotAt(rules, year)` trả một slot, không cấp phát theo số năm. Normal/short/raiders giữ hành vi hiện tại. Endless dùng `FULL_CALENDAR[(year-1) % 30]`, giữ sáu vua và thứ tự đã xáo đầu ván, không xáo lại. Vì mẫu có boss ở 10/20/30 nên boss tiếp theo là 40/50/60, lần lượt Bog Ogre/Hornet Queen/Crownless King. `bossOrdinal` vẫn 1..3 để đọc bảng và hành vi, không tăng thành 4.

Sau năm 30, các vua đã conquered/fled vẫn xuất quân theo lịch. Chinh phục, vàng chinh phục và thẻ chinh phục chỉ cấp một lần mỗi vua; `enemies[k].attacks` vẫn kẹp 3 và trạng thái không reset. Không bỏ qua một slot vì vua đã bị chinh phục. Boss lặp được tính vào `bossesWon`; `bossesDefeated` giữ tập id duy nhất tối đa 3, không tích lịch sử dài vô hạn.

Hội đồng: các mốc cũ 5/10/15/20/25 và trong Endless thêm 30 rồi mọi bội số 5. Không cho sắc lệnh đã sở hữu vào offer; pool còn dưới 3 thì hiện số còn lại; hết pool thì không mở modal, lịch ghi “Đã nhận đủ sắc lệnh”. Không reset sắc lệnh để farm. Nhiệm vụ chỉ dùng lịch hữu hạn hiện tại đến năm 27; nhiệm vụ đang chạy tiếp tục được settle đúng hạn, không lặp quest mới sau đó.

### Ngân sách và boss

Mọi số/bảng ở `src/data/endless.ts`, giữ `ENEMY_BUDGET` và `SLOT_MULT` hiện tại. Năm 1..30 lấy đúng bảng cũ (năm 30 = 691). Từ năm 31 dùng bảng số nguyên **lưu sẵn**: `B[y] = min(1_000_000, floor((B[y-1] * 110 + 50) / 100))` (×115 tới 11/11/2026; hạ ×110 sau khi giảm Can Thiệp để giữ độ sống sót của Vô tận, `docs/balance/2026-11-10-draw-one-balance.md` lượt 7). Đây là round từng năm từ 691; năm 31 = 760, năm 32 = 836. Bảng dừng tại phần tử đầu đạt 1.000.000; năm xa hơn tra phần tử cuối O(1), không vòng lặp theo year, không Math.pow. Test kiểm recurrence và điểm bão hoà, không sinh bảng runtime.

Ngân sách cuối = `min(3_000_000, round(B[y] * slotMult * (1 + 0.1 * Gai) * modifierBudgetMult))`. Trần áp **sau** slot/Gai/modifier. Tiếp tục dùng `composeArmy`, `ENEMY_CAP=120`, cấp 1..5 và `sqrt(budget/spent)` khi chạm cap. Không tăng số quân để biểu diễn EP lớn. Năm 1..30 chưa có modifier nên cùng công thức cũ.

Boss năm ≤30 giữ nguyên. Với năm >30, cycle = floor((year-1)/30); bảng hệ số basis points bắt đầu 10000 ở cycle 0, mỗi chu kỳ ×1,25 làm tròn, trần 100000 (10×), lưu sẵn và tra bão hoà. Áp hệ số một lần lên HP và sát thương của boss, quân do boss triệu hồi và mirror; quân hộ tống đã tăng theo ngân sách, không nhân hệ số boss lần nữa. Gai tiếp tục tăng HP boss như hiện tại, không tự tăng DMG Gai. Giữ tốc độ, interval, timer, số summon và hard limit hiện tại. Modifier của thập niên áp sau hệ số boss. Sát thương kỹ năng riêng như Ném Bùn cũng phải scale: BossSetup thêm specialDamage đã resolve chỉ cho Endless, bosses.ts dùng giá trị này thay raw BOSS_RULES.bog.mudDmg; normal thiếu field dùng đúng giá trị cũ. Không nhân lại specialDamage mỗi tick.

Trần ngân sách và trần buff là giới hạn số học/hiệu năng, không phải mốc kết thúc năm. Ván không có hạn năm gameplay. Chỉ chấp nhận year/counters là số nguyên an toàn khi decode; không biểu diễn vô hạn bằng giá trị non-finite.

## 4. Bàn 7×7, id ổn định và hình học

Endless có 49 ô ngay từ lúc bắt đầu; 24 ô ngoài đều khoá. Mười ô mở ban đầu như normal: Ngai và chín ô giữa. Vòng ngoài mua được từ năm 1, theo lân cận trực giao hiện tại. Sách Khai Hoang vẫn mở ô bất kỳ, kể cả vòng ngoài; các hiệu ứng mở miễn phí không tăng purchasedPlots. Không đặt gate năm 30 cho đất.

**Id 0..24 giữ nguyên**, vẫn `row=floor(id/5)`, `col=id%5` bên trong. Ngai vẫn id 2 tại inner (row=0,col=2). Id 25..48 cấp theo row-major trên hệ inner với row,col thuộc [-1,5], bỏ qua [0,4]². Ví dụ 25=(-1,-1), 31=(-1,5), 32=(0,-1), 33=(0,5), 48=(5,5). Không dùng `row*7+col` làm id; descriptor có `plotCoords`, `plotAtCell`, `neighbours` để mọi lớp dùng cùng ánh xạ. Thứ tự neighbour Bắc/Đông/Nam/Tây giữ nguyên; thứ tự dựng entity theo id tăng dần. Mode là nguồn chọn layout, không đoán từ year.

| Giá trị | Normal | Endless |
|---|---:|---:|
| Ô / số ô / cạnh phủ | 64 / 25 / 320 px | 64 / 49 / 448 px |
| Inner origin | 224 | 224 |
| Mép toàn bàn | [224,544)² | [160,608)² |
| Tâm bàn | (384,384) | (384,384) |
| FIELD | 768 | 768 |
| WALL_Y | 176 | 112 |
| Ngai id / tâm world | 2 / (384,256) | 2 / (384,256) |
| Đường nam | x=384, y=544..768 | x=384, y=608..768 |
| ENEMY_PORTAL | (384,792) | (384,792) |

Vòng bắc nằm giữa Ngai và tường mới; đây là hệ quả của giữ vị trí tương đối inner, không dời Ngai ra vòng ngoài. Tường cách mép bàn bắc 48 px như trước. Không phóng sân, tốc độ lính hay tầm đánh. DEPLOY_BOX giữ offset x=[-24,24], y=[18,30] theo tâm mỗi ô; box của ô ngoài cũng nằm gọn trong ô. Nhà giữa ô, chỉ lính mình đi xuyên nhà mình. Vách, road, vùng cấm decor, bounds bắc, deployment, spawn và UI hit dùng descriptor đúng ván. Portal không cần dịch vì sân giữ nguyên; đường chỉ ngắn đi 64 px.

`src/data/boardGeometry.ts` sở hữu hai descriptor và bảng toạ độ/id; THRONE_PLOT=2 trở thành nguồn chung (hiện thực tế đang export ở `src/game/run/board.ts`, file đó re-export để giữ tương thích). Data chỉ chứa types/values; helper thuần áp dụng descriptor nằm ở game. Không đổi hằng toàn cục lúc chuyển mode. BattleSetup chỉ thêm `geometry: 'endless'` cho Endless; normal không thêm thuộc tính geometry, dùng mặc định cũ. BattleWorld giữ geometry theo instance, không đọc session hay RunState.

Projection giữ nguyên `project({x,y})={x:y-x,y:(x+y)/2}` và inverse; ô là thoi 128×64. Chỉ view đổi extent. Overview zoom tính theo bề ngang chiếu **896** thay 640 trong Endless, giữ mục tiêu rộng 65% desktop (có clamp theo chiều cao HUD hiện tại); phone giữ zoom tối thiểu 33/32, không chia zoom theo cạnh bàn; zoom tự do đến 3×, snapView như hiện tại, HUD không zoom. Pan clamp theo wall=112 và extent của ván. Mọi click/hover/drop/mua ô/freeMove/can thiệp qua camera inverse rồi unproject. Ngưỡng touch và dung sai 44 px dùng cùng model hiện hành; ở mức overview nhỏ phải zoom trước khi đặt nếu ô không đạt ngưỡng. Không thu nhỏ hit target HUD dưới 44×44.

Giá ô inner giữ `unlockCost(purchasedPlots)`; giá ô outer trước giảm = `20 + 2*purchasedPlots` vàng. Mọi ô mua bằng vàng đều tăng cùng purchasedPlots. Buff giảm giá áp phần trăm rồi floor, tối thiểu 1; UI và command đọc chung `plotPurchasePrice(state, plot)`. Không có ô miễn phí do floor về 0. Lân cận qua mép inner/outer đúng tọa độ, không nối nhầm cuối hàng.

## 5. Phúc lành vĩnh viễn

Sau trận năm 30 và mọi 5 năm sau (35/40/…), còn mạng thì bắt buộc chọn 1 trong 3; không bán, bỏ qua hay đổi offer. Dùng RNG mới `blessing`, seed `hashSeed(seed + ':blessing')`, không tiêu thụ draw/reward/calendar/council/quest. Chỉ tạo offer một lần và lưu ngay qua checkpoint của command, không roll khi mở modal/resume. Rút 3 id khác nhau bằng partial Fisher–Yates trên pool id sắp tăng; trọng số đều nhau.

RunState có `endless: null | { blessingStacks: Partial<Record<EndlessBlessingId, number>>; lastBlessingYear: number; modifierId: EndlessModifierId | null; modifierStartYear: number }`. Endless mới khởi tạo blessingStacks={}, lastBlessingYear=0, modifierId=null, modifierStartYear=0. RNG thêm `blessing` cho cả hai mode để migration có giá trị trung tính; normal không dùng nó. `lastBlessingYear` = mốc đã tạo offer, không phải mốc đã chọn, ngăn enqueue trùng khi tải lại. Offer union thêm `{kind:'blessing', blessingIds: EndlessBlessingId[], year:number}`, phase `blessing`, command `{type:'pickBlessing', index:number}`. Chỉ index nguyên 0..2 của offer hiện tại hợp lệ; sai pha/index giữ nguyên state, RNG, vàng. Effect tính từ stack; không sửa vĩnh viễn bản thẻ gốc.

Mọi buff lặp được; stack lưu tối đa theo bảng. Nếu chọn loại đã đạt trần, nhận **25 vàng**, không tăng stack; modal nói rõ **“Đã đạt giới hạn — nhận 25 vàng”** trước khi chọn. Pool vẫn luôn có 12 id nên không cạn offer. Đây là lựa chọn triển khai để run dài vẫn có bước chọn hợp lệ; bảng stack nhỏ cố định, không lưu lịch sử mỗi lần chọn.

| Id / tên Việt | Mỗi stack, hiệu lực toàn ván | Stack tối đa |
|---|---|---:|
| harvest / Mùa màng | +2 thuế đầu năm | 10 |
| treasury / Kho bạc | +2 vàng thưởng thắng trận, sau hệ số vàng boss | 10 |
| vigor / Sinh lực | +10% HP tất cả lính mình, gồm summon | 20 |
| might / Sức mạnh | +10% DMG lính mình, gồm summon và DOT của chúng | 20 |
| haste / Nhanh nhẹn | +5% tốc độ di chuyển lính mình | 10 |
| tower_might / Hoả lực | +10% DMG tháp (đạn, pulse, DOT), không Ngai | 20 |
| tower_haste / Nhịp tháp | +5% tốc đánh tháp, qua clamp interval hiện tại | 10 |
| masonry / Thành vững | +10% HP mọi công trình, gồm Ngai | 20 |
| vitality / Phúc thọ | +1 trần mạng và hồi ngay 1 mạng | 2 |
| interest / Sinh lời | +2% lãi trên số dư đầu năm sau phí duy trì, trước thuế/thu nhập; floor, tối đa 10 vàng/stack/năm | 5 |
| reroll / Cơ hội | +1 lần đổi bài miễn phí mỗi đầu năm | 3 |
| survey / Khẩn đất | -10% giá mua ô inner và outer | 5 |

Trần mạng Endless = RUN.maxLives + vitalityStacks, tối đa 6; mọi nguồn hồi mạng dùng chung trần theo mode, kể cả sắc lệnh/perk. Chọn vitality đang đầy mạng vẫn tăng trần và hồi 1 nếu chưa max stack. Lãi tính `min(10*stacks, floor(max(0,balanceAfterUpkeep)*2*stacks/100))`, không lãi kép trên vàng vừa nhận cùng năm; cộng vào goldEarned. Buff thuế/reroll/lãi bắt đầu từ năm kế; buff combat có hiệu lực trận kế; hồi mạng có hiệu lực ngay. Stat % cộng vào sheet cùng loại trước finalStat; tốc đánh áp quy ước của stat sheet, không nhân interval nhầm chiều; không vượt các clamp hiện tại.

Thứ tự sau trận: cập nhật mạng/stats/boss/chinh phục → kiểm hết mạng → reward → conquest nếu có → council → blessing → quest settlement cuối năm và các questReward theo flow hiện hành → yearEnd → advance/startYear. Giữ đường normal đúng thứ tự cũ. Các reward quest phát sinh ngay từ kết quả trận giữ vị trí hiện hành; không dùng refactor Endless để đổi normal. PendingOffers giữ FIFO; modal blessing luôn chặn bản đồ và startBattle. Việc chọn phúc lành được checkpoint trước khi thông báo state qua RunController.

## 6. Thập niên biến thể

Chỉ kích hoạt từ **31–40**, đổi tại đầu năm 41,51,…; năm 1..30 modifier=null. Có bốn bản ghi theo thứ tự id cố định trong data. Chọn offset đầu = `hashSeed(seed + ':endless-modifier') % 4`; block `floor((year-31)/10)` tiến vòng theo offset, không tiêu thụ RNG khác. Lưu id + startYear của block hiện tại; codec kiểm khớp seed/year. Preview lịch dùng cùng hàm thuần, không đổi state hay RNG.

| Id / tên | Hiệu ứng trong cả 10 năm |
|---|---|
| elite / Tinh nhuệ | Địch (gồm boss/summon/mirror) +25% HP, +10% DMG |
| double_edge / Hai lưỡi | Cả hai phe +25% DMG; không đổi HP |
| famine / Khó mùa | Thuế -2 (không dưới 0 sau buff); vàng thưởng thắng trận +3 sau hệ số boss |
| siege / Công thành | EP ×1,20 trước trần cuối; công trình mình gồm Ngai +20% HP |

Các giá trị là dữ liệu, không hardcode switch số trong UI. Modifier stats dựng một lần vào BattleSetup, áp lên đúng nhóm và nguồn đòn; không nhân mỗi tick. Effect kinh tế áp đúng nguồn, không nhân killGold/conquest/skipReward. Vẫn giữ cap enemy/player/entity/projectile. Modifier không reset buff, không tiêu hao khi reload, không tác động normal. Calendar báo trước tên/khoảng năm và hiệu ứng; boss năm 40 chịu modifier 31–40, năm 41 mới đổi.

## 7. UI và lịch hữu hạn theo trang

HUD Endless hiện **“Năm {year} · Vô tận”**; không `/30`. Dải lịch vẫn cửa sổ hữu hạn quanh năm hiện tại. CalendarModal dùng trang 30 năm, hiện trang chứa năm hiện tại khi mở, nút trước/sau ≥44×44; không tạo mảng từ năm 1 đến năm hiện tại. Chuyển trang chỉ đọc lịch, không roll offers/armies hoặc ghi save. Mỗi ô có boss/council/mốc phúc lành, tên modifier trong chi tiết; lịch normal vẫn 6×5 và nội dung cũ. Trang xa dùng arithmetic và bảng tra, không mô phỏng từng năm trước.

Modal **“Phúc lành năm {year}”**: desktop 3 lựa chọn cạnh nhau; mobile xếp dọc trong panel cuộn, nút chọn luôn đọc được và ≥44 px. Hiện tên, effect, stack hiện tại/giới hạn và giá trị sau chọn; không xác nhận lần hai. Có panel **“Phúc lành & Biến thể”** mở từ HUD, xem tổng hợp 12 loại và modifier hiện hành/kế tiếp, không lưu lịch sử các lần chọn. Keyboard focus, Esc không bỏ offer bắt buộc; đóng bảng xem trả về offer hiện hành. Không cho click xuyên modal hay pinch phát drop.

MainMenu giữ một save slot hiện tại, Tiếp tục ghi kèm chế độ/năm trong thông tin resume; chọn Ván mới không tự chuyển/settle ván cũ. RunEnd ghi số năm sống sót và năm kết thúc, rồi breakdown điểm thật được session trả về, kể cả credited=false. Dòng năm tính điểm ghi **“Năm tính điểm: {min(completedYears,60)} (tối đa 60)”**; không làm người chơi tưởng score bị cắt.

Tất cả UI dùng createPanel/createButton/ContentBox/Tooltip và FONT_UI, chữ Việt, id Anh. Resize layout ở 1280×720 và 375×812, breakpoint 768. Scene instance tái sử dụng: reset runMode, modal, geometry/view, pending selections trong create và huỷ listener đúng teardown. HUD đọc snapView qua realm:view; dữ liệu ban đầu truyền launch data.

## 8. Điểm meta, trạng thái và lưu

Công thức cũ giữ nguyên với Endless: `round((min(completedYears,60) + 3*conquered + 5*min(bossesWon,3) + 0) * (1 + 0.2*Gai))`. Conquered không quá sáu vì không cấp lại chinh phục. Điểm tối đa Endless Gai 0 = 93, Gai 5 = 186; mastery nhận cùng số điểm. Cắt boss count khi tính điểm để không farm boss vô hạn. Số liệu thống kê thực không bị cắt. Normal vẫn dùng chính xác công thức hiện tại và victory +20. Không settle một phần mỗi mốc phúc lành.

Run save tăng **6 → 7**, envelope formatVersion vẫn 1, IndexedDB vẫn db crowned-kingdoms v1, stores run/meta, key current. Migrator v6 thêm mode normal, endless null, rng.blessing = hashSeed(seed + ':blessing'); không đổi plots/army/rules/deck/RNG cũ. Giữ chuỗi 3→4→5→6→7, v7 không migrate lại. Phiên bản mới không sửa hay ghi đè fixture cũ.

Codec kiểm mode/rules khớp, normal đúng 25 ô/Ngai 2, Endless đúng 49 ô/Ngai 2, id ô trong selection và command hợp lệ theo descriptor; year Endless là safe integer ≥1 (không giới hạn ở rules.years), stack đúng id/int/range rồi kiểm lives theo maxLivesForRun (Endless vitality cho phép 6, từ chối 7; normal vẫn tối đa 4), RNG uint32, modifier đúng block, offer đúng 3 id khác nhau và mốc, lastBlessingYear đúng 0 hoặc bội 5 từ 30 không vượt năm hiện tại. Normal phải endless=null và không có blessing offer. Không chữa save v7 Endless 25 ô thành ván mới, không thay id lạ bằng buff ngẫu nhiên. Hash content bổ sung endless definitions có version riêng trong dữ liệu dùng để kiểm thay đổi; hash khác vẫn kiểm mọi id/field thay vì loại save chỉ vì hash đổi. Không đổi contentHash của normal chỉ vì thêm pool Endless.

Checkpoint mọi command thành công ngoài trận và vào/ra trận theo FIFO hiện tại; không ghi mỗi tick/speed/camera/can thiệp/auto-fire toggle. Mid-battle reload dựng lại tick 0 với cùng geometry, army, blessing, modifier, autoFire. Offer hiện tại và pending queue được lưu đầy đủ. Session giữ giao dịch endRun nguyên tử; lỗi ghi không làm mất save, không bật unlock trước khi meta lưu thành công.

**“Byte-identical normal”** áp dụng payload gameplay và BattleSetup/hash/trace với cùng inputs. Việc bắt buộc bump schema khiến bytes JSON save v7 không thể giống v6: chỉ cho phép khác version, mode='normal', endless=null và rng.blessing trung tính; projection so sánh bỏ đúng các trường mới này phải trùng bytes baseline v6. Không viết lại expected hash/determinism test để hợp thức hoá regression. Save fixtures cũ vẫn decode; thêm assertion v7/migration riêng, không đổi nội dung fixture hay kỳ vọng gameplay hiện hữu. Nếu baseline đã có lỗi, báo riêng, không nhận khác biệt đó là Endless.

## 9. Nghiệm thu và rủi ro

- E1 (Claude, TDD): data/rules/state/flow/save/meta, geometry descriptors và cơ chế buff/modifier thuần. E2 chỉ nối hình học đó xuyên battle/render/camera, không trì hoãn luật ô đến UI.
- E2 (Codex UI, Claude review): 49 ô, tường/road/deployment/hit/zoom theo instance; normal giữ baseline. Kiểm đầy đủ chín vua trên cùng skin hiện có, không tạo asset.
- E3 (Codex UI): mode toggle, offers/view panel, calendar pages và score/meta copy; test models trước scene.
- E4: headless chạy thật cùng bot/seed sống qua N=40 năm, kết thúc bounded harness không giả battleResult; deterministic trace và reload matrix. Thêm test orchestration đến năm 65 để kiểm boss lặp cả ba; fixture không thay cho bằng chứng run thật. Số seed sống được phải đo trong triển khai, không tuyên bố trước.
- Gate triển khai: lint/typecheck/test/build đều exit 0; browser hai kích thước, console sạch; benchmark trường hợp 49 công trình và trần quân. Phiên tài liệu này chỉ kiểm file và tính nhất quán, không chạy node/npm/npx.

Rủi ro: helper row/col hardcode 5 ở card custom/council/perk có thể nối sai vòng; wall global khiến ván normal đổi; double scale boss summon/DOT; mốc 30 tự thắng hoặc mất reward; hết sắc lệnh làm kẹt queue; reload roll lại buff hoặc cấp lại mạng; meta v1 không có provenance; pool buff tới trần gây kỳ vọng sai; lãi/EP/stat lớn và 49 nguồn sinh quân gây tràn pool/chi phí tick. Plan phải gắn từng rủi ro với test hoặc browser gate, không tăng cap quân để né.

Không có câu hỏi thiết kế còn bỏ ngỏ. Các trần số và bảng effect là thông số ban đầu đã chốt trong tài liệu này; cân bằng về sau cần thay data và test có chủ đích.

