
// const paytabs = require('paytabs_pt2');

// const profileID = process.env.PAYTABS_PROFILE_ID;
// const serverKey = process.env.PAYTABS_SERVER_KEY;
// const region = process.env.PAYTABS_REGION;

// paytabs.setConfig(profileID, serverKey, region);

// // module.exports = paytabs;
// export default paytabs;


const paytabs = require('paytabs_pt2');
// import dotenv from "dotenv";
// dotenv.config();

const profileID = process.env.PAYTABS_ENV === 'sandbox' ? process.env.TEST_PAYTABS_PROFILE_ID : process.env.PAYTABS_PROFILE_ID;
const serverKey = process.env.PAYTABS_ENV === 'sandbox' ? process.env.TEST_PAYTABS_SERVER_KEY : process.env.PAYTABS_SERVER_KEY;

console.log("@@@@@@@@@", profileID, serverKey);

// const profileID = process.env.PAYTABS_PROFILE_ID!;
// const serverKey = process.env.PAYTABS_SERVER_KEY!;
const region = process.env.PAYTABS_REGION!;

paytabs.setConfig(profileID, serverKey, region);

export default paytabs;