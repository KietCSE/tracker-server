import mongoose from "mongoose";

export default async function connect() {
    mongoose.connect('mongodb://localhost:27017/tracker')
        .then(() => console.log('Connect mongodb successfully'))
        .catch(err => console.log('Failed to connect MongoDB:', err));

}

