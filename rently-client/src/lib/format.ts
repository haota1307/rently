/**
 * Các hàm tiện ích để định dạng dữ liệu
 */

/**
 * Định dạng số thành tiền tệ Việt Nam
 * @param amount Số tiền cần định dạng
 * @returns Chuỗi đã định dạng theo tiền tệ Việt Nam
 */
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Định dạng ngày tháng theo định dạng Việt Nam
 * @param date Ngày cần định dạng
 * @returns Chuỗi ngày đã định dạng (DD/MM/YYYY)
 */
export const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("vi-VN");
};

/**
 * Định dạng ngày tháng có cả giờ phút
 * @param date Ngày cần định dạng
 * @returns Chuỗi ngày giờ đã định dạng (DD/MM/YYYY HH:MM)
 */
export const formatDateTime = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("vi-VN");
};
