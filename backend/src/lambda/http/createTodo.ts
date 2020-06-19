import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { createLogger } from '../../utils/logger';
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import * as middy from "middy";
import { cors } from "middy/middlewares";
import { createTodo } from '../../businessLogic/todos';

const logger = createLogger('createTodo');

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  logger.info('Creating new item ',newTodo)
  const item = await createTodo(newTodo, event);
  // TODO: Implement creating a new TODO item
  return {
    statusCode: 201,
    body: JSON.stringify({
      item
    })
  };
});

handler.use(
  cors({
    origin: "*",
    credentials: true
  })
)