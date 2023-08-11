const mailer = require("nodemailer");


const sendEmail = async (options)=>{
    // const transporter = mailer.createTransport({
    //     host : process.env.SMPT_HOST,
    //     port:process.env.SMPT_PORT,
    //     auth:{
    //         user : process.env.SMPT_MAIL,
    //         pass : process.env.SMPT_PASSWORD,
    //     },
    // })

    var transport = mailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "691c989e04e91b",
          pass: "c51004dc68804f"
        }
      });
    const mailOptions = {
        from : process.env.SMPT_MAIL,
        to:options.email,
        subject : options.subject,
        text:options.message
    }

    await transport.sendMail(mailOptions)


}

module.exports={sendEmail};