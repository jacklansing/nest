import { User } from '.prisma/client';

export class LoginDto implements Partial<User> {
  email: string;
  password: string;
}
