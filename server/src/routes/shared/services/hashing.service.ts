import { Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';

const saltRounds = 10;

@Injectable()
export class HashingService {
  hash(value: string) {
    return hash(value, saltRounds);
  }

  compare(value: string, hash: string) {
    return this.compare(value, hash);
  }
}
