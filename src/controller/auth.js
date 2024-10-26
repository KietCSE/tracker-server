import { Router } from "express";
import authentication from '../service/auth.js'

const router = Router()

router.post('/register', (req, res) => {
    authentication.registerAccount(req, res)
})

router.post('/login', (req, res) => {
    authentication.loginAccount(req, res)
})

router.get('/', (req, res) => {
    res.send("WELCOME TO TUANKIET'S SERVER")
})

export default router