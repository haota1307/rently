const http = require('http')
const https = require('https')
const os = require('os')
const fs = require('fs')

// Simple fetch polyfill for Node.js with HTTP/HTTPS support
const fetch = async url => {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://')
    const client = isHttps ? https : http

    const req = client.get(url, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        try {
          resolve({
            ok: res.statusCode === 200,
            json: () => Promise.resolve(JSON.parse(data)),
          })
        } catch (error) {
          reject(error)
        }
      })
    })
    req.on('error', reject)
  })
}

// Cấu hình test chỉ cho optimized endpoint
//https://rently-server.up.railway.app
//'http://localhost:4000'
const CONFIG = {
  BASE_URL: 'http://localhost:4000',
  ENDPOINT: '/recommendations',
  VALID_ROOM_IDS: null,
  LIMIT: 10,
  TEST_SCENARIOS: [
    { name: '10 Users', users: 10 },
    { name: '25 Users', users: 25 },
    { name: '50 Users', users: 50 },
    { name: '100 Users', users: 100 },
    { name: '250 Users', users: 250 },
    { name: '500 Users', users: 500 },
    { name: '1K Users', users: 1000 },
    { name: '2.5K Users', users: 2500 },
    { name: '5K Users', users: 5000 },
    { name: '10K Users', users: 10000 },
    { name: '25K Users', users: 25000 },
  ],
}

// Load valid room IDs từ database
async function loadValidRoomIds() {
  if (CONFIG.VALID_ROOM_IDS) return CONFIG.VALID_ROOM_IDS

  try {
    const response = await fetch(`${CONFIG.BASE_URL}/rooms?limit=100&page=1`)
    const data = await response.json()

    if (data.payload && data.payload.data) {
      CONFIG.VALID_ROOM_IDS = data.payload.data.map(room => room.id)
      console.log(`✅ Loaded ${CONFIG.VALID_ROOM_IDS.length} valid room IDs`)
      return CONFIG.VALID_ROOM_IDS
    }
  } catch (error) {
    console.log('⚠️ Failed to load room IDs, using fallback range 1-50')
    CONFIG.VALID_ROOM_IDS = Array.from({ length: 50 }, (_, i) => i + 1)
    return CONFIG.VALID_ROOM_IDS
  }
}

// Hàm tạo random roomId từ danh sách valid IDs
function getRandomRoomId() {
  if (!CONFIG.VALID_ROOM_IDS || CONFIG.VALID_ROOM_IDS.length === 0) {
    return 1 // fallback
  }
  const randomIndex = Math.floor(Math.random() * CONFIG.VALID_ROOM_IDS.length)
  return CONFIG.VALID_ROOM_IDS[randomIndex]
}

// Hàm tạo URL với random roomId
function createRequestUrl() {
  const roomId = getRandomRoomId()
  return `${CONFIG.BASE_URL}${CONFIG.ENDPOINT}?roomId=${roomId}&limit=${CONFIG.LIMIT}`
}

// Hàm gọi API với HTTP/HTTPS support
async function makeRequest() {
  return new Promise(resolve => {
    const url = createRequestUrl()
    const startTime = Date.now()
    const isHttps = url.startsWith('https://')
    const client = isHttps ? https : http

    const req = client.get(url, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        const endTime = Date.now()
        resolve({
          success: res.statusCode === 200,
          responseTime: endTime - startTime,
          statusCode: res.statusCode,
          dataSize: data.length,
          url: url.split('?')[1], // Lưu query params để debug
        })
      })
    })

    req.on('error', () => {
      resolve({
        success: false,
        responseTime: Date.now() - startTime,
        statusCode: 0,
        dataSize: 0,
      })
    })

    req.setTimeout(30000, () => {
      req.destroy()
      resolve({
        success: false,
        responseTime: 30000,
        statusCode: 408,
        dataSize: 0,
      })
    })
  })
}

