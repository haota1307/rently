const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

// Sample data
const SAMPLE_USERS = [
  { name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', phone: '0901234567' },
  { name: 'Trần Thị B', email: 'tranthib@gmail.com', phone: '0902345678' },
  { name: 'Lê Văn C', email: 'levanc@gmail.com', phone: '0903456789' },
  { name: 'Phạm Thị D', email: 'phamthid@gmail.com', phone: '0904567890' },
  { name: 'Hoàng Văn E', email: 'hoangvane@gmail.com', phone: '0905678901' },
]

const SAMPLE_ADDRESSES = [
  {
    district: 'Ninh Kiều',
    ward: 'An Hòa',
    street: 'Đường 3/2',
    lat: 10.0301,
    lng: 105.7685,
  },
  {
    district: 'Ninh Kiều',
    ward: 'An Cư',
    street: 'Đường Nguyễn Văn Cừ',
    lat: 10.0251,
    lng: 105.7595,
  },
  {
    district: 'Ninh Kiều',
    ward: 'Xuân Khánh',
    street: 'Đường Võ Văn Kiệt',
    lat: 10.0201,
    lng: 105.7505,
  },
  {
    district: 'Cái Răng',
    ward: 'Ba Láng',
    street: 'Đường Trần Hưng Đạo',
    lat: 10.0401,
    lng: 105.7785,
  },
  {
    district: 'Cái Răng',
    ward: 'Lê Bình',
    street: 'Đường Cách Mạng Tháng 8',
    lat: 10.0451,
    lng: 105.7885,
  },
]

const SAMPLE_AMENITIES = [
  'WiFi miễn phí',
  'Máy lạnh',
  'Tủ lạnh',
  'Máy giặt chung',
  'Bãi đậu xe',
  'An ninh 24/7',
  'Thang máy',
  'Ban công',
  'Cửa sổ',
  'Nhà vệ sinh riêng',
  'Bếp chung',
  'Giường',
  'Tủ quần áo',
  'Bàn học',
  'Kệ sách',
]

const ROOM_TYPES = [
  { name: 'Phòng đơn', basePrice: 2000000, baseArea: 15 },
  { name: 'Phòng đôi', basePrice: 3000000, baseArea: 20 },
  { name: 'Phòng VIP', basePrice: 4000000, baseArea: 25 },
  { name: 'Studio', basePrice: 5000000, baseArea: 30 },
  { name: 'Mini apartment', basePrice: 6000000, baseArea: 35 },
]

// Tọa độ điểm tham chiếu (Đại học Nam Cần Thơ)
const REFERENCE_POINT = {
  lat: 10.03012,
  lng: 105.76852,
  name: 'Đại học Nam Cần Thơ',
}

/**
 * Tính khoảng cách giữa 2 điểm sử dụng công thức Haversine
 * @param {number} lat1 - Latitude điểm 1
 * @param {number} lng1 - Longitude điểm 1
 * @param {number} lat2 - Latitude điểm 2
 * @param {number} lng2 - Longitude điểm 2
 * @returns {number} - Khoảng cách tính bằng kilomet
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3 // Bán kính Trái Đất tính bằng mét
  const φ1 = (lat1 * Math.PI) / 180 // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  const distanceInMeters = R * c // in metres
  const distanceInKm = distanceInMeters / 1000 // chuyển sang km
  return Math.round(distanceInKm * 10) / 10 // Làm tròn đến 1 chữ số thập phân
}

function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomPrice(basePrice) {
  const variation = 0.3
  const min = basePrice * (1 - variation)
  const max = basePrice * (1 + variation)
  return Math.floor(randomInRange(min, max) / 100000) * 100000
}

function randomArea(baseArea) {
  const variation = 0.4
  const min = baseArea * (1 - variation)
  const max = baseArea * (1 + variation)
  return Math.floor(randomInRange(min, max))
}

function randomSubset(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function generatePostTitle(userName, rentalIndex, roomIndex, roomType) {
  const titles = [
    `${roomType} tại nhà trọ ${userName} ${rentalIndex + 1} - Phòng ${roomIndex + 1}`,
    `Cho thuê ${roomType.toLowerCase()} đẹp gần ĐH Nam Cần Thơ`,
    `${roomType} full nội thất, an ninh tốt`,
    `Phòng trọ sinh viên giá rẻ - ${roomType}`,
    `${roomType} mới xây, sạch sẽ, thoáng mát`,
  ]
  return titles[randomInRange(0, titles.length - 1)]
}

function generateDescription(roomType, amenities) {
  const descriptions = [
    `${roomType} được thiết kế hiện đại, đầy đủ tiện nghi. Khu vực an ninh, gần trường học và các tiện ích công cộng.`,
    `Phòng sạch sẽ, thoáng mát với ${amenities.slice(0, 3).join(', ')}. Thích hợp cho sinh viên và người đi làm.`,
    `${roomType} có vị trí thuận lợi, giao thông dễ dàng. Chủ nhà thân thiện, hỗ trợ tận tình.`,
    `Không gian sống lý tưởng với đầy đủ tiện ích. Giá cả hợp lý, phù hợp với túi tiền sinh viên.`,
    `Phòng mới xây, nội thất cơ bản đầy đủ. Khu vực yên tĩnh, thích hợp nghỉ ngơi và học tập.`,
  ]
  return descriptions[randomInRange(0, descriptions.length - 1)]
}

async function createAmenities() {
  console.log('🔧 Creating amenities...')

  const existingAmenities = await prisma.amenity.findMany()
  const existingNames = existingAmenities.map(a => a.name)

  const newAmenities = SAMPLE_AMENITIES.filter(
    name => !existingNames.includes(name)
  )

  if (newAmenities.length > 0) {
    await prisma.amenity.createMany({
      data: newAmenities.map(name => ({ name })),
      skipDuplicates: true,
    })
    console.log(`✅ Created ${newAmenities.length} new amenities`)
  } else {
    console.log('✅ All amenities already exist')
  }
}

async function getLandlordRoleId() {
  const landlordRole = await prisma.role.findFirst({
    where: { name: 'LANDLORD' },
  })

  if (!landlordRole) {
    throw new Error(
      'LANDLORD role not found. Please run: npm run create-permissions first.'
    )
  }

  return landlordRole.id
}

async function createUsers() {
  console.log('👥 Creating users...')

  const landlordRoleId = await getLandlordRoleId()
  const users = []
  const hashedPassword = await bcrypt.hash('123456', 10)

  for (const userData of SAMPLE_USERS) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          phoneNumber: userData.phone,
          status: 'ACTIVE',
          roleId: landlordRoleId,
        },
      })
      users.push(user)
      console.log(`✅ Created user: ${user.name}`)
    } else {
      users.push(existingUser)
      console.log(`⏭️  User already exists: ${existingUser.name}`)
    }
  }

  return users
}

async function createRentalsAndRooms(users) {
  console.log('🏠 Creating rentals and rooms...')

  const allAmenities = await prisma.amenity.findMany()
  const createdData = {
    rentals: [],
    rooms: [],
    posts: [],
  }

  for (let userIndex = 0; userIndex < users.length; userIndex++) {
    const user = users[userIndex]
    console.log(`\n📍 Creating rentals for ${user.name}...`)

    for (let rentalIndex = 0; rentalIndex < 5; rentalIndex++) {
      const address = SAMPLE_ADDRESSES[rentalIndex % SAMPLE_ADDRESSES.length]
      const rentalTitle = `Nhà trọ ${user.name} ${rentalIndex + 1}`

      const latVariation = (Math.random() - 0.5) * 0.01
      const lngVariation = (Math.random() - 0.5) * 0.01

      const rentalLat = address.lat + latVariation
      const rentalLng = address.lng + lngVariation

      // Tính khoảng cách từ rental đến Đại học Nam Cần Thơ
      const distanceToUniversity = calculateDistance(
        rentalLat,
        rentalLng,
        REFERENCE_POINT.lat,
        REFERENCE_POINT.lng
      )

      const rental = await prisma.rental.create({
        data: {
          title: rentalTitle,
          address: `${randomInRange(1, 999)} ${address.street}, ${address.ward}, ${address.district}, Cần Thơ`,
          lat: rentalLat,
          lng: rentalLng,
          distance: distanceToUniversity, // Thêm field distance tính bằng km
          landlordId: user.id,
          description: `Nhà trọ chất lượng tại ${address.district}, gần các trường đại học và tiện ích công cộng. Cách ${REFERENCE_POINT.name} ${distanceToUniversity}km.`,
        },
      })

      createdData.rentals.push(rental)
      console.log(
        `  ✅ Created rental: ${rentalTitle} (${Math.round(distanceToUniversity)}m to ${REFERENCE_POINT.name})`
      )

      for (let roomIndex = 0; roomIndex < 5; roomIndex++) {
        const roomType = ROOM_TYPES[roomIndex % ROOM_TYPES.length]
        const price = randomPrice(roomType.basePrice)
        const area = randomArea(roomType.baseArea)
        const selectedAmenities = randomSubset(
          allAmenities,
          randomInRange(3, 8)
        )

        const room = await prisma.room.create({
          data: {
            title: `${roomType.name} ${roomIndex + 1}`,
            price: price,
            area: area,
            isAvailable: Math.random() > 0.2,
            rentalId: rental.id,
            roomAmenities: {
              create: selectedAmenities.map(amenity => ({
                amenityId: amenity.id,
              })),
            },
          },
        })

        createdData.rooms.push(room)

        const postTitle = generatePostTitle(
          user.name,
          rentalIndex,
          roomIndex,
          roomType.name
        )
        const description = generateDescription(
          roomType.name,
          selectedAmenities.map(a => a.name)
        )

        const post = await prisma.rentalPost.create({
          data: {
            title: postTitle,
            description: description,
            deposit: price * 0.5,
            pricePaid: price,
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            roomId: room.id,
            landlordId: user.id,
            rentalId: rental.id,
          },
        })

        createdData.posts.push(post)
        console.log(
          `    ✅ Created room & post: ${roomType.name} - ${price.toLocaleString()}đ`
        )
      }
    }
  }

  return createdData
}

async function main() {
  console.log('🚀 Starting recommendation data seeding...\n')

  try {
    await createAmenities()
    const users = await createUsers()
    const { rentals, rooms, posts } = await createRentalsAndRooms(users)

    console.log('\n🎉 Seeding completed successfully!')
    console.log('📊 Summary:')
    console.log(`   👥 Users: ${users.length}`)
    console.log(`   🏠 Rentals: ${rentals.length}`)
    console.log(`   🏠 Rooms: ${rooms.length}`)
    console.log(`   📋 Posts: ${posts.length}`)
    console.log(`   🔧 Amenities: ${SAMPLE_AMENITIES.length}`)
    console.log(`   📍 Distance calculated to: ${REFERENCE_POINT.name}`)

    console.log('\n💡 Test with these room IDs:')
    const sampleRooms = rooms.slice(0, 5)
    sampleRooms.forEach((room, index) => {
      console.log(`   Room ${index + 1}: ID ${room.id} - ${room.title}`)
    })

    console.log('\n🌐 API Test URLs:')
    sampleRooms.forEach(room => {
      console.log(
        `   GET /api/recommendations?roomId=${room.id}&limit=8&method=HYBRID`
      )
    })

    console.log('\n🔥 Frontend Test:')
    console.log(`   useRecommendations(${sampleRooms[0]?.id || 'ROOM_ID'})`)

    console.log('\n🎯 Login info:')
    console.log('   Email: nguyenvana@gmail.com')
    console.log('   Password: 123456')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(error => {
  console.error('❌ Seeding failed:', error)
  process.exit(1)
})
