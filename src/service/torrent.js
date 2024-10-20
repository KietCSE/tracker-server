import Metainfo from '../model/Metainfo.js'
import Download from '../model/Download.js'

let torrentNetwork = []

const findMetainfo = async (hashCode) => {
    if (!hashCode) return undefined
    try {
        const findMetainfo = await Metainfo.findOne({ hashCode: hashCode }).lean()
        if (!findMetainfo) return undefined
        return findMetainfo
    }
    catch (error) {
        console.log(error)
    }
}

const updateDownloaded = async (hashCode) => {
    if (hashCode) return undefined
    try {
        const findDownloaded = Download.findOne({ hashCode: data.hashCode })
        if (findDownloaded) {
            await findDownloaded.updateOne({ $inc: { number: 1 } })
        }
        else {
            const downloadEntity = new Download({
                hashCode: data.hashCode,
                number: 1
            })
            await downloadEntity.save()
        }
        return true
    }
    catch (error) {
        console.log(error)
        return false
    }
}


// const listPeerSchema = new mongoose.Schema({
//     peerId: { type: String, required: true, unique: true },
//     port: { type: Number, required: true },
//     ip: { type: String, required: true },
//     upload: { type: Number, required: true },
//     download: { type: Number, required: true },
//     left: { type: Number, required: true }
// });

// const torrentNetworkSchema = new mongoose.Schema({
//     hashCode: { type: String, required: true, unique: true },
//     seeder: { type: Number, required: true },
//     leecher: { type: Number, required: true },
//     fileName: { type: String, required: true },
//     peers: [listPeerSchema]
// });

const peerJoinNetwork = async (req, res) => {
    const data = req.body
    if (!data) return res.status(401).json({ status: false, message: "No body data" })

    const metainfo = await findMetainfo(data.hashCode)
    if (!metainfo) return res.status(401).json({ status: false, message: "Your code is wrong" })

    const peer = {
        peerId: data.peerId,
        port: data.port,
        upload: data.uploaded,
        download: data.downloaded,
        left: data.left,
        ip: data.ip
    }

    const network = torrentNetwork.find(e => e.hashCode === data.hashCode)
    if (network) {
        const isExist = network.peers?.find(e => e.peerId === data.peerId)
        if (isExist) return res.status(200).json({ status: true, message: "Your has already join network" })
        network.peers?.push(peer)
        network[data.status]++;
    }
    else {
        torrentNetwork.push({
            hashCode: data.hashCode,
            seeder: data.event === 'complete' ? 1 : 0,
            leecher: data.event === 'complete' ? 0 : 1,
            fileName: metainfo.info?.name,
            peers: [peer]
        })
    }

    console.log("torrent network", JSON.stringify(torrentNetwork, null, 2));

    const listPeers = network ? network.peers?.filter(e => e.peerId !== data.peerId) : []
    res.status(200).json({ status: true, metainfo: metainfo, peers: listPeers })
}


const peerLeaveNetwork = async (req, res) => {
    const data = req.body
    if (!data) return res.status(401).json({ status: false, message: "No body data" })

    const network = torrentNetwork.find(e => e.hashCode === data.hashCode)
    if (network) {

        //update new list 
        const newlist = network.peers?.filter(e => e.peerId !== data.peerId)

        if (newlist.length === network.peers?.length)
            return res.status(200).json({ status: true, message: "You are not in this network" })
        network.peers = newlist

        if (network[data.status] > 0) network[data.status]--;

        // clear if network empty 
        if (network.seeder + network.leecher === 0) {
            const torrent = torrentNetwork.filter(net => net.hashCode !== data.hashCode)
            torrentNetwork = torrent
        }

        if (data.complete) {
            const result = updateDownloaded(data.hashCode)
            if (!result) res.status(500).json({ status: false, message: "Internal error, can save downloaded" })
        }
    }
    else return res.status(401).json({ status: false, message: "Your code is wrong" })

    console.log("torrent network", JSON.stringify(torrentNetwork, null, 2));

    return res.status(200).json({ status: true, message: "You leaved successfully" })
}



export default {
    peerJoinNetwork,
    peerLeaveNetwork,
}