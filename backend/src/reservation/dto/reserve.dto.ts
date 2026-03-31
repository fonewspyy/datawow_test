import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ReserveDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  concertId!: number;
}
