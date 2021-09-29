import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Body,
  UseFilters,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsersMailService } from 'src/mail/users/users-mail.service';
import { PrismaExceptionFilter } from 'src/prisma-exception.filter';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private usersMailService: UsersMailService,
  ) {}

  @Post('register')
  @UseFilters(new PrismaExceptionFilter())
  async registerProfile(
    @Body(new ValidationPipe()) createUserInput: CreateUserDto,
  ) {
    const newUser = await this.usersService.createUser(createUserInput);
    this.usersMailService.sendRegisterConfirmation(newUser);
    return newUser;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProile(@Request() req) {
    return req.user;
  }
}
