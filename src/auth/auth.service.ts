import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserData } from 'src/users/users.interface';
import { userRoles } from './constants';
import * as bcrypt from 'bcryptjs';
const fetch = require('node-fetch');
const { OAuth2Client } = require('google-auth-library');

import { ID_CLIENT_GG, API_KEY_GUN, DOMAIN } from './constants';
import { MailService } from 'src/mail/mail.service';
const client = new OAuth2Client(ID_CLIENT_GG);

////config mail api with mailgun
// const api_key = API_KEY_GUN;
// const domain = DOMAIN;
// var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserData> {
    const user = await this.usersService.findOneByUsername(email);
    if (
      user &&
      bcrypt.compareSync(password, user.password) &&
      user.role === userRoles.user &&
      user.isActive === true && user.status===true
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: UserData) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async loginWithGoogle(access_token: string) {
    const result = await client.verifyIdToken({
      idToken: access_token,
      audience: ID_CLIENT_GG,
    });
    if (result.payload.email_verified) {
      const user = await this.usersService.findOneByEmail(
        result.payload.email,
      );
      if (user) {
        if(user.status) return this.login(user);
        else return null;
      } else {
        await this.usersService.create({
          username: result.payload.email,
          name: result.payload.family_name + result.payload.given_name,
          password: access_token,
          email: result.payload.email,
        });
        const newAccount = await this.usersService.findOneByUsername(
          result.payload.email,
        );
        return await this.login(newAccount);
      }
    }
  }
  async loginWithFacebook(access_token: string, userID: string) {
    const urlGraphFacebook =
      'https://graph.facebook.com/v2.11/' +
      userID +
      '/?fields=id,name,email&access_token=' +
      access_token;
    const result = await fetch(urlGraphFacebook, {
      method: 'GET',
    });
    const resultJson = await result.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email, name } = resultJson;
    const user = await this.usersService.findOneByEmail(email);

    if (user !== null) {
      if(user.status) return await this.login(user);
      else  return null;
    } else {
      //create new account
      await this.usersService.create({
        username: email,
        name: email,
        password: access_token,
        email: email,
      });
      const newAccount = await this.usersService.findOneByUsername(email);
      return await this.login(newAccount);
    }
  }
  async FindAccount(email: string) {
    // let data = {
    //   from: 'bibinkhoa@gmail.com',
    //   to: 'phanmdangdangkhoa2802@gmail.com',
    //   subject: 'Hello API mail gun',
    //   text: 'Testing some Mailgun awesomeness!'
    // };
    // mailgun.messages().send(data, function (error, body) {
    //   console.log(error);
    //   return body;
    // });
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      if (user.isActive === false)
        return {
          err:
            'Tài khoản của bạn chưa được kích hoạt. Vui lòng kích hoạt tài khoản',
        };
      const token = this.jwtService.sign({ sub: user.id });
      const html =
        '<p>Bạn vừa thực hiện yêu cầu reset password tại Advanced caro của Khoa Huy Hưng, nếu đó là bạn : <p><li><a href="http://localhost:3001/resetpassword/' +
        token +
        '"><b>Nhấn vào đây để lấy lại mật khẩu</b></a></li>';
      // Vì mail api free nên vui lòng k test với tần suất cao để k bị gg khóa tài khoản hoặc mail bị chuyển vào quảng cáo, mất công tạo lại
      //return "Truy cập http://localhost:3001/resetpassword/"+token+ ' để tìm lại mật khẩu'; //comment dòng này để test
      this.mailService.SendMail(
        email,
        '[Advanced Caro] - Xác nhận lấy lại mật khẩu',
        html,
      ); //mở dòng này để test
      return 'Gửi yêu cầu thành công. Vui lòng kiểm tra mail để xác thực lấy lại mật khẩu.';
    }
  }
  async ResetPassword(idUser: number, newPassword: string) {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashPassword = bcrypt.hashSync(newPassword, salt);
    const res = await this.usersService.update(idUser, {
      password: hashPassword,
    });
    if (res) return true;
    else return false;
  }
}
