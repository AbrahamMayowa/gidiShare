const {buildSchema} = require('graphql')

module.exports = buildSchema(`

    type UserId {
        _id: ID
    }

    type ThumpUpData {
        thumpUpCount: Int!
        userActionThumpUp: [UserId]
        
    }

    type ThumpDownData {
        thumpDownCount: Int!
        userActionThumpDown: [UserId]
        
    }

    type User {
        username: String!
        imageUrl: String!
    }

    type AuthData {
        token: String!
        userId: ID!
        username: String!
        expiresIn: String!
        imageUrl: String!
        refreshToken: String!
    }


    type Image {
        imageUrl: String!
        imageId: ID!
        creator: User!
        description: String!
        category: String!
        createdAt: String!
        updatedAt: String!
        thumpUp: ThumpUpData
        thumpDown: ThumpDownData
    }

    type ThumpData{
        imageId: ID!
        thumpUp: ThumpUpData
        thumpDown: ThumpDownData
    }

    type ImageSearch{
        images: [Image]
    }

    input UserInput{
        username: String!
        password: String!
        imageUrl: String!
        imagePath: String!
    }

    type RefreshReturn{
        expiresIn: String!
        token: String!
        username: String!
        imageUrl: String!
    }


    type RootMutation {
        createUser(userData: UserInput): AuthData!
        uploadImage(imageUrl: String!, description: String!, category: String!): Image!
        thumpUpMutation(imageId: ID!): ThumpData!
        thumpDownMutation(imageId: ID!): ThumpData!
        login(username: String!, password: String!): AuthData!
        logout: Boolean!
        refreshToken(refreshToken: String!, userId: ID!): RefreshReturn!
    }

    type RootQuery {
        imageList: [Image!]
        singleImage(_id: ID!): Image!
        userData(_id: ID!): User!
        searchImages(queryString: String!): ImageSearch!
    }


    schema{
        query: RootQuery
        mutation: RootMutation
    }
`)