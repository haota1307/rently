import { PrismaClient } from '@prisma/client'

/**
 * Script để tạo các subscription plans mặc định.
 * Chạy với: npx ts-node initialScript/seed-subscription-plans.ts
 */
export async function seedSubscriptionPlans(prisma: PrismaClient) {
  try {
    console.log('Bắt đầu seed subscription plans...')

    // Đếm plans hiện tại
    const existingPlansCount = await prisma.subscriptionPlan.count()

    // Không xóa plans hiện tại nếu được gọi từ file index.ts
    // Chỉ thêm hoặc cập nhật

    let createdCount = 0
    let updatedCount = 0

    // Tạo feature list mặc định cho tất cả plans
    const defaultFeatures = [
      'Đăng bài không giới hạn',
      'Hiển thị trên trang chủ',
      'Quản lý phòng trọ',
      'Quản lý hợp đồng',
      'Quản lý thanh toán',
      'Hỗ trợ 24/7',
    ]

    // Tạo các plans
    const plans = [
      {
        id: 'free_trial',
        name: 'Dùng thử miễn phí',
        description: 'Trải nghiệm đầy đủ tính năng trong 30 ngày',
        price: 0,
        duration: 30,
        durationType: 'days',
        features: defaultFeatures,
        isFreeTrial: true,
        isActive: true,
        color: 'green',
        badge: 'Khuyến nghị',
        icon: 'gift',
      },
      {
        id: 'monthly',
        name: 'Gói cơ bản',
        description: 'Gói cơ bản hàng tháng cho landlord',
        price: 299000,
        duration: 1,
        durationType: 'months',
        features: defaultFeatures,
        isFreeTrial: false,
        isActive: true,
        color: 'blue',
        badge: 'Phổ biến',
        icon: 'calendar',
      },
      {
        id: 'yearly',
        name: 'Gói cơ bản (Năm)',
        description: 'Tiết kiệm 30% so với gói tháng',
        price: 2870400,
        duration: 12,
        durationType: 'months',
        features: defaultFeatures,
        isFreeTrial: false,
        isActive: true,
        color: 'amber',
        badge: 'Tiết kiệm',
        icon: 'star',
      },
    ]

    // Thêm hoặc cập nhật plans trong database
    for (const plan of plans) {
      const existingPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: plan.id },
      })

      if (existingPlan) {
        // Cập nhật plan nếu đã tồn tại
        await prisma.subscriptionPlan.update({
          where: { id: plan.id },
          data: plan,
        })
        updatedCount++
      } else {
        // Tạo plan mới nếu chưa tồn tại
        await prisma.subscriptionPlan.create({
          data: plan,
        })
        createdCount++
      }
    }

    console.log(
      `Đã tạo ${createdCount} và cập nhật ${updatedCount} subscription plans`
    )
    console.log('Seed subscription plans hoàn tất!')

    return { createdCount, updatedCount }
  } catch (error) {
    console.error('Lỗi khi seed subscription plans:', error)
    return { createdCount: 0, updatedCount: 0 }
  }
}

// Chạy seed function nếu file này được chạy trực tiếp
if (require.main === module) {
  const prismaClient = new PrismaClient()
  seedSubscriptionPlans(prismaClient)
    .then(async () => {
      await prismaClient.$disconnect()
    })
    .catch(async e => {
      console.error(e)
      await prismaClient.$disconnect()
      process.exit(1)
    })
}
