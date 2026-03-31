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
import { ConcertService } from './concert.service';
import { CreateConcertDto } from './dto/create-concert.dto';

@Controller('concerts')
export class ConcertController {
  constructor(private readonly concertService: ConcertService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.concertService.findAll(user.sub);
  }

  @Roles('ADMIN')
  @Get('stats')
  stats() {
    return this.concertService.stats();
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateConcertDto) {
    return this.concertService.create(dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.concertService.remove(id);
  }
}
