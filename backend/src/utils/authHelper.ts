import { Jwt } from '../models/Jwt'
import { createLogger } from "../utils/logger";
import { JwtPayload } from '../models/JwtPayload'
import { APIGatewayProxyEvent } from "aws-lambda";
import { verify, decode } from 'jsonwebtoken'
import * as jwksClient from "jwks-rsa";

const logger = createLogger('authHelper');

const client = jwksClient({ jwksUri : process.env.JWKS_URL });

export async function verifyToken(token: string,secretOrPublicKey: string): Promise<JwtPayload> {
    if (!token)
        throw new Error("Authentiaction header not found");

    if (!secretOrPublicKey)
        throw new Error("secretOrPublicKey not found");
    logger.info("verifyToken:getToken:authHeader:"+token)
    //const token = getToken(authHeader)
    //const jwt: Jwt = decode(token, { complete: true }) as Jwt
    //logger.info("verifyToken:decode:jwt:"+jwt);
    // TODO: Implement token verification
    // You should implement it similarly to how it was implemented for the exercise for the lesson 5
    // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
    logger.info("verifyToken:verify:secretOrPublicKey"+secretOrPublicKey)
    return verify(token,secretOrPublicKey,{ algorithms: ['RS256'] }
    ) as JwtPayload;
}

/**
 * Get a user id from an API Gateway event
 * @param event an event from API Gateway
 *
 * @returns a user id from a JWT token
 */
export function getUserId(event: APIGatewayProxyEvent): string {
    const authorization = event.headers.Authorization
    const jwtToken = getToken(authorization)
    return parseUserId(jwtToken)
}

export function parseJwtToken(authorization: string): string {
    if (!authorization)
        throw new Error('No authentication header')
    if (!authorization.toLowerCase().startsWith('bearer ')){
        logger.error('Invalid header',authorization)
        throw new Error('Invalid authorization header:'+authorization);
    }
    const split = authorization.split(' ')
    logger.info("returning parsed token:"+split[1])
    return split[1]
}

export function getToken(authorization: string): string {
    logger.info("getToken:authorization:"+authorization);
    const jwtToken = parseJwtToken(authorization)
    logger.info("getToken:parseJwtToken:jwtToken"+jwtToken);
    return jwtToken;
}


/**
 * Parse a JWT token and return a user id
 * @param jwtToken JWT token to parse
 * @returns a user id from the JWT token
 */
export function parseUserId(jwtToken: string): string {
    logger.info("parseUserId:jwtToken"+jwtToken)
    const decodedJwt = decode(jwtToken) as JwtPayload
    logger.info("parseUserId:decodedJwt"+decodedJwt)
    return decodedJwt.sub
}


export function decodeJWTToken(jwtToken: string): Jwt {
    if (!jwtToken)
        throw new Error("No jwtToken to decode");

    return decode(jwtToken, {
        complete: true
    }) as Jwt;
}

export function getSigningKey(jwt: Jwt): Promise<jwksClient.SigningKey> {
    return new Promise((resolve, reject) => {
        if (!jwt || !jwt.header) {
            return reject("No JWT token provided to get signing key");
        }
        logger.debug("jwt.header.kid "+jwt.header.kid)
        client.getSigningKey(jwt.header.kid, (err: Error, key: jwksClient.SigningKey) => {
            if (err) {
                logger.error("error occurred when signing error is "+err)
                return reject(err);
            }
            resolve(key);
        });
    });
}