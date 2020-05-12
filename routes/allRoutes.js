const router = require('express').Router()

const createUser = require('../controllers/createUser')

const uploadImage = require('../controllers/uploadImage')



router.post('/api/create-user',createUser)


router.put('/api/upload', uploadImage)


module.exports = router

