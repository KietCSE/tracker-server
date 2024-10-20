import { Router } from "express";
import torrent from "../service/torrent.js"

const router = Router()

router.post('/join', (req, res) => {
    torrent.peerJoinNetwork(req, res)
})

router.post('/leave', (req, res) => {
    torrent.peerLeaveNetwork(req, res)
})



export default router