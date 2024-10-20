import mongoose from "mongoose";

const listPeerSchema = new mongoose.Schema({
    peerId: { type: String, required: true, unique: true },
    port: { type: Number, required: true },
    ip: { type: String, required: true },
    upload: { type: Number, required: true },
    download: { type: Number, required: true },
    left: { type: Number, required: true }
});

const torrentNetworkSchema = new mongoose.Schema({
    hashCode: { type: String, required: true, unique: true },
    seeder: { type: Number, required: true },
    leecher: { type: Number, required: true },
    fileName: { type: String, required: true },
    peers: [listPeerSchema]
});

const Network = mongoose.model('Network', torrentNetworkSchema);

export default Network;
