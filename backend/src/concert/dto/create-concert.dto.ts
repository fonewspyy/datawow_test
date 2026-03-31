import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateConcertDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  description!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalSeats!: number;
}
