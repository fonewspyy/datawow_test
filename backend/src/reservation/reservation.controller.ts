import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { ReserveDto } from './dto/reserve.dto';
import { ReservationService } from './reservation.service';

@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  reserve(@CurrentUser() user: JwtPayload, @Body() dto: ReserveDto) {
    return this.reservationService.reserve(user.sub, dto.concertId);
  }

  @Delete(':concertId')
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('concertId', ParseIntPipe) concertId: number,
  ) {
    return this.reservationService.cancel(user.sub, concertId);
  }

  @Get('history')
  history(@CurrentUser() user: JwtPayload) {
    return this.reservationService.history(user.sub);
  }

  @Roles('ADMIN')
  @Get('history/all')
  allHistory() {
    return this.reservationService.allHistory();
  }
}