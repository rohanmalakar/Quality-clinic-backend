
import jwt, { JwtPayload } from 'jsonwebtoken'
import {JWT_AUTH_SECRET} from "@utils/contants"
import { Response, NextFunction, RequestHandler } from 'express';
import { Request } from '@customTypes/connection';
import { ERRORS } from '@utils/error';

export const verifyClient: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  let token = req.headers["x-access-token"] as string;
  console.log(token)
  console.log('Header token:', req.headers['x-access-token']);
console.log('Auth header:', req.headers['authorization']);
  if (!token) {
    next(ERRORS.AUTH_NO_TOKEN_FOUND)
    return;
  }

  jwt.verify(token, JWT_AUTH_SECRET, (err, decoded) => {
    console.log(err)
    console.log(decoded)
    if (err || !decoded) {
      next(ERRORS.AUTH_UNAUTHERISED);
      return;
    }
    // @ts-ignore
    req.userID = decoded.id;
    // @ts-ignore
    req.isAdmin = decoded.is_admin;
    next();
  });
};

export const verifyAdmin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  let token = req.headers["x-access-token"] as string;

  if (!token) {
    next(ERRORS.AUTH_NO_TOKEN_FOUND)
    return;
  }

  jwt.verify(token, JWT_AUTH_SECRET, (err, decoded) => {
    if (err || !decoded) {
      next(ERRORS.AUTH_UNAUTHERISED);
      return;
    }
    // @ts-ignore
    if(!decoded.is_admin) {
      next(ERRORS.ADMIN_ONLY_ROUTE)
    }
    // @ts-ignore
    req.userID = decoded.id;
    req.isAdmin = true;
    next();
  });
};

export function decode(token: string): Promise<JwtPayload> {
  return new Promise(function(resolve, reject) {
      try {
        const dec =jwt.verify(token, JWT_AUTH_SECRET);
        if(typeof dec == 'string') {
          reject("We got an string as decoded");
          return;
        }
        resolve(dec);
      } catch(e) {
        reject(e)
      }
  })
}

export const checkUser: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  let token = req.headers["x-access-token"] as string;

  if (!token) {
    req.userID = undefined
  }
  else{
    jwt.verify(token!, JWT_AUTH_SECRET, (err, decoded) => {
      if (err || !decoded) {
        req.userID = undefined
        next()
      }
      // @ts-ignore
      req.userID = decoded.id;
    });
  }
  next();
};
