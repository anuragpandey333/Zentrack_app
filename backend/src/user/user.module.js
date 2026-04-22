import {model,Schema} from 'mongoose';
const Schema=new Schema({
    fullname:{type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    mobile:{type:String,
        required:true,
        trim:true
    },
    email:{type:String,
        required:true,
        trim:true
    },
    password:{type:String,
        required:true,
        trim:true
    },
    status:{type:String,
        default:false
    },
    role:{type:String,
        default:'user',
        enum:['user']
    }
},{timestamps:true});
const UserModel=model('User',Schema);
export default UserModel;