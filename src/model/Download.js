import mongoose from "mongoose";

const downloadSchema = new mongoose.Schema({
    hashCode: { type: String, required: true, unique: true },
    number: { type: Number, required: true }
})

const Download = mongoose.model('Download', downloadSchema)

export default Download