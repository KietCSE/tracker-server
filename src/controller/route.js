import { Router } from "express";
import authController from './auth.js'
import metainfoController from './metainfor.js'
import torrentController from './torrent.js'

const router = Router()

router.use(authController)
router.use(metainfoController)
router.use(torrentController)

export default router
