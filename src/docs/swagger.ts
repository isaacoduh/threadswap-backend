import path from 'path'
import swaggerJSDoc from 'swagger-jsdoc'
import type { OAS3Options } from 'swagger-jsdoc'

const root = path.resolve(__dirname, '..')
// when running src with ts-node => __dirname = src/docs => root = src
// when running dist => __dirname = dist/docs => root = dist

const options: OAS3Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ThreadSwap API',
      version: '1.0.0',
      description: 'ThreadSwap backend API documentation',
    },
    servers: [{ url: '/api/v1', description: 'API v1 (relative)' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        ApiError: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            detail: { type: 'string' },
            meta: { type: 'object', nullable: true },
          },
        },
      },
    },
  },

  // IMPORTANT: absolute globs + include js for dist runtime
  apis: [
    path.join(root, 'routes', '**', '*.{ts,js}'),
    path.join(root, 'modules', '**', 'routes', '**', '*.{ts,js}'),
    path.join(root, 'modules', '**', 'controllers', '**', '*.{ts,js}'),
  ],
}

export const swaggerSpec = swaggerJSDoc(options)
export default swaggerSpec
