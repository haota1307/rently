import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import axios from 'axios'
import { GetTransactionsQueryDTO } from './payment.dto'

@Injectable()
export class PaymentService {
  private readonly baseUrl = 'https://my.sepay.vn/userapi'
  private readonly apiToken =
    'U0GTJGPZW2RYJC55MEYVZAPNRINZHFLEDXAMTSQFB9S07TVOLK7QR1OLII2V48EP'

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    }
  }

  // Get transaction details by ID
  async getTransactionDetails(transactionId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions/details/${transactionId}`,
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error) {
      if (error.response) {
        throw new HttpException(
          error.response.data || 'Error fetching transaction details',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR
        )
      }
      throw new HttpException(
        'Unable to connect to SePay API',
        HttpStatus.SERVICE_UNAVAILABLE
      )
    }
  }

  // Get list of transactions with optional filters
  async getTransactionsList(queryParams: GetTransactionsQueryDTO) {
    try {
      const response = await axios.get(`${this.baseUrl}/transactions/list`, {
        headers: this.getHeaders(),
        params: queryParams,
      })
      return response.data
    } catch (error) {
      if (error.response) {
        throw new HttpException(
          error.response.data || 'Error fetching transactions list',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR
        )
      }
      throw new HttpException(
        'Unable to connect to SePay API',
        HttpStatus.SERVICE_UNAVAILABLE
      )
    }
  }

  // Count transactions with optional filters
  async countTransactions(queryParams: Partial<GetTransactionsQueryDTO>) {
    try {
      const response = await axios.get(`${this.baseUrl}/transactions/count`, {
        headers: this.getHeaders(),
        params: queryParams,
      })
      return response.data
    } catch (error) {
      if (error.response) {
        throw new HttpException(
          error.response.data || 'Error counting transactions',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR
        )
      }
      throw new HttpException(
        'Unable to connect to SePay API',
        HttpStatus.SERVICE_UNAVAILABLE
      )
    }
  }

  // Save transaction to database (could be used for caching or history)
  async saveTransactionToDatabase(transactionData: any) {
    try {
      // Implementation would depend on your database service
      // This is where you'd save the transaction to your local database
      // Example using PrismaService would go here
      return { success: true, message: 'Transaction saved to database' }
    } catch (error) {
      throw new HttpException(
        'Error saving transaction to database',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
