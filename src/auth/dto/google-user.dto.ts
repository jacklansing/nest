import { User } from '.prisma/client';

export class GoogleUserDto implements User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  accessToken: string;
  isNew: boolean;
}
