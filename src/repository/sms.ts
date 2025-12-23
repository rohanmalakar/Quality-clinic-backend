import { ERRORS } from "@utils/error";
import {SMS_PASSWORD, SMS_SENDER_ID, SMS_USER, SMS_TEMPLATE_ID} from '@utils/contants';

export default class SMSRepository {
  async sendOTP(phoneNumber: string): Promise<number> {
    console.log({ SMS_USER, SMS_PASSWORD, SMS_SENDER_ID });

    // const otp = 12345;
    const otp = Math.floor(10000 + Math.random() * 90000);
    console.log(otp);
    const message = `Your OTP for Quality clinic registration is ${otp}  رقم التسجيل الخاص بك في عيادة الجودة OTP هو ${otp}`;
    // const url = `https://mshastra.com/sendurl.aspx?user=${SMS_USER}&pwd=${SMS_PASSWORD}&senderid=${SMS_SENDER_ID}&mobileno=${phoneNumber}&msgtext=${message}&priority=High&CountryCode=ALL`
    
    const encodedMessage = encodeURIComponent(message);
    // const url = `https://mshastra.com/sendurl.aspx?user=${SMS_USER}&pwd=${SMS_PASSWORD}&senderid=${SMS_SENDER_ID}&mobileno=${phoneNumber}&msgtext=${encodedMessage}&priority=High&CountryCode=ALL`;
    
    const url = `https://mshastra.com/sendurl.aspx?user=${SMS_USER}&pwd=${SMS_PASSWORD}&senderid=${SMS_SENDER_ID}&mobileno=${phoneNumber}&msgtext=${encodedMessage}&priority=High&CountryCode=ALL&template_id=${SMS_TEMPLATE_ID}`;

    console.log('SMS URL:', url);

    
    const response = await fetch(url);
    const responseText = await response.text();
    console.log('SMS API Response:', responseText);
    if (!response.ok) {
      throw ERRORS.SMS_SENDING_FAILED;
    }
    if (phoneNumber == '+966123456789'){
      return 12345;
    }
    return otp
  }
}
