const nodemailer = require('nodemailer');
const { logger } = require('../config');
module.exports = class MailService {
  constructor({ host, port, user, pass, name }) {
    this.host = host;
    this.port = port;
    this.pass = pass;
    this.user = user;
    this.name = name;

    this.transporter = nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: true, // true for 465, false for other ports. TODO: find better way to work with it
      auth: {
        user: this.user,
        pass: this.pass,
      },
    });

    this.transporter.verify((err, success) => {
      if (err) console.error(err);
      logger.debug('HS-AUTH:: Your config is correct');
    });
  }

  async sendEmail(to, message, subject) {
    const info = await this.transporter.sendMail({
      from: `${this.name} <${this.user}>`,
      to,
      subject: 'No reply: ' + subject,
      html: message,
    });
    return info;
  }
};
