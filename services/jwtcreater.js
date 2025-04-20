const jwt=require('jsonwebtoken')
const key="abcd"

const createtoken=(user)=>{
   const payload={
        user:user.username,
        role:user.role,
        _id:user._id
    }
    const token=jwt.sign(payload,key,{expiresIn:'1h'})
    return token
}
const validator=(token)=>{
    try {
        const payload=jwt.verify(token,key)
        console.log("verified")
        return payload
    } catch (error) {
        console.log("got error in validating the json token")
        return null
    }
}
module.exports={
    validator,createtoken
}