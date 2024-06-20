const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
const studentSchema = Schema(
    {
       email: {
            type: String,
            required: true

        },
        name: {
            type: String,
            required: true

        },
        password: {
            type: String,
            required: true

        }, 
        id: {
            type: String,
            required: true

        }, 
    
    },
  
)
studentSchema.plugin(passportLocalMongoose);
const Student = mongoose.model('student', studentSchema);
module.exports = Student;



