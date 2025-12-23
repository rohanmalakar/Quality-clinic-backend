import jwt from 'jsonwebtoken';
import {  JWT_AUTH_SECRET } from '../utils/contants';
var a = jwt.sign({
    id: '1',
    name: 'JohnDoe',
}, JWT_AUTH_SECRET)

console.log(a);
