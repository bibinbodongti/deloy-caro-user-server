import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { StepsService } from './steps.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('steps')
export class StepsController {
  constructor(private readonly stepsService: StepsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createStepDto: CreateStepDto) {
    return this.stepsService.create(createStepDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.stepsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('matches/:id')
  async findStepOfMatch(@Param('id') matchID) {
    return await this.stepsService.findStepOfMatch(matchID);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stepsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateStepDto: UpdateStepDto) {
    return this.stepsService.update(+id, updateStepDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stepsService.remove(+id);
  }
}
