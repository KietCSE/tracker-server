import express from 'express';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dotenv from 'dotenv'
import CentralizeRouter from './controller/route.js'
import ConnectDatabase from './config/mongoDB.js'

const app = express();

dotenv.config()

// define CLI args for running on flexible port 
const argv = yargs(hideBin(process.argv)) // Pass the command-line arguments
    .option('port', {
        type: 'number',
        default: 3000, // Default port if none is provided
        description: 'Port to run the server on',
    })
    .argv;


ConnectDatabase()

app.use(express.json())


app.use(CentralizeRouter)


const PORT = argv.port
app.listen(PORT, () => {
    console.log("Server was launched at port", PORT);
});
