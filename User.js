const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
    profileId: String,
    name: String,
    last_name: String,
    first_name: String,
    middle_name: String,
    pictureUrl: String,  
})

const User = mongoose.model('User', userSchema)

module.exports = {User}