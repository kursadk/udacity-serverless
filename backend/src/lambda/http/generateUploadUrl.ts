import 'source-map-support/register'
import * as middy from "middy";
import { cors } from "middy/middlewares";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { createLogger } from '../../utils/logger';
import * as AWSXRay from 'aws-xray-sdk'
import * as AWS  from 'aws-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('createTodo');

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const bucketName = process.env.IMAGES_S3_BUCKET

const urlExpiration = parseInt(process.env.URL_EXPIRE, 10)

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const todoId = event.pathParameters.todoId
    logger.info('Generating upload url for todo item ', todoId)

    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const uploadUrl = getUploadUrl(todoId)

    logger.info("upload url is:", uploadUrl)

    return {
      statusCode: 201,
      body: JSON.stringify({
        uploadUrl
      })
    }

  } catch (error) {
    logger.error("Eror in generating upload url:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error
      })
    };
  }
})

handler.use(
  cors({
    origin: "*",
    credentials: true
  })
)

function getUploadUrl(todoId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  })
}