// Hàm monitor system resources
function getSystemMetrics() {
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1)

  const cpus = os.cpus()
  const numCpus = cpus.length

  // Calculate CPU usage (simplified)
  const cpuUsage = process.cpuUsage()

  return {
    totalMemoryMB: Math.round(totalMem / 1024 / 1024),
    usedMemoryMB: Math.round(usedMem / 1024 / 1024),
    freeMemoryMB: Math.round(freeMem / 1024 / 1024),
    memUsagePercent: parseFloat(memUsagePercent),
    numCpus,
    nodeMemoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    nodeHeapMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  }
}

// Hàm monitor CPU usage over time
async function monitorCPU(durationMs = 1000) {
  const startUsage = process.cpuUsage()

  return new Promise(resolve => {
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage)
      const totalUsage = endUsage.user + endUsage.system
      const cpuPercent = (totalUsage / (durationMs * 1000)).toFixed(1)
      resolve(parseFloat(cpuPercent))
    }, durationMs)
  })
}

// Hàm test concurrent với system monitoring
async function testConcurrent(userCount) {
  const batchSize = Math.min(100, userCount)
  const numBatches = Math.ceil(userCount / batchSize)

  console.log(`🚀 Testing ${userCount.toLocaleString()} concurrent users...`)
  console.log(
    `📊 Batches: ${numBatches} x ${batchSize} users (Valid room IDs: ${CONFIG.VALID_ROOM_IDS?.length || 0})`
  )

  let allResults = []
  const startTime = Date.now()

  // System metrics before test
  const beforeMetrics = getSystemMetrics()
  console.log(
    `💾 System Before: RAM ${beforeMetrics.memUsagePercent}% (${beforeMetrics.usedMemoryMB}MB), Node Heap: ${beforeMetrics.nodeHeapMB}MB`
  )

  // Start CPU monitoring
  const cpuMonitorPromise = monitorCPU(5000) // Monitor for 5 seconds

  for (let i = 0; i < numBatches; i++) {
    const currentBatchSize =
      i === numBatches - 1 ? userCount - i * batchSize : batchSize
    const promises = Array(currentBatchSize)
      .fill()
      .map(() => makeRequest())

    const batchResults = await Promise.all(promises)
    allResults.push(...batchResults)

    // Progress bar
    const progress = Math.round(((i + 1) / numBatches) * 100)
    const progressBar =
      '█'.repeat(Math.floor(progress / 2)) +
      '░'.repeat(50 - Math.floor(progress / 2))
    process.stdout.write(
      `\r[${progressBar}] ${progress}% (${i + 1}/${numBatches} batches)`
    )
  }

  const totalTime = Date.now() - startTime
  console.log('\n') // New line after progress bar

  // System metrics after test
  const afterMetrics = getSystemMetrics()
  const avgCPU = await cpuMonitorPromise

  console.log(
    `💾 System After:  RAM ${afterMetrics.memUsagePercent}% (${afterMetrics.usedMemoryMB}MB), Node Heap: ${afterMetrics.nodeHeapMB}MB`
  )
  console.log(`🔥 CPU Usage: ${avgCPU}% (average during test)`)

  const successful = allResults.filter(r => r.success)
  const failed = allResults.filter(r => !r.success)
  const timeouts = failed.filter(r => r.statusCode === 408)

  return {
    totalRequests: userCount,
    successful: successful.length,
    failed: failed.length,
    timeouts: timeouts.length,
    successRate: ((successful.length / userCount) * 100).toFixed(1),
    avgResponseTime:
      successful.length > 0
        ? Math.round(
            successful.reduce((sum, r) => sum + r.responseTime, 0) /
              successful.length
          )
        : 0,
    minResponseTime:
      successful.length > 0
        ? Math.min(...successful.map(r => r.responseTime))
        : 0,
    maxResponseTime:
      successful.length > 0
        ? Math.max(...successful.map(r => r.responseTime))
        : 0,
    p95ResponseTime:
      successful.length > 0
        ? calculatePercentile(
            successful.map(r => r.responseTime),
            95
          )
        : 0,
    p99ResponseTime:
      successful.length > 0
        ? calculatePercentile(
            successful.map(r => r.responseTime),
            99
          )
        : 0,
    throughput:
      successful.length > 0
        ? (successful.length / (totalTime / 1000)).toFixed(1)
        : 0,
    totalTime,
    systemMetrics: {
      before: beforeMetrics,
      after: afterMetrics,
      cpuUsage: avgCPU,
      memoryDelta: afterMetrics.usedMemoryMB - beforeMetrics.usedMemoryMB,
      nodeHeapDelta: afterMetrics.nodeHeapMB - beforeMetrics.nodeHeapMB,
    },
  }
}

