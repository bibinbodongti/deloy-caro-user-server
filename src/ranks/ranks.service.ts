import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { getRepository } from 'typeorm';

import { CreateRankDto } from './dto/create-rank.dto';
import { UpdateRankDto } from './dto/update-rank.dto';
import { Rank } from './rank.entity';

@Injectable()
export class RanksService {
  constructor(
    @InjectRepository(Rank)
    private ranksRepository: Repository<Rank>,
  ) {}

  async create(createRankDto: CreateRankDto): Promise<Rank> {
    return await this.ranksRepository.save(createRankDto);
  }

  async findAll() {
    return await this.ranksRepository.find();
  }

  async findOne(id: number) {
    return await this.ranksRepository.findOne(id);
  }

  async findOneByQuery(cup: number): Promise<Rank> {
    const rank = await getRepository(Rank)
      .createQueryBuilder('rank')
      .where('rank.minCup <= :cup AND rank.maxCup >= :cup', { cup: cup })
      .getOne();
    return rank;
  }

  async update(id: number, updateRankDto: UpdateRankDto): Promise<Rank> {
    const toUpdate = await this.ranksRepository.findOne(id);

    const updated = Object.assign(toUpdate, updateRankDto);
    return await this.ranksRepository.save(updated);
  }

  async remove(id: number): Promise<DeleteResult> {
    return await this.ranksRepository.delete(id);
  }
}
