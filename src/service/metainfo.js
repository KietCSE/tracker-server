import UserRepo from '../model/UserRepo.js'
import Metainfo from '../model/Metainfo.js'


// save metainfo file 
const saveMetainfoFile = async (req, res) => {
    const data = req.body

    if (!data || Object.keys(data).length === 0) return res.status(401).json({ status: false, message: "undefine metainfo" })

    try {
        // init metainfo file
        const findMetainfo = await Metainfo.findOne({ hashCode: data.hashCode })
        if (findMetainfo) return res.status(200).json({ status: true, message: 'Metainfo has already exist' })

        const metainfo = new Metainfo({
            author: data.author,
            hashCode: data.hashCode,
            announce: data.announce,   // can cai thien cai nay thanh list neu co nhieu tracker 
            creationDate: data.creationDate,
            comment: data.comment,
            info: data.info
        })
        const saveMetainfo = await metainfo.save()
        if (!saveMetainfo) return res.status(401).json({ status: false, message: "Internal error: Can not save metainfo" })
        console.log("Save metainfor")

        // update user repo 
        const findUserRepo = await UserRepo.findOne({ peerId: data.author })
        if (findUserRepo) {
            findUserRepo.list.push({
                hashCode: data.hashCode,
                fileName: data.info?.name,
                timeSave: data.creationDate,
            })

            const updatedUserRepo = await findUserRepo.save();
            if (!updatedUserRepo) return res.status(401).json({ status: false, message: "Internal error: Can not update userrepo" })
            console.log("Updated user repo");
        }
        else {
            // create new repo 
            const userRepo = new UserRepo({
                peerId: data.author,
                list: [
                    {
                        fileName: data.info?.name,
                        timeSave: data.creationDate,
                        hashCode: data.hashCode
                    }
                ]
            })
            const saveUserRepo = await userRepo.save()
            if (!saveUserRepo) return res.status(401).json({ status: false, message: "Internal error: Can not init userrepo" })
            console.log("New user repo is init ")
        }

        return res.status(200).json({ status: true, message: "Add successfully" })
    }
    catch (err) {
        console.log(err)
    }
}

const listUserRepo = async (req, res) => {
    const peerId = req.params.id
    if (!peerId) return res.status(401).json({ status: false, message: "Internal error, undefine peerId" })

    const repo = await UserRepo.findOne({ peerId: peerId }).lean();
    if (repo) {
        return res.status(200).json({ status: true, repo: repo.list })
    }
    else return res.status(200).json({ status: true, message: "You haven't had a repo yet" })
}


const deleteMetainfo = async (req, res) => {
    const data = req.body
    if (!data || Object.keys(data).length === 0)
        return res.status(500).json({ status: false, message: "Internal error, undefine data" })

    try {
        const findMetainfo = await Metainfo.findOne({ hashCode: data.hashCode })
        if (!findMetainfo) return res.status(401).json({ status: true, message: "Your code is wrong" })
        else {
            if (findMetainfo.author !== data.peerId)
                return res.status(401).json({ status: false, messsage: "Document is not in your repo" })
            await Metainfo.deleteOne({ hashCode: data.hashCode });

            const result = await UserRepo.updateOne(
                { peerId: data.peerId },
                { $pull: { list: { hashCode: data.hashCode } } }
            )
            if (result.nModified === 0)
                return res.status(500).json({ status: false, message: "Internal error, no user repo updated" });

            return res.status(200).json({ status: true, message: `${data.hashCode} is removed` })
        }
    }
    catch (error) {
        console.log(error)
    }
}


export default {
    saveMetainfoFile,
    listUserRepo,
    deleteMetainfo
}