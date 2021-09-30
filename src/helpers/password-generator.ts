import { generate } from 'generate-password';

export abstract class PasswordGenerator {
  static complexPassword(): string {
    return generate({
      length: 16,
      numbers: true,
      uppercase: true,
      symbols: true,
    });
  }
}
