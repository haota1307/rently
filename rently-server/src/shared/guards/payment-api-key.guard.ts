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
    const paymentAPIKey = request.headers['Authorization']?.split(' ')[1]
    if (paymentAPIKey !== envConfig.PAYMENT_API_KEY) {
      throw new UnauthorizedException('Payment API key không hợp lệ')
    }
    return true
  }
}