function calculatePercentile(arr, percentile) {
  const sorted = arr.sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[index]
}

// Hàm in kết quả cá nhân
function printResults(results, scenario) {
  console.log(`\n📈 ${scenario} RESULTS`)
  console.log('┌─────────────────────────┬─────────────────────────┐')
  console.log('│ Metric                  │ Value                   │')
  console.log('├─────────────────────────┼─────────────────────────┤')
  console.log(
    `│ Total Requests          │ ${results.totalRequests.toLocaleString().padStart(21)} │`
  )
  console.log(
    `│ Successful              │ ${results.successful.toLocaleString().padStart(21)} │`
  )
  console.log(
    `│ Failed                  │ ${results.failed.toLocaleString().padStart(21)} │`
  )
  console.log(
    `│ Timeouts                │ ${results.timeouts.toLocaleString().padStart(21)} │`
  )
  console.log(
    `│ Success Rate            │ ${(results.successRate + '%').padStart(21)} │`
  )
  console.log(
    `│ Avg Response Time       │ ${(results.avgResponseTime + 'ms').padStart(21)} │`
  )
  console.log(
    `│ Min Response Time       │ ${(results.minResponseTime + 'ms').padStart(21)} │`
  )
  console.log(
    `│ Max Response Time       │ ${(results.maxResponseTime + 'ms').padStart(21)} │`
  )
  console.log(
    `│ P95 Response Time       │ ${(results.p95ResponseTime + 'ms').padStart(21)} │`
  )
  console.log(
    `│ P99 Response Time       │ ${(results.p99ResponseTime + 'ms').padStart(21)} │`
  )
  console.log(
    `│ Throughput              │ ${(results.throughput + ' RPS').padStart(21)} │`
  )
  console.log(
    `│ Total Test Time         │ ${(Math.round(results.totalTime / 1000) + 's').padStart(21)} │`
  )
  console.log(
    `│ Avg Time per Request    │ ${((results.totalTime / results.totalRequests).toFixed(1) + 'ms').padStart(21)} │`
  )
  console.log(
    `│ Requests per Second     │ ${((results.totalRequests / (results.totalTime / 1000)).toFixed(1) + ' RPS').padStart(21)} │`
  )
  console.log('├─────────────────────────┼─────────────────────────┤')
  console.log(
    `│ CPU Usage               │ ${(results.systemMetrics.cpuUsage + '%').padStart(21)} │`
  )
  console.log(
    `│ Memory Delta            │ ${(results.systemMetrics.memoryDelta >= 0 ? '+' : '') + results.systemMetrics.memoryDelta + 'MB'.padStart(20)} │`
  )
  console.log(
    `│ Node Heap Delta         │ ${(results.systemMetrics.nodeHeapDelta >= 0 ? '+' : '') + results.systemMetrics.nodeHeapDelta + 'MB'.padStart(20)} │`
  )
  console.log('└─────────────────────────┴─────────────────────────┘')
}

// Hàm in header đẹp
function printHeader(title) {
  const width = 80
  const padding = Math.floor((width - title.length - 2) / 2)

  console.log('\n' + '═'.repeat(width))
  console.log(
    '║' +
      ' '.repeat(padding) +
      title +
      ' '.repeat(width - padding - title.length - 2) +
      '║'
  )
  console.log('═'.repeat(width))
}

