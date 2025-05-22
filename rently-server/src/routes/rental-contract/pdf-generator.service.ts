import { Injectable } from '@nestjs/common'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import * as fs from 'fs'
import * as path from 'path'
import * as childProcess from 'child_process'
import { getContractHTML } from './contract-template'

@Injectable()
export class PdfGeneratorService {
  async generateContractPdf(
    contract: any,
    landlord: any,
    tenant: any
  ): Promise<Buffer> {
    // Tạo dữ liệu cho template
    const templateData = {
      contract,
      landlord,
      tenant,
      currentDate: format(new Date(), 'dd/MM/yyyy', { locale: vi }),
    }

    // Tạo HTML từ template
    const htmlContent = getContractHTML(templateData)

    // Đường dẫn tạm thời cho file
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const htmlPath = path.join(
      tempDir,
      `contract_${contract.id}_${Date.now()}.html`
    )
    const pdfPath = path.join(
      tempDir,
      `contract_${contract.id}_${Date.now()}.pdf`
    )

    // Ghi nội dung HTML vào file tạm
    fs.writeFileSync(htmlPath, htmlContent, 'utf8')

    try {
      // Sử dụng trình duyệt Chrome headless (thông qua Node.js spawn) để chuyển HTML sang PDF
      // Hoặc sử dụng wkhtmltopdf (cần cài đặt trên server)
      // Đây là giải pháp đơn giản không cần thư viện bên thứ 3, chỉ dựa vào khả năng của Node.js

      // Phương pháp 1: Dùng Chrome headless (nếu Chrome đã được cài đặt)
      await new Promise<void>((resolve, reject) => {
        const chromePath =
          process.platform === 'win32'
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            : process.platform === 'darwin'
              ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
              : '/usr/bin/google-chrome'

        const chromeProcess = childProcess.spawn(chromePath, [
          '--headless',
          '--disable-gpu',
          '--print-to-pdf=' + pdfPath,
          '--no-pdf-header-footer', // Loại bỏ header và footer
          '--print-to-pdf-no-header', // Loại bỏ header
          htmlPath,
        ])

        chromeProcess.on('close', code => {
          if (code !== 0) {
            // Phương pháp thay thế: Nếu Chrome không khả dụng,
            // trả về HTML dạng buffer và để client render
            resolve()
          } else {
            resolve()
          }
        })

        chromeProcess.on('error', err => {
          console.error('Lỗi khi tạo PDF:', err)
          reject(err)
        })
      })

      // Đọc file PDF
      let pdfBuffer: Buffer

      if (fs.existsSync(pdfPath)) {
        pdfBuffer = fs.readFileSync(pdfPath)
      } else {
        // Nếu không tạo được PDF, trả về HTML dạng buffer
        pdfBuffer = Buffer.from(htmlContent)
      }

      // Xóa các file tạm
      try {
        fs.unlinkSync(htmlPath)
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath)
        }
      } catch (err) {
        console.error('Lỗi khi xóa file tạm:', err)
      }

      return pdfBuffer
    } catch (error) {
      console.error('Lỗi khi tạo PDF:', error)

      // Trong trường hợp lỗi, trả về nội dung HTML dạng buffer
      // Client sẽ hiển thị HTML thay vì PDF
      return Buffer.from(htmlContent)
    }
  }
}
