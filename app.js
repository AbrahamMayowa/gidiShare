const express = require('express')
const multer = require('multer')
const mongoose = require('mongoose')
const graphqlExpress = require('express-graphql')
const cors = require('cors')
const graphqlResolver = require('./graphql/resolvers')
const graphqlSchema = require('./graphql/schema')
const isAuth = require('./middleware/isAuth')
const allRoutes = require('./routes/allRoutes')
const errorController = require('./controllers/error')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const path = require('path')
const aws = require( 'aws-sdk' )
const multerS3 = require( 'multer-s3' )

const {s3} = require('./utiity/deleteImage')




const app = express()
app.use(cors())
app.use('/static', express.static('images'))
// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'gidiShare-frontend/build')))


app.use(bodyParser.json())
app.use(cookieParser())
//app.use(cors({credentials: true, origin: true}))



const s3Storage = multerS3({
  s3,
  bucket: 'gidishare.com',
  acl: 'public-read',
  metadata: function(req, file, cb){
    cb(null, {fieldName: file.fieldname})
  },
  key: function(req, file, cb){
    cb(null, new Date().toISOString() + '-' + file.originalname)
  }
})   
  
  const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };


app.use(
    multer({ storage: s3Storage, fileFilter: fileFilter }).single('image')
  )

  app.use(isAuth)

  app.use(allRoutes)

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/gidiShare-frontend/build/index.html'));
});

  
  app.use('/graphql',
  graphqlExpress({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    customFormatErrorFn(err){
      if(!err.originalError){
        return err
      }
      const data = err.originalError.data
      const message = err.originalError.message || 'An error occured'
      const code = err.originalError.code
      return {message: message, status: code, data: data}
    }
  })
  )



app.use(errorController.errorHandler)


const port = process.env.PORT || 5000
mongoose.connect(process.env.mongooseUrl, {useNewUrlParser: true, useUnifiedTopology: true}).then(connected =>{
  app.listen(port, () => console.log('connected'))
})
.catch(error => console.log(error))

