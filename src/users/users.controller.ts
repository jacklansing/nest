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
import { PrismaExceptionFilter } from 'src/prisma-exception.filter';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('register')
  @UseFilters(new PrismaExceptionFilter())
  registerProfile(@Body(new ValidationPipe()) createUserInput: CreateUserDto) {
    return this.usersService.createUser(createUserInput);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProile(@Request() req) {
    return req.user;
  }
}
