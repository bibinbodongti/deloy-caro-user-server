import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { Step } from './entities/step.entity';

@Injectable()
export class StepsService {
  constructor(
    @InjectRepository(Step)
    private stepsRepository: Repository<Step>,
  ) { }

  async create(createStepDto: CreateStepDto): Promise<Step> {
    return await this.stepsRepository.save(createStepDto);
  }

  async createStep(position, time, matchID, userID) {
    const newStep = new Step();
    newStep.position = position;
    newStep.time = time;
    newStep.match = matchID;
    newStep.user = userID;

    return await this.stepsRepository.save(newStep);
  }

  async findAll(): Promise<Step[]> {
    return await this.stepsRepository.find();
  }

  async findStepOfMatch(matchID) {
    return await this.stepsRepository.query(`
    SELECT * 
    FROM advancedcaro.step as s
    where s.matchId = ${matchID}
    ORDER BY s.time ASC`);
  }

  async findOne(id: number): Promise<Step> {
    return await this.findOne(id);
  }

  async update(id: number, updateStepDto: UpdateStepDto): Promise<Step> {
    const toUpdate = await this.stepsRepository.findOne(id);

    const updated = Object.assign(toUpdate, updateStepDto);
    return await this.stepsRepository.save(updated);
  }

  async remove(id: number): Promise<DeleteResult> {
    return await this.stepsRepository.delete(id);
  }
}
