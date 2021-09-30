export const jwtConstants = {
  secret: process.env.JWT_SECRET,
  expiry: process.env.JWT_EXPIRY,
};

export const googleAuthConstants = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
};
