import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'username must be a string' })
  @IsNotEmpty({ message: 'Username is required' })
  username!: string;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}
