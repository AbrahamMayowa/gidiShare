const Image = require('../models/image')
const User = require('../models/user')
const validate = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const deleteImage = require('../utiity/deleteImage')
require('dotenv').config()

module.exports = {
    createUser: async function({userData}, req){

        if (validate.isEmpty(userData.username) || validate.isEmpty(userData.password)){
        //delete the saved image in the file storage if the process is not successful
            deleteImage.deleteFile(userData.imagePath)
            const err = new Error('Operation fails! Provide a valid input')
            err.code = 422
            throw err
        }

        const existingUser = await User.findOne({username: userData.username})

        if(existingUser){
            deleteImage.deleteFile(userData.imagePath)
            const error = new Error('The username is not available. Choose another username')
            error.code = 422
            throw error
        }

        try{

        const hashedPassword = await bcrypt.hash(userData.password, 12)

        const randomToken = await crypto.randomBytes(32)

        const refreshToken = randomToken.toString('hex')

    

        const savedUser = await new User({
        username: userData.username,
        password: hashedPassword,
        imageUrl: userData.imageUrl,
        refreshToken: refreshToken

        })

        const user = await savedUser.save()

        const token = jwt.sign({userId: user._id}, process.env.jwtSecret, {expiresIn: '15min'})

        const expirationDate = Date.now() + 900000
        return {
            token: token,
            refreshToken: user.refreshToken,
            userId: user._id,
            expiresIn: expirationDate,
            username: user.username,
            imageUrl: user.imageUrl, 
        }
        }catch(error){
        if(!error.code){
            error.code = 500
        }
        throw error
    }

    },

    login: async function({username, password}, req){
        if (validate.isEmpty(username) || validate.isEmpty(password)) {
            throw new Error('Please provide a valid input')
          }
    
        try{
            const user = await User.findOne({username: username})
            if(!user){
                const err = new Error('A user with this user is not found')
                err.code = 404
                err.data = null
                throw err
            }
    
            const matchedPassword = await bcrypt.compare(password, user.password)
    
            if(!matchedPassword){
                const err = new Error('Invalid Password')
                err.code = 422
                err.data = null
                throw err
            }
    
    
            const randomToken = await crypto.randomBytes(32)
    
    
            const refreshToken = randomToken.toString('hex') 
            
    
            user.refreshToken = refreshToken
    
            await user.save()
            
            const token = jwt.sign({userId: user._id}, process.env.jwtSecret, {expiresIn: '15min'})

            const expirationDate = Date.now() + 900000

            return {
                token: token,
                refreshToken: user.refreshToken,
                userId: user._id,
                expiresIn: expirationDate,
                username: user.username,
                imageUrl: user.imageUrl,
            }
        }catch(error){
          
            throw error
          
        }
    
        
    },


    thumpUpMutation: async function({imageId}, req){
        if(!req.isAuth){
            const err = new Error('Not authenticated')
            err.code = 401
            err.data = null
            throw err
        }

        const imageData = await Image.findById(imageId)
        if(!imageData){ 
            const err = new Error('Not Found')
            err.code = 404
            err.data = null
            throw err
        }

        try{
        await imageData.thumpUpMethod(req.userId)
        const updatedImage = await Image.findById(imageId)
        return {
            thumpUp: {thumpUpCount: updatedImage.thumpUp.thumpUpCount,
                userActionThumpUp: updatedImage.thumpUp.userActionThumpUp},

            imageId: updatedImage._id,
            
            thumpDown: {thumpDownCount: updatedImage.thumpDown.thumpDownCount,
                userActionThumpDown: updatedImage.thumpDown.userActionThumpDown}
        }
        }catch(error){  
            throw error
        }
    },

    uploadImage: async function({imageUrl, description, category}, req){
        if(!req.isAuth){
            const err = new Error('Not authenticated')
            err.code = 401
            err.data = null
            throw err
        }

        if(validate.isEmpty(imageUrl)){
            const error = new Error('ImageUrl cannot be empty.');
            error.data = null;
            error.code = 422;
            throw error;
        }

        if(validate.isEmpty(description)){
            const error = new Error('Description cannot be empty.');
            error.data = null;
            error.code = 422;
            throw error;

        }

        if(validate.isEmpty(category)){
            const error = new Error('category cannot be empty.');
            error.data = null;
            error.code = 422;
            throw error;
        }

        try{
        
        const newImage = await new Image({
            imageUrl: imageUrl,
            creator: req.userId,
            description: description,
            category: category
            
        })

        const savedImage = await newImage.save()
        const populatedImage = await Image.findById(savedImage._id).populate('creator')

        return {

            ...populatedImage._doc, creator: {username: populatedImage.creator.username, imageUrl: populatedImage.creator.imageUrl},
            createdAt: populatedImage.createdAt.toString(), updatedAt: populatedImage.updatedAt.toString(),
            imageId: populatedImage._id,

            thumpUp: {...populatedImage.thumpUp,
                userActionThumpUp: populatedImage.thumpUp.userActionThumpUp},


            thumpDown: {...populatedImage.thumpDown,
                userActionThumpDown: populatedImage.thumpDown.userActionThumpDown}

            }

        }catch(error){
            if(!error.code){
                error.code = 500
            }

            throw error
        }

    },

    thumpDownMutation: async function({imageId}, req){
        if(!req.isAuth){
            const err = new Error('Not authenticated')
            err.code = 401
            err.data = null
            throw err
        }

        const imageData = await Image.findById(imageId)
        if(!imageData){ 
            const err = new Error('Not Found')
            err.code = 404
            err.data = null
            throw err
        }

        try{
        await imageData.thumpDownMethod(req.userId)
        const updatedImage = await Image.findById(imageId)
        return {
            thumpUp: {thumpUpCount: updatedImage.thumpUp.thumpUpCount,
                userActionThumpUp: updatedImage.thumpUp.userActionThumpUp},
            imageId: updatedImage._id.toString(),
            
            thumpDown: {thumpDownCount: updatedImage.thumpDown.thumpDownCount,
                userActionThumpDown: updatedImage.thumpDown.userActionThumpDown}
        }

    }catch(error){
        if(!error.code){
        error.code = 500
        }
        throw error
    }

    },

    imageList: async function(args, req){

        try{
        const images = await Image.find().sort({createdAt: -1}).populate('creator')
        if(!images){
            const err = new Error('Image not found')
            err.code = 404
            throw err
        }
        if(!images.length > 0){
            const err = new Error('No image found')
            err.code = 404
            throw err
        }

        return images.map(image =>{

            return {

                ...image._doc,
                creator: {username: image.creator.username, imageUrl: image.creator.imageUrl},
                createAt: image.createdAt,
                updatedAt: image.updatedAt,
                thumpUp: image.thumpUp,
                thumpDown: image.thumpDown,
                imageId: image._id.toString()
    
                }

        })
    }

    catch(error){
        throw error
        
    }
    },

    singleImage: async function({_id}, req){
        try{
        const populatedImage = await Image.findById(_id).populate('creator')
        if(!populatedImage){
            const err = new Error('Image not found')
            err.code = 404
            throw err
        }

        return {

                ...populatedImage._doc, creator: {username: populatedImage.creator.username, imageUrl: populatedImage.creator.imageUrl},
                createAt: populatedImage.createdAt.toString(), updateAt: populatedImage.updatedAt.toString(),
    
                thumpUp: {...populatedImage.thumpUp,
                    userActionThumpUp: populatedImage.thumpUp.userActionThumpUp},
    
    
                thumpDown: {...populatedImage.thumpDown,
                    userActionThumpDown: populatedImage.thumpDown.userActionThumpDown},
                imageId: populatedImage._id
    
        }

        }catch(error){
            throw error
        }
    },

    userData: async function({_id}, req){
        if(!req.isAuth){
            const err = new Error('Not authenticated')
            err.code = 401
            err.data = null
            throw err
        }
        try{
            const user = await User.findById(_id)
            if(!user){
                const err = new Error('Not found')
                err.code = 404
                err.data = null
                throw err
            }

            return {
                username: user.username,
                imageUrl: user.imageUrl

            }
            
        }catch(error){
            throw error
        }

    },

    searchImages: async function({queryString}, req){
        try{
            const images = Image.find({$text: {$search: queryString}})
            if(images.length < 1){
                const err = new Error('No image found')
                err.code = 404
                throw err
            }
            
            return images.map(image =>{

                return {
    
                    ...image._doc, creator: {username: image.username, imageUrl: image.imageUrl},
                    createAt: image.createdAt.toString(), updatedAt: image.updatedAt.toString(),
        
                    thumpUp: {...image.thumpUp,
                        userActionThumpUp: image.userActionThumpUp},
        
        
                    thumpDown: {...image.thumpDown,
                        userActionThumpDown: image.userActionThumpDown}
        
                    }
    
            })
        }catch(error){
            throw error

        }
    },

    logout: async function(args, req){
        if(!req.isAuth){
            const err = new Error('Not authenticated')
            err.code = 401
            err.data = err
            throw err
        }
        try{
        const user = await User.findById(req.userId)
        if(!user){
            const err = new Error('Not found')
            err.code = 404
            throw err
        }

        user.refreshToken = null
        await user.save()

        return true
        }catch(error){
            throw error
        }
    },



    refreshToken: async function({refreshToken, userId}, req){
            // if no token or cookieToken, return 401
        if(validate.isEmpty(refreshToken) || validate.isEmpty(userId)){
            const err = new Error('Not Authorized')
            err.code = 401
            throw err
        }

        try{
            const user = await User.findOne({refreshToken: refreshToken, _id: userId})
            if(!user){
            const err = new Error('User not found')
            err.code = 404
            throw err
            }
            
            const token = jwt.sign({userId: user._id}, process.env.jwtSecret, {expiresIn: '15min'})
            const expirationDate = Date.now() + 900000

            return {expiresIn: expirationDate, token: token, username: user.username, imageUrl: user.imageUrl}

        }catch(error){
            throw error
        }
}

}


