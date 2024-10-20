import User from '../model/User.js'
import crypto from 'crypto'


const generatePeerIdFromPassword = (password) => {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const userId = hash.slice(0, 16); // Lấy 16 ký tự đầu tiên của hash làm ID
    return userId;
}


// register new account for user 
const registerAccount = async (req, res) => {
    const { account, password } = req.body

    if (!account || !password) {
        return res.status(401).json({ status: false, message: "Username or password is invalid" })
    }

    try {

        const findUserAccount = await User.findOne({ account: account }).lean()
        if (findUserAccount) {
            return res.status(401).json({ status: false, message: "Username has already exist" })
        }

        const findUserPassword = await User.findOne({ password: password })
        if (findUserPassword) {
            return res.status(401).json({ status: false, message: "Password has already exist" })
        }

        // generate peerId
        const peerId = generatePeerIdFromPassword(password)

        const NewUser = new User({
            peerId: peerId,
            account: account,
            password: password
        })

        const user = await NewUser.save()

        console.log("new user is created ", user)

        return res.status(200).json({ status: true, peerId: peerId })

    } catch (err) {
        console.error(err)
    }
}


// login with account and password 
const loginAccount = async (req, res) => {
    const { account, password } = req.body

    if (!account || !password) {
        return res.status(401).json({ status: false, message: "Username or password is invalid" })
    }

    try {
        const findUserAccount = await User.findOne({ account }).lean()
        if (!findUserAccount || findUserAccount.password !== password) return res.status(401).json({ status: false, message: "Account or password is incorrect" })
        return res.status(200).json({ status: true, peerId: findUserAccount.peerId })
    }
    catch (err) {
        console.log(err)
    }
}


export default {
    registerAccount,
    loginAccount,
}