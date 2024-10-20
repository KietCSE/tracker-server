import mongoose from "mongoose";

const listMetainfoSchema = new mongoose.Schema({
    hashCode: { type: String, required: true, unique: true },
    fileName: { type: String },
    timeSave: { type: Date, required: true },
});

const userRepoSchema = new mongoose.Schema({
    peerId: { type: String, required: true, unique: true },
    list: [listMetainfoSchema]
});

const UserRepo = mongoose.model('UserRepo', userRepoSchema);

export default UserRepo;
