const mongoose = require('mongoose')

const subjectSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        hour_per_day: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true
    }
)

const Subject = mongoose.model('subject', subjectSchema);

module.exports = Subject;



