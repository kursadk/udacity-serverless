import 'source-map-support/register'
import * as middy from "middy";
import { cors } from "middy/middlewares";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { createLogger } from '../../utils/logger';
import { getTodos } from '../../businessLogic/todos';

const logger = createLogger('createTodo');

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Getting todo items ',event)
  const todos = await getTodos(event);

  return {
    statusCode: 200,
    body: JSON.stringify({
      items: todos
    })
  };
});

handler.use(
  cors({
    origin: "*"
  })
)