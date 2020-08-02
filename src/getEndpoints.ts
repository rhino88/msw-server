import lodashId from "lodash-id";
import mixins from "json-server/lib/server/mixins";
import { RequestHandlersList } from "msw/lib/types/setupWorker/glossary";
import { rest, graphql as mswGraphql, GraphQLRequestPayload } from "msw";
import low from "lowdb";
import _ from "lodash";
import { makeExecutableSchema } from "@graphql-tools/schema";
import {
  mockServer,
  addMocksToSchema,
  IMocks,
} from "@graphql-tools/mock";
import Memory from "lowdb/adapters/Memory";
import {MswServerConfig, GraphQLRequestHandlerOptions} from './types';

// declare const hammerhead: number;
declare global {
  interface Window {
    "%hammerhead%": {
      utils: {
        url: {
          getProxyUrl: (url: string) => string;
        };
      };
    };
  }
}
function withUrl(url: string) {
  if (process.env.NEXT_PUBLIC_IS_TESTCAFE) {
    //@ts-ignore
    const getProxyUrl = window["%hammerhead%"].utils.url.getProxyUrl;

    return getProxyUrl(url);
  }
  return url;
}

export function jsonParse<T extends Record<string, any>>(
  str: string,
): T | undefined {
  try {
    return JSON.parse(str)
  } catch (error) {
    return undefined
  }
}


export function getGraphQLEndpoints(
  options?: GraphQLRequestHandlerOptions
): RequestHandlersList {
  const schema = makeExecutableSchema({ typeDefs: options?.schema as string });
  // const schemaWithMocks = addMocksToSchema({schema, mocks: options?.mocks, preserveResolvers: true});
  const server = mockServer(schema, options?.mocks, false);
  // return schemaWithMocks.getQueryType()?.astNode?.fields?.map(field => {
  //   return mswGraphql.query(field.name, async (req, res, ctx) => {
  //     const results = await = server.query(req.body?.query)
  //     return res(ctx.data({ [field.name]: [results]}));
  //   }))
  // });

  return [
    // @ts-ignore
    mswGraphql.query("getTodos", async (req, res, ctx) => {
      //@ts-ignore
      const result = await server.query(req?.body?.query, req?.variables);
      return res(
        ctx.data(result.data)
      );
    }),
    //@ts-ignore
    mswGraphql.mutation("createTodo", async (req, res, ctx) => {
      //@ts-ignore
      const result = await server.query(req?.body?.query, req?.variables);
      return res(
        ctx.data(result.data)
      );
    }),
  ];
}

export function getRestEndpoints(data: object): RequestHandlersList {
  const db = low(new Memory()).setState(JSON.parse(JSON.stringify(data)));
  db._.mixin(lodashId);
  db._.mixin(mixins);

  const handlers: RequestHandlersList = [];
  _.forEach(data, (value: any, key: string) => {
    handlers.push(
      rest.get(withUrl(`/${key}`), (req, res, ctx) => {
        // rest.get((`*/${key}`), (req, res, ctx) => {
        return res(ctx.json(db.get(key).value()));
      })
    );

    handlers.push(
      rest.post(withUrl(`/${key}`), (req, res, ctx) => {
        const body = JSON.parse(req.body as string);

        const collection = db.get(key);

        const newResource = collection.insert(body).write();

        return res(ctx.json(collection.getById(newResource.id).value()));
      })
    );
    handlers.push(
      rest.put(withUrl(`/${key}/:id`), (req, res, ctx) => {
        const { id } = req.params;

        const resource = db.get(key).getById(id).value();

        const result = db
          .get(key)
          .replaceById(id, JSON.parse(req.body as string))
          .write();
        return res(ctx.json(result));
      })
    );

    handlers.push(
      rest.delete(withUrl(`/${key}/:id`), (req, res, ctx) => {
        const resource = db.get(key).removeById(req.params.id).write();

        // Remove dependents documents
        // const removable = db._.getRemovable(db.getState(), {})
        // removable.forEach((item:any) => {
        //   console.log(item)
        //   db.get(item.name)
        //     .removeById(item.id)
        //     .write()
        // })
        return res(ctx.json({}));
      })
    );
  });

  return handlers;
}

export function getEndpointsFor({rest: data, graphql}: MswServerConfig): RequestHandlersList {
  const handlers: RequestHandlersList = [];
  if (data) {
    handlers.push(...getRestEndpoints(data))
  }

  if (graphql) {
    handlers.push(...getGraphQLEndpoints(graphql));
  }

  return handlers;
}