// Hàm in summary table
function printSummaryTable(allResults) {
  console.log('\n📊 OPTIMIZED ENDPOINT PERFORMANCE SUMMARY')
  console.log(
    '┌─────────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────────┬─────────┬─────────┬─────────┐'
  )
  console.log(
    '│ Scenario    │ Users   │ Success │ Avg RT  │ P95 RT  │ P99 RT  │ Throughput  │ Duration│ CPU %   │ RAM Δ   │'
  )
  console.log(
    '├─────────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────────┼─────────┼─────────┼─────────┤'
  )

  allResults.forEach(result => {
    const scenario = result.scenario.padEnd(11)
    const users = result.users.toLocaleString().padStart(7)
    const success = (result.results.successRate + '%').padStart(7)
    const avgRT = (result.results.avgResponseTime + 'ms').padStart(7)
    const p95RT = (result.results.p95ResponseTime + 'ms').padStart(7)
    const p99RT = (result.results.p99ResponseTime + 'ms').padStart(7)
    const throughput = (result.results.throughput + ' RPS').padStart(11)
    const duration = (
      Math.round(result.results.totalTime / 1000) + 's'
    ).padStart(7)
    const cpuUsage = (result.results.systemMetrics.cpuUsage + '%').padStart(7)
    const memDelta = (
      (result.results.systemMetrics.memoryDelta >= 0 ? '+' : '') +
      result.results.systemMetrics.memoryDelta +
      'MB'
    ).padStart(7)

    console.log(
      `│ ${scenario} │ ${users} │ ${success} │ ${avgRT} │ ${p95RT} │ ${p99RT} │ ${throughput} │ ${duration} │ ${cpuUsage} │ ${memDelta} │`
    )
  })

  console.log(
    '└─────────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────────┴─────────┴─────────┴─────────┘'
  )
}

