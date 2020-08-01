interface MswServerConfig {
    rest?: object,
    graphql?: GraphQLRequestHandlerOptions
}

export interface GraphQLRequestHandlerOptions {
    /**
    * The schema to which to add mocks. This can also be a set of type definitions instead.
    */
    schema?: String;
    /**
    * The mocks to add to the schema.
    */
    mocks?: IMocks;
    /**
    * Set to `true` to prevent existing resolvers from being overwritten to provide
    * mock data. This can be used to mock some parts of the server and not others.
    */
    preserveResolvers?: boolean;
}