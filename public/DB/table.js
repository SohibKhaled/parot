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
        }
    },
    {
        timestamps: true
    }
)

const Table = mongoose.model('Table', tableSchema);

module.exports = Table;