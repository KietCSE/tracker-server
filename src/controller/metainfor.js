import { Router } from "express";
import metainfo from '../service/metainfo.js'

const router = Router()

router.post('/metainfo', (req, res) => {
    metainfo.saveMetainfoFile(req, res)
})

router.get('/list/:id', (req, res) => {
    metainfo.listUserRepo(req, res)
})

router.post('/delete', (req, res) => {
    metainfo.deleteMetainfo(req, res)
})

export default router