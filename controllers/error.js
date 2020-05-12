exports.errorHandler = (error, req, res, next)=>{
    const data = error.data
    const code = error.code || 500
    const message = error.message || 'An error occured!'
    console.log(error)
    return res.status(code).json({message: message, data: data, status: code})
}