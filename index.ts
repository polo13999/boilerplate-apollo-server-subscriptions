import { ApolloServer, gql } from 'apollo-server-express'
import express from 'express'
import bodyParser from 'body-parser'
import cookieSession from 'cookie-session'
import cookieParser from 'cookie-parser'
import config from './config'
import "reflect-metadata"
import { createConnections, getConnection } from "typeorm"
import { ormconfigErp, } from './ormconfig'
import jwtwork from './jwtwork'
import { genSchema } from './utils/genSchema'
import _ from 'lodash'
import http = require('http');
import { SubscriptionServer, ConnectionContext } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';


export const main = async () => {
    await createConnections([ormconfigErp])
    const connectionErp = getConnection("Erp")
    const app = express()

    app.use(bodyParser.json({ limit: '10mb' }))
    app.use(cookieSession({ maxAge: 30 * 24 * 60 * 60 * 1000, keys: [config.cookieKey], secure: config.production }))
    app.use(cookieParser())
    const schema = genSchema()






    const server = new ApolloServer({
        schema,
        context: async ({ req }: { req: express.Request }) => { const { userCode, userId }: any = await jwtwork(req); return { req, connectionErp, userId, userCode }; },
        // tracing: true,
        debug: !process.env.PRODUCTION,
        introspection: !process.env.PRODUCTION,
        plugins: [{
            async serverWillStart() {
                return {
                    async drainServer() {
                        subscriptionServer.close();
                    }
                };
            }
        }],
    })


    await server.start()
    //todo: 抽出到config    
    server.applyMiddleware({ app, cors: { credentials: true, origin: ["http://localhost:3001", "http://localhost:3000",] }, })

    const httpServer = http.createServer(app);


    const subscriptionServer = SubscriptionServer.create({

        schema,
        // These are imported from `graphql`.
        execute,
        subscribe,
        // Providing `onConnect` is the `SubscriptionServer` equivalent to the
        // `context` function in `ApolloServer`. Please [see the docs](https://github.com/apollographql/subscriptions-transport-ws#constructoroptions-socketoptions--socketserver)
        // for more information on this hook.
        async onConnect(
            connectionParams: Object,
            webSocket: WebSocket,
            context: ConnectionContext
        ) {
            // If an object is returned here, it will be passed as the `context`
            // argument to your subscription resolvers.
        }
    }, {
        // This is the `httpServer` we created in a previous step.
        server: httpServer,
        // This `server` is the instance returned from `new ApolloServer`.
        path: server.graphqlPath,
    });



    httpServer.listen({ port: 4005 }, () => { console.log(`🚀 GraphQl Server at 開發環境 is    http://localhost:4005${server.graphqlPath}`); })
}

try { main(); } catch (error) { console.log(' 發生錯誤了 error', error); }