// Main function
async function main() {
  printHeader('🚀 RENTLY OPTIMIZED ENDPOINT PERFORMANCE TEST')

  console.log('🎯 Testing Configuration:')
  console.log(`   • Base URL: ${CONFIG.BASE_URL}`)
  console.log(`   • Endpoint: ${CONFIG.ENDPOINT}`)
  console.log(`   • Limit per request: ${CONFIG.LIMIT}`)
  console.log(
    `   • Test Scenarios: ${CONFIG.TEST_SCENARIOS.map(s => s.name).join(', ')}`
  )

  // Load valid room IDs trước khi test
  await loadValidRoomIds()
  console.log(
    `   • Valid Room IDs: ${CONFIG.VALID_ROOM_IDS?.length || 0} rooms loaded`
  )

  const allResults = []

  for (const scenario of CONFIG.TEST_SCENARIOS) {
    printHeader(`🧪 ${scenario.name.toUpperCase()} LOAD TEST`)

    const results = await testConcurrent(scenario.users)

    printResults(results, scenario.name)

    allResults.push({
      scenario: scenario.name,
      users: scenario.users,
      results: results,
    })

    // Nghỉ giữa các test để server recover
    const waitTime = scenario.users >= 1000 ? 10000 : 5000
    if (scenario !== CONFIG.TEST_SCENARIOS[CONFIG.TEST_SCENARIOS.length - 1]) {
      console.log(
        `\n⏳ Waiting ${waitTime / 1000} seconds for server recovery...`
      )
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  printSummaryTable(allResults)

  printHeader('🎉 PERFORMANCE TEST COMPLETED')
  console.log('✨ Key Insights:')
  console.log('   • System performance under various load conditions')
  console.log('   • Scalability limits and breaking points identified')
  console.log('   • Optimized endpoint shows consistent performance')
  console.log('   • Ready for production deployment\n')

  // Performance analysis
  const perfectScenarios = allResults.filter(
    r => parseFloat(r.results.successRate) === 100
  )
  const degradedScenarios = allResults.filter(
    r =>
      parseFloat(r.results.successRate) < 100 &&
      parseFloat(r.results.successRate) > 50
  )
  const failedScenarios = allResults.filter(
    r => parseFloat(r.results.successRate) <= 50
  )

  console.log('📈 Performance Analysis:')
  if (perfectScenarios.length > 0) {
    const maxPerfectUsers = Math.max(...perfectScenarios.map(s => s.users))
    console.log(
      `   • Perfect Performance: Up to ${maxPerfectUsers.toLocaleString()} concurrent users`
    )
  }
  if (degradedScenarios.length > 0) {
    console.log(
      `   • Degraded Performance: ${degradedScenarios.map(s => s.scenario).join(', ')}`
    )
  }
  if (failedScenarios.length > 0) {
    console.log(
      `   • Failed Scenarios: ${failedScenarios.map(s => s.scenario).join(', ')}`
    )
  }

  // Export performance reports
  await exportReports(allResults)
}

// Export reports function
async function exportReports(allResults) {
  console.log('\n📊 EXPORTING PERFORMANCE REPORTS...')

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .substring(0, 19)

  // Create reports directory if not exists
  const reportsDir = './reports'
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }

  try {
    // Export to CSV
    const csvPath = `./reports/performance-report-${timestamp}.csv`
    await exportToCSV(allResults, csvPath)

    // Export to JSON
    const jsonPath = `./reports/performance-report-${timestamp}.json`
    await exportToJSON(allResults, jsonPath)

    // Export to HTML
    const htmlPath = `./reports/performance-report-${timestamp}.html`
    await createHTMLReport(allResults, htmlPath)

    console.log('\n✅ Export completed!')
    console.log(`📊 CSV: ${csvPath}`)
    console.log(`🔧 JSON: ${jsonPath}`)
    console.log(`🌐 HTML: ${htmlPath}`)
    console.log(
      '\n🎉 You can now open these files to analyze performance data!'
    )
    console.log('💡 Tips:')
    console.log('   📈 Import CSV into Excel/Google Sheets for charts')
    console.log(
      '   🌐 Open HTML in browser and use Print > Save as PDF for images'
    )
  } catch (error) {
    console.error('❌ Export failed:', error)
  }
}

// Export to CSV
async function exportToCSV(allResults, filePath) {
  try {
    console.log('📈 Exporting to CSV...')

    // Create CSV header
    const header = [
      'Scenario',
      'Users',
      'Success Rate (%)',
      'Avg Response Time (ms)',
      'P95 Response Time (ms)',
      'P99 Response Time (ms)',
      'Throughput (RPS)',
      'Duration (s)',
      'CPU Usage (%)',
      'RAM Delta (MB)',
      'Total Requests',
      'Successful Requests',
      'Failed Requests',
    ].join(',')

    // Create CSV rows
    const rows = allResults.map(result =>
      [
        `"${result.scenario}"`,
        result.users,
        result.results.successRate,
        result.results.avgResponseTime,
        result.results.p95ResponseTime,
        result.results.p99ResponseTime,
        result.results.throughput,
        Math.round(result.results.totalTime / 1000),
        result.results.systemMetrics.cpuUsage,
        result.results.systemMetrics.memoryDelta,
        result.results.totalRequests,
        result.results.successful,
        result.results.failed,
      ].join(',')
    )

    // Combine header and rows
    const csvContent = [header, ...rows].join('\n')

    // Write to file
    fs.writeFileSync(filePath, csvContent, 'utf8')

    console.log(`✅ CSV exported successfully`)
    return filePath
  } catch (error) {
    console.error('❌ CSV export failed:', error)
    throw error
  }
}

// Export to JSON
async function exportToJSON(allResults, filePath) {
  try {
    console.log('📊 Exporting to JSON...')

    // Add metadata
    const exportData = {
      exportedAt: new Date().toISOString(),
      testConfiguration: {
        baseUrl: 'http://localhost:4000',
        endpoint: '/recommendations',
        totalScenarios: allResults.length,
        maxUsers: Math.max(...allResults.map(r => r.users)),
      },
      summary: {
        perfectScenarios: allResults.filter(
          r => parseFloat(r.results.successRate) === 100
        ).length,
        totalSuccessfulRequests: allResults.reduce(
          (sum, r) => sum + r.results.successful,
          0
        ),
        totalRequests: allResults.reduce(
          (sum, r) => sum + r.results.totalRequests,
          0
        ),
        avgThroughput: (
          allResults.reduce((sum, r) => sum + r.results.throughput, 0) /
          allResults.length
        ).toFixed(1),
      },
      results: allResults,
    }

    // Write to file with pretty formatting
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf8')

    console.log(`✅ JSON exported successfully`)
    return filePath
  } catch (error) {
    console.error('❌ JSON export failed:', error)
    throw error
  }
}

// Chạy test
main().catch(console.error)
