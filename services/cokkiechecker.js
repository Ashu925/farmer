const { validator } = require("./jwtcreater");

const checkuser=async (req,res,next) => {
    try {
        const token=req.cookies.token
        if(!token){

            console.log("in 1")

            return res.render('home')
        }
       
        const payload=validator(token)
        if (!payload){
            return res.render('home',{data:null})

        }
        req.user=payload
        console.log("user foundd")
        return next()
    } catch (error) {
        console.log("error",error)
        return res.send('listings')
    }
}

module.exports={
    checkuser
}