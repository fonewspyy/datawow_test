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
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'Concert name is required' })
  @MinLength(2, { message: 'Concert name must be at least 2 characters' })
  @MaxLength(120, { message: 'Concert name must be at most 120 characters' })
  name!: string;

  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(1000, { message: 'Description must be at most 1000 characters' })
  description!: string;

  @Type(() => Number)
  @IsInt({ message: 'Total seats must be a whole number' })
  @Min(1, { message: 'Total seats must be at least 1' })
  totalSeats!: number;
}
