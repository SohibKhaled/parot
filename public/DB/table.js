const mongoose = require('mongoose')


const tableSchema = mongoose.Schema(
    {
        Sname: {
            type: String,
            required: true
        },
        Sid: {
            type: String,
            required: true
        },
        Time: {
            type: Number,
            required: true
        },
        Day: {
            type: String,
            required: true
        },
        Short: {
            type: String,
            required: true
        },
        index: {
            type: Number,
            required: true
        },

    },
    {
        timestamps: true
    }
)

const Table = mongoose.model('Table', tableSchema);

module.exports = Table;