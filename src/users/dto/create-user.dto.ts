import { User } from '.prisma/client';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto implements Partial<User> {
  @IsString()
  @MinLength(3)
  @MaxLength(99)
  firstName: string;

  @IsString()
  @MinLength(3)
  @MaxLength(99)
  lastName: string;

  @IsString()
  @MinLength(4)
  @MaxLength(99)
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  @MaxLength(99)
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\-@$!%*#?&])[A-Za-z\d\-@$!%*#?&]{10,}$/,
    {
      message:
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
    },
  )
  password: string;
}
