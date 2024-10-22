import Metainfo from '../model/Metainfo.js'
import Download from '../model/Download.js'

let torrentNetwork = []

let channel = {}


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
    if (!hashCode) return undefined
    try {
        const findDownloaded = await Download.findOne({ hashCode: hashCode })
        if (findDownloaded) {
            await findDownloaded.updateOne({ $inc: { number: 1 } })
        }
        else {
            const downloadEntity = new Download({
                hashCode: hashCode,
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
        if (isExist) return res.status(200).json({ status: false, message: "Your has already join network" })
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

    const listPeers = network ? network.peers
        ?.map(e => ({ peerId: e.peerId, port: e.port, ip: e.ip })) : [];

    res.status(200).json({ status: true, metainfo: metainfo, peers: listPeers })

    // send notification to other peers 
    publishNotification(data.hashCode, listPeers)
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
            const result = await updateDownloaded(data.hashCode)
            console.log("update download")
            if (!result) res.status(500).json({ status: false, message: "Internal error, can save downloaded" })
        }
    }
    else return res.status(401).json({ status: false, message: "Your code is wrong" })

    console.log("torrent network", JSON.stringify(torrentNetwork, null, 2));

    res.status(200).json({ status: true, message: "You leaved successfully" })

    // leave channel
    unsubscribeChannel(data.hashCode, data.peerId)
}


const peerScrapeData = async (req, res) => {
    const magnet = req.params.code
    const network = torrentNetwork.find(net => net.hashCode === magnet)
    if (!network) return res.status(200).json({ status: false, message: "Torrent is not alive" })

    const findDownloaded = await Download.findOne({ hashCode: magnet })
    const downloaded = findDownloaded ? findDownloaded.number : 0

    const data = {
        fileName: network.fileName,
        seeder: network.seeder,
        leecher: network.leecher,
        downloaded: downloaded
    }
    return res.status(200).json({ status: true, data })
}


const subscribeChannel = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Gửi header ngay lập tức

    const hashCode = req.params.code
    const peerId = req.params.id

    if (!channel[hashCode]) channel[hashCode] = []
    channel[hashCode].push({ [peerId]: res })

    console.log("Channel ", channel)

    // Lắng nghe sự kiện "close" khi client đóng kết nối
    req.on('close', () => {
        console.log(`Peer ${req.params.id} out`);

        unsubscribeChannel(hashCode, peerId)

        // check if the peer has leave network or not? if not => make it leave the network
        const network = torrentNetwork.find(e => e.hashCode === hashCode)
        if (network) {
            const leaved = network.peers?.find(peer => peer.peerId === peerId)
            if (leaved) {
                network.peers = network.peers.filter(peer => peer.peerId !== peerId)
                // clear if network empty 
                if (network.peers.length === 0) {
                    const torrent = torrentNetwork.filter(net => net.hashCode !== hashCode)
                    torrentNetwork = torrent
                }
                else network.leecher--;

                console.log("Torrent network ", torrentNetwork)
            }
        }

    });
};


const publishNotification = (hashCode, listPeers) => {
    channel[hashCode]?.forEach(element => {
        const response = Object.values(element)[0];
        if (response && typeof response.write === 'function') {
            response.write(`data: ${JSON.stringify(listPeers)}\n\n`);  // dau /n/n la chuan cua SSE
        }
    });
}


const unsubscribeChannel = (hashCode, peerId) => {
    channel[hashCode] = channel[hashCode]?.filter(peer => Object.keys(peer)[0] !== peerId)
    if (!channel[hashCode] || channel[hashCode].length === 0) delete channel[hashCode]
    console.log("Channel ", channel)
}


export default {
    peerJoinNetwork,
    peerLeaveNetwork,
    peerScrapeData,
    subscribeChannel
}
