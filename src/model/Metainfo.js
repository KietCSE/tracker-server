import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    length: { type: Number, required: true },
    path: { type: [String], required: true }
})

const infoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    pieceLength: { type: Number, required: true },
    pieces: { type: String, required: true },
    files: [fileSchema]
});

const metainfoSchema = new mongoose.Schema({
    hashCode: { type: String, required: true, unique: true },
    announce: { type: String, required: true },   // can cai thien cai nay thanh list neu co nhieu tracker 
    creationDate: { type: Date, required: true },
    comment: { type: String, required: true },
    createdBy: { type: String, required: true },  // peerid 
    info: { type: infoSchema, required: true }
});

const Metainfo = mongoose.model('Metainfo', metainfoSchema);

export default Metainfo;
