import { IsString, IsNotEmpty } from 'class-validator';

export class UserLoginDto {
  @IsNotEmpty()
  username: string; // Change from username to email

  @IsNotEmpty()
  password: string;
}
