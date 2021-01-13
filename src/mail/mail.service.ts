import { Injectable } from '@nestjs/common';
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const transporter = nodemailer.createTransport({
  // config mail server
  service: 'Gmail',
  auth: {
    user: 'advancedcaro.itus@gmail.com',
    pass: 'qwertyuiop@123456789',
  },
});

@Injectable()
export class MailService {
  constructor() {}
  async SendMail(email: string, subject: string, html: any) {
    // const html = '<p>Bạn vừa thực hiện yêu cầu reset password tại Đăng Khoa Store, nếu đó là bạn: <p><li><a href="http://localhost:3000/users/activate-account-' + token + '"><b>Click here to reset password</b></a></li>'
    const mainOptions = {
      // thiết lập đối tượng, nội dung gửi mail
      from: 'Advanced Caro',
      to: email,
      subject: subject,
      text: 'Advanced Caro',
      html: html,
    };
    transporter.sendMail(mainOptions, function (err, info) {
      if (err) console.log(err);
      else {

      }
    });
  }
}
