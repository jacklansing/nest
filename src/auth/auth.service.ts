import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.user({ email });
    if (!user) return null;
    const passwordMatches = await this.compareHash(user.password, password);
    if (user && passwordMatches) {
      delete user.password;
      return user;
    }
    return null;
  }

  async compareHash(hashedPassword: string, password: string) {
    return argon2.verify(hashedPassword, password);
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
