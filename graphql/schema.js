const { buildSchema } = require("graphql");

module.exports = buildSchema(`
    type TestData {
        text: String!
        views: Int!
    }
    type PostData {
        posts : [Post!]!
        totalPosts : Int!
    }
    type RootQuery {
        hello: TestData!
        login(email : String!,password : String!) : AuthData
        posts (page : Int!,perPage : Int!) : PostData!
        post (id : ID!) : Post!
        user : User!
    }

    input UserData {
       email : String!
       name : String!
       password : String!
    }
    type Post {
        _id :ID!
        title:String,
        content:String!
        imageUrl:String!
        creator : User!
        createdAt: String!
        updatedAt : String!
    }

    type User {
        _id : ID!
       email : String!
       name : String!
       password : String
       status : String!
       posts : [Post!]!
    }

    input PostInputData {
        title : String!
        content : String!
        imageUrl : String!
    }

    type RootMutation {
       createUser(userInput : UserData) : User!
       createPost(postInputData : PostInputData) : Post!
       updatePost(id: ID!, postInput : PostInputData) : Post!
       deletePost(id: ID!) : Boolean
       updateStatus(status : String!) : User!
       
    }
    type AuthData {
        token : String!
        userId : String!
    }
    schema {
        query: RootQuery,
        mutation : RootMutation
    }
`);
