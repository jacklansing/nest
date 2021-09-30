import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, VerifyCallback } from 'passport-google-oauth20';
import { Strategy } from 'passport-google-oauth20';
import { UsersService } from 'src/users/users.service';
import { googleAuthConstants } from './constants';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      clientID: googleAuthConstants.clientID,
      clientSecret: googleAuthConstants.clientSecret,
      callbackURL: googleAuthConstants.callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const user = await this.usersService.findOrCreateFromPassportProfile(
      profile,
    );
    done(null, { ...user, accessToken });
  }
}
