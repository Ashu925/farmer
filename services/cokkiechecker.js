const { validator } = require("./jwtcreater");

const checkuser=async (req,res,next) => {
    try {
        const token=req.cookies.token
        if(!token){
<<<<<<< HEAD
            console.log("in 1")
=======
<<<<<<< HEAD
>>>>>>> 0902396f4ef9f0d516222488c942d4f937cc64b1
            return res.render('home')
        }
        const payload=validator(token)
        if (!payload){
            console.log("in 2")
            return res.render('home')
=======
            return res.render('home',{data:null})
        }
        const payload=validator(token)
        if (!payload){
            return res.render('home',{data:null})
>>>>>>> 8a9d1dfaceecf8f791718f4a8e1f65ff3e2adfef
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