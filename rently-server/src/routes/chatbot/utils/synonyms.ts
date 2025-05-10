/**
 * Quản lý từ đồng nghĩa và từ khóa thường dùng để tăng cường khả năng phân tích
 */

/**
 * Từ đồng nghĩa cho các tiện ích phổ biến
 */
export const amenitySynonyms: Record<string, string[]> = {
  'máy lạnh': ['điều hòa', 'máy lạnh', 'máy điều hòa', 'aircon', 'điều hoà'],
  wifi: [
    'wifi',
    'internet',
    'mạng',
    'wi-fi',
    'mạng không dây',
    'mạng internet',
  ],
  'nhà vệ sinh riêng': [
    'wc riêng',
    'toilet riêng',
    'nhà vệ sinh riêng',
    'vệ sinh riêng',
    'phòng tắm riêng',
    'phòng vệ sinh riêng',
  ],
  'tủ lạnh': ['tủ lạnh', 'tủ mát', 'refrigerator', 'tủ đông'],
  'máy giặt': ['máy giặt', 'máy giặt quần áo', 'giặt ủi'],
  'gác lửng': ['gác lửng', 'gác xép', 'gác', 'tầng lửng', 'gác mái'],
  'ban công': ['ban công', 'balcony', 'lô gia', 'logia', 'sân thượng', 'sân'],
  bếp: ['bếp', 'phòng bếp', 'khu bếp', 'bếp nấu ăn', 'bếp chung', 'bếp riêng'],
  'bàn làm việc': [
    'bàn làm việc',
    'bàn học',
    'khu vực làm việc',
    'bàn',
    'bàn viết',
  ],
  'an ninh': [
    'an ninh',
    'bảo vệ',
    'camera an ninh',
    'khóa vân tay',
    'khóa thẻ từ',
    'bảo mật',
  ],
}

/**
 * Các cụm từ quan trọng liên quan đến thuê phòng
 */
export const importantPhrases: string[] = [
  // Loại phòng
  'phòng trọ',
  'thuê phòng',
  'phòng cho thuê',
  'căn hộ',
  'chung cư mini',
  'nhà nguyên căn',
  'homestay',
  'chung cư',
  'ký túc xá',
  'ktx',
  'phòng ở ghép',

  // Tiện ích
  'tiện ích',
  'nội thất',
  'giường',
  'tủ',
  'bàn',
  'máy lạnh',
  'wifi',
  'nhà vệ sinh',
  'toilet',
  'nhà bếp',
  'bếp',
  'máy giặt',
  'nước nóng',
  'tủ lạnh',

  // Khu vực
  'cần thơ',
  'gần trường',
  'gần chợ',
  'gần bệnh viện',
  'trung tâm',
  'nam cần thơ',
  'đại học',
  'trường học',
  'đại học nam cần thơ',
  'khu vực',

  // Hợp đồng & pháp lý
  'hợp đồng',
  'đặt cọc',
  'tiền cọc',
  'giấy tờ',
  'pháp lý',
  'đăng ký tạm trú',
  'giấy tờ tùy thân',
  'hóa đơn',
  'thanh toán',

  // Người dùng
  'sinh viên',
  'người đi làm',
  'gia đình',
  'phù hợp',
  'chủ nhà',
  'người thuê',

  // Không gian & kích thước
  'diện tích',
  'rộng',
  'lớn',
  'nhỏ',
  'mét vuông',
  'm2',
  'đầy đủ',

  // Giá cả
  'giá phòng',
  'giá thuê',
  'tiền thuê',
  'giá',
  'phí',
  'chi phí',
  'triệu',
  'nghìn',
  'rẻ',
  'mắc',
  'đắt',
  'tháng',
  'tiết kiệm',

  // An ninh & chất lượng
  'an ninh',
  'an toàn',
  'yên tĩnh',
  'sạch sẽ',
  'thoáng mát',
  'mới',
  'chất lượng',
]

/**
 * Stop words tiếng Việt phổ biến (từ không mang nhiều ý nghĩa)
 */
export const vietnameseStopWords: string[] = [
  'và',
  'là',
  'của',
  'cho',
  'có',
  'tôi',
  'bạn',
  'với',
  'trong',
  'này',
  'đó',
  'để',
  'tại',
  'từ',
  'về',
  'thì',
  'mà',
  'như',
  'nào',
  'một',
  'các',
  'đến',
  'những',
  'được',
  'khi',
  'vì',
  'nếu',
  'nên',
  'sẽ',
  'đã',
  'còn',
  'chỉ',
  'cũng',
  'không',
  'nhưng',
  'vậy',
  'rằng',
  'thế',
  'thôi',
  'đây',
  'vừa',
  'phải',
  'quá',
  'rất',
  'làm',
  'sao',
  'ai',
  'mình',
  'nhiều',
  'ít',
  'hay',
  'lại',
  'cần',
  'muốn',
]
