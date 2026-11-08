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
