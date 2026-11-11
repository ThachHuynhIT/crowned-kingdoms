/** Cấu hình lưu ván (spec §9.3): IndexedDB và các chuỗi người chơi thấy. */

/** Phiên bản định dạng phong bì lưu; độc lập với `RUN_SAVE_VERSION` (phiên bản RunState). */
export const SAVE_FORMAT_VERSION = 1;

/** IndexedDB: một cơ sở dữ liệu, hai kho; phiên bản cơ sở dữ liệu độc lập với hai phiên bản trên. */
export const SAVE_DB = {
  name: 'crowned-kingdoms',
  version: 1,
  runStore: 'run',
  metaStore: 'meta',
  runKey: 'current',
  metaKey: 'profile',
} as const;

/** Nhiều bản lưu (2026-11-09): bản có tên nằm trong kho `run` dưới khoá `slot:<id>`; khoá `current` là bản tự lưu. */
export const SLOT_KEY_PREFIX = 'slot:';
export const MAX_SAVE_SLOTS = 10;
export const SLOT_NAME_MAX = 40;
export const SLOTS_FULL_TEXT = 'Đã đủ 10 bản lưu: xoá bớt một bản rồi lưu lại.';
export const SLOT_SAVE_FAILED_TEXT = 'Không lưu được bản lưu này.';
export const SLOT_BROKEN_TEXT = 'Bản lưu này không còn dùng được với bản cập nhật hiện tại.';
export const AUTOSAVE_NAME = 'Tự động lưu';

export const INCOMPATIBLE_RUN_TEXT = 'Ván đang chơi không còn tương thích với bản cập nhật này.';
export const STORAGE_WARNING_TEXT = 'Trình duyệt này không lưu được tiến trình.';
/** Hồ sơ meta do bản mới hơn của trò chơi ghi: chỉ đọc, không ghi đè. */
export const META_READ_ONLY_TEXT = 'Hồ sơ được lưu bởi phiên bản mới hơn của trò chơi: tiến trình lần này không được lưu.';
/** Ghi hồ sơ meta thất bại khi kết thúc ván: ván đang lưu được giữ lại để chấm điểm lần sau. */
export const META_SAVE_FAILED_TEXT = 'Không lưu được hồ sơ: điểm của ván này chưa được cộng.';
/** Cùng một ván đã kết thúc được chấm lần hai (đã có trong `settledRuns`): điểm không được cộng thêm. */
export const RUN_ALREADY_SCORED_TEXT = 'Ván này đã được tính điểm trước đó.';
/** Ghi hồ sơ meta thất bại khi mở khoá (vua, thẻ): chưa mở gì, điểm còn nguyên. */
export const UNLOCK_SAVE_FAILED_TEXT = 'Chưa lưu được lần mở khoá, hãy thử lại.';
/** Mở khoá khi hồ sơ chưa đủ điều kiện (điểm, chiến thắng) hoặc đã mở rồi. */
export const UNLOCK_REFUSED_TEXT = 'Chưa đủ điều kiện để mở khoá.';
/** Điểm đã cộng nhưng kho lưu chỉ còn trong RAM (IndexedDB không dùng được): mất khi đóng trang. */
export const META_MEMORY_ONLY_TEXT = 'Điểm Vương Miện chỉ được giữ tới khi đóng trang: trình duyệt này không lưu được tiến trình.';
/** Ghi Settings hỏng: giữ giá trị cũ. */
export const SETTINGS_SAVE_FAILED_TEXT = 'Chưa lưu được cài đặt, hãy thử lại.';
/** Giá trị Settings không hợp lệ (không phải số 0–100 / bật-tắt). */
export const SETTINGS_INVALID_TEXT = 'Giá trị cài đặt không hợp lệ.';
/** Bỏ ván xong nhưng không xác nhận được đã xoá trên thiết bị (kho đã chuyển sang RAM). */
export const DISCARD_MEMORY_ONLY_TEXT = 'Đã bỏ ván trong phiên này; chưa xác nhận xoá được bản lưu trên thiết bị.';
