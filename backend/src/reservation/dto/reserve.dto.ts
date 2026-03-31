import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ReserveDto {
  @Type(() => Number)
  @IsInt({ message: 'Concert ID must be a valid number' })
  @Min(1, { message: 'Concert ID is required' })
  concertId!: number;
}
