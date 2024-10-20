import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    peerId: { type: String, required: true, unique: true },
    account: { type: String, required: true },
    password: { type: String, required: true }
})

const User = mongoose.model('User', userSchema)

export default User