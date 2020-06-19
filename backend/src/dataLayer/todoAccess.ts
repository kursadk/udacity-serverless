import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem';
import { TodoUpdate } from '../models/TodoUpdate';
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import { createLogger } from "../utils/logger";

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('todoAccess');

export class TodoAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todosTableIndex = process.env.TODOS_TABLE_INDEX) {
    }

    async getTodos(userId: string): Promise<TodoItem[]> {
        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todosTableIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()
        return result.Items as TodoItem[]
    }

    async getTodo(todoId: string, userId: string): Promise<TodoItem> {
        const todos = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todosTableIndex,
            KeyConditionExpression: 'todoId = :todoId and userId = :userId',
            ExpressionAttributeValues: {
                ':todoId': todoId,
                ':userId': userId
            }
        }).promise()
        if(todos.Count == 0){
            logger.error(`Error deleting non existing todo with id ${todoId}`)
            return undefined
        }
        return todos.Items[0] as TodoItem
    }

    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
        logger.info("Creating new todo", todoItem);
        await this.docClient.put({ TableName: this.todosTable, Item: todoItem }).promise()
        return todoItem
    }

    async updateTodo(todoId: string, userId: string, updateTodoRequest: UpdateTodoRequest): Promise<TodoUpdate> {
        logger.info(`Updating todo by id: ${todoId}`);
        const updatedTodo = await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            },
            UpdateExpression: 'set #namefield = :namefield, #dueDate = :dueDate, #done = :done',
            ExpressionAttributeNames: {
                "#namefield": "name",
                "#dueDate": "dueDate",
                "#done": "done"
            },
            ExpressionAttributeValues: {
                ":namefield": updateTodoRequest.name,
                ":dueDate": updateTodoRequest.dueDate,
                ":done": updateTodoRequest.done
            },
            ReturnValues: "UPDATED_NEW"
        }).promise()
        return updatedTodo.Attributes as TodoUpdate
    }

    async deleteTodo(todoId: string, userId: string): Promise<void> {
        logger.info(`Deleting todo by id : ${todoId}`);
        const param = {
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            }
        }
        await this.docClient.delete(param).promise()
    }

}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        console.log('Creating a local DynamoDB instance')
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new XAWS.DynamoDB.DocumentClient()
}
