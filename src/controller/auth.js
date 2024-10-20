import { Router } from "express";
import authentication from '../service/auth.js'

const router = Router()

router.post('/register', (req, res) => {
    authentication.registerAccount(req, res)
})

router.post('/login', (req, res) => {
    authentication.loginAccount(req, res)
})

export default router