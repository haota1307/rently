import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import envConfig from 'src/shared/config'
@Injectable()
export class PaymentAPIKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers['authorization']

    if (!authHeader) {
      throw new UnauthorizedException('Payment API key không được cung cấp')
    }

    // Kiểm tra nếu header có định dạng "Apikey API_KEY_CUA_BAN"
    const apiKeyMatch = authHeader.match(/^Apikey\s+(.+)$/i)

    if (!apiKeyMatch) {
      throw new UnauthorizedException('Payment API key không đúng định dạng')
    }

    const paymentAPIKey = apiKeyMatch[1]

    if (paymentAPIKey !== envConfig.PAYMENT_API_KEY) {
      throw new UnauthorizedException('Payment API key không hợp lệ')
    }
    return true
  }
}
