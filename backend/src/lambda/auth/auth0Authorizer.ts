import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../models/JwtPayload';
import { decodeJWTToken ,getSigningKey, verifyToken } from '../../utils/authHelper';

const logger = createLogger('auth0Authorizer')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
//const jwksUrl = process.env.JWKS_URL

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  
  try {
    const authToken = event.authorizationToken

    logger.info('Authorizing a user', authToken)

    const jwtToken = await tokenVerification(authToken)

    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
};

const tokenVerification = (authHeader: string): Promise<JwtPayload> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!authHeader)
        throw new Error('tokenVerification No authentication header')
      if (!authHeader.toLowerCase().startsWith('bearer ')){
          logger.error('tokenVerification Invalid header',authHeader)
          throw new Error('tokenVerification Invalid authorization header:'+authHeader);
      }
      const split = authHeader.split(' ')
      logger.info("parsed token:"+split[1])
      const token = split[1]
      logger.info("decoding token "+token)
      const decodedToken = decodeJWTToken(token);
      logger.info("decodedToken token "+decodedToken)
      const signingKey = await getSigningKey(decodedToken);
      logger.info("signingKey "+signingKey)
      const payload = verifyToken(token,signingKey.getPublicKey());
      logger.info("tokenVerification:payload:"+payload)
      resolve(payload);
    } catch (error) {
      reject(error);
    }
  });
};

