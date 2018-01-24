// Construct a schema, using GraphQL schema language
const typeDefs = `
    type Status {
        node_status: String!
    }
    type Query {
        # Get status
        status: Status!
    }
`;

export default typeDefs;
