import { Injectable } from '@nestjs/common';
// import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, getRepository, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { RanksService } from '../ranks/ranks.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly ranksService: RanksService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<any> {
    const { username, name, password, email } = createUserDto;
    const queryBuilder = getRepository(User)
      .createQueryBuilder('user')
      .where('user.username = :username', { username });
    const queryBuilderCheckEmail = getRepository(User)
      .createQueryBuilder('user')
      .where('user.email = :email AND user.isActive=1', { email });
    const user = await queryBuilder.getOne();
    const userTemp = await queryBuilderCheckEmail.getOne();
    if (user) {
      return { err: 'Username đã được sử dụng' };
    }
    if (userTemp) {
      return { err: 'Email đã được sử dụng' };
    }
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashPassword = bcrypt.hashSync(password, salt);
    const token = this.jwtService.sign({ email: email });
    const newUser = new User();
    newUser.username = username;
    newUser.password = hashPassword;
    newUser.email = email;
    newUser.name = name;
    newUser.token = token;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const savedUser = await this.usersRepository.save(newUser);
    const html =
      '<p>Bạn vừa thực hiện yêu cầu đăng ký tài khoản tại Advanced caro của Khoa Huy Hưng, nếu đó là bạn : <p><li><a href="http://localhost:3001/active/' +
      token +
      '"><b>Nhấn vào đây để kích hoạt tài khoản</b></a></li>';
    // Vì mail api free nên vui lòng k test với tần suất cao để k bị gg khóa tài khoản hoặc mail bị chuyển vào quảng cáo, mất công tạo lại
    //return "Đăng ký thành công. Truy cập http://localhost:3000/active/" + token + ' kích hoạt tài khoản'; //comment dòng này để test
    this.mailService.SendMail(
      email,
      '[Advanced Caro] - Kích hoạt tài khoản',
      html,
    ); //mở dòng này để test
    return 'Đăng ký thành công. Kiểm tra email để tiến hành kích hoạt tài khoản';
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findOneById(id: number): Promise<User> {
    const result = await this.usersRepository.findOne(id);
    return result;
  }

  async findOneByToken(token: string): Promise<User> {
    return await this.usersRepository.findOne({ token });
  }

  async findOneByUsername(username: string): Promise<User> {
    return await this.usersRepository.findOne({ username });
  }

  async findOneByEmail(email: string): Promise<User> {
    return await this.usersRepository.findOne({ email });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const toUpdate = await this.usersRepository.findOne(id);

    const updated = Object.assign(toUpdate, updateUserDto);
    return await this.usersRepository.save(updated);
  }

  async ChangePassword(
    id: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<any> {
    const user = await this.findOneById(id);
    if (user) {
      if (bcrypt.compareSync(oldPassword, user.password)) {
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashPassword = bcrypt.hashSync(newPassword, salt);
        const res = await this.update(id, {
          password: hashPassword,
        });
        if (res) return true;
        else return false;
      }
    }
  }

  async remove(id: number): Promise<DeleteResult> {
    return await this.usersRepository.delete(id);
  }

  async getOnlineUsers(userIDs: Array<number>, userHost) {
    if (userIDs.length === 0) return [];

    const usernames = await this.usersRepository
      .createQueryBuilder('user')
      .select(['user.username'])
      .where('user.id IN (:...ids) AND user.id != :idHost', {
        ids: userIDs,
        idHost: userHost.id,
      })
      .getMany();

    return usernames;
  }

  async getViewers(userIDs: Array<number>) {
    if (userIDs.length === 0) return [];

    const usernames = await this.usersRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.cup'])
      .where('user.id IN (:...ids)', { ids: userIDs })
      .getMany();

    return usernames;
  }

  async plusCup(userID:number, cups: number) {
    const user = await this.usersRepository.findOne({ id: userID });
    user.cup = user.cup + cups < 0 ? 0 : user.cup + cups;
    this.usersRepository.save(user);
  }

  async getSuitableUserIndex(
    requestUserId: number,
    userPlayNowQueue: number[],
  ): Promise<number> {
    const requestUser = await this.findOneById(requestUserId);
    let suitableUserIndex = -1;
    let i = 0;
    const DIFF_CUP = 50;
    for await (const userId of userPlayNowQueue) {
      const user = await this.findOneById(userId);
      if (Math.abs(requestUser.cup - user.cup) < DIFF_CUP) {
        suitableUserIndex = i;
      }
      i++;
    }
    return suitableUserIndex;
  }
  async plusCountMatch(userID) {
    const user = await this.usersRepository.findOne({ id: userID });
    user.countMatch = Number(user.countMatch) + 1;
    this.usersRepository.save(user);
  }
}
