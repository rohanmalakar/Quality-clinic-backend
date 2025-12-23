import bcrypt from 'bcryptjs';
const input_pass= '1799@Gurgaon'
function hashPassword() {
    try{
        console.log(bcrypt.hashSync(input_pass, 8))
    } catch (e) {
        console.log(e)
    }
}
hashPassword()