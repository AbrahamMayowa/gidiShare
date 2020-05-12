const deleteImage = require('../utiity/deleteImage')

module.exports = async (req, res, next)=>{
    const image = req.file

    if(!req.isAuth){
        if(image){
            deleteImage.deleteFile(image.path)
        }
        return res.status(401).json({message: 'Not authenticated'})

    }
    if(!image){
        return res.status(402).json({message: 'Attach valid image'})
    }

    return res.status(201).json({message: 'Image uploaded', imageUrl: image.filename})

}