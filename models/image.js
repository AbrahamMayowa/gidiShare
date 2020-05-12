const mongoose = require('mongoose')
const Schema = mongoose.Schema

const imageSchema = new Schema({
    imageUrl: {
        type: String,
        required: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
    description:{
        type: String,
        required: true
    },

    category: {
        type: String
    },

    thumpUp: {
        thumpUpCount:{
            type: Number,
            default: 0
        },
        userActionThumpUp: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        ]
    },
    thumpDown: {
        thumpDownCount:{
            type: Number,
            default: 0
        },
        userActionThumpDown: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        ]
    }


},
{timestamps: true}
)

imageSchema.index({description: 'text', category: 'text'});


imageSchema.methods.thumpUpMethod = function(userId){

    const updateThumpUp = {...this.thumpUp}


     // the removed reduced thumpDownCount by one if user had thumped the image
     const currentUserActionThumpDown = {...this.thumpDown}
     const findUser = currentUserActionThumpDown.userActionThumpDown.find(user => user.toString() === userId.toString())
     //check if user had thumped-down the image
     if(findUser){
         const newThumpDownCount = currentUserActionThumpDown.thumpDownCount - 1
         const filteredUserAction = currentUserActionThumpDown.userActionThumpDown.filter(user => user.toString() !== userId.toString())
         this.thumpDown = {...this.thumpDown, thumpDownCount: newThumpDownCount, userActionThumpDown: filteredUserAction}
     } 
    const userIndex = updateThumpUp.userActionThumpUp.findIndex(u => u.toString() === userId.toString())
    let newUserThumpList
    let newCount
    if(userIndex > -1){
        newUserThumpList = updateThumpUp.userActionThumpUp.filter(u => u.toString() != userId.toString())
        newCount = updateThumpUp.thumpUpCount - 1
        
    }else{
        newCount = updateThumpUp.thumpUpCount + 1
        newUserThumpList = updateThumpUp.userActionThumpUp.concat(userId)
    }

    this.thumpUp = {...this.thumpUp, thumpUpCount: newCount, userActionThumpUp: newUserThumpList}
    return this.save()

}

imageSchema.methods.thumpDownMethod = function(userId){
    const updateThumpDown = {...this.thumpDown}

    // the removed reduced thumpUpCount by one if user had thumped the image
    const currentUserActionThumpUp = {...this.thumpUp}
    const findUser = currentUserActionThumpUp.userActionThumpUp.find(user => user.toString() === userId.toString())
    //check if user had thumped-up the image
    if(findUser){
        const newThumpUpCount = currentUserActionThumpUp.thumpUpCount - 1
        const filteredUserAction = currentUserActionThumpUp.userActionThumpUp.filter(user => user.toString() !== userId.toString())
        this.thumpUp = {...this.thumpUp, thumpUpCount: newThumpUpCount, userActionThumpUp: filteredUserAction}
    } 
    const userIndex = updateThumpDown.userActionThumpDown.findIndex(u => u.toString()=== userId.toString())
    let newUserThumpList
    let newCount
    if(userIndex > -1){
        newUserThumpList = updateThumpDown.userActionThumpDown.filter(u => u.toString() != userId.toString())
        newCount = updateThumpDown.thumpDownCount -1
    }else{
        newCount = updateThumpDown.thumpDownCount + 1
        newUserThumpList = updateThumpDown.userActionThumpDown.concat(userId)
    }

    this.thumpDown = {...this.thumpDown, thumpDownCount: newCount, userActionThumpDown: newUserThumpList}

    return this.save()


}



module.exports = mongoose.model('Image', imageSchema)