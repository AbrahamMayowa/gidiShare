const {validationResult} = require('express-validator')
const bcrypt = require('bcryptjs')
const User = require('../models/user')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const Env = require('../env')
const deleteImage = require('../utiity/deleteImage')

module.exports = async (req, res, next)=>{
    const image = req.file

  // image will not be in req.file if multer rejected the image mimetype or user fails to upload image
   
  if(!image){
    return res.status(422).json({message: 'Image is required'})
  }

  return res.status(201).json({imageUrl: image.filename, imagePath: image.path})

}